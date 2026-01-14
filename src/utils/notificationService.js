import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const checkAndSendNotifications = async (
    subscriptions,
    profile,
    showInAppPopup = null,
    NotificationAPI = window.Notification,
    StorageAPI = localStorage
) => {
    // Early return if notifications are disabled or no subscriptions
    if (!profile.notificationsEnabled || subscriptions.length === 0) {
        console.log('❌ Notifications disabled or no subscriptions');
        return { sent: 0, skipped: 0, errors: [] };
    }

    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
 
    // Check if running on native platform (Android/iOS)
    const isNativePlatform = Capacitor.isNativePlatform();
    const canUseBrowserNotifications = !isNativePlatform && 
        NotificationAPI && 
        NotificationAPI.permission === 'granted';

    let sentCount = 0;
    let skippedCount = 0;
    const errors = [];

    console.log('🔔 === NOTIFICATION CHECK START ===');
    console.log('📅 Today:', todayNormalized.toDateString());
    console.log('⚙️ Reminder days:', profile.reminderDays);
    console.log('📱 Platform:', isNativePlatform ? 'NATIVE (Android/iOS)' : 'WEB');
    console.log('🔔 Permission:', isNativePlatform ? 'Using Capacitor' : NotificationAPI?.permission);

    // Request permission for native notifications if needed
    if (isNativePlatform) {
        try {
            const permStatus = await LocalNotifications.checkPermissions();
            console.log('📱 Native permission status:', permStatus);
            
            if (permStatus.display !== 'granted') {
                const permResult = await LocalNotifications.requestPermissions();
                console.log('📱 Native permission result:', permResult);
                
                if (permResult.display !== 'granted') {
                    console.error('❌ Native notification permission denied');
                    return { sent: 0, skipped: 0, errors: [{ type: 'permission', error: 'Permission denied' }] };
                }
            }
        } catch (error) {
            console.error('❌ Failed to check/request permissions:', error);
            errors.push({ type: 'permission', error: error.message });
        }
    }

    const notificationsToSchedule = [];

    subscriptions.forEach(sub => {
        if (!sub.nextBillingDate) {
            console.log(`⏭️ Skipping ${sub.name} - no billing date`);
            return;
        }

        const nextDate = new Date(sub.nextBillingDate);
        const nextDateNormalized = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

        const diffTime = nextDateNormalized - todayNormalized;
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(`📊 ${sub.name}:`, {
            nextBillingDate: sub.nextBillingDate,
            daysUntil: daysUntil,
            shouldNotify: profile.reminderDays.includes(daysUntil)
        });

        // Send reminder if sub is due within reminder days
        if (profile.reminderDays.includes(daysUntil)) {
            const lastNotifiedKey = `notified_${sub.id}_${daysUntil}`;

            if (StorageAPI.getItem(lastNotifiedKey) !== 'true') {
                let notificationSent = false;

                // 1. IN-APP POPUP (Works everywhere)
                if (showInAppPopup && typeof showInAppPopup === 'function') {
                    try {
                        console.log(`📱 Showing in-app popup for ${sub.name}...`);
                        showInAppPopup(sub, daysUntil);
                        console.log(`✅ In-app popup shown for ${sub.name}`);
                        notificationSent = true;
                    } catch (error) {
                        console.error(`❌ Failed to show in-app popup for ${sub.name}:`, error);
                        errors.push({ subscription: sub.name, type: 'in-app', error: error.message });
                    }
                }

                // 2. NATIVE OR BROWSER NOTIFICATION
                const notificationTitle = '🔔 Subscription Reminder';
                const notificationBody = `${sub.name} renewal of ${sub.cost} ${sub.currency} is ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}!`;

                if (isNativePlatform) {
                    // Use Capacitor Local Notifications for native apps
                    notificationsToSchedule.push({
                        title: notificationTitle,
                        body: notificationBody,
                        id: Date.now() + Math.random(), // Unique ID
                        schedule: { at: new Date(Date.now() + 1000) }, // Schedule 1 second from now
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: "",
                        extra: {
                            subscriptionId: sub.id,
                            subscriptionName: sub.name
                        }
                    });
                    notificationSent = true;
                    console.log(`✅ Native notification queued for ${sub.name}`);
                } else if (canUseBrowserNotifications) {
                    // Use Web Notifications API for browser
                    try {
                        const notification = new NotificationAPI(notificationTitle, {
                            body: notificationBody,
                            icon: sub.image || '/logo192.png',
                            badge: '/logo192.png',
                            tag: lastNotifiedKey,
                            requireInteraction: false,
                            silent: false
                        });

                        notification.onclick = function (event) {
                            event.preventDefault();
                            console.log(`👆 Browser notification clicked for ${sub.name}`);
                            window.focus();
                            notification.close();
                        };

                        setTimeout(() => {
                            try {
                                notification.close();
                            } catch (e) {
                                // Notification may already be closed
                            }
                        }, 15000);

                        notificationSent = true;
                        console.log(`✅ Browser notification sent for ${sub.name}`);
                    } catch (error) {
                        console.error(`❌ Failed to send browser notification for ${sub.name}:`, error);
                        errors.push({ subscription: sub.name, type: 'browser', error: error.message });
                    }
                }

                // Mark as notified if at least one notification method succeeded
                if (notificationSent) {
                    StorageAPI.setItem(lastNotifiedKey, 'true');
                    sentCount++;
                    console.log(`✅ Marked as notified: ${lastNotifiedKey}`);
                } else {
                    console.error(`❌ All notification methods failed for ${sub.name}`);
                    errors.push({
                        subscription: sub.name,
                        type: 'all',
                        error: 'All notification methods failed'
                    });
                }
            } else {
                console.log(`⏭️ Already notified for ${sub.name} at ${daysUntil} days`);
                skippedCount++;
            }
        }
    });

    // Schedule all native notifications at once
    if (isNativePlatform && notificationsToSchedule.length > 0) {
        try {
            await LocalNotifications.schedule({
                notifications: notificationsToSchedule
            });
            console.log(`✅ Scheduled ${notificationsToSchedule.length} native notifications`);
        } catch (error) {
            console.error('❌ Failed to schedule native notifications:', error);
            errors.push({ type: 'native-schedule', error: error.message });
        }
    }

    const result = { sent: sentCount, skipped: skippedCount, errors };
    console.log('🏁 === NOTIFICATION CHECK COMPLETE ===');
    console.log('📊 Result:', result);

    return result;
};
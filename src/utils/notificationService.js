import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

// Helper to get/set notification status using Capacitor Preferences
const getNotificationStatus = async (key) => {
    try {
        const { value } = await Preferences.get({ key });
        return value === 'true';
    } catch (error) {
        console.error('Failed to get notification status:', error);
        return false;
    }
};

const setNotificationStatus = async (key, status) => {
    try {
        await Preferences.set({ key, value: String(status) });
    } catch (error) {
        console.error('Failed to set notification status:', error);
    }
};

export const checkAndSendNotifications = async (
    subscriptions,
    profile,
    forceCheck = false,
    targetSubscriptionId = null
) => {
    // Early return if notifications are disabled or no subscriptions
    if (!profile.notificationsEnabled || subscriptions.length === 0) {
        console.log('❌ Notifications disabled or no subscriptions');
        return { sent: 0, skipped: 0, errors: [] };
    }

    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if we can use browser notifications (web only)
    const canUseBrowserNotifications = !isNative &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted';

    let sentCount = 0;
    let skippedCount = 0;
    const errors = [];

    console.log('🔔 === NOTIFICATION CHECK START ===');
    console.log('📅 Today:', todayNormalized.toDateString());
    console.log('⚙️ Reminder days:', profile.reminderDays);
    console.log('📱 Platform:', isNative ? 'NATIVE (Android/iOS)' : 'WEB');
    console.log('🔔 Permission:', isNative ? 'Using Capacitor' : (typeof window !== 'undefined' && 'Notification' in window ? window.Notification?.permission : 'N/A'));

    // Request permission for native notifications if needed
    if (isNative) {
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

    for (const sub of subscriptions) {
        // If targetSubscriptionId is provided, ONLY process that specific subscription
        if (targetSubscriptionId && sub.id !== targetSubscriptionId) {
            continue;
        }

        if (!sub.nextBillingDate) {
            console.log(`⏭️ Skipping ${sub.name} - no billing date`);
            continue;
        }

        // Parse strictly as local date (YYYY-MM-DD) to avoid UTC offsets
        const [y, m, d] = sub.nextBillingDate.split('-').map(Number);
        const nextDateNormalized = new Date(y, m - 1, d); // Month is 0-indexed in JS Date

        const diffTime = nextDateNormalized - todayNormalized;
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Logic: Notify if in reminder list OR (it is today AND we are forcing a check e.g. on save)
        const shouldNotify = profile.reminderDays.includes(daysUntil) || (forceCheck && daysUntil === 0);

        console.log(`📊 ${sub.name}:`, {
            nextBillingDate: sub.nextBillingDate,
            daysUntil: daysUntil,
            shouldNotify: shouldNotify,
            forced: forceCheck && daysUntil === 0
        });

        // Send reminder if sub is due within reminder days OR forced Today
        if (shouldNotify) {
            const lastNotifiedKey = `notified_${sub.id}_${daysUntil}`;
            const wasNotified = await getNotificationStatus(lastNotifiedKey);

            if (forceCheck || !wasNotified) {
                let notificationSent = false;

                // 2. NATIVE OR BROWSER NOTIFICATION
                const notificationTitle = '🔔 Subscription Reminder';
                const notificationBody = `${sub.name} renewal of ${sub.cost} ${sub.currency} is ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}!`;

                if (isNative) {
                    // Use Capacitor Local Notifications for native apps
                    notificationsToSchedule.push({
                        title: notificationTitle,
                        body: notificationBody,
                        id: Math.floor(Math.random() * 2147483647), // Random safe 32-bit integer
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
                        const notification = new Notification(notificationTitle, {
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
                            if (typeof window !== 'undefined') {
                                window.focus();
                            }
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
                    await setNotificationStatus(lastNotifiedKey, true);
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
    }

    // Schedule all native notifications at once
    if (isNative && notificationsToSchedule.length > 0) {
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
    console.log('🎯 === NOTIFICATION CHECK COMPLETE ===');
    console.log('📊 Result:', result);

    return result;
};

export const sendTestNotification = async () => {
    const notificationTitle = '🔔 Test Notification';
    const notificationBody = 'Success! Notifications are working correctly on your device.';

    try {
        if (isNative) {
            // Check permission first
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                const permResult = await LocalNotifications.requestPermissions();
                if (permResult.display !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            await LocalNotifications.schedule({
                notifications: [{
                    title: notificationTitle,
                    body: notificationBody,
                    id: Math.floor(Math.random() * 2147483647),
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: "",
                    extra: null
                }]
            });
            return { success: true, method: 'native' };
        } else {
            // Web Notification
            if (typeof window === 'undefined' || !('Notification' in window)) {
                throw new Error('Not supported');
            }

            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            const notification = new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/logo192.png',
                badge: '/logo192.png',
                requireInteraction: false
            });

            // Auto-close after 10 seconds
            setTimeout(() => {
                try {
                    notification.close();
                } catch (e) {
                    // Already closed
                }
            }, 10000);

            return { success: true, method: 'web' };
        }
    } catch (error) {
        console.error('Test notification failed:', error);
        return { success: false, error: error.message };
    }
};

export const sendCustomNotification = async (title, body) => {
    try {
        if (isNative) {
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') return false;

            await LocalNotifications.schedule({
                notifications: [{
                    title: title,
                    body: body,
                    id: Math.floor(Math.random() * 2147483647),
                    schedule: { at: new Date(Date.now() + 1000) },
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: "",
                    extra: null
                }]
            });
            return true;
        } else {
            if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
                return false;
            }

            const notification = new Notification(title, {
                body: body,
                icon: '/logo192.png',
                requireInteraction: false
            });

            // Auto-close after 10 seconds
            setTimeout(() => {
                try {
                    notification.close();
                } catch (e) {
                    // Already closed
                }
            }, 10000);

            return true;
        }
    } catch (e) {
        console.error('Custom notification failed:', e);
        return false;
    }
};

// Helper function to clear notification history (useful for debugging)
export const clearNotificationHistory = async () => {
    try {
        // Get all keys
        const { keys } = await Preferences.keys();
        
        // Filter keys that start with 'notified_'
        const notificationKeys = keys.filter(key => key.startsWith('notified_'));
        
        // Remove all notification status keys
        await Promise.all(
            notificationKeys.map(key => Preferences.remove({ key }))
        );
        
        // Also clear last check date
        await Preferences.remove({ key: 'lastNotificationCheck' });
        
        console.log(`✅ Cleared ${notificationKeys.length} notification history entries`);
        return true;
    } catch (error) {
        console.error('Failed to clear notification history:', error);
        return false;
    }
};

// Helper to get last notification check date
export const getLastNotificationCheck = async () => {
    try {
        const { value } = await Preferences.get({ key: 'lastNotificationCheck' });
        return value;
    } catch (error) {
        console.error('Failed to get last notification check:', error);
        return null;
    }
};

// Helper to set last notification check date
export const setLastNotificationCheck = async (date) => {
    try {
        await Preferences.set({ key: 'lastNotificationCheck', value: date });
        return true;
    } catch (error) {
        console.error('Failed to set last notification check:', error);
        return false;
    }
};
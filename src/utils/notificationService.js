export const checkAndSendNotifications = (
  subscriptions, 
  profile, 
  showInAppPopup = null,
  NotificationAPI = window.Notification, 
  StorageAPI = localStorage
) => {
    // Early return if notifications are disabled or not supported
    if (!profile.notificationsEnabled || subscriptions.length === 0) {
        console.log('❌ Notifications disabled or no subscriptions');
        return { sent: 0, skipped: 0, errors: [] };
    }

    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let sentCount = 0;
    let skippedCount = 0;
    const errors = [];

    console.log('🔔 Starting Universal Notification Check...');
    console.log('📅 Today:', todayNormalized.toDateString());
    console.log('⚙️ Reminder days:', profile.reminderDays);
    console.log('📱 Device:', navigator.userAgent);
    console.log('🔐 Browser Notification Permission:', NotificationAPI ? NotificationAPI.permission : 'N/A');

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
            nextDateNormalized: nextDateNormalized.toDateString(),
            daysUntil: daysUntil,
            shouldNotify: profile.reminderDays.includes(daysUntil)
        });

        // Send reminder if sub is due within reminder days
        if (profile.reminderDays.includes(daysUntil)) {
            const lastNotifiedKey = `notified_${sub.id}_${daysUntil}`;

            if (StorageAPI.getItem(lastNotifiedKey) !== 'true') {
                let notificationSent = false;

                // 1. ALWAYS show in-app popup (works everywhere)
                if (showInAppPopup && typeof showInAppPopup === 'function') {
                    try {
                        console.log(`📱 Showing in-app popup for ${sub.name}...`);
                        showInAppPopup(sub, daysUntil);
                        notificationSent = true;
                        console.log(`✅ In-app popup shown for ${sub.name}`);
                    } catch (error) {
                        console.error(`❌ Failed to show in-app popup for ${sub.name}:`, error);
                        errors.push({ subscription: sub.name, type: 'in-app', error: error.message });
                    }
                }

                // 2. ALSO send browser/system notification (if supported)
                if (NotificationAPI && NotificationAPI.permission === 'granted') {
                    try {
                        const notificationTitle = '🔔 Subscription Reminder';
                        const notificationBody = `${sub.name} renewal of ${sub.cost} ${sub.currency} is ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}!`;
                        
                        console.log(`🔔 Sending browser notification for ${sub.name}...`);
                        
                        // Detect mobile vs desktop for different notification strategies
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                        
                        // Simple notification options that work everywhere
                        const notificationOptions = {
                            body: notificationBody,
                            icon: sub.image || '/logo192.png',
                            tag: lastNotifiedKey,
                            requireInteraction: isMobile, // Keep on screen on mobile
                            silent: false
                        };

                        // Only add advanced features if they won't cause errors
                        try {
                            // Add vibration on mobile devices (not all browsers support this)
                            if (isMobile && 'vibrate' in navigator) {
                                notificationOptions.vibrate = [200, 100, 200];
                            }
                        } catch (e) {
                            console.log('Vibration not supported');
                        }
                        
                        const notification = new NotificationAPI(notificationTitle, notificationOptions);
                        
                        notification.onclick = function(event) {
                            event.preventDefault();
                            window.focus();
                            notification.close();
                            console.log(`👆 Browser notification clicked for ${sub.name}`);
                        };
                        
                        notification.onerror = function(event) {
                            console.error(`❌ Notification error for ${sub.name}:`, event);
                        };
                        
                        // Auto-close after 15 seconds on desktop, 30 on mobile
                        const autoCloseTime = isMobile ? 30000 : 15000;
                        setTimeout(() => {
                            notification.close();
                        }, autoCloseTime);
                        
                        notificationSent = true;
                        console.log(`✅ Browser notification sent for ${sub.name} (${daysUntil} days)`);
                    } catch (error) {
                        console.error(`❌ Failed to send browser notification for ${sub.name}:`, error);
                        errors.push({ subscription: sub.name, type: 'browser', error: error.message });
                    }
                } else {
                    if (!NotificationAPI) {
                        console.log('⚠️ Browser notifications not supported on this device');
                    } else if (NotificationAPI.permission !== 'granted') {
                        console.log('⚠️ Browser notification permission not granted');
                    }
                }

                // Mark as notified if at least one notification method succeeded
                if (notificationSent) {
                    StorageAPI.setItem(lastNotifiedKey, 'true');
                    sentCount++;
                } else {
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
        } else {
            console.log(`⏭️ ${sub.name} not in reminder window (${daysUntil} days)`);
        }
    });

    const result = { sent: sentCount, skipped: skippedCount, errors };
    console.log('📊 Universal Notification Check Complete:', result);
    console.log('✅ In-app popups: Always shown when subscription matches');
    console.log('🔔 Browser notifications: Sent if permission granted');
    
    return result;
};
export const checkAndSendNotifications = (
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

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    const canUseBrowserNotifications = NotificationAPI &&
        NotificationAPI.permission === 'granted' &&
        !(isIOS && !isInStandaloneMode);

    let sentCount = 0;
    let skippedCount = 0;
    const errors = [];

    console.log('🔔 === NOTIFICATION CHECK START ===');
    console.log('📅 Today:', todayNormalized.toDateString());
    console.log('⚙️ Reminder days:', profile.reminderDays);
    console.log('📱 Device:', { isMobile, isIOS, isAndroid, isInStandaloneMode });
    console.log('🔐 Browser Notification Permission:', NotificationAPI ? NotificationAPI.permission : 'N/A');
    console.log('👤 User Agent:', navigator.userAgent);

    // iOS Safari warning
    if (isIOS && !isInStandaloneMode) {
        console.warn('⚠️ iOS Safari detected. Browser notifications NOT supported. Only in-app popups will work.');
        console.warn('💡 To enable browser notifications on iOS: Add this app to Home Screen (PWA mode)');
    }

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

                // ==========================================
                // 1. IN-APP POPUP (Works everywhere including iOS)
                // ==========================================
                if (showInAppPopup && typeof showInAppPopup === 'function') {
                    try {
                        console.log(`📱 Showing in-app popup for ${sub.name}...`);

                        // Delay on mobile to ensure DOM is ready
                        if (isMobile) {
                            setTimeout(() => {
                                showInAppPopup(sub, daysUntil);
                                console.log(`✅ In-app popup triggered for ${sub.name} (mobile)`);
                            }, 100);
                        } else {
                            showInAppPopup(sub, daysUntil);
                            console.log(`✅ In-app popup shown for ${sub.name} (desktop)`);
                        }
                        notificationSent = true;
                    } catch (error) {
                        console.error(`❌ Failed to show in-app popup for ${sub.name}:`, error);
                        errors.push({ subscription: sub.name, type: 'in-app', error: error.message });
                    }
                }

                // ==========================================
                // 2. BROWSER NOTIFICATION (Skip on iOS Safari)
                // ==========================================
                if (canUseBrowserNotifications) {
                    try {
                        const notificationTitle = '🔔 Subscription Reminder';
                        const notificationBody = `${sub.name} renewal of ${sub.cost} ${sub.currency} is ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}!`;

                        console.log(`🔔 Sending browser notification for ${sub.name}...`);

                        // Build notification options
                        const notificationOptions = {
                            body: notificationBody,
                            icon: sub.image || '/logo192.png',
                            badge: '/logo192.png',
                            tag: lastNotifiedKey,
                            requireInteraction: isMobile, // Keep visible on mobile
                            silent: false,
                            timestamp: Date.now()
                        };

                        // Add Android-specific features
                        if (isAndroid) {
                            if ('vibrate' in navigator) {
                                notificationOptions.vibrate = [200, 100, 200];
                                console.log('📳 Added vibration pattern for Android');
                            }
                        }

                        // Create notification
                        const notification = new NotificationAPI(notificationTitle, notificationOptions);

                        notification.onclick = function (event) {
                            event.preventDefault();
                            console.log(`👆 Browser notification clicked for ${sub.name}`);
                            window.focus();
                            notification.close();
                        };

                        notification.onerror = function (event) {
                            console.error(`❌ Notification error for ${sub.name}:`, event);
                        };

                        notification.onshow = function () {
                            console.log(`👀 Notification shown for ${sub.name}`);
                        };

                        // Auto-close after timeout
                        const autoCloseTime = isMobile ? 30000 : 15000;
                        setTimeout(() => {
                            try {
                                notification.close();
                                console.log(`🔕 Auto-closed notification for ${sub.name}`);
                            } catch (e) {
                                // Notification may already be closed
                            }
                        }, autoCloseTime);

                        notificationSent = true;
                        console.log(`✅ Browser notification sent for ${sub.name} (${daysUntil} days)`);
                    } catch (error) {
                        console.error(`❌ Failed to send browser notification for ${sub.name}:`, error);
                        errors.push({ subscription: sub.name, type: 'browser', error: error.message });
                    }
                } else {
                    // Log why browser notifications were skipped
                    if (!NotificationAPI) {
                        console.log('⏭️ Browser notifications not supported on this device');
                    } else if (NotificationAPI.permission !== 'granted') {
                        console.log('⏭️ Browser notification permission not granted');
                    } else if (isIOS && !isInStandaloneMode) {
                        console.log('⏭️ iOS Safari - browser notifications skipped (use PWA mode or in-app popup)');
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
        } else {
            console.log(`⏭️ ${sub.name} not in reminder window (${daysUntil} days)`);
        }
    });

    const result = { sent: sentCount, skipped: skippedCount, errors };
    console.log('🏁 === NOTIFICATION CHECK COMPLETE ===');
    console.log('📊 Result:', result);
    console.log('✅ In-app popups: Always shown when subscription matches');
    console.log('🔔 Browser notifications:', canUseBrowserNotifications ? 'Sent' : 'Skipped (see reasons above)');

    return result;
};
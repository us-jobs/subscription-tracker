export const checkAndSendNotifications = (subscriptions, profile, NotificationAPI = window.Notification, StorageAPI = localStorage) => {
    // Early return if notifications are disabled or not supported
    if (!profile.notificationsEnabled || subscriptions.length === 0) return;

    const today = new Date();
    // Normalize to start of day
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    subscriptions.forEach(sub => {
        if (!sub.nextBillingDate) return;

        const nextDate = new Date(sub.nextBillingDate);
        // Normalize to start of day
        const nextDateNormalized = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

        const diffTime = nextDateNormalized - todayNormalized;
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(`🔔 Notification check for ${sub.name}: daysUntil = ${daysUntil}, reminderDays = ${profile.reminderDays}`);

        // Send reminder if sub is due within reminder days (e.g., 1 or 3 days away)
        if (profile.reminderDays.includes(daysUntil)) {
            const lastNotifiedKey = `notified_${sub.id}_${daysUntil}`;

            // Check if we already sent a notification for this subscription at this timing
            if (StorageAPI.getItem(lastNotifiedKey) !== 'true') {
                if (NotificationAPI && NotificationAPI.permission === 'granted') {
                    try {
                        const notification = new NotificationAPI('🔔 Subscription Reminder', {
                            body: `${sub.name} renewal of ${sub.cost} ${sub.currency} is in ${daysUntil} day(s).`,
                            icon: sub.image || undefined,
                            tag: lastNotifiedKey,
                            requireInteraction: true,
                            silent: false,
                            // Remove vibrate and badge - they cause issues on mobile
                            // vibrate: [200, 100, 200],
                            // badge: sub.image || undefined,
                        });
                        
                        notification.onclick = function(event) {
                            event.preventDefault();
                            window.focus();
                            notification.close();
                        };
                        
                        setTimeout(() => {
                            notification.close();
                        }, 10000); // Reduced from 30 seconds
                        
                        // Mark as notified
                        StorageAPI.setItem(lastNotifiedKey, 'true');
                        
                        console.log(`✅ Notification sent for ${sub.name} (${daysUntil} days)`);
                    } catch (error) {
                        console.error('❌ Failed to send notification:', error);
                    }
                } else {
                    console.log('❌ Notification permission not granted');
                }
            } else {
                console.log(`⏭️ Already notified for ${sub.name} at ${daysUntil} days`);
            }
        }
    });
};
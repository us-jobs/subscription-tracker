export const checkAndSendNotifications = (subscriptions, profile, NotificationAPI = window.Notification, StorageAPI = localStorage) => {
  // Early return if notifications are disabled or not supported
  if (!profile.notificationsEnabled || subscriptions.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  subscriptions.forEach(sub => {
    if (!sub.nextBillingDate) return;

    const nextDate = new Date(sub.nextBillingDate);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate - today;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Send reminder if sub is due within reminder days (e.g., 1 or 3 days away)
    if (profile.reminderDays.includes(daysUntil)) {
      const lastNotifiedKey = `notified_${sub.name}_${sub.nextBillingDate}_${daysUntil}`;

      // Check if we already sent a notification for this subscription at this timing
      if (StorageAPI.getItem(lastNotifiedKey) !== 'true') {
        // FIXED: Changed NotificationAPI to Notification (using the parameter)
        if (NotificationAPI && NotificationAPI.permission === 'granted') {
          const notification = new NotificationAPI('🔔 Subscription Reminder', {
            body: `${sub.name} renewal of ${sub.cost} ${sub.currency} is in ${daysUntil} day(s).`,
            icon: sub.image || undefined, // Optional: use subscription image as icon
            tag: lastNotifiedKey, // Prevent duplicate notifications
            requireInteraction: true, // Keeps notification on screen until user dismisses
            silent: false, // Play notification sound
            badge: sub.image || undefined,
            vibrate: [200, 100, 200], // Vibrate pattern for mobile devices
            data: {
              url: window.location.origin,
              subscriptionId: sub.id,
              subscriptionName: sub.name
            }
          });
          
          // Add click handler to focus the app when notification is clicked
          notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            // Close the notification after clicking
            notification.close();
          };
          
          // Auto-close after 30 seconds (if user doesn't interact)
          setTimeout(() => {
            notification.close();
          }, 30000);
          
          // Mark as notified
          StorageAPI.setItem(lastNotifiedKey, 'true');
          
          console.log(`✅ Notification sent for ${sub.name} (${daysUntil} days)`);
        } else {
          console.log('❌ Notification permission not granted');
        }
      } else {
        console.log(`⏭️ Already notified for ${sub.name} at ${daysUntil} days`);
      }
    }
  });
};
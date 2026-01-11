# How to Test Notifications

## Quick Test Steps (Easiest Method)

### 1. Enable Notifications
1. Click the **bell icon** in the header (top right)
2. When prompted, click **"Allow"** to grant notification permission
3. Select your reminder days (e.g., **1 day**, **3 days**)
4. Click **"Confirm & Enable"**

### 2. Verify Your Subscription
- Make sure you have a subscription due within your selected reminder days
- For example, if you selected "1 day", you need a subscription due tomorrow
- Your subscription "ui" is due tomorrow (1/12/2026), so if today is 1/11/2026 and you selected "1 day", it should work!

### 3. Notification Will Trigger Automatically
- ✅ When you enable notifications (immediately after clicking "Confirm & Enable")
- ✅ When you refresh the page (checks on page load)
- ✅ Every hour while the app is open

## Test Browser Notifications Directly (Console)

Open your browser's Developer Console (F12) and run:

```javascript
// Test if browser notifications work at all
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    console.log('Permission:', permission);
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'If you see this, browser notifications are working!',
        icon: '/logo.png'
      });
      console.log('✅ Test notification sent!');
    } else {
      console.log('❌ Permission denied. Click the lock icon in address bar to enable.');
    }
  });
} else {
  console.log('❌ Notifications not supported');
}
```

## Check Your App Settings (Console)

Run this to verify your settings are correct (using the correct localStorage keys):

```javascript
// Check notification permission
console.log('🔔 Permission:', Notification.permission);

// Check your profile settings (stored in separate keys)
const profile = {
  name: localStorage.getItem('userName') || '',
  reminderDays: JSON.parse(localStorage.getItem('reminderDays') || '[1, 3]'),
  notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true'
};
console.log('✅ Notifications enabled:', profile.notificationsEnabled);
console.log('📅 Reminder days:', profile.reminderDays);

// Check your subscriptions
const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
const today = new Date();
today.setHours(0, 0, 0, 0);

subs.forEach(sub => {
  if (sub.nextBillingDate) {
    const nextDate = new Date(sub.nextBillingDate);
    nextDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    console.log(`\n📋 ${sub.name}:`);
    console.log(`   Due in ${daysUntil} day(s) (Date: ${sub.nextBillingDate})`);
    
    if (profile.reminderDays && profile.reminderDays.includes(daysUntil)) {
      console.log(`   ✅ SHOULD TRIGGER NOTIFICATION!`);
    } else {
      console.log(`   ❌ Won't trigger (not in reminder days: ${profile.reminderDays})`);
    }
  }
});
```

## Troubleshooting

### No Notification Appears?

1. **Check browser permission:**
   - Click the **lock icon** (🔒) in the address bar
   - Check if notifications are **"Allowed"**
   - If "Blocked", change it to "Allow" and refresh the page

2. **Check if already notified:**
   - The app prevents duplicate notifications
   - Check localStorage keys starting with `notified_`
   - To reset and test again, run in console:
   ```javascript
   // Clear notification flags (keeps your subscriptions)
   Object.keys(localStorage).forEach(key => {
     if (key.startsWith('notified_')) {
       localStorage.removeItem(key);
     }
   });
   console.log('✅ Notification flags cleared. Refresh the page to test.');
   ```

3. **Verify settings match:**
   - Subscription must be due within your selected reminder days
   - If subscription is due tomorrow, make sure "1 day" is selected
   - Notifications must be enabled in profile

4. **Check console for errors:**
   - Open Developer Tools (F12) → Console tab
   - Look for any red error messages

### Permission Denied?

1. Click the **lock icon** (🔒) in the browser address bar
2. Find **"Notifications"**
3. Change it to **"Allow"**
4. **Refresh the page**
5. Try enabling notifications again

## Expected Behavior

When a notification triggers, you should see:
- ✅ A browser/system notification popup
- ✅ Title: **"Subscription Reminder 📅"**
- ✅ Body: **"[Subscription Name] renewal of [cost] [currency] is in [X] day(s)."**
- ✅ Icon: Your app logo
- ✅ Only appears once per subscription/date/reminder day combination

## Important Notes

- ⚠️ Notifications only work when the **app tab is open** (browser limitation)
- ⚠️ Notifications check every **hour** while the app is open
- ⚠️ Notifications check **immediately** when you enable them or refresh the page
- ⚠️ Duplicate prevention: Once notified for a specific subscription/date/day, won't notify again unless you clear the localStorage flag

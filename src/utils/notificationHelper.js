// Add this utility function to check if notifications are blocked at system level
export const checkNotificationSystemStatus = async () => {
  if (!('Notification' in window)) {
    return { supported: false, permission: 'unsupported' };
  }

  const permission = Notification.permission;
  
  // If permission is granted, try to create a test notification to verify system settings
  if (permission === 'granted') {
    try {
      // This will fail silently if system notifications are disabled
      const test = new Notification('', { silent: true, tag: 'system-check' });
      test.close();
      return { supported: true, permission: 'granted', systemEnabled: true };
    } catch (e) {
      // System notifications might be disabled
      return { supported: true, permission: 'granted', systemEnabled: false };
    }
  }
  
  return { supported: true, permission };
};

// Enhanced notification request with system-level detection
export const requestNotificationPermissionWithGuidance = async () => {
  const status = await checkNotificationSystemStatus();
  
  if (!status.supported) {
    return {
      success: false,
      message: 'Notifications are not supported in this browser',
      needsSystemEnable: false
    };
  }
  
  if (status.permission === 'denied') {
    return {
      success: false,
      message: 'Notifications were previously blocked. Please enable them in your browser settings.',
      needsSystemEnable: false,
      showInstructions: true
    };
  }
  
  if (status.permission === 'default') {
    // Request permission for the first time
    const result = await Notification.requestPermission();
    
    if (result === 'granted') {
      // Permission granted, but check if system notifications might be disabled
      try {
        const test = new Notification('🎉 Notifications Enabled!', { 
          body: 'You\'ll now receive reminders for upcoming subscriptions.',
          silent: false,
          requireInteraction: true, // Keep on screen until dismissed
          tag: 'welcome-notification',
          vibrate: [200, 100, 200]
        });
        
        // Add click handler
        test.onclick = function(event) {
          event.preventDefault();
          window.focus();
          test.close();
        };
        
        // Auto-close after 10 seconds
        setTimeout(() => test.close(), 10000);
        
        return {
          success: true,
          message: 'Notifications enabled successfully!',
          needsSystemEnable: false
        };
      } catch (e) {
        // Permission granted but system might have notifications disabled
        return {
          success: true,
          message: 'Browser permission granted, but system notifications may be disabled.',
          needsSystemEnable: true,
          showInstructions: true
        };
      }
    } else if (result === 'denied') {
      return {
        success: false,
        message: 'Notification permission denied. Please enable in browser settings.',
        needsSystemEnable: false,
        showInstructions: true
      };
    }
  }
  
  // Already granted
  if (status.permission === 'granted') {
    if (!status.systemEnabled) {
      return {
        success: true,
        message: 'Browser permission is granted, but system notifications may be disabled.',
        needsSystemEnable: true,
        showInstructions: true
      };
    }
    
    return {
      success: true,
      message: 'Notifications are already enabled!',
      needsSystemEnable: false
    };
  }
  
  return {
    success: false,
    message: 'Unable to determine notification status',
    needsSystemEnable: false
  };
};

// Platform-specific instructions
export const getNotificationInstructions = () => {
  const platform = navigator.platform.toLowerCase();
  const isMac = platform.includes('mac');
  const isWindows = platform.includes('win');
  const isLinux = platform.includes('linux');
  
  if (isMac) {
    return {
      title: 'Enable Notifications on Mac',
      steps: [
        '1. Open System Settings (or System Preferences)',
        '2. Click on "Notifications"',
        '3. Find "Google Chrome" (or your browser) in the left sidebar',
        '4. Make sure "Allow notifications" is turned ON',
        '5. Set notification style to "Alerts" (not "Banners") so they stay visible',
        '6. Refresh this page and try again'
      ],
      icon: '🍎'
    };
  }
  
  if (isWindows) {
    return {
      title: 'Enable Notifications on Windows',
      steps: [
        '1. Open Windows Settings (Win + I)',
        '2. Go to System → Notifications',
        '3. Make sure "Notifications" is turned ON',
        '4. Scroll down and find "Google Chrome" (or your browser)',
        '5. Make sure notifications are enabled for the browser',
        '6. Also check "Focus Assist" - it should be OFF',
        '7. Refresh this page and try again'
      ],
      icon: '🪟'
    };
  }
  
  if (isLinux) {
    return {
      title: 'Enable Notifications on Linux',
      steps: [
        '1. Open System Settings',
        '2. Go to Notifications',
        '3. Make sure notifications are enabled',
        '4. Check Do Not Disturb mode is OFF',
        '5. Refresh this page and try again'
      ],
      icon: '🐧'
    };
  }
  
  return {
    title: 'Enable System Notifications',
    steps: [
      '1. Open your system settings',
      '2. Find the notifications section',
      '3. Enable notifications for your browser',
      '4. Refresh this page and try again'
    ],
    icon: '🔔'
  };
};
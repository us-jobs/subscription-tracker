import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Smartphone, Clock } from 'lucide-react';

const NotificationTester = ({ onClose }) => {
  const [testResults, setTestResults] = useState({
    permission: Notification.permission,
    supported: 'Notification' in window,
    testSent: false,
    testReceived: false
  });
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (testResults.testSent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [testResults.testSent, countdown]);

  const handleTestNotification = () => {
    if (!('Notification' in window)) {
      setTestResults(prev => ({ ...prev, supported: false }));
      return;
    }

    if (Notification.permission !== 'granted') {
      alert('Please enable notifications in settings first!');
      return;
    }

    // Send test notification
    const notification = new Notification('🔔 SubTrack Test', {
      body: 'This is a test notification from SubTrack!',
      tag: 'test-notification',
      requireInteraction: true,
      icon: '/logo.png'
    });

    notification.onclick = () => {
      setTestResults(prev => ({ ...prev, testReceived: true }));
      notification.close();
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      if (!testResults.testReceived) {
        notification.close();
      }
    }, 30000);

    setTestResults(prev => ({ ...prev, testSent: true }));
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    const permission = await Notification.requestPermission();
    setTestResults(prev => ({ ...prev, permission }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone size={32} />
            <Bell size={32} />
          </div>
          <h2 className="text-xl font-bold">Mobile Notification Test</h2>
          <p className="text-indigo-100 text-sm mt-1">Test if notifications work on your device</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${testResults.supported ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {testResults.supported ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Browser Support</p>
                  <p className="text-xs text-gray-500">{testResults.supported ? 'Supported ✓' : 'Not Supported'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${testResults.permission === 'granted' ? 'bg-green-100 text-green-600' : testResults.permission === 'denied' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  <Bell size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Permission</p>
                  <p className="text-xs text-gray-500 capitalize">{testResults.permission}</p>
                </div>
              </div>
              {testResults.permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTestNotification}
            disabled={!testResults.supported || testResults.permission !== 'granted'}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-3"
          >
            <Bell size={20} />
            Send Test Notification
          </button>

          {/* Test Status */}
          {testResults.testSent && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Test Notification Sent!</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {testResults.testReceived 
                      ? '✅ You received and clicked the notification!' 
                      : `Look for the notification in your status bar. Auto-closing in ${countdown}s...`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile-Specific Instructions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h4 className="font-bold text-yellow-900 text-sm mb-2">📱 Mobile Testing Tips:</h4>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Minimize the browser after clicking "Send Test"</li>
              <li>• Check your phone's notification center</li>
              <li>• Ensure "Do Not Disturb" mode is off</li>
              <li>• Make sure volume is on for notification sounds</li>
            </ul>
          </div>
        </div>

        <div className="border-t p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-xl transition"
          >
            Close
          </button>
          {testResults.testReceived && (
            <button
              onClick={() => {
                alert('🎉 Notifications are working correctly!');
                onClose();
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
            >
              All Good!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTester;
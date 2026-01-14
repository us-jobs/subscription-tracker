import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionForm from './components/SubscriptionForm';
import CameraCapture from './components/CameraCapture';
import ImagePreview from './components/ImagePreview';
import Analytics from './components/Analytics';
import SettingsModal from './components/SettingsModal';
import TourGuide from './components/TourGuide';
import GuidanceSections from './components/GuidanceSections';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import AIUpgradeModal from './components/AIUpgradeModal';
import AIErrorModal from './components/AIErrorModal';
import NotificationPopup from './components/NotificationPopup';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

import { processImageWithGemini } from './utils/geminiProcessor';
import { checkAndSendNotifications } from './utils/notificationService';

import { loadSubscriptions, saveSubscriptions, loadUserProfile, saveUserProfile } from './utils/storage';
import { Camera, Upload, FileText, PieChart, List, AlertTriangle, Check, X, ShieldAlert, Download, Bell } from 'lucide-react';

const App = () => {
  // Data State
  const [subscriptions, setSubscriptions] = useState(() => loadSubscriptions());
  const [profile, setProfile] = useState(() => loadUserProfile());
  const [apiKey, setApiKey] = useState('');
  const [tempName, setTempName] = useState('');
  const [nameError, setNameError] = useState('');

  // UI State
  const [view, setView] = useState('list');
  const [editingSub, setEditingSub] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [notificationPopups, setNotificationPopups] = useState([]);

  // Modals
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAIUpgrade, setShowAIUpgrade] = useState({ show: false, mode: '' });
  const [showAIError, setShowAIError] = useState({ show: false, error: '' });
  const [lastAIAction, setLastAIAction] = useState('');
  const [subToDelete, setSubToDelete] = useState(null);
  const [pendingSubscription, setPendingSubscription] = useState(null);

  const fileInputRef = useRef(null);
  const isInitialMount = useRef(true);

useEffect(() => {
    // Initialize UI based on loaded profile
    if (profile.name) {
      setTempName(profile.name);
    } else {
      setShowNamePrompt(true);
    }

    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) setApiKey(savedKey);

    const tourDone = localStorage.getItem('hasSeenTourV1');
    if (!tourDone) setShowTour(true);

    // Check notification permission (works for both native and web)
    const checkNotificationPermission = async () => {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        try {
          const permStatus = await LocalNotifications.checkPermissions();
          if (permStatus.display === 'granted') {
            setProfile(prev => ({ ...prev, notificationsEnabled: true }));
          }
        } catch (error) {
          console.error('Failed to check native permissions:', error);
        }
      } else {
        if ('Notification' in window && Notification.permission === 'granted') {
          setProfile(prev => ({ ...prev, notificationsEnabled: true }));
        }
      }
    };
    
    checkNotificationPermission();

    // Service worker is only needed for web, not native
    if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('✅ Service Worker registered successfully:', registration.scope);
          })
          .catch(error => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }
}, []);

  // Save Data
  useEffect(() => {
    saveSubscriptions(subscriptions);
  }, [subscriptions]);

  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  // Show in-app notification popup
  const showNotificationPopup = (subscription, daysUntil) => {
    const id = Date.now();
    const newPopup = {
      id,
      subscription,
      daysUntil,
      timestamp: new Date()
    };

    setNotificationPopups(prev => [...prev, newPopup]);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotificationPopups(prev => prev.filter(p => p.id !== id));
    }, 10000);
  };

  const removeNotificationPopup = (id) => {
    setNotificationPopups(prev => prev.filter(p => p.id !== id));
  };

  // Check for notifications - runs once per day
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (profile.notificationsEnabled && subscriptions.length > 0) {
      const lastCheckDate = localStorage.getItem('lastNotificationCheck');
      const today = new Date().toDateString();

      if (lastCheckDate !== today) {
        const result = checkAndSendNotifications(
          subscriptions,
          profile,
          showNotificationPopup
        );

        if (result.sent > 0) {
          localStorage.setItem('lastNotificationCheck', today);
        }
      }
    }
  }, [profile.notificationsEnabled, profile.reminderDays]);

  const handleSaveSettings = (key) => {
    const cleanKey = key ? key.trim() : '';
    setApiKey(cleanKey);

    if (cleanKey) {
      localStorage.setItem('geminiApiKey', cleanKey);
    } else {
      localStorage.removeItem('geminiApiKey');
    }
  };

  const handleCompleteTour = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenTourV1', 'true');
  };

  const handleRestartTour = () => {
    setShowSettings(false);
    setShowTour(true);
  };

  // Test Notification Function with dual notifications
  const handleTestNotification = () => {
        alert('Button clicked! Notifications: ' + profile.notificationsEnabled + ', Subs: ' + subscriptions.length);

        console.log('🔍 === BUTTON CLICKED ===');
    console.log('profile.notificationsEnabled:', profile.notificationsEnabled);
    console.log('subscriptions.length:', subscriptions.length);
    console.log('Is Native Platform:', Capacitor.isNativePlatform());
    if (!profile.notificationsEnabled) {
      setNotification({ message: 'Please enable notifications first!', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
      return;
    }

    if (subscriptions.length === 0) {
      setNotification({ message: 'Add a subscription first to test!', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
      return;
    }

    // Detailed mobile debugging
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);

    console.log('🧪 === MOBILE NOTIFICATION DEBUG ===');
    console.log('📱 Device Type:', isMobile ? 'MOBILE' : 'DESKTOP');
    console.log('🤖 Android:', isAndroid);
    console.log('🌐 Chrome:', isChrome);
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🔔 Notification Support:', 'Notification' in window);
    console.log('🔐 Permission:', Notification.permission);
    console.log('👤 Profile:', profile);
    console.log('📦 Subscriptions:', subscriptions.length);
    console.log('📅 Reminder Days:', profile.reminderDays);

    // Clear previous notification flags
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('notified_')) {
        localStorage.removeItem(key);
      }
    });

    try {
      console.log('🚀 Starting notification test...');

      const result = checkAndSendNotifications(
        subscriptions,
        profile,
        showNotificationPopup
      );

      console.log('📊 === TEST RESULT ===');
      console.log('✅ Sent:', result.sent);
      console.log('⏭️ Skipped:', result.skipped);
      console.log('❌ Errors:', result.errors);

      if (result.sent > 0) {
        setNotification({
          message: `✅ ${result.sent} notification(s) sent! ${isMobile ? 'Check popup above & notification shade' : 'Check popup & notification center'}`,
          type: 'success'
        });
      } else if (result.skipped > 0) {
        setNotification({
          message: `⚠️ No subscriptions match your reminder days (${profile.reminderDays.join(', ')} days)`,
          type: 'error'
        });
      } else {
        setNotification({
          message: '⚠️ No notifications sent. Check console for details.',
          type: 'error'
        });
      }

      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    } catch (error) {
      console.error('❌ === TEST ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      setNotification({ message: `❌ Error: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    }
  };

const handleSaveSubscription = async (data) => {
    if (data.id) {
      setSubscriptions(prev => prev.map(s => s.id === data.id ? data : s));
      setView('list');
      setEditingSub(null);
    } else {
      // Check if notifications are enabled before saving new subscription
      const isNative = Capacitor.isNativePlatform();
      let hasPermission = false;

      if (isNative) {
        try {
          const permStatus = await LocalNotifications.checkPermissions();
          hasPermission = permStatus.display === 'granted';
        } catch (error) {
          console.error('Failed to check permissions:', error);
        }
      } else {
        hasPermission = 'Notification' in window && Notification.permission === 'granted';
      }

      if (!hasPermission) {
        console.log('🚫 Permission missing, blocking save...');
        setProfile(prev => ({ ...prev, notificationsEnabled: false }));
        setPendingSubscription(data);
        setShowNotificationSettings(true);
        return;
      }

      const newSub = {
        ...data,
        id: Date.now(),
        status: 'active',
        nextBillingDate: new Date(data.nextBillingDate).toISOString().split('T')[0]
      };
      setSubscriptions(prev => [...prev, newSub]);
      setView('list');
      setEditingSub(null);
    }
};

  const handleDeleteSubscription = (id) => {
    setSubToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (subToDelete) {
      setSubscriptions(prev => prev.filter(s => s.id !== subToDelete));
      setSubToDelete(null);
      setShowDeleteConfirm(false);
      setNotification({ message: 'Subscription deleted', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handleEditSubscription = (sub) => {
    setEditingSub(sub);
    setView('form');
  };

  const handleManualAdd = () => {
    setEditingSub(null);
    setView('form');
  };

  const handleDownloadBackup = () => {
    const backupData = {
      profile: profile,
      subscriptions: subscriptions,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({ message: 'Backup downloaded successfully', type: 'success' });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleImageAnalysis = async (blob) => {
    setView('list');
    setIsProcessing(true);

    try {
      let extracted;

      if (apiKey) {
        console.log('Using Gemini AI...');
        extracted = await processImageWithGemini(blob, apiKey);
      } else {
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        setEditingSub({
          name: extracted.name || '',
          cost: extracted.cost || '',
          nextBillingDate: extracted.date || '',
          currency: extracted.currency || 'USD',
          billingCycle: extracted.billingCycle || 'monthly',
          category: 'other',
          image: base64data,
        });
        setIsProcessing(false);
        setView('form');
      };
    } catch (err) {
      console.error(err);
      let message = err.message || 'Scan failed. Please try again.';

      if (message.includes('INVALID_KEY') || message.includes('404')) {
        setApiKey('');
        localStorage.removeItem('geminiApiKey');
        message = 'Invalid Gemini Key removed.';
      }

      setShowAIError({ show: true, error: message });
      setIsProcessing(false);
      setView('list');
    }
  };

  const handleCameraCapture = (blob) => {
    setLastAIAction('scan');
    handleImageAnalysis(blob);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLastAIAction('upload');
      handleImageAnalysis(file);
    }
  };

  const handleRetry = () => {
    if (lastAIAction === 'scan') {
      setView('camera');
    } else if (lastAIAction === 'upload') {
      fileInputRef.current?.click();
    }
  };

  const calculateTotals = () => {
    const cycles = { weekly: 0.23, biweekly: 0.46, monthly: 1, bimonthly: 2, quarterly: 3, semiannually: 6, yearly: 12, biennially: 24 };
    const monthly = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.cost || 0) / (cycles[sub.billingCycle] || 1)), 0);
    return { monthly: monthly.toFixed(2), yearly: (monthly * 12).toFixed(2) };
  };

// Replace the handleRequestNotifications function with this:
const handleRequestNotifications = async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        // Use Capacitor for native platforms
        try {
            const permStatus = await LocalNotifications.checkPermissions();
            
            if (permStatus.display === 'granted') {
                setShowNotificationSettings(true);
                return;
            }

            const permResult = await LocalNotifications.requestPermissions();
            
            if (permResult.display === 'granted') {
                setShowNotificationSettings(true);
            } else {
                setNotification({ message: 'Notification permission denied', type: 'error' });
                setTimeout(() => setNotification({ message: '', type: '' }), 3000);
            }
        } catch (error) {
            console.error('Failed to request permissions:', error);
            setNotification({ message: 'Failed to enable notifications', type: 'error' });
            setTimeout(() => setNotification({ message: '', type: '' }), 3000);
        }
    } else {
        // Use Web Notifications API for browser
        if (!('Notification' in window)) {
            setNotification({ message: 'Notifications not supported on this device', type: 'error' });
            setTimeout(() => setNotification({ message: '', type: '' }), 3000);
            return;
        }

        if (Notification.permission === 'granted') {
            setShowNotificationSettings(true);
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setShowNotificationSettings(true);
        } else {
            setNotification({ message: 'Notification permission denied', type: 'error' });
            setTimeout(() => setNotification({ message: '', type: '' }), 3000);
        }
    }
};

// Replace the handleSaveNotificationSettings function with this:
const handleSaveNotificationSettings = async (days) => {
    console.log('💾 handleSaveNotificationSettings called', { pending: !!pendingSubscription });
    const isNative = Capacitor.isNativePlatform();

    // Request permission if not granted yet
    if (isNative) {
        try {
            const permStatus = await LocalNotifications.checkPermissions();
            
            if (permStatus.display !== 'granted') {
                const permResult = await LocalNotifications.requestPermissions();
                
                if (permResult.display !== 'granted') {
                    if (pendingSubscription) {
                        setNotification({ message: 'Notifications must be allowed to add a subscription', type: 'error' });
                    } else {
                        setNotification({ message: 'Notification permission denied', type: 'error' });
                    }
                    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Permission request failed:', error);
            setNotification({ message: 'Failed to enable notifications', type: 'error' });
            setTimeout(() => setNotification({ message: '', type: '' }), 3000);
            return;
        }
    } else {
        // Browser permission check
        if ('Notification' in window && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                if (pendingSubscription) {
                    setNotification({ message: 'Notifications must be allowed to add a subscription', type: 'error' });
                } else {
                    setNotification({ message: 'Notification permission denied', type: 'error' });
                }
                setTimeout(() => setNotification({ message: '', type: '' }), 3000);
                return;
            }
        }
    }

    setProfile(prev => ({ ...prev, notificationsEnabled: true, reminderDays: days }));

    // Process pending subscription if exists
    if (pendingSubscription) {
        const newSub = {
            ...pendingSubscription,
            id: Date.now(),
            status: 'active',
            nextBillingDate: new Date(pendingSubscription.nextBillingDate).toISOString().split('T')[0]
        };
        setSubscriptions(prev => [...prev, newSub]);
        setPendingSubscription(null);
        setView('list');
        setEditingSub(null);
        setNotification({ message: 'Subscription added & notifications enabled!', type: 'success' });
    } else {
        setNotification({ message: 'Notification settings updated!', type: 'success' });
    }

    setShowNotificationSettings(false);
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    localStorage.removeItem('lastNotificationCheck');
};

  const handleCloseNotificationSettings = () => {
    if (pendingSubscription) {
      setNotification({ message: 'To add a subscription notification must be turned on', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
      // Do NOT close modal
    } else {
      setShowNotificationSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto">

        {/* Notification Popups - Mobile optimized positioning */}
        <div className="fixed top-4 left-0 right-0 z-[200] px-2 sm:px-4 pointer-events-none">
          <div className="max-w-sm ml-auto space-y-3 pointer-events-auto">
            {notificationPopups.map(popup => (
              <NotificationPopup
                key={popup.id}
                subscription={popup.subscription}
                daysUntil={popup.daysUntil}
                onClose={() => removeNotificationPopup(popup.id)}
              />
            ))}
          </div>
        </div>

        {showNamePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
              <h2 className="text-xl font-bold mb-2">Welcome! 👋</h2>
              <p className="text-gray-600 mb-6 text-sm">Let's get to know you. What should we call you?</p>
              <input
                className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="Enter your name"
                value={tempName}
                onChange={(e) => {
                  const val = e.target.value;
                  setTempName(val);
                  if (val && !/^[a-zA-Z\s]*$/.test(val)) {
                    setNameError('Name can only contain letters and spaces');
                  } else {
                    setNameError('');
                  }
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && tempName.trim() && !nameError) {
                    setProfile({ ...profile, name: tempName.trim() });
                    setShowNamePrompt(false);
                  }
                }}
              />
              {nameError && (
                <p className="text-red-500 text-xs mb-4 -mt-2 animate-pulse">{nameError}</p>
              )}
              <button
                onClick={() => {
                  if (tempName.trim() && !nameError) {
                    setProfile({ ...profile, name: tempName.trim() });
                    setShowNamePrompt(false);
                  }
                }}
                disabled={!tempName.trim() || !!nameError}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                Save & Continue
              </button>
              {profile.name && (
                <button onClick={() => setShowNamePrompt(false)} className="w-full text-gray-400 text-xs mt-4 hover:text-gray-600">Cancel</button>
              )}
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Subscription?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove this subscription? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        <Header
          userName={profile.name}
          notificationsEnabled={profile.notificationsEnabled}
          onEditName={() => { setTempName(profile.name || ''); setShowNamePrompt(true); }}
          onRequestNotifications={handleRequestNotifications}
          hasSubscriptions={subscriptions.length > 0}
          onToggleSettings={() => setShowSettings(true)}
          hasApiKey={!!apiKey}
        />

        {showSettings && (
          <SettingsModal
            initialApiKey={apiKey}
            onClose={() => setShowSettings(false)}
            onSave={handleSaveSettings}
            onRestartTour={handleRestartTour}
            onDownloadBackup={handleDownloadBackup}
          />
        )}

        {showNotificationSettings && (
          <NotificationSettingsModal
            onClose={handleCloseNotificationSettings}
            onSave={handleSaveNotificationSettings}
            currentDays={profile.reminderDays}
            isEnabling={!profile.notificationsEnabled}
          />
        )}

        {showAIUpgrade.show && (
          <AIUpgradeModal
            mode={showAIUpgrade.mode}
            onClose={() => setShowAIUpgrade({ show: false, mode: '' })}
            onEnableAI={() => setShowSettings(true)}
          />
        )}

        {showAIError.show && (
          <AIErrorModal
            error={showAIError.error}
            onClose={() => setShowAIError({ show: false, error: '' })}
            onManualAdd={handleManualAdd}
            onRetry={handleRetry}
          />
        )}

        {showTour && <TourGuide onComplete={handleCompleteTour} />}

        {view === 'camera' && (
          <CameraCapture onCapture={handleCameraCapture} onCancel={() => setView('list')} />
        )}

        {view === 'form' && (
          <SubscriptionForm
            initialData={editingSub}
            onSave={handleSaveSubscription}
            onCancel={() => { setView('list'); setEditingSub(null); }}
            onRetakePhoto={() => setView('camera')}
            onUploadDifferent={() => fileInputRef.current?.click()}
          />
        )}

        {(view === 'list' || view === 'analytics') && (
          <>
            <SummaryCards totals={calculateTotals()} count={subscriptions.length} />

            {profile.notificationsEnabled && subscriptions.length > 0 && view === 'list' && (
              <div className="mb-4">
                <button
                  onClick={handleTestNotification}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  <Bell size={20} className="animate-pulse" />
                  🧪 Test Notifications Now
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Tests both in-app popup + browser/system notifications
                </p>
              </div>
            )}

            <div className="flex justify-center mb-6">
              <div className="bg-gray-200 p-1 rounded-xl inline-flex shadow-inner">
                <button onClick={() => setView('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <List size={18} /> List
                </button>
                <button onClick={() => setView('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <PieChart size={18} /> Analytics
                </button>
              </div>
            </div>

            {view === 'analytics' ? (
              <Analytics subscriptions={subscriptions} />
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
                  <h2 className="text-base font-bold text-gray-800 mb-4">{subscriptions.length === 0 ? '🚀 Add Your First Subscription' : 'Add New'}</h2>
                  {isProcessing ? (
                    <div className="p-8 text-center text-purple-600 animate-pulse bg-purple-50 rounded-xl">
                      <div className="text-2xl mb-2">📸</div>
                      <div className="font-semibold">Processing Receipt...</div>
                      <div className="text-xs text-purple-400 mt-1">Extracting details</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={handleManualAdd} className="flex flex-col items-center justify-center p-4 border-2 border-green-100 bg-green-50 rounded-xl hover:bg-green-100 transition text-green-700 gap-2">
                        <FileText size={24} /><span className="text-xs font-semibold">Manual</span>
                      </button>
                      <button
                        onClick={() => {
                          if (apiKey) setView('camera');
                          else setShowAIUpgrade({ show: true, mode: 'scan' });
                        }}
                        className="flex flex-col items-center justify-center p-4 border-2 border-purple-100 bg-purple-50 rounded-xl hover:bg-purple-100 transition text-purple-700 gap-2"
                      >
                        <Camera size={24} /><span className="text-xs font-semibold">Scan</span>
                      </button>
                      <button
                        onClick={() => {
                          if (apiKey) fileInputRef.current?.click();
                          else setShowAIUpgrade({ show: true, mode: 'upload' });
                        }}
                        className="flex flex-col items-center justify-center p-4 border-2 border-blue-100 bg-blue-50 rounded-xl hover:bg-blue-100 transition text-blue-700 gap-2"
                      >
                        <Upload size={24} /><span className="text-xs font-semibold">Upload</span>
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
                <SubscriptionList subscriptions={subscriptions} onEdit={handleEditSubscription} onDelete={handleDeleteSubscription} onImageClick={(img) => setPreviewImage(img)} />
                {view === 'list' && <GuidanceSections />}
              </>
            )}
          </>
        )}

        <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
        {notification.message && (
          <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-bounce-short w-max max-w-sm ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {notification.type === 'error' ? <AlertTriangle size={20} className="flex-shrink-0" /> : <Check size={20} className="flex-shrink-0" />}
            <span className="font-medium text-sm flex-1">{notification.message}</span>
            <button onClick={() => setNotification({ message: '', type: '' })} className="ml-2 opacity-80 hover:opacity-100 flex-shrink-0"><X size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
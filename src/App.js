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
import SubscriptionSavedModal from './components/SubscriptionSavedModal';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

import { processImageWithGemini } from './utils/geminiProcessor';
import {
  checkAndSendNotifications,
  sendTestNotification,
  getLastNotificationCheck,
  setLastNotificationCheck
} from './utils/notificationService';

import {
  loadSubscriptions,
  saveSubscriptions,
  loadUserProfile,
  saveUserProfile,
  getApiKey,
  setApiKey
} from './utils/storage';
import { Camera, Upload, FileText, PieChart, List, AlertTriangle, Check, X, ShieldAlert, Download, Bell, Loader2 } from 'lucide-react';

const App = () => {
  // Data State
  const [subscriptions, setSubscriptions] = useState([]);
  const [profile, setProfile] = useState({ name: '', reminderDays: [1, 3], notificationsEnabled: false });
  const [apiKey, setApiKeyState] = useState('');
  const [tempName, setTempName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [view, setView] = useState('list');
  const [editingSub, setEditingSub] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Modals
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAIUpgrade, setShowAIUpgrade] = useState({ show: false, mode: '' });
  const [showAIError, setShowAIError] = useState({ show: false, error: '' });
  const [lastAIAction, setLastAIAction] = useState('');
  const [subToDelete, setSubToDelete] = useState(null);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  const [showSavedModal, setShowSavedModal] = useState(null);

  const fileInputRef = useRef(null);
  const isInitialMount = useRef(true);

  // Initialize app - Load all data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');

        // Load all data in parallel
        const [loadedSubs, loadedProfile, loadedKey] = await Promise.all([
          loadSubscriptions(),
          loadUserProfile(),
          getApiKey()
        ]);

        console.log('📦 Data loaded:', {
          subscriptions: loadedSubs.length,
          profile: loadedProfile,
          hasApiKey: !!loadedKey
        });

        setSubscriptions(loadedSubs);
        setProfile(loadedProfile);
        setApiKeyState(loadedKey);

        // Handle initial UI state
        if (!loadedProfile.name) {
          setShowNamePrompt(true);
        } else {
          setTempName(loadedProfile.name);
        }

        // Check tour status
        try {
          const { value } = await Preferences.get({ key: 'hasSeenTourV1' });
          if (value !== 'true') {
            setShowTour(true);
          }
        } catch (error) {
          console.warn('Failed to check tour status:', error);
        }

        // Check notification permission
        const isNative = Capacitor.isNativePlatform();
        if (isNative) {
          try {
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display === 'granted' && !loadedProfile.notificationsEnabled) {
              setProfile(prev => ({ ...prev, notificationsEnabled: true }));
            }
          } catch (error) {
            console.error('Failed to check native permissions:', error);
          }
        } else {
          if ('Notification' in window && Notification.permission === 'granted' && !loadedProfile.notificationsEnabled) {
            setProfile(prev => ({ ...prev, notificationsEnabled: true }));
          }
        }

      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setNotification({
          message: 'Failed to load data. Please restart the app.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
        console.log('✅ App initialized');
      }
    };

    initializeApp();
  }, []);

  // Save Data when changed
  useEffect(() => {
    if (!isLoading && subscriptions.length >= 0) {
      console.log('🔄 Saving subscriptions due to change:', { count: subscriptions.length, isLoading });
      saveSubscriptions(subscriptions);
    }
  }, [subscriptions, isLoading]);

  useEffect(() => {
    if (!isLoading && profile.name !== undefined) {
      saveUserProfile(profile);
    }
  }, [profile, isLoading]);


  // Check for notifications - runs once per day
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const checkNotifications = async () => {
      if (profile.notificationsEnabled && subscriptions.length > 0) {
        try {
          const lastCheckDate = await getLastNotificationCheck();
          const today = new Date().toDateString();

          if (lastCheckDate !== today) {
            const result = await checkAndSendNotifications(
              subscriptions,
              profile
            );
            // Set last check date to today, regardless of whether notifications were sent
            await setLastNotificationCheck(today);
          }
        } catch (error) {
          console.warn('Failed to check notifications:', error);
        }
      }
    };

    checkNotifications();
  }, [profile.notificationsEnabled, profile.reminderDays]); // Removed subscriptions.length from dependencies

  const handleSaveSettings = async (key) => {
    const cleanKey = key ? key.trim() : '';
    setApiKeyState(cleanKey);
    await setApiKey(cleanKey);
  };

  const handleCompleteTour = async () => {
    setShowTour(false);
    try {
      await Preferences.set({ key: 'hasSeenTourV1', value: 'true' });
    } catch (error) {
      console.warn('Failed to save tour status:', error);
    }
  };

  const handleRestartTour = () => {
    setShowSettings(false);
    setShowTour(true);
  };

  // Test Notification Function
  const handleTestNotification = async () => {
    setNotification({ message: 'Sending test notification...', type: 'info' });

    const result = await sendTestNotification();

    if (result.success) {
      setNotification({
        message: `✅ Test notification sent! Check your ${result.method === 'native' ? 'notification shade' : 'notification center'}.`,
        type: 'success'
      });
    } else {
      setNotification({
        message: `❌ Failed: ${result.error}. Please check settings.`,
        type: 'error'
      });

      if (result.error.includes('Permission denied') || result.error.includes('denied')) {
        setTimeout(() => {
          if (window.confirm("Notifications are blocked. Open settings to enable?")) {
            setShowNotificationSettings(true);
          }
        }, 1000);
      }
    }

    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const handleSaveSubscription = async (data) => {
    if (data.id) {
      // Editing existing subscription
      setSubscriptions(prev => {
        const updated = prev.map(s => s.id === data.id ? data : s);

        // IMMEDIATE NOTIFICATION CHECK for edited item
        setTimeout(async () => {
          console.log('🔄 Triggering immediate notification check for edited subscription...');
          await checkAndSendNotifications(updated, profile, true, data.id);
        }, 500);

        return updated;
      });
      setView('list');
      setEditingSub(null);
    } else {
      // Adding new subscription - check permissions first
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

        const isDenied = (!isNative && Notification.permission === 'denied');

        if (isDenied) {
          alert('⚠️ Notifications are blocked! Please enable them in your browser/device settings to save subscriptions.');
          return;
        }

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

      setSubscriptions(prev => {
        const updated = [...prev, newSub];

        // IMMEDIATE NOTIFICATION CHECK for the new item
        setTimeout(async () => {
          console.log('🔄 Triggering immediate notification check for new subscription...');
          const result = await checkAndSendNotifications(updated, profile, true, newSub.id);

          if (result.sent === 0) {
            setShowSavedModal({ sub: newSub, reminderDays: profile.reminderDays });
          }
        }, 500);

        return updated;
      });
      setView('list');
      setEditingSub(null);
    }
  };

  const handleDeleteSubscription = (id) => {
    setSubToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (subToDelete) {
      setIsDeleting(true);
      await new Promise(r => setTimeout(r, 600));

      setSubscriptions(prev => prev.filter(s => s.id !== subToDelete));
      setSubToDelete(null);
      setShowDeleteConfirm(false);
      setIsDeleting(false);

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
        setApiKeyState('');
        await setApiKey('');
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
    const cycles = {
      weekly: 0.23,
      biweekly: 0.46,
      monthly: 1,
      bimonthly: 2,
      quarterly: 3,
      semiannually: 6,
      yearly: 12,
      biennially: 24
    };
    const monthly = subscriptions.reduce((sum, sub) =>
      sum + (parseFloat(sub.cost || 0) / (cycles[sub.billingCycle] || 1)), 0
    );
    return {
      monthly: monthly.toFixed(2),
      yearly: (monthly * 12).toFixed(2)
    };
  };

  const handleRequestNotifications = async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
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

    // Check if settings actually changed
    const daysChanged = JSON.stringify(profile.reminderDays.sort()) !== JSON.stringify(days.sort());
    const enabledChanged = profile.notificationsEnabled !== true;

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
    } else if (daysChanged || enabledChanged) {
      setNotification({ message: 'Notification settings updated!', type: 'success' });
    }

    setShowNotificationSettings(false);
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);

    try {
      await Preferences.remove({ key: 'lastNotificationCheck' });
    } catch (error) {
      console.warn('Failed to remove last notification check:', error);
    }
  };

  const handleCloseNotificationSettings = () => {
    if (pendingSubscription) {
      setNotification({ message: 'To add a subscription notification must be turned on', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } else {
      setShowNotificationSettings(false);
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💳</div>
          <div className="text-2xl font-bold text-gray-800 mb-2">SubTrack</div>
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-indigo-600" />
            <div className="text-sm text-gray-500">Loading your subscriptions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto">

        {/* Name Prompt Modal */}
        {showNamePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
              <h2 className="text-xl font-bold mb-2">Welcome! 👋</h2>
              <p className="text-gray-600 mb-6 text-sm">Let's get to know you. Your Name?</p>
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

        {/* Delete Confirmation Modal */}
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
                <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition disabled:text-gray-400">Cancel</button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:bg-red-400"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : null}
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
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

        {showSavedModal && (
          <SubscriptionSavedModal
            subscription={showSavedModal.sub}
            reminderDays={showSavedModal.reminderDays}
            onClose={() => setShowSavedModal(null)}
          />
        )}

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
                    <div className="p-8 text-center text-purple-600 animate-pulse bg-purple-50 rounded-xl flex flex-col items-center justify-center">
                      <Loader2 size={48} className="animate-spin mb-3 text-purple-500" />
                      <div className="font-semibold text-lg">Processing Receipt...</div>
                      <div className="text-sm text-purple-400 mt-1">Extracting AI details</div>
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
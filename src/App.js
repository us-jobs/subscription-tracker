
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
import { processImage } from './utils/ocrProcessor'; // Offline
import { processImageWithGemini } from './utils/geminiProcessor';
import { loadSubscriptions, saveSubscriptions, loadUserProfile, saveUserProfile } from './utils/storage';
import { Camera, Upload, FileText, PieChart, List, AlertTriangle, Check, X, ShieldAlert, Download } from 'lucide-react';

const App = () => {
  // Data State
  const [subscriptions, setSubscriptions] = useState([]);
  const [profile, setProfile] = useState({ name: '', reminderDays: [1, 3], notificationsEnabled: false });
  const [apiKey, setApiKey] = useState('');
  const [tempName, setTempName] = useState('');
  
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
  const [subToDelete, setSubToDelete] = useState(null);
  
  const fileInputRef = useRef(null);

  // Load Initial Data
  useEffect(() => {
    const subs = loadSubscriptions();
    setSubscriptions(subs);
    
    const userProfile = loadUserProfile();
    setProfile(userProfile);
    if (userProfile.name) {
        setTempName(userProfile.name); 
    } else {
        setShowNamePrompt(true);
    }

    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) setApiKey(savedKey);

    const tourDone = localStorage.getItem('hasSeenTourV1');
    if (!tourDone) setShowTour(true);

    if ('Notification' in window && Notification.permission === 'granted') {
        setProfile(prev => ({ ...prev, notificationsEnabled: true }));
    }
  }, []);

  // Save Data
  useEffect(() => {
    saveSubscriptions(subscriptions);
  }, [subscriptions]);
  
  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

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

  // Handlers
  const handleSaveSubscription = (data) => {
    if (data.id) {
        setSubscriptions(prev => prev.map(s => s.id === data.id ? data : s));
    } else {
        const newSub = { ...data, id: Date.now(), status: 'active' };
        setSubscriptions(prev => [...prev, newSub]);
    }
    setView('list');
    setEditingSub(null);
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
            console.log('Using Offline OCR...');
            extracted = await processImage(blob);
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
        
        // Auto-remove invalid keys logic
        if (message.includes('INVALID_KEY') || message.includes('404')) {
            setApiKey('');
            localStorage.removeItem('geminiApiKey');
            message = 'Invalid Gemini Key removed. Using offline scanner fallback.';
        }

        setNotification({ 
            message: message, 
            type: 'error' 
        });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
        
        setIsProcessing(false);
        setView('list');
    }
  };

  const handleCameraCapture = (blob) => handleImageAnalysis(blob);
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) handleImageAnalysis(file);
  };

  const calculateTotals = () => {
    const cycles = { weekly: 0.23, biweekly: 0.46, monthly: 1, bimonthly: 2, quarterly: 3, semiannually: 6, yearly: 12, biennially: 24 };
    const monthly = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.cost || 0) / (cycles[sub.billingCycle] || 1)), 0);
    return { monthly: monthly.toFixed(2), yearly: (monthly * 12).toFixed(2) };
  };

  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        new Notification('Notifications Enabled!', { body: 'We will remind you about upcoming payments.' });
        setProfile(prev => ({ ...prev, notificationsEnabled: true }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto">
        
        {showNamePrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
                    <h2 className="text-xl font-bold mb-2">Welcome! 👋</h2>
                    <p className="text-gray-600 mb-6 text-sm">Let's get to know you. What should we call you?</p>
                    <input 
                        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                        placeholder="Enter your name"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && tempName.trim()) {
                                setProfile({ ...profile, name: tempName });
                                setShowNamePrompt(false);
                            }
                        }}
                    />
                    <button 
                        onClick={() => {
                            if (tempName.trim()) {
                                setProfile({ ...profile, name: tempName });
                                setShowNamePrompt(false);
                            }
                        }}
                        disabled={!tempName.trim()}
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
                                    <button onClick={() => setView('camera')} className="flex flex-col items-center justify-center p-4 border-2 border-purple-100 bg-purple-50 rounded-xl hover:bg-purple-100 transition text-purple-700 gap-2">
                                        <Camera size={24} /><span className="text-xs font-semibold">Scan</span>
                                    </button>
                                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-4 border-2 border-blue-100 bg-blue-50 rounded-xl hover:bg-blue-100 transition text-blue-700 gap-2">
                                        <Upload size={24} /><span className="text-xs font-semibold">Upload</span>
                                    </button>
                                    <button onClick={handleManualAdd} className="flex flex-col items-center justify-center p-4 border-2 border-green-100 bg-green-50 rounded-xl hover:bg-green-100 transition text-green-700 gap-2">
                                        <FileText size={24} /><span className="text-xs font-semibold">Manual</span>
                                    </button>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </div>
                        <SubscriptionList subscriptions={subscriptions} onEdit={handleEditSubscription} onDelete={handleDeleteSubscription} onImageClick={(img) => setPreviewImage(img)} />
                    </>
                )}
            </>
        )}
        
        <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
        {notification.message && (
            <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-bounce-short w-max max-w-sm ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {notification.type === 'error' ? <AlertTriangle size={20} className="flex-shrink-0"/> : <Check size={20} className="flex-shrink-0"/>}
                <span className="font-medium text-sm flex-1">{notification.message}</span>
                <button onClick={() => setNotification({ message: '', type: '' })} className="ml-2 opacity-80 hover:opacity-100 flex-shrink-0"><X size={16} /></button>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Settings, ExternalLink, X } from 'lucide-react';
import { 
  requestNotificationPermissionWithGuidance, 
  getNotificationInstructions 
} from '../utils/notificationHelper';

const NotificationSetupModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('initial'); // initial, requesting, instructions, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [showSystemInstructions, setShowSystemInstructions] = useState(false);

  const handleEnableNotifications = async () => {
    setStep('requesting');
    
    const result = await requestNotificationPermissionWithGuidance();
    
    if (result.success) {
      if (result.needsSystemEnable) {
        setErrorMessage(result.message);
        setShowSystemInstructions(true);
        setStep('instructions');
      } else {
        setStep('success');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }
    } else {
      setErrorMessage(result.message);
      if (result.showInstructions) {
        setShowSystemInstructions(true);
        setStep('instructions');
      } else {
        setStep('error');
      }
    }
  };

  const instructions = getNotificationInstructions();

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Set! 🎉</h3>
          <p className="text-gray-600 text-sm">
            You'll now receive reminders for your upcoming subscriptions.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'instructions') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{instructions.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{instructions.title}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={20} />
            </button>
          </div>
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6 space-y-2">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{step.replace(/^\d+\.\s*/, '')}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <Settings size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-blue-900">Quick Access</p>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              Click the lock icon in your browser's address bar, then click "Site settings" to quickly access browser notification permissions.
            </p>
          </div>

          <button
            onClick={() => {
              setStep('initial');
              setShowSystemInstructions(false);
              handleEnableNotifications();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            I've Enabled Notifications - Try Again
          </button>
          
          <button
            onClick={onClose}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition"
          >
            I'll Do This Later
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Unable to Enable Notifications</h3>
          <p className="text-sm text-gray-600 mb-6 text-center">{errorMessage}</p>
          
          <button
            onClick={() => {
              setShowSystemInstructions(true);
              setStep('instructions');
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition mb-3"
          >
            Show Me How to Fix This
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    );
  }

  // Initial state
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Bell size={32} className="text-indigo-600" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
          Never Miss a Payment! 🔔
        </h3>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Get timely reminders before your subscriptions renew. We'll notify you 1-3 days before each payment.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Stay in control</p>
              <p className="text-xs text-gray-600">Cancel unwanted subscriptions before renewal</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Avoid surprises</p>
              <p className="text-xs text-gray-600">Know exactly when payments are due</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Your privacy matters</p>
              <p className="text-xs text-gray-600">Notifications are local and private</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleEnableNotifications}
          disabled={step === 'requesting'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {step === 'requesting' ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Bell size={18} />
              Enable Notifications
            </>
          )}
        </button>
        
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default NotificationSetupModal;
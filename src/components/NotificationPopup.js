import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Bell } from 'lucide-react';

const NotificationPopup = ({ subscription, daysUntil, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Play notification sound if available
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuFzvLaizsIGGS57OihUBELTKXh8bllHgU2jdT0yn0vBSh+zPLfklAKE1m07OyrWxYLQ5zd8sFuJAUuhM/z3I4+CRZiturqpVITC0mi4PK8aB8GM4/U88yAMQUpgs/z3pFDChJXs+ztrV0XC0CY3PLEcSYELIHO8tiJOQgZZ7zs6aJREQtLpOHxt2YeBTWP1PLLfi4GJ3vM8+CRQgoTWLTs7axaFQs/mNzyxHImBS2Czc',);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'CAD': '$', 'AUD': '$',
      'JPY': '¥', 'CNY': '¥', 'KRW': '₩'
    };
    return symbols[currency] || currency;
  };

  const getDaysText = () => {
    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow';
    return `in ${daysUntil} days`;
  };

  const getUrgencyColor = () => {
    if (daysUntil === 0) return 'from-red-500 to-red-600';
    if (daysUntil === 1) return 'from-orange-500 to-orange-600';
    if (daysUntil <= 3) return 'from-yellow-500 to-yellow-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100
        transform transition-all duration-300 ease-out w-full max-w-sm
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'scale-95' : 'scale-100'}
      `}
      style={{
        animation: isVisible && !isExiting ? 'slideInRight 0.3s ease-out, pulse 0.5s ease-in-out' : '',
        maxWidth: '90vw' // Ensure it fits on small screens
      }}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${getUrgencyColor()} p-4 text-white relative`}>
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Bell size={24} className="animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Subscription Reminder</h3>
            <p className="text-sm text-white/90">Payment due soon</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {subscription.image ? (
            <img 
              src={subscription.image} 
              alt={subscription.name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{subscription.name.charAt(0)}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-lg truncate">
              {subscription.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={16} className="text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 font-semibold">
                {getCurrencySymbol(subscription.currency)}{subscription.cost}
              </span>
              <span className="text-gray-400 text-sm">/ {subscription.billingCycle}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Calendar size={16} className="text-gray-500 flex-shrink-0" />
              <span className={`font-bold ${daysUntil <= 1 ? 'text-red-600' : 'text-orange-600'}`}>
                Due {getDaysText()}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleClose}
          className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all transform hover:scale-105 active:scale-95"
        >
          Got it!
        </button>
      </div>

      {/* Progress bar showing urgency */}
      <div className="h-1 bg-gray-100">
        <div 
          className={`h-full bg-gradient-to-r ${getUrgencyColor()} transition-all duration-[10000ms] ease-linear`}
          style={{ width: isVisible ? '0%' : '100%' }}
        />
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPopup;
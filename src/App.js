import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, Edit2, X, Check, Camera, Upload, FileText, User, BellOff } from 'lucide-react';

const SubscriptionTracker = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempName, setTempName] = useState('');
  const [formData, setFormData] = useState({
    name: '', cost: '', billingCycle: 'monthly', nextBillingDate: '',
    category: 'streaming', isTrial: false, trialEndDate: '', email: '', image: ''
  });
  const [errors, setErrors] = useState({});
  const [nameWarning, setNameWarning] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomedImage, setZoomedImage] = useState('');
  const [addMethod, setAddMethod] = useState('manual');
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderDays, setReminderDays] = useState([1, 3]); // Default: 1 and 3 days before
  const [customDays, setCustomDays] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showClearDataWarning, setShowClearDataWarning] = useState(false);


  const categories = ['streaming', 'software', 'fitness', 'food', 'gaming', 'music', 'other'];

  useEffect(() => {
    const saved = localStorage.getItem('subscriptions');
    if (saved) setSubscriptions(JSON.parse(saved));
    
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowNamePrompt(true);
    }
    
    const savedReminderDays = localStorage.getItem('reminderDays');
    if (savedReminderDays) {
      setReminderDays(JSON.parse(savedReminderDays));
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('reminderDays', JSON.stringify(reminderDays));
  }, [reminderDays]);

  const saveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('userName', tempName.trim());
      setShowNamePrompt(false);
    }
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('Notifications Enabled!', {
          body: `You'll get reminders ${reminderDays.sort((a,b) => b - a).join(', ')} days before charges`
        });
        setShowReminderSettings(true);
      }
    }
  };

  const toggleReminderDay = (day) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => a - b));
    }
  };

  const addCustomDay = () => {
    const day = parseInt(customDays);
    if (day && day > 0 && day <= 30 && !reminderDays.includes(day)) {
      setReminderDays([...reminderDays, day].sort((a, b) => a - b));
      setCustomDays('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim() === '') newErrors.name = 'Name required';
    if (!formData.cost || formData.cost === '') newErrors.cost = 'Cost required';
    else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Enter valid amount';
    }
    if (!formData.nextBillingDate) newErrors.nextBillingDate = 'Date required';
    if (formData.isTrial && !formData.trialEndDate) newErrors.trialEndDate = 'Trial date required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (editingId) {
      setSubscriptions(subscriptions.map(s => 
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
    } else {
      setSubscriptions([...subscriptions, { ...formData, id: Date.now(), status: 'active' }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', cost: '', billingCycle: 'monthly', nextBillingDate: '',
      category: 'streaming', isTrial: false, trialEndDate: '', email: '', image: '' });
    setShowAddForm(false);
    setEditingId(null);
    setNameWarning('');
    setErrors({});
    setAddMethod('manual');
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const startCamera = async () => {
    setAddMethod('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      streamRef.current = stream;
      setShowCamera(true);
      
      // Wait a moment for video element to be ready
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(err => console.log('Play error:', err));
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access denied. Please allow camera permission in your browser settings.');
      setAddMethod('manual');
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Make sure video is playing
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
      if (blob) {
        processImage(blob);
      } else {
        alert('Failed to capture image. Please try again.');
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddMethod('upload');
      processImage(file);
    }
  };

  const preprocessImage = (imageBlob) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Increase contrast and brightness for better OCR
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          
          // Increase contrast
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          let pixel = factor * (avg - 128) + 128;
          
          // Increase brightness
          pixel = pixel + 50;
          
          // Clamp values
          pixel = Math.max(0, Math.min(255, pixel));
          
          // Apply to all channels
          data[i] = data[i + 1] = data[i + 2] = pixel;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
      
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const processImage = async (imageBlob) => {
    setIsProcessing(true);
    stopCamera();
    
    try {
      // Convert image to base64 for storage
      const reader = new FileReader();
      const imageBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(imageBlob);
      });
      
      // Preprocess image for better OCR
      const processedBlob = await preprocessImage(imageBlob);
      const imageUrl = URL.createObjectURL(processedBlob);
      
      const { default: Tesseract } = await import('tesseract.js');
      
      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`Processing: ${Math.round(info.progress * 100)}%`);
          }
        }
      });
      
      const text = result.data.text;
      console.log('Full extracted text:', text);
      
      const parsed = parseReceiptText(text);
      
      const found = [];
      const missing = [];
      
      if (parsed.name) found.push('Name');
      else missing.push('Name');
      
      if (parsed.cost) found.push('Cost');
      else missing.push('Cost');
      
      if (parsed.date) found.push('Date');
      else missing.push('Date');
      
      // Set form data with parsed info AND the image
      setFormData(prev => ({
        ...prev,
        name: parsed.name || prev.name,
        cost: parsed.cost || prev.cost,
        nextBillingDate: parsed.date || prev.nextBillingDate,
        image: imageBase64  // Store the image
      }));
      
      setShowAddForm(true);
      
      URL.revokeObjectURL(imageUrl);
      
      if (found.length === 0) {
        alert('❌ Could not extract information\n\nImage saved. Please enter details manually below.');
      } else if (missing.length > 0) {
        alert(`✅ Found: ${found.join(', ')}\n⚠️ Missing: ${missing.join(', ')}\n\nImage saved. Fill missing fields below.`);
      } else {
        alert('✅ All details extracted!\n\nImage saved. Verify and save.');
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      setShowAddForm(true);
      alert('❌ Processing failed\n\nPlease enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let name = '', cost = '', date = '';
    
    console.log('All extracted lines:', lines);
    
    const services = [
      'netflix', 'spotify', 'amazon', 'prime', 'disney', 'hulu', 'apple', 'youtube',
      'jio', 'airtel', 'hotstar', 'zee5', 'sonyliv', 'voot', 'mx player',
      'cricbuzz', 'cricket', 'plan', 'subscription', 'membership', 'offer', 'upgrade'
    ];
    
    // STRICT: Look for service names - must have service keyword and reasonable length
    const potentialNames = [];
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      let hasService = false;
      
      // Check if contains service keyword
      for (const service of services) {
        if (lower.includes(service)) {
          hasService = true;
          break;
        }
      }
      
      // Check patterns like "X Month Plan", "X Year Plan"
      const hasPlanPattern = /\d+\s*(month|year|day)\s*(plan|subscription|membership)/i.test(line);
      
      if ((hasService || hasPlanPattern) && line.length > 3 && line.length < 60) {
        // Calculate relevance score
        let score = 0;
        if (hasService) score += 10;
        if (hasPlanPattern) score += 8;
        if (/plan|subscription|membership|offer/i.test(line)) score += 5;
        if (line.length < 30) score += 3; // Prefer shorter, cleaner names
        
        potentialNames.push({ name: line, score: score });
      }
    }
    
    // Sort by score and pick the best
    potentialNames.sort((a, b) => b.score - a.score);
    if (potentialNames.length > 0) {
      name = potentialNames[0].name;
    }
    
    console.log('Potential names found:', potentialNames);
    
    // Look for ALL potential prices
    const potentialPrices = [];
    
    for (const line of lines) {
      if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(line.trim())) continue;
      
      const pricePatterns = [
        { pattern: /(?:USD|INR|EUR|GBP|JPY|CNY|AUD|CAD|CHF|SGD|NZD|HKD|KRW|MXN|BRL|ZAR|RUB|SEK|NOK|DKK|PLN|TRY|AED|SAR|MYR|THB|IDR|PHP|VND|Rs\.?|₹|£|€|¥|₩|R\$|Fr|kr|zł|₺|RM|฿|Rp|₱|₫)\s*(\d{1,6}(?:[.,]\d{1,3})?)/i, priority: 10 },
        { pattern: /(\d{1,6}(?:[.,]\d{1,3})?)\s*(?:USD|INR|EUR|GBP|JPY|CNY|AUD|CAD|CHF|SGD|NZD|HKD|KRW|MXN|BRL|ZAR|RUB|SEK|NOK|DKK|PLN|TRY|AED|SAR|MYR|THB|IDR|PHP|VND|dollars?|rupees?|euros?|pounds?|yen|yuan|francs?|kronor?|kroner?|złoty|lira|ringgit|baht|rupiah|pesos?|dong)/i, priority: 10 },
        { pattern: /[\$£€¥₹₩₪₱₡₵₦₨₴₸]\s*(\d{1,6}(?:[.,]\d{1,3})?)/i, priority: 10 },
        { pattern: /(\d{1,6}(?:[.,]\d{1,3})?)\s*[\$£€¥₹₩₪₱₡₵₦₨₴₸]/i, priority: 10 },
        { pattern: /(?:price|cost|amount|total|pay|charge|fee|bill|payment)[:=\s]*(\d{2,6}(?:[.,]\d{1,3})?)/i, priority: 8 },
        { pattern: /(\d{2,6}(?:[.,]\d{1,3})?)\s*(?:only|off|discount|per|each)/i, priority: 7 },
        { pattern: /\b(\d{2,4})\b(?!\s*(?:day|month|year|mar|jan|feb|apr|may|jun|jul|aug|sep|oct|nov|dec|days|months|years))/i, priority: 5 }
      ];
      
      for (const { pattern, priority } of pricePatterns) {
        const match = line.match(pattern);
        if (match) {
          let amount = match[1].replace(',', '.');
          const numAmount = parseFloat(amount);
          
          // STRICT: Must be reasonable price AND have some currency context
          // Reject if it's just a standalone number without currency indicator
          const hasCurrencyContext = /[\$£€¥₹₩₪₱₡₵₦₨₴₸]|USD|INR|EUR|GBP|price|cost|amount|pay|charge|fee|bill/i.test(line);
          
          if (numAmount >= 0.01 && numAmount <= 999999 && numAmount < 2000) {
            // Only add if it has currency context OR it's high priority
            if (hasCurrencyContext || priority >= 8) {
              potentialPrices.push({
                amount: amount,
                value: numAmount,
                priority: priority,
                line: line,
                hasCurrency: hasCurrencyContext
              });
            }
          }
        }
      }
    }
    
    // Sort by: 1) has currency, 2) priority, 3) value
    potentialPrices.sort((a, b) => {
      if (a.hasCurrency !== b.hasCurrency) return b.hasCurrency ? 1 : -1;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.value - a.value;
    });
    
    console.log('Potential prices found:', potentialPrices);
    
    // Pick the best one ONLY if it has currency context
    if (potentialPrices.length > 0 && potentialPrices[0].hasCurrency) {
      cost = potentialPrices[0].amount;
    }
    
    // STRICT: Look for dates with better patterns
    const potentialDates = [];
    
    for (const line of lines) {
      const datePatterns = [
        // "expires on 21 Mar, 2026" or "Plan expires on 21 Mar, 2026"
        { pattern: /(?:expires?|expiry|renewal|renews?|next|due).*?(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,\s]+(\d{4})/i, priority: 10 },
        // "21 Mar, 2026"
        { pattern: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,\s]+(\d{4})/i, priority: 8 },
        // "Mar 21, 2026"
        { pattern: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/i, priority: 8 },
        // "21/03/2026" or "21-03-2026"
        { pattern: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/i, priority: 6 }
      ];
      
      for (const { pattern, priority } of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            const dateStr = match[0].replace(/(?:expires?|expiry|renewal|renews?|next|due).*?(?:on|in)?\s*:?\s*/i, '');
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              const year = parsed.getFullYear();
              // Only accept future dates or dates within reasonable range
              if (year >= 2024 && year <= 2030) {
                const month = String(parsed.getMonth() + 1).padStart(2, '0');
                const day = String(parsed.getDate()).padStart(2, '0');
                potentialDates.push({
                  date: `${year}-${month}-${day}`,
                  priority: priority,
                  line: line
                });
              }
            }
          } catch (e) {
            console.log('Date parse error:', e);
          }
        }
      }
    }
    
    // Sort by priority and pick best date
    potentialDates.sort((a, b) => b.priority - a.priority);
    console.log('Potential dates found:', potentialDates);
    
    if (potentialDates.length > 0) {
      date = potentialDates[0].date;
    }
    
    console.log('Final parsed results:', { name, cost, date });
    return { name, cost, date };
  };

  const handleNameChange = (name) => {
    setFormData({...formData, name});
    if (errors.name) setErrors({...errors, name: ''});
    const duplicate = subscriptions.find(sub => 
      sub.name.toLowerCase() === name.toLowerCase() && sub.id !== editingId
    );
    setNameWarning(duplicate ? `⚠️ "${duplicate.name}" exists${duplicate.email ? ` (${duplicate.email})` : ''}` : '');
  };

  const removeImage = () => {
    setFormData({...formData, image: ''});
  };

  const zoomImage = (imageUrl) => {
    setZoomedImage(imageUrl);
    setShowImageZoom(true);
  };

  const exportData = () => {
    const data = {
      userName,
      subscriptions,
      reminderDays,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    localStorage.clear();
    setSubscriptions([]);
    setUserName('');
    setReminderDays([1, 3]);
    setShowClearDataWarning(false);
    alert('✅ All data cleared successfully!');
    window.location.reload();
  };

  const editSubscription = (sub) => {
    setFormData(sub);
    setEditingId(sub.id);
    setShowAddForm(true);
    setNameWarning('');
    setErrors({});
  };

  const deleteSubscription = (id) => {
    if (window.confirm('Delete subscription?')) {
      const updated = subscriptions.filter(s => s.id !== id);
      setSubscriptions(updated);
    }
  };

  const calculateTotals = () => {
    const cycles = { weekly: 0.23, biweekly: 0.46, monthly: 1, bimonthly: 2, quarterly: 3, semiannually: 6, yearly: 12, biennially: 24 };
    const monthly = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.cost) / cycles[sub.billingCycle]), 0);
    return { monthly: monthly.toFixed(2), yearly: (monthly * 12).toFixed(2) };
  };

  const getUpcoming = () => {
    const today = new Date();
    return subscriptions
      .map(sub => ({ ...sub, daysUntil: Math.ceil((new Date(sub.nextBillingDate) - today) / 86400000) }))
      .filter(sub => sub.daysUntil >= 0 && sub.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const totals = calculateTotals();
  const upcoming = getUpcoming();

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Welcome! 👋</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">What's your name?</p>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveName()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              placeholder="Enter your name"
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={!tempName.trim()}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* SEO Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 text-white">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3 leading-tight">SubTrack - Never Miss a Subscription Payment</h1>
          <p className="text-base sm:text-xl text-indigo-100 mb-4 leading-relaxed hidden sm:block">
            Smart subscription manager with AI-powered receipt scanning. Track all your subscriptions, get reminders before charges, and save money by canceling unused services.
          </p>
          <div className="flex flex-wrap gap-4 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">📸</div>
              <span className="text-indigo-50">AI Receipt Scanner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">🔔</div>
              <span className="text-indigo-50">Smart Reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">💰</div>
              <span className="text-indigo-50">Save Money</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md">
                {userName ? getInitials(userName) : <User size={20} />}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{userName || 'SubTrack'}</h1>
                <p className="text-xs sm:text-sm text-gray-500">Manage subscriptions</p>
              </div>
            </div>
            <button onClick={requestNotifications}
              className={`p-2 sm:p-3 rounded-lg transition ${notificationsEnabled ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}>
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            {notificationsEnabled && (
              <button 
                onClick={() => setShowReminderSettings(!showReminderSettings)}
                className="p-2 sm:p-3 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition text-xs sm:text-sm font-medium hidden sm:block"
                title="Reminder Settings"
              >
                ⚙️
              </button>
            )}
            {subscriptions.length > 0 && (
              <button
                onClick={() => setShowClearDataWarning(true)}
                className="p-2 sm:p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs"
                title="Clear All Data"
              >
                🗑️
              </button>
            )}
          </div>

          {/* Reminder Settings */}
          {showReminderSettings && notificationsEnabled && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🔔 Reminder Settings
              </h3>
              <p className="text-xs text-gray-600 mb-3">Choose when to get reminders before charges:</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {[1, 3, 7, 14, 30].map(day => (
                  <button
                    key={day}
                    onClick={() => toggleReminderDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      reminderDays.includes(day)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day} day{day > 1 ? 's' : ''}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Custom days"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={addCustomDay}
                  disabled={!customDays}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Add
                </button>
              </div>

              {reminderDays.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  Active reminders: <span className="font-semibold text-indigo-600">{reminderDays.sort((a,b) => a - b).join(', ')} days before</span>
                </div>
              )}
            </div>
          )}
          
          {subscriptions.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 sm:p-4 text-white shadow-md">
                <div className="text-xs opacity-90">Monthly</div>
                <div className="text-lg sm:text-2xl font-bold">${totals.monthly}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white shadow-md">
                <div className="text-xs opacity-90">Yearly</div>
                <div className="text-lg sm:text-2xl font-bold">${totals.yearly}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white shadow-md">
                <div className="text-xs opacity-90">Active</div>
                <div className="text-lg sm:text-2xl font-bold">{subscriptions.length}</div>
              </div>
            </div>
          )}
        </div>

        {!showAddForm && !showCamera && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
              {subscriptions.length === 0 ? '🚀 Add Your First Subscription' : '➕ Add Subscription'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={startCamera} disabled={isProcessing}
                className="flex items-center gap-3 p-3 sm:p-4 border-2 border-purple-300 rounded-xl hover:bg-purple-50 transition disabled:opacity-50">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera size={20} className="text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-800 text-sm">
                    <span className="sm:hidden">Photo</span>
                    <span className="hidden sm:inline">Take Photo</span>
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">Scan receipt</div>
                </div>
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                className="flex items-center gap-3 p-3 sm:p-4 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition disabled:opacity-50">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Upload size={20} className="text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-800 text-sm">
                    <span className="sm:hidden">Upload</span>
                    <span className="hidden sm:inline">Upload Image</span>
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">From gallery</div>
                </div>
              </button>
              <button onClick={() => { setAddMethod('manual'); setShowAddForm(true); }}
                className="flex items-center gap-3 p-3 sm:p-4 border-2 border-green-300 rounded-xl hover:bg-green-50 transition">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-800 text-sm">
                    <span className="sm:hidden">Manual</span>
                    <span className="hidden sm:inline">Manual Entry</span>
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">Type details</div>
                </div>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            {isProcessing && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-center text-purple-600 text-xs sm:text-sm font-medium animate-pulse">
                📸 Processing...
              </div>
            )}
          </div>
        )}

        {showCamera && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">📸 Camera</h2>
              <button onClick={stopCamera} className="text-gray-500"><X size={20} /></button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden mb-3" style={{ minHeight: '300px' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-auto"
                style={{ maxHeight: '60vh' }}
              />
              {!videoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <div className="text-sm">Loading camera...</div>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={captureImage} 
              className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 font-medium text-sm sm:text-base mb-2 flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              📸 Capture Photo
            </button>
            <button 
              onClick={stopCamera} 
              className="w-full bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Point camera at receipt or subscription email
            </p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingId ? '✏️ Edit' : '➕ Add'}
              </h2>
              <button onClick={resetForm} className="text-gray-500"><X size={20} /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.name ? 'border-red-500' : nameWarning ? 'border-yellow-400' : ''}`}
                  placeholder="Netflix, Spotify, etc." />
                {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
                {nameWarning && !errors.name && <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">{nameWarning}</div>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(optional)</span></label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="john@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cost ($) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" value={formData.cost}
                    onChange={(e) => { setFormData({...formData, cost: e.target.value}); if (errors.cost) setErrors({...errors, cost: ''}); }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.cost ? 'border-red-500' : ''}`} placeholder="9.99" />
                  {errors.cost && <div className="mt-1 text-xs text-red-600">{errors.cost}</div>}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cycle</label>
                  <select value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
                  {categories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Next Billing <span className="text-red-500">*</span></label>
                <input type="date" value={formData.nextBillingDate}
                  onChange={(e) => { setFormData({...formData, nextBillingDate: e.target.value}); if (errors.nextBillingDate) setErrors({...errors, nextBillingDate: ''}); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.nextBillingDate ? 'border-red-500' : ''}`} />
                {errors.nextBillingDate && <div className="mt-1 text-xs text-red-600">{errors.nextBillingDate}</div>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isTrial" checked={formData.isTrial}
                  onChange={(e) => setFormData({...formData, isTrial: e.target.checked})} className="w-4 h-4 text-purple-600 rounded" />
                <label htmlFor="isTrial" className="text-xs sm:text-sm font-medium text-gray-700">Free trial</label>
              </div>
              {formData.isTrial && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Trial End <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.trialEndDate}
                    onChange={(e) => { setFormData({...formData, trialEndDate: e.target.value}); if (errors.trialEndDate) setErrors({...errors, trialEndDate: ''}); }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.trialEndDate ? 'border-red-500' : ''}`} />
                  {errors.trialEndDate && <div className="mt-1 text-xs text-red-600">{errors.trialEndDate}</div>}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={resetForm} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition text-gray-700">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium text-sm transition shadow-sm">
                  <Check size={16} /> {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>

            {/* Image Preview BELOW Form */}
            {formData.image && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Captured Receipt</h3>
                  {addMethod === 'camera' ? (
                    <button
                      onClick={() => { removeImage(); startCamera(); }}
                      className="text-xs sm:text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 flex items-center gap-1 transition"
                    >
                      <Camera size={14} />
                      Take Photo Again
                    </button>
                  ) : (
                    <button
                      onClick={() => { removeImage(); fileInputRef.current?.click(); }}
                      className="text-xs sm:text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 flex items-center gap-1 transition"
                    >
                      <Upload size={14} />
                      Upload Different
                    </button>
                  )}
                </div>
                <div className="relative">
                  <img 
                    src={formData.image} 
                    alt="Receipt" 
                    className="w-full rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-90 transition"
                    onClick={() => zoomImage(formData.image)}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click to zoom • Use button above to retake/reupload
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

                    {subscriptions.length > 0 && !showAddForm && !showCamera && (
          <div className="space-y-3">
            {upcoming.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-3">📅 Upcoming</h2>
                <div className="space-y-2">
                  {upcoming.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        {sub.image && (
                          <img 
                            src={sub.image} 
                            alt={sub.name} 
                            className="w-10 h-10 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition" 
                            onClick={() => zoomImage(sub.image)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-sm truncate">{sub.name}</div>
                          <div className="text-xs text-gray-600">{sub.daysUntil === 0 ? 'Today' : `${sub.daysUntil}d`}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-800 text-sm">${sub.cost}</div>
                        <div className="text-xs text-gray-500">{sub.billingCycle.slice(0,3)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-3">All Subscriptions</h2>
              <div className="space-y-2">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="flex justify-between items-start p-3 border rounded-lg hover:shadow-md transition">
                    <div className="flex items-start gap-2 flex-1 min-w-0 mr-2">
                      {sub.image && (
                        <img 
                          src={sub.image} 
                          alt={sub.name} 
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition" 
                          onClick={() => zoomImage(sub.image)}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <div className="font-semibold text-sm text-gray-800 truncate">{sub.name}</div>
                          {sub.isTrial && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex-shrink-0">Trial</span>}
                        </div>
                        <div className="text-xs text-gray-600">
                          ${sub.cost} / {sub.billingCycle} • {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </div>
                        {sub.email && <div className="text-xs text-gray-500 truncate">📧 {sub.email}</div>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => editSubscription(sub)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteSubscription(sub.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {showImageZoom && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={() => setShowImageZoom(false)}>
            <div className="relative max-w-4xl max-h-screen">
              <button
                onClick={() => setShowImageZoom(false)}
                className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-200 shadow-lg z-10"
              >
                <X size={24} />
              </button>
              <img 
                src={zoomedImage} 
                alt="Zoomed" 
                className="max-w-full max-h-screen object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-white text-center mt-4 text-sm">Click outside to close</p>
            </div>
          </div>
        )}

        {subscriptions.length === 0 && !showAddForm && !showCamera && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Subscriptions Yet</h3>
            <p className="text-sm text-gray-500">Add your first subscription above to start tracking</p>
          </div>
        )}

        {/* SEO Content Section - Always show */}
        {!showAddForm && !showCamera && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                Why Use SubTrack?
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-100">
                    <span className="text-2xl">💸</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Save Money</h3>
                    <p className="text-sm text-gray-600">Track all subscriptions in one place and cancel unused services. Average user saves $200/year.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔔</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Never Miss Payments</h3>
                    <p className="text-sm text-gray-600">Get reminders before charges. Avoid surprise bills and overdraft fees.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">AI-Powered Scanner</h3>
                    <p className="text-sm text-gray-600">Snap a photo of receipts or emails. AI extracts subscription details automatically.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">100% Private</h3>
                    <p className="text-sm text-gray-600">All data stored locally on your device. No accounts, no servers, complete privacy.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                How to Use SubTrack
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Add Your Subscriptions</h3>
                    <p className="text-sm text-gray-600">Take a photo of your receipt, upload an image, or enter details manually. Our AI scanner extracts subscription name, cost, and billing date automatically.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Enable Notifications</h3>
                    <p className="text-sm text-gray-600">Get browser notifications 1-3 days before charges. Never miss a payment or forget to cancel a free trial.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Track & Save</h3>
                    <p className="text-sm text-gray-600">View total monthly and yearly spending. Identify unused subscriptions and cancel them to save money.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">
                Features That Make SubTrack Special
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">AI receipt scanning with 40+ currency support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">Smart reminders for upcoming charges</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">Trial period tracking with auto-alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">Works offline - no internet required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">Multiple accounts per service tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">Visual calendar of upcoming payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">100% free - no premium plans</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span className="text-indigo-50">Works on mobile, tablet, and desktop</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear Data Warning Modal */}
        {showClearDataWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Clear All Data?</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>This will delete:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• All {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</li>
                  <li>• Your profile ({userName})</li>
                  <li>• Reminder settings</li>
                  <li>• All captured images</li>
                </ul>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  💾 Download a backup first (recommended)
                </p>
                <button
                  onClick={exportData}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 mb-2"
                >
                  📥 Download Backup
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Saves all your data as JSON file
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearDataWarning(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTracker;
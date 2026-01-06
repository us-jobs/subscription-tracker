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
    category: 'streaming', isTrial: false, trialEndDate: '', email: ''
  });
  const [errors, setErrors] = useState({});
  const [nameWarning, setNameWarning] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addMethod, setAddMethod] = useState('manual');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

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
    
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

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
          body: 'You will now receive reminders'
        });
      }
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
      category: 'streaming', isTrial: false, trialEndDate: '', email: '' });
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      alert('Camera access denied');
      setAddMethod('manual');
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => processImage(blob), 'image/jpeg');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddMethod('upload');
      processImage(file);
    }
  };

  const processImage = async (imageBlob) => {
    setIsProcessing(true);
    stopCamera();
    try {
      const imageUrl = URL.createObjectURL(imageBlob);
      const { default: Tesseract } = await import('tesseract.js');
      const result = await Tesseract.recognize(imageUrl, 'eng');
      const parsed = parseReceiptText(result.data.text);
      
      if (parsed.name || parsed.cost || parsed.date) {
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          cost: parsed.cost || prev.cost,
          nextBillingDate: parsed.date || prev.nextBillingDate
        }));
        
        const missing = [];
        if (!parsed.name) missing.push('name');
        if (!parsed.cost) missing.push('cost');
        if (!parsed.date) missing.push('date');
        
        setShowAddForm(true);
        if (missing.length > 0) {
          alert(`✅ Scanned! Fill: ${missing.join(', ')}`);
        } else {
          alert('✅ Done! Verify & save');
        }
      } else {
        alert('⚠️ No data found. Enter manually');
        setAddMethod('manual');
        setShowAddForm(true);
      }
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      alert('❌ Failed. Try again');
      setAddMethod('manual');
      setShowAddForm(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim());
    let name = '', cost = '', date = '';
    const services = ['netflix', 'spotify', 'amazon', 'disney', 'hulu', 'apple', 'youtube', 'prime'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const service of services) {
        if (lower.includes(service)) {
          name = service.charAt(0).toUpperCase() + service.slice(1);
          break;
        }
      }
    }
    for (const line of lines) {
      const priceMatch = line.match(/\$?\s*(\d+[.,]\d{2})/);
      if (priceMatch) { cost = priceMatch[1].replace(',', '.'); break; }
    }
    for (const line of lines) {
      const dateMatch = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
      if (dateMatch) {
        const parts = dateMatch[1].split(/[-/]/);
        if (parts.length === 3) {
          let year = parts[2];
          if (year.length === 2) year = '20' + year;
          date = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        break;
      }
    }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-2 sm:p-4">
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Welcome! 👋</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">What's your name?</p>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveName()}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              placeholder="Enter your name"
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={!tempName.trim()}
              className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 font-medium disabled:bg-gray-300"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                {userName ? getInitials(userName) : <User size={20} />}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{userName || 'SubTrack'}</h1>
                <p className="text-xs sm:text-sm text-gray-500">Manage subscriptions</p>
              </div>
            </div>
            <button onClick={requestNotifications}
              className={`p-2 sm:p-3 rounded-lg ${notificationsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              title={notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}>
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
          </div>
          
          {subscriptions.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 sm:p-4 text-white">
                <div className="text-xs opacity-90">Monthly</div>
                <div className="text-lg sm:text-2xl font-bold">${totals.monthly}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white">
                <div className="text-xs opacity-90">Yearly</div>
                <div className="text-lg sm:text-2xl font-bold">${totals.yearly}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 sm:p-4 text-white">
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
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-3" />
            <div className="flex gap-2">
              <button onClick={captureImage} className="flex-1 bg-green-500 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-green-600 font-medium text-sm sm:text-base">
                Capture
              </button>
              <button onClick={stopCamera} className="flex-1 bg-gray-500 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-600 font-medium text-sm sm:text-base">
                Cancel
              </button>
            </div>
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
                <button onClick={resetForm} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 font-medium text-sm">
                  <Check size={16} /> {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
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
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-semibold text-gray-800 text-sm truncate">{sub.name}</div>
                        <div className="text-xs text-gray-600">{sub.daysUntil === 0 ? 'Today' : `${sub.daysUntil}d`}</div>
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
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <div className="font-semibold text-sm text-gray-800 truncate">{sub.name}</div>
                        {sub.isTrial && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex-shrink-0">Trial</span>}
                      </div>
                      <div className="text-xs text-gray-600">
                        ${sub.cost} / {sub.billingCycle} • {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </div>
                      {sub.email && <div className="text-xs text-gray-500 truncate">📧 {sub.email}</div>}
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

        {subscriptions.length === 0 && !showAddForm && !showCamera && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Subscriptions Yet</h3>
            <p className="text-sm text-gray-500">Add your first subscription above to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTracker;
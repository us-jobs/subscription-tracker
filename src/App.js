import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, Edit2, Calendar, X, Check, Camera, Upload, FileText } from 'lucide-react';

const SubscriptionTracker = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('Notifications Enabled!', {
          body: 'You will now receive reminders for your subscriptions'
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim() === '') newErrors.name = 'Name is required';
    if (!formData.cost || formData.cost === '') newErrors.cost = 'Cost is required';
    else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Enter a valid amount greater than 0';
    }
    if (!formData.nextBillingDate) newErrors.nextBillingDate = 'Next billing date is required';
    if (formData.isTrial && !formData.trialEndDate) newErrors.trialEndDate = 'Trial end date is required';
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
      alert('Camera access denied. Please allow camera permission.');
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
        if (!parsed.date) missing.push('billing date');
        
        setShowAddForm(true);
        if (missing.length > 0) {
          alert(`✅ Scanned! Please fill in: ${missing.join(', ')}`);
        } else {
          alert('✅ All details extracted! Verify and save.');
        }
      } else {
        alert('⚠️ Could not extract details. Please enter manually.');
        setAddMethod('manual');
        setShowAddForm(true);
      }
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      alert('❌ Failed to process image. Try again or enter manually.');
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
    setNameWarning(duplicate ? `⚠️ You already have "${duplicate.name}"${duplicate.email ? ` (${duplicate.email})` : ''}. Add email to differentiate.` : '');
  };

  const editSubscription = (sub) => {
    setFormData(sub);
    setEditingId(sub.id);
    setShowAddForm(true);
    setNameWarning('');
    setErrors({});
  };

  const deleteSubscription = (id) => {
    if (window.confirm('Delete this subscription?')) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">SubTrack</h1>
            <button onClick={requestNotifications}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${notificationsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Bell size={20} />
              {notificationsEnabled ? 'On' : 'Enable Notifications'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="text-sm opacity-90">Monthly</div>
              <div className="text-3xl font-bold">${totals.monthly}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="text-sm opacity-90">Yearly</div>
              <div className="text-3xl font-bold">${totals.yearly}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="text-sm opacity-90">Active</div>
              <div className="text-3xl font-bold">{subscriptions.length}</div>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && !showAddForm && !showCamera && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Add New Subscription</h2>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={startCamera} disabled={isProcessing}
                className="flex flex-col items-center gap-3 p-6 border-2 border-purple-300 rounded-xl hover:bg-purple-50 transition disabled:opacity-50">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Camera size={32} className="text-purple-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">Take Photo</div>
                  <div className="text-sm text-gray-500">Scan receipt</div>
                </div>
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                className="flex flex-col items-center gap-3 p-6 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition disabled:opacity-50">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload size={32} className="text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">Upload Image</div>
                  <div className="text-sm text-gray-500">From gallery</div>
                </div>
              </button>
              <button onClick={() => { setAddMethod('manual'); setShowAddForm(true); }}
                className="flex flex-col items-center gap-3 p-6 border-2 border-green-300 rounded-xl hover:bg-green-50 transition">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText size={32} className="text-green-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">Manual Entry</div>
                  <div className="text-sm text-gray-500">Type details</div>
                </div>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            {isProcessing && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg text-center text-purple-600 font-medium animate-pulse">
                📸 Processing image...
              </div>
            )}
          </div>
        )}

        {showCamera && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">📸 Camera</h2>
              <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4" />
            <div className="flex gap-3">
              <button onClick={captureImage} className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium">
                Capture
              </button>
              <button onClick={stopCamera} className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingId ? '✏️ Edit' : '➕ Add'} Subscription
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.name ? 'border-red-500' : nameWarning ? 'border-yellow-400' : ''}`}
                  placeholder="Netflix, Spotify, etc." />
                {errors.name && <div className="mt-1 text-sm text-red-600">{errors.name}</div>}
                {nameWarning && !errors.name && <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">{nameWarning}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Email <span className="text-gray-400 text-xs">(optional)</span></label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="john@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" value={formData.cost}
                    onChange={(e) => { setFormData({...formData, cost: e.target.value}); if (errors.cost) setErrors({...errors, cost: ''}); }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.cost ? 'border-red-500' : ''}`} placeholder="9.99" />
                  {errors.cost && <div className="mt-1 text-sm text-red-600">{errors.cost}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cycle</label>
                  <select value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="bimonthly">Bi-monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semiannually">Semi-annually</option>
                    <option value="yearly">Yearly</option>
                    <option value="biennially">Biennially</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  {categories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Billing Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.nextBillingDate}
                  onChange={(e) => { setFormData({...formData, nextBillingDate: e.target.value}); if (errors.nextBillingDate) setErrors({...errors, nextBillingDate: ''}); }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.nextBillingDate ? 'border-red-500' : ''}`} />
                {errors.nextBillingDate && <div className="mt-1 text-sm text-red-600">{errors.nextBillingDate}</div>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isTrial" checked={formData.isTrial}
                  onChange={(e) => setFormData({...formData, isTrial: e.target.checked})} className="w-4 h-4 text-purple-600 rounded" />
                <label htmlFor="isTrial" className="text-sm font-medium text-gray-700">This is a free trial</label>
              </div>
              {formData.isTrial && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trial End Date <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.trialEndDate}
                    onChange={(e) => { setFormData({...formData, trialEndDate: e.target.value}); if (errors.trialEndDate) setErrors({...errors, trialEndDate: ''}); }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.trialEndDate ? 'border-red-500' : ''}`} />
                  {errors.trialEndDate && <div className="mt-1 text-sm text-red-600">{errors.trialEndDate}</div>}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={resetForm} className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 font-medium">
                  <Check size={20} /> {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow">
          {['dashboard', 'subscriptions', 'calendar'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium capitalize transition ${activeTab === tab ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar /> Upcoming Charges (Next 30 Days)</h2>
              {upcoming.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming charges</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <div className="font-semibold text-gray-800">{sub.name}</div>
                        <div className="text-sm text-gray-600">{sub.daysUntil === 0 ? 'Today' : `In ${sub.daysUntil} day${sub.daysUntil !== 1 ? 's' : ''}`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">${sub.cost}</div>
                        <div className="text-xs text-gray-500 capitalize">{sub.billingCycle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">All Subscriptions</h2>
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No subscriptions yet</p>
                <button onClick={() => setActiveTab('dashboard')} className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600">
                  Add Your First
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg text-gray-800">{sub.name}</div>
                        {sub.isTrial && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Trial</span>}
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{sub.category}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${sub.cost} / {sub.billingCycle} • Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                        {sub.email && <div className="text-xs text-gray-500 mt-0.5">📧 {sub.email}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); editSubscription(sub); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteSubscription(sub.id); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Calendar View</h2>
            <div className="space-y-4">
              {subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-purple-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{sub.name}</div>
                    <div className="text-sm text-gray-600">
                      Next billing: {new Date(sub.nextBillingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">${sub.cost}</div>
                    <div className="text-xs text-gray-500 capitalize">{sub.billingCycle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTracker;

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, Save } from 'lucide-react';

const SubscriptionForm = ({
    initialData,
    onSave,
    onCancel,
    onRetakePhoto,
    onUploadDifferent
}) => {
    const [formData, setFormData] = useState({
        name: '', cost: '', currency: 'USD', billingCycle: 'monthly', nextBillingDate: '',
        category: 'streaming', isTrial: false, trialEndDate: '', email: '', image: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name || formData.name.trim() === '') newErrors.name = 'Name required';
        if (!formData.cost || formData.cost === '') newErrors.cost = 'Cost required';
        else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
            newErrors.cost = 'Enter valid amount';
        }
        if (!formData.nextBillingDate) newErrors.nextBillingDate = 'Date required';
        if (formData.isTrial && !formData.trialEndDate) newErrors.trialEndDate = 'Trial date required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsSubmitting(true);
            // Simulate brief delay for UX
            await new Promise(r => setTimeout(r, 600));
            onSave(formData);
            // Don't set false here immediately if onSave causes unmount, but safest to do so for stability if it doesn't
            setIsSubmitting(false);
        }
    };

    const categories = ['streaming', 'software', 'fitness', 'food', 'gaming', 'music', 'education', 'hosting', 'other'];
    const currencies = [
        { value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' },
        { value: 'INR', label: 'INR (₹)' }, { value: 'CAD', label: 'CAD ($)' }, { value: 'AUD', label: 'AUD ($)' },
        { value: 'JPY', label: 'JPY (¥)' }, { value: 'CNY', label: 'CNY (¥)' }, { value: 'KRW', label: 'KRW (₩)' }
    ];

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {initialData?.id ? '✏️ Edit Subscription' : '➕ Add Subscription'}
                </h2>
                <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-3">
                {/* Name */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Netflix, Spotify, etc."
                    />
                    {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
                </div>

                {/* Email (Optional) */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(optional)</span></label>
                    <input type="email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.email ? 'border-red-500' : ''}`} placeholder="john@example.com" />
                    {errors.email && <div className="mt-1 text-xs text-red-600">{errors.email}</div>}
                </div>

                {/* Cost & Cycle */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cost <span className="text-red-500">*</span></label>
                        <input type="number" step="0.01" value={formData.cost}
                            onChange={(e) => { setFormData({ ...formData, cost: e.target.value }); if (errors.cost) setErrors({ ...errors, cost: '' }); }}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.cost ? 'border-red-500' : ''}`} placeholder="9.99" />
                        {errors.cost && <div className="mt-1 text-xs text-red-600">{errors.cost}</div>}
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cycle</label>
                        <select value={formData.billingCycle} onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>

                {/* Currency & Category */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
                            {currencies.map(curr => <option key={curr.value} value={curr.value}>{curr.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm capitalize">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* Billing Date */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Next Billing <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.nextBillingDate}
                        min={today}
                        onChange={(e) => { setFormData({ ...formData, nextBillingDate: e.target.value }); if (errors.nextBillingDate) setErrors({ ...errors, nextBillingDate: '' }); }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.nextBillingDate ? 'border-red-500' : ''}`} />
                    {errors.nextBillingDate && <div className="mt-1 text-xs text-red-600">{errors.nextBillingDate}</div>}
                </div>

                {/* Trial Checkbox */}
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isTrial" checked={formData.isTrial}
                        onChange={(e) => setFormData({ ...formData, isTrial: e.target.checked })} className="w-4 h-4 text-purple-600 rounded" />
                    <label htmlFor="isTrial" className="text-xs sm:text-sm font-medium text-gray-700">Free trial</label>
                </div>

                {/* Trial End Date */}
                {formData.isTrial && (
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Trial End <span className="text-red-500">*</span></label>
                        <input type="date" value={formData.trialEndDate}
                            min={today}
                            onChange={(e) => { setFormData({ ...formData, trialEndDate: e.target.value }); if (errors.trialEndDate) setErrors({ ...errors, trialEndDate: '' }); }}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors.trialEndDate ? 'border-red-500' : ''}`} />
                        {errors.trialEndDate && <div className="mt-1 text-xs text-red-600">{errors.trialEndDate}</div>}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition text-gray-700">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium text-sm transition shadow-sm disabled:bg-indigo-400"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                {initialData?.id ? 'Updating...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {initialData?.id ? 'Update' : 'Save'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Receipt Preview */}
            {formData.image && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Receipt Image</h3>
                        <div className="flex gap-2">
                            {onRetakePhoto && (
                                <button
                                    onClick={onRetakePhoto}
                                    className="text-xs sm:text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                                >
                                    <Camera size={14} /> Retake
                                </button>
                            )}
                            {onUploadDifferent && (
                                <button
                                    onClick={onUploadDifferent}
                                    className="text-xs sm:text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition"
                                >
                                    <Upload size={14} /> Upload
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="relative group">
                        <img
                            src={formData.image}
                            alt="Receipt"
                            className="w-full rounded-lg border border-gray-200"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionForm;

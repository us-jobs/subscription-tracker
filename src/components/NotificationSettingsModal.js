
import React, { useState } from 'react';
import { X, Bell, Calendar, Check, Clock } from 'lucide-react';

const NotificationSettingsModal = ({ onClose, onSave, currentDays, isEnabling }) => {
    const [selectedDays, setSelectedDays] = useState(currentDays || [1, 3]);
    const [customDay, setCustomDay] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const options = [1, 3, 5, 7, 14, 30];

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleAddCustom = () => {
        const val = parseInt(customDay);
        if (val > 0 && !selectedDays.includes(val)) {
            setSelectedDays([...selectedDays, val]);
            setCustomDay('');
            setShowCustom(false);
        }
    };

    const handleSave = () => {
        onSave(selectedDays);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
                <div className="bg-indigo-600 p-6 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={32} />
                    </div>
                    <h2 className="text-xl font-bold">
                        {isEnabling ? 'Enable Notifications' : 'Reminder Preferences'}
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">When should we remind you?, before <br></br> 1 day, 3 days.. Select from below</p>
                </div>

                <div className="p-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 italic">
                        Select reminder timing
                    </label>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {options.map(day => (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`py-2 rounded-xl text-xs font-semibold transition ${selectedDays.includes(day)
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {day} {day === 1 ? 'day' : 'days'}
                            </button>
                        ))}
                    </div>

                    {showCustom ? (
                        <div className="flex gap-2 mb-6 animate-fade-in">
                            <input
                                type="number"
                                value={customDay}
                                onChange={(e) => setCustomDay(e.target.value)}
                                placeholder="Enter days"
                                className="flex-1 border p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleAddCustom}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
                            >
                                Add
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCustom(true)}
                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition mb-6 font-medium"
                        >
                            + Add Custom Days
                        </button>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            onClick={handleSave}
                            disabled={selectedDays.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            {isEnabling ? 'Confirm & Enable' : 'Save Changes'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full text-gray-400 text-sm font-medium hover:text-gray-600"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 border-t text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                        <Clock size={12} />
                        <span>You will be notified for each selected timing.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsModal;


import React from 'react';
import { X, Sparkles, Key, Camera, Upload, AlertCircle } from 'lucide-react';

const AIUpgradeModal = ({ onClose, onEnableAI, mode }) => {
    const isScan = mode === 'scan';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                {/* Header with Icon */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/10 animate-pulse-subtle">
                        {isScan ? <Camera size={36} /> : <Upload size={36} />}
                    </div>

                    <h2 className="text-2xl font-bold mb-2">Enable AI to {isScan ? 'Scan' : 'Upload'}</h2>
                    <p className="text-indigo-100 text-sm opacity-90">
                        {isScan
                            ? "Camera scanning requires an AI connection to read receipt details."
                            : "Image uploads require AI to automatically extract subscription data."
                        }
                    </p>
                </div>

                <div className="p-8">
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">Automated Extraction</h4>
                                <p className="text-xs text-gray-500">AI reads dates, pricing, and names so you don't have to type.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                <Key size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">Privacy Focused</h4>
                                <p className="text-xs text-gray-500">Use your own Gemini key for 100% private, secure processing.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                onEnableAI();
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
                        >
                            <Sparkles size={18} className="group-hover:rotate-12 transition" />
                            Enable AI Now
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 border-t flex items-center justify-center gap-2">
                    <AlertCircle size={14} className="text-amber-500" />
                    <span className="text-[10px] text-gray-500 font-medium italic">
                        Manual entry is always available for free.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AIUpgradeModal;

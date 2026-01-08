
import React from 'react';
import { X, AlertCircle, FileText, RefreshCw, ChevronRight } from 'lucide-react';

const AIErrorModal = ({ error, onClose, onManualAdd, onRetry }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[80] backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                {/* Header with Icon */}
                <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">AI Scan Failed</h2>
                </div>

                <div className="p-8">
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 italic">
                        <p className="text-xs text-gray-600 leading-relaxed text-center">
                            "{error || "We couldn't process this image. it might be too large or the API key might be invalid."}"
                        </p>
                    </div>

                    <p className="text-sm text-gray-500 mb-8 text-center">
                        Don't let it stop you! You can still add your subscription details manually in seconds.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                onManualAdd();
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-indigo-200 flex items-center px-6 group"
                        >
                            <FileText size={18} className="shrink-0" />
                            <span className="flex-1 text-center">Add Manually</span>
                            <ChevronRight size={18} className="shrink-0 opacity-50 group-hover:translate-x-1 transition" />
                        </button>

                        <button
                            onClick={() => {
                                onClose();
                                onRetry();
                            }}
                            className="w-full py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} />
                            Try Again
                        </button>
                    </div>
                </div>

                <div className="bg-red-50/30 px-6 py-3 flex items-center justify-center gap-2">
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                        System Error Detected
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AIErrorModal;

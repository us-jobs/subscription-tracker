
import React, { useState } from 'react';
import { X, Save, ExternalLink, Check, Eye, EyeOff, Trash2, Download, BrainCircuit } from 'lucide-react';

const SettingsModal = ({ onClose, onSave, initialApiKey, onRestartTour, onDownloadBackup }) => {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    // Basic format check
    if (apiKey && apiKey.trim().length < 30) {
        setError('Key looks too short. Please check.');
        return;
    }
    
    onSave(apiKey); // App.js handles the trim()
    setSuccess(true);
    setTimeout(() => {
        setSuccess(false);
        onClose();
    }, 1000);
  };

  const handleDelete = () => {
      if (window.confirm('Remove API Key? You will switch back to offline mode.')) {
          setApiKey('');
          onSave(''); // Clear in parent
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
                ⚙️ Settings
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <BrainCircuit size={18} className="text-indigo-600"/> 
                    AI Scanning (Gemini)
                </h3>
                
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
                    <p className="text-xs text-indigo-900 font-semibold mb-2">Why use your own key?</p>
                    <ul className="text-xs text-indigo-700 space-y-1">
                        <li className="flex items-center gap-1.5"><Check size={12} /> 10x More Accurate than offline mode</li>
                        <li className="flex items-center gap-1.5"><Check size={12} /> Detects "Expires in 27 days" dates</li>
                        <li className="flex items-center gap-1.5"><Check size={12} /> Reads complex invoice layouts</li>
                    </ul>
                </div>

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Gemini API Key
                </label>
                <div className="relative mb-2">
                    <input 
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                        placeholder="AIzaSy..."
                        className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                    >
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                
                <div className="flex gap-2 mt-3">
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
                    >
                        🔑 Get Free Key <ExternalLink size={12}/>
                    </a>
                    {initialApiKey && (
                        <button 
                            onClick={handleDelete}
                            className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-100"
                            title="Remove Key"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 pt-4 border-t border-gray-100 space-y-3">
                <h3 className="font-bold text-gray-800 mb-2 text-sm">Data & Support</h3>
                
                <button 
                    onClick={onDownloadBackup}
                    className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-800 flex items-center justify-between transition border border-blue-100"
                >
                    <span className="flex items-center gap-2"><Download size={16} /> Download Data Backup</span>
                    <ExternalLink size={14} className="opacity-50" />
                </button>

                <button 
                    onClick={onRestartTour}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 flex items-center justify-between transition"
                >
                    <span>👀 Show Feature Tour again</span>
                    <ExternalLink size={14} className="opacity-50" />
                </button>
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className={`px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition ${success ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {success ? <><Check size={18} /> Saved</> : <><Save size={18} /> Save Settings</>}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

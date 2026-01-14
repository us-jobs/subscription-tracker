
import React from 'react';
import { User, Bell, BellOff, Wallet, Edit2, Sparkles, Settings } from 'lucide-react';

const Header = ({ userName, notificationsEnabled, onEditName, onRequestNotifications, onToggleSettings, hasApiKey }) => {
    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">SubTrack</span>
                    </div>

                    <button
                        onClick={onEditName}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition text-sm font-medium"
                    >
                        <User size={14} className="text-indigo-200" />
                        <span>{userName || 'Guest'}</span>
                        <Edit2 size={12} className="text-indigo-300 opacity-70" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {!hasApiKey ? (
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline text-[10px] text-indigo-100 font-medium opacity-80 max-w-[80px] leading-tight text-right">
                                Use Gemini for accurate Image scanning
                            </span>
                            <button
                                onClick={onToggleSettings}
                                className="bg-white text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-gray-50 hover:scale-105 transition flex items-center gap-1.5 animate-pulse-subtle"
                            >
                                <Sparkles size={14} fill="currentColor" />
                                Enable AI
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onToggleSettings}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-xs font-semibold text-white/90 hover:text-white border border-white/10"
                        >
                            <Sparkles size={14} />
                            AI Enabled
                        </button>
                    )}

                    {notificationsEnabled ? (
                        <button
                            onClick={onRequestNotifications}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition shadow-inner"
                            title="Notification Preferences"
                        >
                            <Bell size={20} className="text-white" />
                        </button>
                    ) : (
                        <button
                            onClick={onRequestNotifications}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-indigo-100 hover:text-white"
                            title="Enable Notifications"
                        >
                            <BellOff size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* SEO & Promotional Banner Content */}
            <div className="mt-8 relative z-10">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
                    SubTrack - Never Miss a Subscription Payment!
                </h1>
                <p className="hidden md:block text-indigo-100 text-sm sm:text-base max-w-2xl leading-relaxed opacity-90 mb-6">
                    Smart subscription manager with AI-powered receipt scanning. Track all your subscriptions,
                    get reminders before charges, and save money by canceling unused services.
                </p>
            </div>
        </div>
    );
};

export default Header;

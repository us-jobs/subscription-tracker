
import React from 'react';
import { Banknote, Bell, Scan, Lock, Check } from 'lucide-react';

const GuidanceSections = () => {
    return (
        <div className="mt-12 space-y-12 pb-12">
            {/* Why Use SubTrack? */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">Why Use SubTrack?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-xl text-green-600 shrink-0">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">Save Money</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">Track all subscriptions in one place and cancel unused services. Average user saves $200/year.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">Never Miss Payments</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">Get reminders before charges. Avoid surprise bills and overdraft fees.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                        <div className="bg-purple-100 p-3 rounded-xl text-purple-600 shrink-0">
                            <Scan size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">AI-Powered Scanner</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">Snap a photo of receipts or emails. AI extracts subscription details automatically.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                        <div className="bg-yellow-100 p-3 rounded-xl text-yellow-600 shrink-0">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">100% Private</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">All data stored locally on your device. No accounts, no servers, complete privacy.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Use SubTrack */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-8">How to Use SubTrack</h2>
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-indigo-100">1</div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">Add Your Subscriptions</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">Take a photo of your receipt, upload an image, or enter details manually. Our AI scanner extracts subscription name, cost, and billing date automatically.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-indigo-100">2</div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">Enable Notifications</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">Get browser notifications 1-3 days before charges. Never miss a payment or forget to cancel a free trial.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-indigo-100">3</div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">Track & Save</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">View total monthly and yearly spending. Identify unused subscriptions and cancel them to save money.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features That Make SubTrack Special */}
            <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
                <h2 className="text-xl font-bold mb-8">Features That Make SubTrack Special</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">AI receipt scanning with 40+ currency support</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">Smart reminders for upcoming charges</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">Trial period tracking with auto-alerts</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">Works offline - no internet required</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">Multiple accounts per service tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">Visual calendar of upcoming payments</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">100% free - no premium plans</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>
                        <span className="text-xs font-semibold">Works on mobile, tablet, and desktop</span>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default GuidanceSections;

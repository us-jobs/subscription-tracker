
import React, { useState } from 'react';
import { Edit2, Trash2, Filter } from 'lucide-react';

const SubscriptionList = ({ subscriptions, onEdit, onDelete, onImageClick }) => {
    const [sortBy, setSortBy] = useState('date'); // 'date', 'cost-desc', 'cost-asc', 'name'
    const [filterCategory, setFilterCategory] = useState('all');

    const getCurrencySymbol = (currency) => {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'CAD': '$', 'AUD': '$',
            'JPY': '¥', 'CNY': '¥', 'KRW': '₩'
        };
        return symbols[currency] || currency;
    };

    const categories = ['all', 'streaming', 'software', 'fitness', 'food', 'gaming', 'music', 'education', 'hosting', 'other'];

    const getUpcoming = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return subscriptions
            .map(sub => {
                const nextDate = new Date(sub.nextBillingDate);
                nextDate.setHours(0, 0, 0, 0);
                const diffTime = nextDate - today;
                const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return { ...sub, daysUntil };
            })
            .filter(sub => sub.daysUntil >= 0 && sub.daysUntil <= 30)
            .sort((a, b) => a.daysUntil - b.daysUntil);
    };

    const upcoming = getUpcoming();

    const getFilteredAndSorted = () => {
        let filtered = [...subscriptions];

        // Filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(sub => sub.category === filterCategory);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'cost-desc') return parseFloat(b.cost) - parseFloat(a.cost); // Simplified (ignores currency difference for sorting)
            if (sortBy === 'cost-asc') return parseFloat(a.cost) - parseFloat(b.cost);
            // Default: Next Billing Date
            return new Date(a.nextBillingDate) - new Date(b.nextBillingDate);
        });

        return filtered;
    };

    const processedSubs = getFilteredAndSorted();

    if (subscriptions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Subscriptions Yet</h3>
                <p className="text-sm text-gray-500">Add your first subscription above to start tracking</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* UPCOMING SECTION - Always shows top upcoming regardless of filter */}
            {upcoming.length > 0 && filterCategory === 'all' && (
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
                                            onClick={() => onImageClick(sub.image)}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-800 text-sm truncate">{sub.name}</div>
                                        <div className="text-xs text-gray-600">{sub.daysUntil === 0 ? 'Today' : sub.daysUntil === 1 ? 'Tomorrow' : `${sub.daysUntil} days`}</div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="font-bold text-gray-800 text-sm">{getCurrencySymbol(sub.currency)}{sub.cost}</div>
                                    <div className="text-xs text-gray-500 capitalize">{sub.billingCycle}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTROLS (Only show if list is long) */}
            {subscriptions.length > 15 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="date">Sort: Date</option>
                        <option value="name">Sort: Name</option>
                        <option value="cost-desc">Sort: Cost (High)</option>
                        <option value="cost-asc">Sort: Cost (Low)</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                    </select>
                </div>
            )}

            {/* MAIN LIST */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm sm:text-base font-bold text-gray-800">
                        {filterCategory === 'all' ? 'All Subscriptions' : <span className="capitalize">{filterCategory}</span>}
                        <span className="text-gray-400 font-normal ml-2 text-xs">({processedSubs.length})</span>
                    </h2>
                </div>

                {processedSubs.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">No subscriptions match filter</div>
                ) : (
                    <div className="space-y-2">
                        {processedSubs.map(sub => (
                            <div key={sub.id} className="flex justify-between items-start p-3 border rounded-lg hover:shadow-md transition bg-white">
                                <div className="flex items-start gap-2 flex-1 min-w-0 mr-2">
                                    {sub.image ? (
                                        <img
                                            src={sub.image}
                                            alt={sub.name}
                                            className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition bg-gray-100"
                                            onClick={() => onImageClick(sub.image)}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center p-1">
                                            No Img
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1 mb-1">
                                            <div className="font-semibold text-sm text-gray-800 truncate">{sub.name}</div>
                                            {sub.isTrial && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex-shrink-0">Trial</span>}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {getCurrencySymbol(sub.currency)}{sub.cost} / {sub.billingCycle}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => onEdit(sub)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => onDelete(sub.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionList;

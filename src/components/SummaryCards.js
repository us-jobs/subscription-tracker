
import React from 'react';

const SummaryCards = ({ totals, count }) => {
    if (count === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">Spending Overview</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 sm:p-4 text-white shadow-md transition transform hover:scale-105">
                    <div className="text-xs opacity-90 mb-1">Monthly</div>
                    <div className="text-lg sm:text-2xl font-bold">${totals.monthly}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white shadow-md transition transform hover:scale-105">
                    <div className="text-xs opacity-90 mb-1">Yearly</div>
                    <div className="text-lg sm:text-2xl font-bold">${totals.yearly}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white shadow-md transition transform hover:scale-105">
                    <div className="text-xs opacity-90 mb-1">Active</div>
                    <div className="text-lg sm:text-2xl font-bold">{count}</div>
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;

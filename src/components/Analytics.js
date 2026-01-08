
import React from 'react';

const Analytics = ({ subscriptions }) => {
    const getCategoryData = () => {
        const categories = {};
        let totalCost = 0;

        const cycles = { weekly: 0.23, biweekly: 0.46, monthly: 1, bimonthly: 2, quarterly: 3, semiannually: 6, yearly: 12, biennially: 24 };

        subscriptions.forEach(sub => {
            const monthlyCost = parseFloat(sub.cost || 0) / (cycles[sub.billingCycle] || 1);
            const cat = sub.category || 'other';

            if (!categories[cat]) categories[cat] = 0;
            categories[cat] += monthlyCost;
            totalCost += monthlyCost;
        });

        // Sort by value desc
        return Object.entries(categories)
            .map(([name, value]) => ({
                name,
                value,
                percentage: totalCost > 0 ? (value / totalCost) * 100 : 0
            }))
            .sort((a, b) => b.value - a.value);
    };

    const data = getCategoryData();
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
        '#10b981', '#06b6d4', '#3b82f6', '#64748b'
    ];

    if (subscriptions.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <p className="text-gray-500">Add subscriptions to see analytics</p>
            </div>
        );
    }

    // Calculate cumulative for Pie Chart
    let cumulativePercent = 0;
    const pieSegments = data.map((item, index) => {
        const start = cumulativePercent;
        cumulativePercent += item.percentage;
        return { ...item, start, end: cumulativePercent, color: colors[index % colors.length] };
    });

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Monthly Spending Analysis</h2>

            <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* PIE CHART */}
                <div className="relative w-48 h-48 flex-shrink-0">
                    <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                        {pieSegments.map(segment => {
                            const [startX, startY] = getCoordinatesForPercent(segment.start / 100);
                            const [endX, endY] = getCoordinatesForPercent(segment.end / 100);
                            const largeArcFlag = segment.percentage > 50 ? 1 : 0;

                            const pathData = [
                                `M ${startX} ${startY}`,
                                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                `L 0 0`,
                            ].join(' ');

                            return (
                                <path
                                    key={segment.name}
                                    d={pathData}
                                    fill={segment.color}
                                    stroke="white"
                                    strokeWidth="0.02" // slight gap
                                />
                            );
                        })}
                        {/* Center hole for donut effect */}
                        <circle cx="0" cy="0" r="0.6" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="font-bold text-gray-800">${data.reduce((a, b) => a + b.value, 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* LEGEND */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {pieSegments.map(item => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="capitalize text-gray-700">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900">${item.value.toFixed(2)}</span>
                                <span className="text-xs text-gray-500 w-8 text-right">{Math.round(item.percentage)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Analytics;

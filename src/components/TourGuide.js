
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Camera, PieChart, Settings, Rocket } from 'lucide-react';

const TourGuide = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to SubTrack! 🚀",
            content: "Your privacy-focused subscription manager. Track data, monitor costs, and never miss a payment again. All data is stored locally on your device.",
            icon: <Rocket size={48} className="text-indigo-500" />
        },
        {
            title: "📸 AI Receipt Scanning",
            content: "Tap the 'Scan' button to capture receipts. Our smart AI extracts the Service Name, Cost, and Renewal Date automatically.",
            icon: <Camera size={48} className="text-purple-500" />
        },
        {
            title: "📊 Visual Analytics",
            content: "Toggle the 'Analytics' view to see exactly where your money goes. View spending by category in a beautiful pie chart.",
            icon: <PieChart size={48} className="text-pink-500" />
        },
        {
            title: "⚙️ Supercharge with Gemini",
            content: "Use the 'Enable AI' button to connect your own Google Gemini API Key. This unlocks 'Pro Mode' for highly accurate, detailed scanning.",
            icon: <Settings size={48} className="text-gray-700" />
        }
    ];

    const isLast = step === steps.length - 1;

    const handleNext = () => {
        if (isLast) {
            onComplete();
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(prev => prev - 1);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 relative">

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Close Button */}
                <button
                    onClick={onComplete}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <X size={20} />
                </button>

                <div className="p-8 pt-10 text-center">
                    {/* Icon Animation Wrapper */}
                    <div className="mb-6 h-20 flex items-center justify-center animate-bounce-slow">
                        <div className="bg-gray-50 p-4 rounded-2xl shadow-sm">
                            {steps[step].icon}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                        {steps[step].title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-8">
                        {steps[step].content}
                    </p>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-auto">
                        <button
                            onClick={handleBack}
                            className={`p-2 rounded-full transition ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-indigo-600 w-4' : 'bg-gray-300'}`} />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                        >
                            {isLast ? 'Get Started' : 'Next'}
                            {!isLast && <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourGuide;

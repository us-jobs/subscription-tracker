import React from 'react';
import { Bell, CheckCircle, X } from 'lucide-react';
import { sendCustomNotification } from '../utils/notificationService';

const SubscriptionSavedModal = ({ onClose, subscription, reminderDays }) => {
    const handleTestNotification = async () => {
        const success = await sendCustomNotification(
            'Subscription Added Successfully',
            `Your "${subscription.name}" has been added. tracking started!`
        );

        if (success) {
            // Maybe show a quick toast or just rely on the notification itself
            // But for UX, let's close the modal after a short delay or just let user close
        } else {
            alert('Could not send notification. Please check permissions.');
        }
    };

    const daysText = reminderDays.map(d => d === 0 ? 'Same Day' : d === 1 ? '1 day' : `${d} days`).join(', ');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center transform transition-all scale-100">

                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 animate-scale-up">
                    <CheckCircle size={32} />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Saved!</h2>

                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Your <strong>"{subscription.name}"</strong> has been saved.<br />
                    You will be notified before <strong>{daysText}</strong> of the Next Payment.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleTestNotification}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                    >
                        <Bell size={20} />
                        Test Notification Now
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SubscriptionSavedModal;

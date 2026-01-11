import React, { Component } from 'react';

class MobileErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorInfo: error.toString() };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Mobile Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Mobile Issue Detected</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            There was an issue with notifications. Clearing cache might help.
                        </p>
                        <button
                            onClick={() => {
                                localStorage.removeItem('notified_');
                                window.location.reload();
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg w-full"
                        >
                            Clear Notification Cache & Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MobileErrorBoundary;
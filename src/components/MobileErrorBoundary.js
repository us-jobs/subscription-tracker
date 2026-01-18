import React from 'react';

class MobileErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App crashed:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: '#f9fafb'
                }}>
                    <div style={{
                        textAlign: 'center',
                        maxWidth: '400px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                            App Initialization Failed
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
                            SubTrack encountered an error during startup. Please try clearing the app data or reinstalling.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MobileErrorBoundary;
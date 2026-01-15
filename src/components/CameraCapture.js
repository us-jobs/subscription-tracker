
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Settings, RefreshCcw, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const CameraCapture = ({ onCapture, onCancel }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setIsLoading(true);
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setIsLoading(false);
                    videoRef.current.play().catch(e => console.error("Play error", e));
                };
            }
        } catch (err) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('permission_denied');
            } else if (err.name === 'NotFoundError') {
                setError('no_camera');
            } else {
                setError('Camera error: ' + err.message);
            }
            setIsLoading(false);
        }
    };

    const [settingsError, setSettingsError] = useState(false);
    const [openingSettings, setOpeningSettings] = useState(false);
    const [retrying, setRetrying] = useState(false);

    const handleRetry = () => {
        setRetrying(true);
        setIsLoading(true);
        setError('');
        setSettingsError(false);
        // Small delay to show the loader
        setTimeout(() => {
            startCamera();
            setRetrying(false);
        }, 800);
    };

    const handleOpenSettings = async () => {
        setOpeningSettings(true);
        console.log('Attempting to open settings...');

        try {
            // Add slight delay for realistic feel
            await new Promise(resolve => setTimeout(resolve, 800));
            await App.openAppSettings();
            console.log('Settings opened successfully');
        } catch (e) {
            console.error('Failed to open settings:', e);
            setSettingsError(true);
            alert('Could not open settings automatically. Please open Settings > Apps > SubTrack manually.');
        } finally {
            setOpeningSettings(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current || isCapturing) return;

        setIsCapturing(true);
        // Small delay to let the UI update and show the loader
        setTimeout(() => {
            const video = videoRef.current;

            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                setIsCapturing(false);
                return;
            }

            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            canvas.toBlob(blob => {
                if (blob) {
                    onCapture(blob); // Pass the blob back to parent
                }
                setIsCapturing(false);
            }, 'image/jpeg', 0.95);
        }, 300);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">📸 Camera</h2>
                <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"><X size={20} /></button>
            </div>

            {error ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                    {error === 'permission_denied' ? (
                        <>
                            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <Camera size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Camera Access Required</h3>
                            <p className="text-gray-600 mb-6 max-w-xs mx-auto">
                                Please allow camera access to scan your subscription details.
                            </p>



                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                {Capacitor.isNativePlatform() && !settingsError && (
                                    <button
                                        onClick={handleOpenSettings}
                                        disabled={openingSettings}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
                                    >
                                        {openingSettings ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                                        {openingSettings ? 'Opening...' : 'Enable Here'}
                                    </button>
                                )}

                                <button
                                    onClick={handleRetry}
                                    disabled={retrying}
                                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:text-gray-400"
                                >
                                    {retrying ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                                    {retrying ? 'Retrying...' : 'Try Again'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-4">
                                <X size={40} />
                            </div>
                            <p className="text-gray-800 font-medium mb-4">{error === 'no_camera' ? 'No camera found' : error}</p>
                            <button
                                onClick={onCancel}
                                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="relative bg-black rounded-lg overflow-hidden mb-3" style={{ minHeight: '300px' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-auto object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            style={{ maxHeight: '60vh' }}
                        />

                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                                    <div className="text-sm">Starting camera...</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCapture}
                            disabled={isLoading || isCapturing}
                            className={`flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition disabled:bg-green-400 disabled:cursor-not-allowed`}
                        >
                            {isCapturing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <Camera size={20} />
                                    Capture
                                </>
                            )}
                        </button>
                        <button
                            onClick={onCancel}
                            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 font-medium text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </>
            )}
        </div>
    );
};

export default CameraCapture;

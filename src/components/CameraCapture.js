
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

const CameraCapture = ({ onCapture, onCancel }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
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
            setError('Camera access denied. Please verify permissions.');
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
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
        }, 'image/jpeg', 0.95);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">📸 Camera</h2>
                <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"><X size={20} /></button>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-4">
                    <p>{error}</p>
                    <button
                        onClick={onCancel}
                        className="mt-2 bg-red-100 px-4 py-2 rounded text-sm font-semibold hover:bg-red-200"
                    >
                        Close
                    </button>
                </div>
            ) : (
                <>
                    <div className="relative bg-black rounded-lg overflow-hidden mb-3" style={{ minHeight: '300px' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-auto object-cover"
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
                            disabled={isLoading}
                            className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition disabled:bg-gray-400"
                        >
                            <Camera size={20} />
                            Capture
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

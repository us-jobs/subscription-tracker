
import React from 'react';
import { X } from 'lucide-react';

const ImagePreview = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="relative max-w-4xl max-h-screen w-full flex justify-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-200 shadow-lg z-10"
                >
                    <X size={24} />
                </button>
                <img
                    src={imageUrl}
                    alt="Zoomed"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <p className="fixed bottom-4 text-white text-center text-sm w-full pointer-events-none">Click background to close</p>
        </div>
    );
};

export default ImagePreview;

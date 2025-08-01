"use client";

import React, { useState, useEffect } from 'react';

interface RecordingNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const RecordingNotification: React.FC<RecordingNotificationProps> = ({
  isVisible,
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-lg transition-all duration-300 ${
        isAnimating ? 'scale-105 opacity-100' : 'scale-100 opacity-90'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="text-gray-200 font-mono text-sm">
            <div className="font-semibold">Automatic Recording Started</div>
            <div className="text-gray-400 text-xs mt-1">
              Recording canvas area automatically
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Your interactions are being captured
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingNotification; 
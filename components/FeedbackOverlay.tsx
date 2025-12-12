import React, { useEffect } from 'react';
import { POSITIVE_EMOJIS, NEGATIVE_EMOJIS } from '../constants';

interface FeedbackOverlayProps {
  type: 'success' | 'error';
  onComplete: () => void;
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ type, onComplete }) => {
  
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const emojis = type === 'success' ? POSITIVE_EMOJIS : NEGATIVE_EMOJIS;
  // Pick a random emoji
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={`text-9xl animate-bounce-slow filter drop-shadow-2xl transition-opacity duration-500`}>
        {type === 'success' ? emoji : '❌'}
      </div>
      {type === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-full h-full opacity-30 bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 animate-pulse" />
          </div>
      )}
    </div>
  );
};
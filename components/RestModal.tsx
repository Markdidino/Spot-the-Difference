import React from 'react';
import { Button } from './ui/Button';
import { UI_TEXT } from '../constants';
import { Language } from '../types';

interface RestModalProps {
  onContinue: () => void;
  onExit: () => void;
  language: Language;
}

export const RestModal: React.FC<RestModalProps> = ({ onContinue, onExit, language }) => {
  const t = UI_TEXT[language];
  
  return (
    <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-pink-200 max-w-sm w-full text-center space-y-6">
        <div className="text-6xl animate-bounce">☕️</div>
        <h2 className="text-3xl font-black text-gray-700">{t.restTitle}</h2>
        <div className="flex gap-4 justify-center">
             <Button variant="neutral" onClick={onExit} className="flex-1">{t.menu}</Button>
             <Button variant="primary" onClick={onContinue} className="flex-1">{t.continue}</Button>
        </div>
      </div>
    </div>
  );
};
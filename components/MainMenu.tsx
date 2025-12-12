import React, { useState, useEffect } from 'react';
import { GameMode, GameSettings, Difficulty, Language } from '../types';
import { Button } from './ui/Button';
import { Play, Layers, Clock, Volume2, VolumeX, Ban, Globe } from 'lucide-react';
import { UI_TEXT } from '../constants';

interface MainMenuProps {
  onStart: (mode: GameMode) => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, settings, setSettings }) => {
  const [demoFlipped, setDemoFlipped] = useState(false);
  const t = UI_TEXT[settings.language];
  
  const toggleTimer = () => setSettings(s => ({ ...s, useTimer: !s.useTimer }));
  const toggleVoice = () => setSettings(s => ({ ...s, useVoice: !s.useVoice }));
  
  const cycleDifficulty = () => {
    const next = settings.difficulty === Difficulty.EASY ? Difficulty.MEDIUM 
               : settings.difficulty === Difficulty.MEDIUM ? Difficulty.HARD 
               : Difficulty.EASY;
    setSettings(s => ({ ...s, difficulty: next }));
  };

  const toggleLanguage = () => {
      setSettings(s => ({ 
          ...s, 
          language: s.language === Language.ZH ? Language.EN : Language.ZH 
      }));
  };

  // Demo card animation loop
  useEffect(() => {
      const interval = setInterval(() => {
          setDemoFlipped(prev => !prev);
      }, 2000); // Flip every 2 seconds
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto space-y-8 p-4 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-pink-500 drop-shadow-white tracking-widest animate-bounce-slow">
          {t.title}
        </h1>
        <p className="text-gray-500 text-lg">{t.subtitle}</p>
      </div>

      {/* Demo Graphic Area - Flipping Animation */}
      <div className="perspective-1000 w-64 h-40">
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${demoFlipped ? 'rotate-y-180' : ''}`}>
             {/* Front Side */}
            <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden backface-hidden flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-pastel-blue opacity-50"></div>
                <span className="text-6xl relative z-10">🐻</span>
                <span className="text-xs text-gray-400 font-bold mt-2 relative z-10">FRONT</span>
            </div>
            
            {/* Back Side */}
            <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden backface-hidden rotate-y-180 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-pastel-pink opacity-50"></div>
                <span className="text-6xl relative z-10">🐼</span>
                <span className="text-xs text-gray-400 font-bold mt-2 relative z-10">BACK</span>
            </div>
        </div>
      </div>

      {/* Main Actions - Centered */}
      <div className="w-full flex flex-col items-center gap-4">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => onStart(GameMode.SINGLE)}
          icon={<Play size={28} />}
          className="w-4/5 justify-center"
        >
          {t.singleMode}
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => onStart(GameMode.MULTI)}
          icon={<Layers size={28} />}
          className="w-4/5 justify-center"
        >
          {t.multiMode}
        </Button>
      </div>

      {/* Settings Row */}
      <div className="flex justify-between w-full px-4 gap-2">
         {/* Language Toggle */}
         <button 
            onClick={toggleLanguage}
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
             <Globe size={24} className="text-purple-500 mb-1" />
             <span className="text-xs font-bold text-gray-600">
                {settings.language === Language.ZH ? '繁中' : 'EN'}
             </span>
        </button>

        {/* Difficulty */}
        <button 
            onClick={cycleDifficulty}
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
            <div className={`w-3 h-3 rounded-full mb-1 ${
                settings.difficulty === Difficulty.EASY ? 'bg-green-400' :
                settings.difficulty === Difficulty.MEDIUM ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-xs font-bold text-gray-600">
                {settings.difficulty === Difficulty.EASY ? t.easy :
                 settings.difficulty === Difficulty.MEDIUM ? t.medium : t.hard}
            </span>
        </button>

        {/* Timer Toggle */}
        <button 
            onClick={toggleTimer}
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform relative"
        >
             <Clock size={24} className="text-blue-500" />
             {!settings.useTimer && (
                 <div className="absolute inset-0 flex items-center justify-center text-red-500 opacity-80">
                    <Ban size={32} />
                 </div>
             )}
        </button>

        {/* Voice Toggle */}
        <button 
            onClick={toggleVoice}
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform relative"
        >
             {settings.useVoice ? <Volume2 size={24} className="text-green-500" /> : <VolumeX size={24} className="text-gray-400" />}
        </button>
      </div>

    </div>
  );
};
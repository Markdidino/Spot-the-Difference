import React, { useState, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { SingleCardMode } from './components/SingleCardMode';
import { MultiCardMode } from './components/MultiCardMode';
import { RestModal } from './components/RestModal';
import { GameMode, GameSettings, GameState, Difficulty, Language } from './types';
import { BACKGROUND_COLORS, VOICE_PROMPTS } from './constants';
import { clearBuffer } from './services/cardBuffer'; // Import buffer clear
import { Home } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [settings, setSettings] = useState<GameSettings>({
    useTimer: false,
    useVoice: true,
    difficulty: Difficulty.EASY,
    multiCardCount: 3,
    language: Language.ZH
  });

  const [gameState, setGameState] = useState<GameState>({
    currentRound: 0,
    score: 0,
    streak: 0,
    isResting: false
  });

  const [bgIndex, setBgIndex] = useState(0);

  // Background cycler
  const rotateBackground = useCallback(() => {
    setBgIndex(prev => (prev + 1) % BACKGROUND_COLORS.length);
  }, []);

  // Voice Synthesis Helper
  const speak = useCallback((text: string, mood: 'happy' | 'playful' | 'neutral' = 'neutral') => {
    if (!settings.useVoice) return;
    
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const langCode = settings.language; 
    
    let selectedVoice = voices.find(v => v.lang === langCode && v.name.includes('Google'));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang === langCode);

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.lang = langCode;

    // Base Pitch/Rate
    let pitch = 1.3;
    let rate = langCode === Language.ZH ? 1.0 : 0.9;

    // Mood Adjustments
    if (mood === 'playful') {
        // Shocked/Playful "Eh! No way~"
        pitch = 1.5; // Higher pitch
        rate = 1.2;  // Slightly faster or erratic
    } else if (mood === 'happy') {
        pitch = 1.4;
        rate = 1.0;
    }

    utterance.pitch = pitch;
    utterance.rate = rate;

    window.speechSynthesis.speak(utterance);
  }, [settings.useVoice, settings.language]);

  // Round Completion Logic
  const handleRoundComplete = (success: boolean) => {
    const v = VOICE_PROMPTS[settings.language];

    // Update Score
    setGameState(prev => ({
       ...prev,
       currentRound: prev.currentRound + 1,
       score: success ? prev.score + 10 : prev.score,
       streak: success ? prev.streak + 1 : 0
    }));

    // Check Streak Voice
    if (success && (gameState.streak + 1) % 5 === 0) {
        speak(v.STREAK[Math.floor(Math.random() * v.STREAK.length)], 'happy');
    }

    // Check Rest
    if ((gameState.currentRound + 1) % 10 === 0) {
        setGameState(prev => ({ ...prev, isResting: true }));
        speak(v.REST);
    } else {
        // Rotate background for next round
        rotateBackground();
    }
  };

  const returnToMenu = () => {
    setMode(GameMode.MENU);
    setGameState({ currentRound: 0, score: 0, streak: 0, isResting: false });
    clearBuffer(); // Clear buffer so next game starts fresh with potential new settings
    window.speechSynthesis.cancel();
  };

  return (
    <div className={`w-full h-screen ${BACKGROUND_COLORS[bgIndex]} transition-colors duration-1000 overflow-hidden flex flex-col`}>
      
      {/* Top Bar (Only in Game) */}
      {mode !== GameMode.MENU && (
          <div className="w-full p-4 flex justify-between items-center z-10">
              <button 
                onClick={returnToMenu}
                className="p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
              >
                 <Home className="text-pink-500" />
              </button>
              <div className="flex gap-2">
                 <span className="bg-white px-3 py-1 rounded-full text-pink-500 font-bold shadow-sm">
                    Round {gameState.currentRound + 1}
                 </span>
                 <span className="bg-white px-3 py-1 rounded-full text-yellow-500 font-bold shadow-sm">
                    ⭐ {gameState.score}
                 </span>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {mode === GameMode.MENU && (
            <MainMenu onStart={(m) => setMode(m)} settings={settings} setSettings={setSettings} />
        )}
        
        {/* Using key={gameState.currentRound} forces the component to remount when round changes */}
        
        {mode === GameMode.SINGLE && !gameState.isResting && (
            <SingleCardMode 
                key={gameState.currentRound} 
                settings={settings} 
                onRoundComplete={handleRoundComplete}
                speak={speak}
            />
        )}

        {mode === GameMode.MULTI && !gameState.isResting && (
            <MultiCardMode 
                key={gameState.currentRound}
                settings={settings}
                onRoundComplete={handleRoundComplete}
                speak={speak}
            />
        )}
      </main>

      {/* Rest Modal */}
      {gameState.isResting && (
          <RestModal 
            onContinue={() => setGameState(prev => ({ ...prev, isResting: false }))} 
            onExit={returnToMenu} 
            language={settings.language}
          />
      )}

    </div>
  );
};

export default App;
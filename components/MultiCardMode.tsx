import React, { useState, useEffect } from 'react';
import { CardData, GameSettings, Difficulty } from '../types';
import { getMultiCards } from '../services/cardBuffer';
import { Button } from './ui/Button';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { FeedbackOverlay } from './FeedbackOverlay';
import { VOICE_PROMPTS, UI_TEXT } from '../constants';

interface MultiCardModeProps {
  settings: GameSettings;
  onRoundComplete: (success: boolean) => void;
  speak: (text: string, mood?: 'happy' | 'playful') => void;
}

export const MultiCardMode: React.FC<MultiCardModeProps> = ({ settings, onRoundComplete, speak }) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [targetIndex, setTargetIndex] = useState<number>(-1);
  const [phase, setPhase] = useState<'memorize' | 'covered' | 'guess' | 'reveal'>('memorize');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  
  // Animation state for the target card during 'reveal'
  const [targetFlipState, setTargetFlipState] = useState(180); // 180 is Back (Guess state), 0 is Front

  const t = UI_TEXT[settings.language];
  const v = VOICE_PROMPTS[settings.language];
  
  const cardCount = settings.difficulty === Difficulty.EASY ? 2 
                  : settings.difficulty === Difficulty.MEDIUM ? 4 
                  : 6;

  // Load Cards from Buffer
  useEffect(() => {
    let mounted = true;
    const load = async () => {
        setLoading(true);
        try {
            const allCards = await getMultiCards(settings.difficulty, cardCount);
            if (mounted) {
                setCards(allCards);
                // The buffer service already shuffles, but to be safe/explicit here:
                // Find target (the one where front != back)
                // Actually geminiService returns distractors where front==back.
                // But conceptually, the buffer handles the "Real Pair" logic.
                
                // We identify the target by finding the card that actually has a diffDescription or checking generated content.
                // In our updated service, distractors have same front/back. Target has diff.
                const newTargetIndex = allCards.findIndex(c => c.diffDescription !== "");
                setTargetIndex(newTargetIndex >= 0 ? newTargetIndex : 0);

                if (settings.useTimer) {
                    setTimeLeft(cardCount * 2);
                }
                
                setPhase('memorize');
                speak(v.MEMORIZE);
            }
        } catch (e) {
            console.error("Failed to load multi cards", e);
            if (mounted) setLoading(false);
        } finally {
            if (mounted) setLoading(false);
        }
    };
    load();
    return () => { mounted = false; };
  }, [cardCount, settings.difficulty, settings.useTimer, speak, v]);

  // Timer Logic
  useEffect(() => {
    if (phase === 'memorize' && settings.useTimer && timeLeft > 0) {
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    } else if (phase === 'memorize' && settings.useTimer && timeLeft === 0) {
        handleReady();
    }
  }, [phase, settings.useTimer, timeLeft]);

  const handleReady = () => {
    setPhase('covered');
    speak(v.READY);
    setTimeout(() => {
        setPhase('guess');
        speak(v.GUESS);
    }, 2000); 
  };

  const handleCardClick = (index: number) => {
    if (phase !== 'guess') return;

    if (index === targetIndex) {
        setFeedback('success');
        speak(v.CORRECT[0], 'happy');
        // Wait for overlay to finish, then start reveal animation
        // Feedback overlay duration is 1500ms
        // We can start animation slightly before it ends
    } else {
        setFeedback('error');
        speak(v.INCORRECT[Math.floor(Math.random() * v.INCORRECT.length)], 'playful');
    }
  };

  const onFeedbackDone = () => {
      if (feedback === 'success') {
          // Start Reveal Sequence
          setFeedback(null);
          setPhase('reveal');
          // Animation sequence: Flip Front (0) -> Back (180) -> Front (0) -> Back (180)
          // Initial state in Guess phase is Back (180)
          
          let count = 0;
          const interval = setInterval(() => {
              count++;
              // Toggle between 0 and 180
              setTargetFlipState(prev => prev === 0 ? 180 : 0);
              
              if (count >= 4) { // 2 full flips (Front-Back-Front-Back)
                  clearInterval(interval);
                  setTimeout(() => onRoundComplete(true), 1000);
              }
          }, 800); // Speed of flip
          
      } else {
          setFeedback(null);
      }
  };

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-pink-500 font-bold animate-pulse">{t.loading}</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center h-full w-full max-w-4xl mx-auto py-4 px-2">
      {feedback && <FeedbackOverlay type={feedback} onComplete={onFeedbackDone} />}

      {/* Timer Bar */}
      {settings.useTimer && phase === 'memorize' && (
          <div className="w-full h-4 bg-gray-200 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-blue-400 transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / (cardCount * 2)) * 100}%` }}
              />
          </div>
      )}

      {/* Grid */}
      <div className={`flex-1 grid gap-4 w-full place-items-center transition-all duration-500 perspective-1000
         ${cardCount <= 2 ? 'grid-cols-2' : cardCount <= 4 ? 'grid-cols-2 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}
      `}>
          {cards.map((card, idx) => {
              // Determine rotation for this card
              let rotation = 0;
              if (phase === 'memorize') rotation = 0; // Front
              else if (phase === 'covered') rotation = 0; // Front (but covered by overlay)
              else if (phase === 'guess') {
                  // In guess phase, Target is Back (180), others Front (0)
                  rotation = idx === targetIndex ? 180 : 0;
              } else if (phase === 'reveal') {
                   // In reveal phase, Target animates, others stay 0
                   if (idx === targetIndex) rotation = targetFlipState;
                   else rotation = 0;
              }

              return (
                <div 
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`relative w-full max-w-[200px] aspect-square transition-transform duration-700 transform-style-3d cursor-pointer
                        ${phase === 'guess' ? 'hover:scale-105 active:scale-95' : ''}
                        ${phase === 'covered' ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}
                    `}
                    style={{ transform: `rotateY(${rotation}deg)` }}
                >
                    {/* Front Face */}
                    <div className="absolute inset-0 bg-white rounded-xl shadow-lg border-4 border-white overflow-hidden backface-hidden">
                        {/* Overlay for Covered Phase */}
                        {phase === 'covered' && (
                            <div className="absolute inset-0 bg-pastel-blue z-20 flex items-center justify-center">
                                <EyeOff size={48} className="text-white animate-bounce" />
                            </div>
                        )}
                        <img src={card.frontImage} className="w-full h-full object-cover" alt="front" />
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 bg-white rounded-xl shadow-lg border-4 border-yellow-200 overflow-hidden backface-hidden rotate-y-180">
                         <img src={card.backImage} className="w-full h-full object-cover" alt="back" />
                         {/* Optional highlight to show it's the different one */}
                         <div className="absolute inset-0 border-4 border-pink-400 opacity-50 rounded-xl pointer-events-none"></div>
                    </div>
                </div>
              );
          })}
      </div>

      {/* Footer Action */}
      <div className="h-24 flex items-center justify-center">
          {phase === 'memorize' && (
              <Button 
                onClick={handleReady} 
                size="lg" 
                variant="primary"
                icon={<CheckCircle />}
              >
                {t.ready} ({settings.useTimer ? timeLeft : '∞'})
              </Button>
          )}
          {phase === 'guess' && <p className="text-xl font-bold text-gray-600 animate-pulse">{t.whichOne}</p>}
          {phase === 'reveal' && <p className="text-xl font-bold text-pink-500 animate-bounce">Found it!</p>}
      </div>

    </div>
  );
};
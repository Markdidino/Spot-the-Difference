import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CardData, GameSettings, Quadrant } from '../types';
import { getSingleCard } from '../services/cardBuffer';
import { Button } from './ui/Button';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { VOICE_PROMPTS, UI_TEXT } from '../constants';
import { FeedbackOverlay } from './FeedbackOverlay';

interface SingleCardModeProps {
  settings: GameSettings;
  onRoundComplete: (success: boolean) => void;
  speak: (text: string, mood?: 'happy' | 'playful') => void;
}

export const SingleCardMode: React.FC<SingleCardModeProps> = ({ settings, onRoundComplete, speak }) => {
  const [card, setCard] = useState<CardData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [showDifference, setShowDifference] = useState(false);
  
  const flipHintRef = useRef<number | null>(null);
  const [highlightFlipBtn, setHighlightFlipBtn] = useState(false);

  const t = UI_TEXT[settings.language];
  const v = VOICE_PROMPTS[settings.language];

  // Load Card from Buffer
  useEffect(() => {
    let mounted = true;
    const load = async () => {
        setLoading(true);
        try {
            const data = await getSingleCard(settings.difficulty);
            if (mounted) {
                setCard(data);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            if (mounted) setLoading(false);
        }
    };
    load();
    return () => { mounted = false; };
  }, [settings.difficulty]);

  // Initial Voice Prompts
  useEffect(() => {
    if (!loading && card) {
      speak(v.START_SINGLE);
      
      flipHintRef.current = window.setTimeout(() => {
        speak(v.FLIP_HINT);
        setHighlightFlipBtn(true);
        setTimeout(() => setHighlightFlipBtn(false), 2000);
      }, 5000); // 5 seconds delay for hint
    }
    return () => {
        if (flipHintRef.current) clearTimeout(flipHintRef.current);
    }
  }, [loading, card, speak, v]);


  // Handle Click on Card (Works for BOTH Front and Back)
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!card || showDifference) return;

    // Check click location relative to image
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = rect.width;
    const height = rect.height;

    // Determine Quadrant of click
    let clickedQuad: Quadrant = 'center';
    if (x < width / 3) {
        if (y < height / 2) clickedQuad = 'top-left';
        else clickedQuad = 'bottom-left';
    } else if (x > (width * 2) / 3) {
        if (y < height / 2) clickedQuad = 'top-right';
        else clickedQuad = 'bottom-right';
    } else {
        clickedQuad = 'center';
    }

    const isCorrect = clickedQuad === card.diffLocation || settings.difficulty === 'EASY';

    if (isCorrect) {
      setFeedback('success');
      setShowDifference(true);
      speak(v.CORRECT[Math.floor(Math.random() * v.CORRECT.length)], 'happy');
    } else {
      const newErrors = errors + 1;
      setErrors(newErrors);
      setFeedback('error');
      speak(v.INCORRECT[Math.floor(Math.random() * v.INCORRECT.length)], 'playful');
      
      if (newErrors >= 3) {
        setShowDifference(true); // Show answer after 3 fails
      }
    }
  };

  const handleFeedbackComplete = () => {
    setFeedback(null);
    if (showDifference) {
       // Wait a moment so they can see the red circle
       setTimeout(() => {
           onRoundComplete(errors < 3);
       }, 2000);
    }
  };

  if (loading || !card) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
         <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
         <p className="text-pink-500 font-bold animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto py-4">
       
       {feedback && <FeedbackOverlay type={feedback} onComplete={handleFeedbackComplete} />}

       {/* Flashcard Area */}
       <div className="relative flex-1 w-full flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-2xl border-8 border-white overflow-hidden cursor-crosshair transition-all duration-300"
            onClick={handleCardClick}
          >
             <img 
               src={isFlipped ? card.backImage : card.frontImage} 
               alt="Flashcard" 
               className="w-full h-full object-cover pointer-events-none"
             />
             
             {!showDifference && (
               <div className="absolute inset-0 hover:bg-white/10 active:bg-white/20 transition-colors" />
             )}

             <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm
                ${settings.difficulty === 'EASY' ? 'bg-green-400' : settings.difficulty === 'MEDIUM' ? 'bg-yellow-400' : 'bg-red-400'}
             `}>
               {settings.difficulty === 'EASY' ? t.easy : settings.difficulty === 'MEDIUM' ? t.medium : t.hard}
             </div>

             {/* Answer Circle */}
             {showDifference && (
                 <div className={`absolute w-1/3 h-1/3 border-4 border-red-500 rounded-full animate-pulse-fast shadow-[0_0_15px_rgba(239,68,68,0.6)]
                    ${card.diffLocation === 'top-left' ? 'top-10 left-10' : 
                      card.diffLocation === 'top-right' ? 'top-10 right-10' :
                      card.diffLocation === 'bottom-left' ? 'bottom-10 left-10' :
                      card.diffLocation === 'bottom-right' ? 'bottom-10 right-10' :
                      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
                 `} />
             )}
          </div>
       </div>

       {/* Controls */}
       <div className="h-24 w-full flex items-center justify-center gap-6 px-4">
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`${highlightFlipBtn ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`}
            icon={<RefreshCw className={`${isFlipped ? '-rotate-180' : ''} transition-transform duration-500`} />}
          >
             {isFlipped ? t.flipFront : t.flipBack}
          </Button>

          {showDifference && (
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => onRoundComplete(errors < 3)}
                icon={<ArrowRight />}
              >
                {t.next}
              </Button>
          )}
       </div>

       <div className="text-gray-400 text-sm mt-2">
          {t.hintFront}
       </div>
    </div>
  );
};
import { Difficulty, Language } from "./types";

export const BACKGROUND_COLORS = [
  'bg-pastel-yellow',
  'bg-pastel-pink',
  'bg-pastel-blue',
  'bg-pastel-green',
  'bg-orange-50',
  'bg-purple-50'
];

export const POSITIVE_EMOJIS = ['🎉', '👏', '🤩', '👍', '🌟', '🦄'];
export const NEGATIVE_EMOJIS = ['💪', '🧐', '👀', '🤔'];

export const VOICE_PROMPTS = {
  [Language.ZH]: {
    START_SINGLE: "找一找哪裡不一樣？",
    FLIP_HINT: "翻一下卡片喔",
    CORRECT: ["太棒了！", "沒錯喔！", "答對了！", "好眼力！"],
    STREAK: ["太厲害了吧！", "你好厲害！", "超級觀察家！"],
    INCORRECT: ["咦！不是吧~~~", "哎呀！再看一次！", "喔喔～差一點點！"], // Playful/Shocked
    TIMEOUT: "時間到囉，我們來看看答案",
    REST: "休息一下嗎？",
    MEMORIZE: "仔細看這些卡片喔",
    READY: "準備好了嗎？我要變魔術囉",
    GUESS: "哪一張不一樣了？找找看",
  },
  [Language.EN]: {
    START_SINGLE: "Can you spot the difference?",
    FLIP_HINT: "Try flipping the card!",
    CORRECT: ["Awesome!", "Correct!", "Great job!", "Sharp eyes!"],
    STREAK: ["You're amazing!", "Super star!", "Master observer!"],
    INCORRECT: ["Eh! No way~~~", "Oops! Look again!", "Oh no! So close!"],
    TIMEOUT: "Time's up! Let's see the answer",
    REST: "Do you want to take a break?",
    MEMORIZE: "Look closely at these cards",
    READY: "Ready? Here comes the magic!",
    GUESS: "Which one changed? Find it!",
  }
};

export const UI_TEXT = {
  [Language.ZH]: {
    title: "大家來找碴",
    subtitle: "觀察 • 記憶 • 說說看",
    singleMode: "單張模式",
    multiMode: "多張模式",
    easy: "簡單",
    medium: "中等",
    hard: "困難",
    flipFront: "看正面",
    flipBack: "翻背面",
    next: "下一張",
    hintFront: "點選不一樣的地方！",
    hintBack: "仔細觀察圖案...",
    loading: "繪製可愛閃卡中...",
    restTitle: "休息一下嗎？",
    menu: "回主選單",
    continue: "繼續玩",
    ready: "準備好了",
    whichOne: "哪一張不一樣？",
  },
  [Language.EN]: {
    title: "Spot the Difference",
    subtitle: "Observe • Remember • Speak",
    singleMode: "Single Mode",
    multiMode: "Multi Mode",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    flipFront: "Show Front",
    flipBack: "Show Back",
    next: "Next Card",
    hintFront: "Tap the difference!",
    hintBack: "Observe carefully...",
    loading: "Drawing cute cards...",
    restTitle: "Take a break?",
    menu: "Main Menu",
    continue: "Continue",
    ready: "I'm Ready",
    whichOne: "Which one changed?",
  }
};

// Simplified prompts for speed and clarity
export const DIFFICULTY_PROMPTS = {
  [Difficulty.EASY]: "Very simple cute cartoon icon. Thick outlines, flat colors, white background. 1 object (e.g. apple, ball, cat). Minimal detail.",
  [Difficulty.MEDIUM]: "Simple cute cartoon. Flat colors. 2 interacting characters or objects. Clear distinct shapes.",
  [Difficulty.HARD]: "Cute cartoon scene. 3-4 objects. Simple background elements. Flat vector style."
};
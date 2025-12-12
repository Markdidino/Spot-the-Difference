export enum GameMode {
  MENU = 'MENU',
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum Language {
  ZH = 'zh-TW',
  EN = 'en-US',
}

export interface GameSettings {
  useTimer: boolean;
  useVoice: boolean;
  difficulty: Difficulty;
  multiCardCount: number; // 2 to 6
  language: Language;
}

export interface CardData {
  id: string;
  frontImage: string; // Base64
  backImage: string; // Base64
  diffDescription: string;
  diffLocation: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'; // Approximate quadrant for validation
  prompt: string;
}

export interface GameState {
  currentRound: number;
  score: number;
  streak: number;
  isResting: boolean;
}

export type Quadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
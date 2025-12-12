import { CardData, Difficulty } from "../types";
import { generateCardPair, generateSingleCard } from "./geminiService";

// Buffer storage
let singleCardBuffer: Promise<CardData> | null = null;
let multiCardBuffer: Promise<CardData[]> | null = null;

// Helper to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// SINGLE MODE
export const getSingleCard = (difficulty: Difficulty): Promise<CardData> => {
    if (singleCardBuffer) {
        const promise = singleCardBuffer;
        singleCardBuffer = null; 
        // Delay the prefetch slightly to avoid competing with current usage logic
        setTimeout(() => preloadSingleCard(difficulty), 3000);
        return promise;
    }
    
    const currentPromise = generateCardPair(difficulty);
    setTimeout(() => preloadSingleCard(difficulty), 5000);
    return currentPromise;
};

export const preloadSingleCard = (difficulty: Difficulty) => {
    if (!singleCardBuffer) {
        console.log("Pre-fetching next single card...");
        // Handle error silently for prefetch so we don't crash or loop invalidly
        singleCardBuffer = generateCardPair(difficulty).catch(err => {
            console.warn("Prefetch single failed (likely rate limit), clearing buffer.", err.message);
            singleCardBuffer = null;
            return Promise.reject(err);
        });
    }
};

// MULTI MODE
export const getMultiCards = async (difficulty: Difficulty, count: number): Promise<CardData[]> => {
    if (multiCardBuffer) {
        const promise = multiCardBuffer;
        multiCardBuffer = null;
        setTimeout(() => preloadMultiCards(difficulty, count), 4000);
        return promise;
    }

    const currentPromise = generateMultiCardsImpl(difficulty, count);
    setTimeout(() => preloadMultiCards(difficulty, count), 6000);
    return currentPromise;
};

export const preloadMultiCards = (difficulty: Difficulty, count: number) => {
    if (!multiCardBuffer) {
        console.log("Pre-fetching next multi set...");
        multiCardBuffer = generateMultiCardsImpl(difficulty, count).catch(err => {
             console.warn("Prefetch multi failed, clearing buffer.", err.message);
             multiCardBuffer = null;
             return Promise.reject(err);
        });
    }
};

// Internal implementation: Sequential/Throttled generation
async function generateMultiCardsImpl(difficulty: Difficulty, count: number): Promise<CardData[]> {
    try {
        // 1. Generate Target (Complex)
        const targetCard = await generateCardPair(difficulty);
        
        // 2. Generate Distractors (Simple) - Throttle this!
        // Don't use Promise.all for everything to avoid 429
        const distractors: CardData[] = [];
        const numDistractors = Math.max(1, count - 1);

        for (let i = 0; i < numDistractors; i++) {
            // Wait 500ms between distractor calls to be polite to API
            if (i > 0) await wait(500); 
            try {
                const d = await generateSingleCard(difficulty);
                distractors.push(d);
            } catch (e) {
                console.warn("Failed to generate a distractor, trying one retry...");
                await wait(1000);
                const d = await generateSingleCard(difficulty); // One retry
                distractors.push(d);
            }
        }
        
        const allCards = [targetCard, ...distractors];
        
        // Shuffle
        for (let i = allCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }
        return allCards;
    } catch (e) {
        console.error("Multi generation failed", e);
        throw e;
    }
}

export const clearBuffer = () => {
    singleCardBuffer = null;
    multiCardBuffer = null;
    console.log("Buffers cleared");
};
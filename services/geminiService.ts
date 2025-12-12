import { GoogleGenAI, Type } from "@google/genai";
import { CardData, Difficulty, Quadrant } from "../types";
import { DIFFICULTY_PROMPTS } from "../constants";

// Initialize Gemini Client
const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
    return new GoogleGenAI({ apiKey });
};

// Utility to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with Exponential Backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0) {
            // Check for Rate Limit (429) or Server Overload (503/500)
            const msg = error.message || '';
            if (msg.includes('429') || msg.includes('quota') || msg.includes('503')) {
                console.warn(`API Limit hit. Retrying in ${delay}ms...`);
                await wait(delay);
                return withRetry(fn, retries - 1, delay * 2); // Double the delay
            }
        }
        throw error;
    }
}

// 1. Generate Scenario (Text)
async function generateCardScenario(difficulty: Difficulty): Promise<{ 
    originalPrompt: string; 
    editInstruction: string; 
    diffDescription: string; 
    diffLocation: Quadrant 
}> {
    const ai = getClient();
    
    // Simplified system instruction for speed
    const systemInstruction = `Design a spot-the-difference card. Difficulty: ${difficulty}. Style: ${DIFFICULTY_PROMPTS[difficulty]}.
    JSON Only.
    {
        "originalPrompt": "Simple prompt for base image (e.g. 'A cute cat sitting').",
        "editInstruction": "One simple visual change (e.g. 'Make the cat standing').",
        "diffDescription": "Short description (e.g. 'Cat is standing').",
        "diffLocation": "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Generate 1 simple scenario.',
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    originalPrompt: { type: Type.STRING },
                    editInstruction: { type: Type.STRING },
                    diffDescription: { type: Type.STRING },
                    diffLocation: { type: Type.STRING, enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] }
                }
            }
        }
    });

    if (!response.text) throw new Error("Failed to generate scenario");
    return JSON.parse(response.text);
}

// 2. Generate Full Pair (Front + Back)
export async function generateCardPair(difficulty: Difficulty): Promise<CardData> {
    return withRetry(async () => {
        const ai = getClient();
        const scenario = await generateCardScenario(difficulty);

        // Front Image
        const imgResponse1 = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: scenario.originalPrompt + ", vector art, flat color, white background, simple, cute",
        });

        const extractBase64 = (resp: any) => {
            if (!resp.candidates?.[0]?.content?.parts) return null;
            for (const part of resp.candidates[0].content.parts) {
                if (part.inlineData) return part.inlineData.data;
            }
            return null;
        };

        const frontBase64 = extractBase64(imgResponse1);
        if (!frontBase64) throw new Error("Blocked or failed Front Image");

        // Back Image (Edit)
        const imgResponse2 = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: frontBase64 } },
                    { text: `${scenario.editInstruction}. Maintain exact style and background.` }
                ]
            }
        });

        const backBase64 = extractBase64(imgResponse2);
        if (!backBase64) throw new Error("Blocked or failed Back Image");

        return {
            id: crypto.randomUUID(),
            frontImage: `data:image/png;base64,${frontBase64}`,
            backImage: `data:image/png;base64,${backBase64}`,
            diffDescription: scenario.diffDescription,
            diffLocation: scenario.diffLocation,
            prompt: scenario.originalPrompt
        };
    });
}

// Static prompts to save API calls for Distractors
const SIMPLE_PROMPTS = [
    "A cute red apple", "A happy yellow sun", "A blue ball", "A small green tree", 
    "A cute cupcake", "A smiling star", "A simple flower", "A cute cat face",
    "A little duck", "A slice of watermelon", "A cute robot", "A purple balloon"
];

// 3. Generate Single Image (For Multi-mode Distractors)
// Optimized: Skips the prompt generation step to save quota.
export async function generateSingleCard(difficulty: Difficulty): Promise<CardData> {
    return withRetry(async () => {
        const ai = getClient();
        
        // Pick a random simple prompt instead of generating one via LLM
        // This saves 1 API call per distractor
        const randomBase = SIMPLE_PROMPTS[Math.floor(Math.random() * SIMPLE_PROMPTS.length)];
        const prompt = `${randomBase}, vector art, flat color, white background, simple, cute`;

        const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
        });

        const extractBase64 = (resp: any) => {
             if (!resp.candidates?.[0]?.content?.parts) return null;
             for (const part of resp.candidates[0].content.parts) {
                 if (part.inlineData) return part.inlineData.data;
             }
             return null;
        };

        const base64 = extractBase64(imgResponse);
        if (!base64) throw new Error("Blocked or failed Single Image");

        const dataUrl = `data:image/png;base64,${base64}`;

        return {
            id: crypto.randomUUID(),
            frontImage: dataUrl,
            backImage: dataUrl,
            diffDescription: "",
            diffLocation: "center",
            prompt: randomBase
        };
    });
}
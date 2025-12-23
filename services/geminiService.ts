
import { GoogleGenAI } from "@google/genai";

// Fix: Always use process.env.API_KEY directly without fallbacks or modifications
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getImperialChatter = async (event: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, intense Imperial Command radio message (max 15 words) for a TIE Fighter pilot during the following event: ${event}. Keep it professional, cold, and Star Wars themed. Avoid cheesy tropes. Use callsigns like DS-61-4 or Command.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 50,
      }
    });
    // Fix: Access .text property directly (not as a method)
    return response.text || "Command: Stay on target, pilot.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Command: Connection lost. Maintain visual contact.";
  }
};

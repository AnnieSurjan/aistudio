import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Moved initialization inside the function to prevent white-screen crashes on boot 
// if process.env isn't immediately available in the browser preview environment.

const SYSTEM_INSTRUCTION = `
You are Dup-Detect AI, a specialized assistant for a QuickBooks Online duplicate detection tool.
Your capabilities:
1. Explain how duplicates were detected (Same date/amount, fuzzy matching, same memo).
2. Advise on safe deletion practices (e.g., "Check if the transaction is reconciled first").
3. Help with app navigation (Dashboard, Scan, Settings).
4. Provide accounting context regarding duplicates in Invoices, Bills, Journal Entries.

Tone: Professional, helpful, concise, and accounting-aware.
Assume the user is using the 'Dup-Detect' web app.
`;

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing from environment variables.");
    }

    // Initialize AI client with mandatory object parameter
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview'; 
    
    const prompt = `
    Context: The user is asking: "${newMessage}"
    Previous conversation:
    ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently having trouble connecting to the AI service. Please check your internet connection or API key configuration.";
  }
};
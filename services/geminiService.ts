import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

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
    const model = 'gemini-3-flash-preview'; 
    
    // Construct chat history for the model
    // Note: In a real app, we would persist the chat object. 
    // Here we reconstruct context for a stateless-like call or use the Chat API properly if persistent.
    // For simplicity in this demo, we use generateContent with system instruction.
    
    const prompt = `
    Context: The user is asking: "${newMessage}"
    Previous conversation:
    ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
    `;

    const response = await getAI().models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently having trouble connecting to the AI service. Please try again later.";
  }
};
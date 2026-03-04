import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Moved initialization inside the function to prevent white-screen crashes on boot 
// if process.env isn't immediately available in the browser preview environment.

function getAuthFetchInit(): RequestInit {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
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

const BACKEND_URL = window.location.origin;

export interface ChatSession {
  id: string;
  title: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  sessionId: string;
  message: {
    id: string;
    role: 'model';
    text: string;
    created_at: string;
  };
}

// Send a message and get AI response (with server-side persistence)
export const sendChatMessage = async (
  sessionId: string | null,
  message: string,
  source: 'assistant' | 'help_center' = 'assistant'
): Promise<ChatResponse> => {
  const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
    method: 'POST',
    ...getAuthFetchInit(),
    body: JSON.stringify({ sessionId, message, source }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

// List user's chat sessions
export const getChatSessions = async (
  source: 'assistant' | 'help_center' = 'assistant'
): Promise<ChatSession[]> => {
  const response = await fetch(`${BACKEND_URL}/api/chat/sessions?source=${source}`, {
    ...getAuthFetchInit(),
  });

  if (!response.ok) {
    throw new Error('Failed to load sessions');
  }

  const data = await response.json();
  return data.sessions;
};

// Load messages for a specific session
export const getChatSessionMessages = async (
  sessionId: string
): Promise<{ session: ChatSession; messages: ChatMessage[] }> => {
  const response = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
    ...getAuthFetchInit(),
  });

  if (!response.ok) {
    throw new Error('Failed to load session');
  }

  return response.json();
};

// Delete a chat session
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    ...getAuthFetchInit(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
};

// Legacy wrapper for backward compatibility - still used by HelpCenter
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
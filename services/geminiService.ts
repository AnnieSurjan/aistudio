import { ChatMessage } from "../types";

const BACKEND_URL = window.location.origin;

function getAuthFetchInit(): RequestInit {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
}

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
  _history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const result = await sendChatMessage(null, newMessage, 'help_center');
    return result.message.text;
  } catch {
    return "I am currently having trouble connecting to the AI service. Please try again later.";
  }
};

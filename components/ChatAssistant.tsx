import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Download, Minimize2, Maximize2, Plus, History, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage, getChatSessions, getChatSessionMessages, deleteChatSession, ChatSession } from '../services/geminiService';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Hello! I am your DupDetect AI assistant. How can I help you manage your transactions today?',
  timestamp: new Date(),
};

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');

  // Current chat state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // History state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(sessionId, input, 'assistant');

      // Store session ID for subsequent messages
      if (!sessionId) {
        setSessionId(result.sessionId);
      }

      const aiMsg: ChatMessage = {
        id: result.message.id,
        role: 'model',
        text: result.message.text,
        timestamp: new Date(result.message.created_at),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'I am currently having trouble connecting. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setView('chat');
  };

  const loadHistory = async () => {
    setView('history');
    setLoadingSessions(true);
    try {
      const data = await getChatSessions('assistant');
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSession = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await getChatSessionMessages(id);
      setSessionId(id);
      setMessages(
        data.messages.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'model',
          text: m.text,
          timestamp: new Date(m.created_at),
        }))
      );
      setView('chat');
    } catch {
      // stay on history view
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) {
        startNewChat();
      }
    } catch {
      // ignore
    }
  };

  const exportChat = () => {
    const content = messages
      .map(m => `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dupdetect-chat-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 transition-all duration-300 flex flex-col ${isMinimized ? 'w-72 h-16' : 'w-96 h-[500px]'}`}>
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <Bot size={20} className="text-blue-400" />
          <span className="font-semibold">DupDetect AI</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button onClick={startNewChat} className="hover:text-blue-300 p-1" title="New Chat">
            <Plus size={16} />
          </button>
          <button onClick={loadHistory} className="hover:text-blue-300 p-1" title="Chat History">
            <History size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); exportChat(); }} className="hover:text-blue-300 p-1" title="Export">
            <Download size={16} />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-blue-300 p-1">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:text-red-400 p-1">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {view === 'history' ? (
            /* Session History View */
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div className="flex items-center space-x-2 mb-4">
                <button onClick={() => setView('chat')} className="text-slate-500 hover:text-slate-700">
                  <ArrowLeft size={18} />
                </button>
                <h3 className="font-semibold text-slate-700 text-sm">Chat History</h3>
              </div>

              {loadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No previous chats</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                        sessionId === session.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-700 truncate flex-1 mr-2">
                          {session.title}
                        </p>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Chat View */
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 text-slate-500 rounded-lg p-3 text-sm rounded-bl-none shadow-sm flex items-center space-x-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about duplicates..."
                    className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 mt-2">
                  AI can make mistakes. Verify important info.
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatAssistant;

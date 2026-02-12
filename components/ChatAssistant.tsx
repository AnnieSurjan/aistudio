import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Download, Minimize2, Maximize2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your DupDetect AI assistant. How can I help you manage your QuickBooks transactions today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(messages, userMsg.text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      // Error handled in service, but safety net here
    } finally {
      setIsLoading(false);
    }
  };

  const exportChat = () => {
    const content = messages.map(m => `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dupdetect-chat-log-${new Date().toISOString()}.txt`;
    a.click();
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
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center cursor-pointer" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
        <div className="flex items-center space-x-2">
            <Bot size={20} className="text-blue-400"/>
            <span className="font-semibold">DupDetect AI</span>
        </div>
        <div className="flex items-center space-x-2">
             <button onClick={(e) => { e.stopPropagation(); exportChat(); }} className="hover:text-blue-300" title="Export Chat">
                <Download size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-blue-300">
                {isMinimized ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-red-400">
                <X size={18} />
            </button>
        </div>
      </div>

      {!isMinimized && (
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
            <div className="p-3 bg-white border-t border-slate-100">
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
    </div>
  );
};

export default ChatAssistant;
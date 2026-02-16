import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, FileQuestion, Bug, Lightbulb, Send, HelpCircle, ChevronDown, ChevronUp, Bot, Loader2, CheckCircle } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'faq' | 'ai' | 'feedback';
type FeedbackType = 'Question' | 'Feature Request' | 'General Feedback' | 'Bug Report';

const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('faq');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
                <HelpCircle size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold">Help Center</h2>
                <p className="text-xs text-slate-400">Support & Feedback</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
            <button 
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-colors border-b-2 ${activeTab === 'faq' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <FileQuestion size={18}/>
                <span>FAQ</span>
            </button>
            <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-colors border-b-2 ${activeTab === 'ai' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Bot size={18}/>
                <span>AI Assistant</span>
            </button>
            <button 
                onClick={() => setActiveTab('feedback')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-colors border-b-2 ${activeTab === 'feedback' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <MessageCircle size={18}/>
                <span>Feedback</span>
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white relative">
            {activeTab === 'faq' && <FaqTab />}
            {activeTab === 'ai' && <AiSupportTab />}
            {activeTab === 'feedback' && <FeedbackTab onClose={onClose} />}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const FaqTab = () => {
    const faqs = [
        { q: "How does duplicate detection work?", a: "We analyze transaction dates, amounts, vendors, and memos. We also use fuzzy logic to find amounts within a $1.00 variance and similar vendor names." },
        { q: "Is deleting transactions safe?", a: "Yes. DupDetect creates a secure local backup of every transaction group before resolution. You can undo any action from the 'Scan History' page." },
        { q: "Do you support multi-currency?", a: "Absolutely. We support all ISO currencies including USD, EUR, and HUF. The system matches transactions within the same currency group." },
        { q: "How do I connect multiple QuickBooks accounts?", a: "Upgrade to the 'Professional' plan to manage up to 5 QuickBooks accounts under a single login." },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Frequently Asked Questions</h3>
            {faqs.map((faq, idx) => (
                <details key={idx} className="group bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                    <summary className="flex justify-between items-center p-4 font-medium text-slate-700 cursor-pointer list-none hover:bg-slate-100 transition-colors">
                        {faq.q}
                        <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                            <ChevronDown size={20} />
                        </span>
                    </summary>
                    <div className="p-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100/50 mt-2">
                        {faq.a}
                    </div>
                </details>
            ))}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl flex items-start space-x-3 text-blue-800 text-sm">
                <Lightbulb className="shrink-0 mt-0.5" size={18}/>
                <p>Can't find what you're looking for? Try the <b>AI Assistant</b> tab for instant answers or send us a <b>Question</b> via the Feedback tab.</p>
            </div>
        </div>
    );
};

const AiSupportTab = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hi! I am the DupDetect Support AI. Describe your issue, and I will try to help you solve it immediately.', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if(!input.trim()) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const result = await sendChatMessage(sessionId, userMsg.text, 'help_center');
            if (!sessionId) setSessionId(result.sessionId);
            setMessages(prev => [...prev, { id: result.message.id, role: 'model', text: result.message.text, timestamp: new Date(result.message.created_at) }]);
        } catch {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble connecting. Please use the Feedback tab to report this.", timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-slate-400 text-xs flex items-center ml-2"><Loader2 size={12} className="animate-spin mr-1"/> AI is thinking...</div>}
                <div ref={endRef} />
            </div>
            <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
                <input 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ask about errors, features, or billing..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

const FeedbackTab = ({ onClose }: { onClose: () => void }) => {
    const [type, setType] = useState<FeedbackType>('Question');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        // Mock API call
        setTimeout(() => {
            setIsSending(false);
            setSent(true);
            setTimeout(() => {
                 onClose();
            }, 2500);
        }, 1500);
    };

    if (sent) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Feedback Received!</h3>
                <p className="text-slate-500 mt-2 max-w-xs">Thank you for your input. We review all feedback daily. If this was a question, we'll email you shortly.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Feedback Type</label>
                <div className="relative">
                    <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as FeedbackType)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    >
                        <option value="Question">Question</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="General Feedback">General Feedback</option>
                        <option value="Bug Report">Bug Report</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Your Email</label>
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                <textarea 
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={6}
                    placeholder={
                        type === 'Bug Report' ? "Steps to reproduce the error..." :
                        type === 'Feature Request' ? "I would love to be able to..." :
                        "How can we help?"
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                ></textarea>
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center transition-all disabled:opacity-70"
                >
                    {isSending ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={18} />
                            Sending...
                        </>
                    ) : (
                        <>
                            <span>Submit {type}</span>
                            <Send className="ml-2" size={18} />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default HelpCenter;
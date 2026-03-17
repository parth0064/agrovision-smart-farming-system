import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Plus, MessageSquare, History, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface ChatSession {
  _id: string;
  title: string;
  lastMessageTime: string;
}

export default function ChatbotPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const getAuthToken = () => {
    const stored = localStorage.getItem('agrovision_user');
    return stored ? JSON.parse(stored).token : null;
  };

  const fetchSessions = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chatbot/history/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setCurrentSessionId(sessionId);
    try {
      const token = getAuthToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chatbot/history/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({ role: m.role, text: m.text })));
      }
    } catch (error) {
      console.error('Failed to load session', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{ role: 'bot', text: t('chat.greeting', { name: user?.name || '' }) }]);
  };

  useEffect(() => {
    fetchSessions();
    startNewChat();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    // Add user message to UI immediately
    const updatedMessages = [...messages, { role: 'user', text: userMsg } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          language: i18n.language || 'en',
          userName: user?.name || '',
          sessionId: currentSessionId
        }),
      });

      const data = await response.json();
      if (data.answer) {
        setMessages([...updatedMessages, { role: 'bot', text: data.answer }]);
        if (!currentSessionId) {
          setCurrentSessionId(data.sessionId);
          fetchSessions(); // Refresh list to show new session
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...updatedMessages, { role: 'bot', text: t('chat.error') || 'Error processing request' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-10rem)] bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden border border-border card-3d">
        
        {/* History Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border bg-card/50 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <button 
                  onClick={startNewChat}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <div className="px-2 mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Chats</span>
                </div>
                {sessions.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => loadSession(session._id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group relative ${
                      currentSessionId === session._id 
                        ? 'bg-primary/10 border border-primary/20 text-primary' 
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 mt-1 shrink-0 ${currentSessionId === session._id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate pr-4">{session.title}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">
                        {new Date(session.lastMessageTime).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col relative bg-background/20">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
              >
                <History className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">System Online</span>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-md">
                {currentSessionId 
                  ? sessions.find(s => s._id === currentSessionId)?.title 
                  : "New Advisory Session"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
               <Bot className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'bot' 
                    ? 'bg-primary/10 border border-primary/20 text-primary' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {msg.role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                
                <div className={`group relative max-w-[75%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-sm' 
                    : 'bg-card border border-border text-foreground rounded-tl-sm'
                }`}>
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <div className="prose prose-sm prose-emerald max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-3 text-[9px] opacity-0 group-hover:opacity-40 transition-opacity">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-muted/30 border border-border/50 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-border bg-card/30">
            <div className="max-w-4xl mx-auto relative flex items-center gap-3">
              <div className="relative flex-1 group">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask for agricultural advice..."
                  disabled={loading}
                  className="w-full pl-6 pr-14 py-4 rounded-2xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-inner transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar toggle for desktop */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex p-4 rounded-2xl bg-card border border-border hover:bg-muted transition-colors text-muted-foreground"
                title="Toggle History"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

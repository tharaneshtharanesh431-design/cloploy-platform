import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { askAssistant, setProvider } from '../app/slices/assistantSlice';
import { GlassCard } from '../components/common/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, ChevronDown } from 'lucide-react';

const PROVIDER_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' }
];

export function AIAssistantPage() {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const { thread, status, provider } = useSelector((state) => state.assistant);
  const chatEndRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const msg = message;
    setMessage('');
    await dispatch(askAssistant(msg));
  };

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread, status]);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative pb-4">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-56 h-56 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header with provider selector */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-gradient-to-r from-purple-500 to-transparent" />
            <p className="text-xs uppercase tracking-[0.35em] text-purple-400 font-semibold font-space">AI Copilot</p>
          </div>
          <h1 className="text-4xl font-extrabold font-space text-white">DevOps AI Assistant</h1>
        </div>

        {/* Provider Selector */}
        <div className="relative">
          <select
            value={provider}
            onChange={(e) => dispatch(setProvider(e.target.value))}
            className="appearance-none rounded-xl border border-white/[0.06] bg-[#161B22] pl-4 pr-9 py-2.5 text-xs font-semibold text-white/80 tracking-wide uppercase cursor-pointer focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 hover:bg-[#1C2128]"
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0D1117] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
      </div>

      {/* Chat Container */}
      <GlassCard className="flex-1 flex flex-col justify-between border border-white/[0.06] overflow-hidden p-0 bg-[#0D1117] rounded-2xl">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin">
          <AnimatePresence initial={false}>
            {thread.map((item, index) => {
              const isBot = item.role === 'assistant';
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                    isBot 
                      ? 'bg-[#161B22] border-cyan-500/20 text-cyan-400' 
                      : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                  }`}>
                    {isBot ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  {/* Message bubble */}
                  <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    isBot 
                      ? 'bg-[#161B22] border border-white/[0.06] text-white/90 rounded-tl-md' 
                      : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-[0_4px_20px_rgba(168,85,247,0.15)] border border-purple-500/30 rounded-tr-md'
                  }`}>
                    {isBot && (
                      <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-cyan-400 mb-2 font-space flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Cloploy Engine
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{item.content}</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Assistant typing loader */}
          {status === 'loading' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mr-auto max-w-[85%]"
            >
              <div className="h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#161B22] border border-cyan-500/20 text-cyan-400">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-[#161B22] border border-white/[0.06] px-6 py-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-400/80 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-purple-400/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-purple-400/80 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {thread.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-2xl" />
                <div className="relative p-5 bg-[#161B22] border border-white/[0.06] rounded-2xl">
                  <Bot size={36} className="text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-space">How can I assist you today?</h3>
                <p className="text-sm text-white/40 mt-2 max-w-md leading-relaxed">
                  Ask me about deployment configuration, EKS errors, Docker optimization, or SonarQube quality analysis.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center max-w-lg pt-2">
                {[
                  'How to configure custom domains?',
                  'Why did my container build fail?',
                  'Explain EKS resource requests'
                ].map((sample) => (
                  <button 
                    key={sample}
                    onClick={() => setMessage(sample)}
                    className="text-xs rounded-xl border border-white/[0.06] bg-[#161B22] px-4 py-2 text-white/50 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all duration-300"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={submit} className="flex gap-3 px-5 py-4 border-t border-white/[0.06] bg-[#0D1117]/80 backdrop-blur-xl">
          <input 
            type="text"
            className="flex-1 rounded-xl border border-white/[0.06] bg-[#161B22] px-5 py-3.5 text-sm text-white placeholder-white/20 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 focus:bg-[#1C2128] transition-all duration-300 outline-none" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Ask about Kubernetes, Docker, SonarQube, or cloud deployment costs..." 
          />
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-3.5 font-bold text-white shadow-[0_4px_20px_rgba(168,85,247,0.2)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </GlassCard>
    </div>
  );
}

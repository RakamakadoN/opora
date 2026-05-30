import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Sparkles, ClipboardList, FileText, MapPinned, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../context/ProfileContext';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const helperActions = [
  {
    label: 'Мне тяжело сейчас',
    hint: 'быстро снизить тревогу',
    icon: Heart,
    tone: 'warm',
    prompt: 'Мне очень страшно сейчас, некому поддержать. Помоги мне спокойно пережить ближайшие 10 минут.'
  },
  {
    label: 'Маршрут помощи',
    hint: 'что делать дальше',
    icon: MapPinned,
    tone: 'sage',
    prompt: 'С чего начать при подозрении на аутизм в Казахстане? Составь понятный маршрут на ближайшие недели.'
  },
  {
    label: 'ПМПК и документы',
    hint: 'подготовить комиссию',
    icon: FileText,
    tone: 'sage',
    prompt: 'Помоги подготовиться к ПМПК в Казахстане: какие документы собрать и как спокойно пройти комиссию?'
  },
  {
    label: 'Подготовить визит',
    hint: 'врач, стоматолог, стрижка',
    icon: ClipboardList,
    tone: 'sage',
    prompt: 'Помоги подготовить ребенка с РАС к визиту: что сказать специалисту, что взять с собой и как снизить сенсорную нагрузку?'
  }
];

export function AIAssistantTab() {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Initialize companion messages using the child's profile details
  useEffect(() => {
    const welcomeText = `Я рядом. Для ${profile.childName || "ребенка"} (${profile.childAge} лет) сейчас этап: «${profile.diagnosticStatus}».\n\nМогу простыми словами объяснить термины, подсказать первые шаги в Казахстане или помочь спокойно разложить тревожную ситуацию.`;
    
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: welcomeText
      }
    ]);
  }, [profile.childName, profile.childAge, profile.diagnosticStatus]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (isTyping || !inputValue.trim()) return;

    const userQuery = inputValue.trim();
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userQuery };
    const currentMessages = [...messages, newMsg];
    
    setMessages(currentMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.filter(m => m.id !== '1'), // Exclude intro to save context space if needed, or pass it. Let's pass it actually.
          profile: profile
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: 'Простите, сейчас у меня небольшая заминка со связью. Пожалуйста, попробуйте отправить ваше сообщение чуть позже. Я здесь и никуда не ухожу.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-opora-sand/30">
      {/* Header */}
      <div className="opora-ai-header pt-12 px-6 pb-4 border-b border-black/5 flex items-center justify-between bg-opora-sand/80 backdrop-blur-xl sticky top-0 z-20">
        <div>
          <h1 className="font-serif text-2xl font-medium text-opora-navy mb-1 flex items-center gap-2">
            Помощник <Sparkles className="text-opora-sage drop-shadow-sm" size={17} />
          </h1>
          <p className="text-sm text-opora-sage flex items-center gap-1.5 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Бережно и простыми словами
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">
        <div className="opora-ai-intro rounded-2xl border border-black/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-opora-sage/10 text-opora-sage flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-extrabold text-opora-sage mb-1">
                Не заменяет врача
              </div>
              <p className="text-sm text-opora-navy font-bold leading-snug">
                Я помогу разложить ситуацию, подготовить вопросы и снизить тревогу.
              </p>
              <p className="text-xs text-opora-text/80 font-medium mt-1.5 leading-relaxed">
                Срочные медицинские решения всегда обсуждаются с врачом или экстренной службой.
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-opora-text/60 mb-2 px-1">Быстрый старт</p>
          <div className="grid grid-cols-2 gap-2">
            {helperActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setInputValue(action.prompt)}
                  className={`opora-ai-action text-left p-3 rounded-2xl border transition-all active:scale-[0.98] ${
                    action.tone === 'warm'
                      ? 'bg-opora-peach/35 border-opora-peach/70'
                      : 'bg-white border-black/5'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                    action.tone === 'warm' ? 'bg-white/80 text-rose-500' : 'bg-opora-sage/10 text-opora-sage'
                  }`}>
                    <Icon size={16} />
                  </span>
                  <span className="block text-sm font-extrabold text-opora-navy leading-tight">{action.label}</span>
                  <span className="block text-[11px] text-opora-text/75 mt-0.5 leading-snug">{action.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[92%]">
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-opora-peach flex items-center justify-center flex-shrink-0 mb-1">
                    <Sparkles size={11} className="text-opora-navy" />
                  </div>
                )}
                
                <div className={`opora-ai-message p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-opora-navy text-white rounded-br-none font-medium whitespace-pre-wrap' 
                    : 'bg-white border border-opora-sage/20 text-opora-navy rounded-bl-none markdown-body'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Markdown components={{
                      a: ({node, ...props}) => <a {...props} className="text-opora-sage underline hover:text-opora-navy font-semibold" target="_blank" rel="noopener noreferrer" />
                    }}>
                      {msg.content}
                    </Markdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-end gap-2 max-w-[85%]"
            >
               <div className="w-6 h-6 rounded-full bg-opora-peach flex items-center justify-center flex-shrink-0 mb-1">
                  <Sparkles size={11} className="text-opora-navy" />
                </div>
              <div className="opora-ai-message p-3.5 rounded-2xl bg-white border border-opora-sage/20 text-opora-navy rounded-bl-sm shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-opora-sage rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-opora-sage rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-1.5 h-1.5 bg-opora-sage rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="opora-ai-inputbar px-4 py-3 bg-white/80 backdrop-blur-xl border-t border-black/5 pb-8 relative z-20">
        <div className="flex relative items-end group shadow-sm rounded-2xl">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спросите о терминах, правах в РК или поделитесь..."
            className="opora-ai-input w-full bg-white border border-black/5 rounded-2xl py-3.5 pl-4 pr-12 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-opora-sage/10 focus:border-opora-sage resize-none text-opora-navy placeholder:text-opora-text/40 shadow-sm transition-all"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 bottom-1.5 p-2 bg-opora-navy text-white rounded-2xl disabled:opacity-50 disabled:bg-gray-300 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md shadow-opora-navy/10"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

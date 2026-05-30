import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Share2, Shield, Sparkles, PlusCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { cn } from '../lib/utils';

interface ThreadReply {
  id: string;
  author: string;
  badge: string;
  content: string;
  time: string;
}

interface ThreadPost {
  id: string;
  author: string;
  badge: string;
  content: string;
  likes: number;
  hasLiked?: boolean;
  replies: ThreadReply[];
  time: string;
  category: string;
}

const INITIAL_THREADS: ThreadPost[] = [
  {
    id: "1",
    author: "Мама Аружан",
    badge: "Диагноз подтвержден • Алматы",
    content: "Девочки, мы сегодня впервые защитили индивидуальный план развития на ПМПК в Бостандыкском районе! Шли со страхом, начитавшись чатов, но комиссия была на удивление бережной. Сказали, ребенок перспективный. Не бойтесь ПМПК, готовьте документы заранее и спокойно отстаивайте права.",
    likes: 18,
    hasLiked: false,
    time: "2 ч назад",
    category: "ПМПК, права",
    replies: [
      {
        id: "r1",
        author: "Мама Дамира",
        badge: "В процессе диагностики",
        content: "Поздравляю вас! Нам это только предстоит в июле. А какие именно документы у вас дефектолог запрашивал?",
        time: "1 ч назад"
      },
      {
        id: "r2",
        author: "Мама Аружан",
        badge: "Диагноз подтвержден • Алматы",
        content: "Спасибо! Главное — характеристика из развивающего центра, если ходите, заключение невропатолога и обязательно свежие анализы от лора/офтальмолога.",
        time: "40 мин назад"
      }
    ]
  },
  {
    id: "2",
    author: "Папа Тимура",
    badge: "Только подозреваем • Астана",
    content: "Сын (2.8 года) перестал отзываться на имя и часто собирает ряды из машинок. Родственники говорят 'перерастет, заговорит позже', а у меня сердце не на месте. Записались в Asyl Miras на консультацию. Как уговорить супругу принять ситуацию? Она отрицает любые проблемы.",
    likes: 31,
    hasLiked: true,
    time: "4 ч назад",
    category: "Принятие",
    replies: [
      {
        id: "r3",
        author: "Мама Алишера",
        badge: "Адаптация и терапия",
        content: "Это классическая реакция защиты. Дайте ей немного времени. Хорошо, что записались в Asyl Miras, профессиональный взгляд со стороны часто помогает мягко открыть глаза.",
        time: "3 ч назад"
      }
    ]
  },
  {
    id: "3",
    author: "Ирина (Куратор)",
    badge: "ABA Специалист • КРК",
    content: "Помните про правило 'Сначала наденьте маску на себя'. Если мама истощена, терапия ребенка будет малоэффективна. Выделяйте себе минимум 30 минут в день на чашку чая в полной тишине. Вы делаете великое дело!",
    likes: 45,
    hasLiked: false,
    time: "6 ч назад",
    category: "Ресурс родителя",
    replies: []
  }
];

export function CommunityTab() {
  const { profile } = useProfile();
  const [threads, setThreads] = useState<ThreadPost[]>(() => {
    const saved = localStorage.getItem('opora_threads');
    return saved ? JSON.parse(saved) : INITIAL_THREADS;
  });

  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newReplyContent, setNewReplyContent] = useState('');

  useEffect(() => {
    localStorage.setItem('opora_threads', JSON.stringify(threads));
  }, [threads]);

  const categories = ['Все', 'Принятие', 'ПМПК, права', 'ABA', 'Ресурс родителя'];
  const categoryHints: Record<string, string> = {
    'Все': 'все темы',
    'Принятие': 'страх, сомнения, семья',
    'ПМПК, права': 'документы и маршрут',
    'ABA': 'занятия и навыки',
    'Ресурс родителя': 'усталость и поддержка'
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadContent.trim()) return;

    const newThread: ThreadPost = {
      id: Date.now().toString(),
      author: `Родитель ${profile.childName}`,
      badge: `${profile.diagnosticStatus} • г. ${profile.userCity}`,
      content: newThreadContent.trim(),
      likes: 0,
      hasLiked: false,
      replies: [],
      time: "Только что",
      category: activeCategory === 'Все' ? 'Принятие' : activeCategory
    };

    setThreads(prev => [newThread, ...prev]);
    setNewThreadContent('');
    setIsCreating(false);
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.map(thread => {
      if (thread.id === id) {
        return {
          ...thread,
          likes: thread.hasLiked ? thread.likes - 1 : thread.likes + 1,
          hasLiked: !thread.hasLiked
        };
      }
      return thread;
    }));
  };

  const handleCreateReply = (e: React.FormEvent, threadId: string) => {
    e.preventDefault();
    if (!newReplyContent.trim()) return;

    const newReply: ThreadReply = {
      id: Date.now().toString(),
      author: `Родитель ${profile.childName}`,
      badge: `${profile.diagnosticStatus}`,
      content: newReplyContent.trim(),
      time: "Только что"
    };

    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          replies: [...thread.replies, newReply]
        };
      }
      return thread;
    }));

    setNewReplyContent('');
  };

  const filteredThreads = threads.filter(t => activeCategory === 'Все' || t.category === activeCategory);

  return (
    <div className="min-h-full flex flex-col pt-12 pb-28 relative bg-opora-sand">
      {/* Top sticky bar */}
      <div className="opora-community-header px-6 pb-4 pt-2 border-b border-black/5 flex items-center justify-between bg-opora-sand/90 backdrop-blur-xl sticky top-0 z-20">
        <div>
          <span className="text-[11px] font-bold text-opora-sage uppercase tracking-wider">Бережная лента</span>
          <h1 className="font-serif text-2xl font-medium text-opora-navy flex items-center gap-1.5">
            Свои <Sparkles className="text-opora-peach fill-opora-peach drop-shadow-md" size={20} />
          </h1>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 bg-opora-navy text-white rounded-2xl shadow-md shadow-opora-navy/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <PlusCircle size={15} /> Написать
        </button>
      </div>

      {/* Trust & Safety Banner */}
      <div className="px-6 pt-5">
        <div className="opora-community-safety flex items-start gap-3 bg-white p-4 rounded-2xl border border-opora-sage/20 shadow-sm text-[12px] text-opora-text/90 relative overflow-hidden">
          <Shield className="text-opora-sage shrink-0 mt-0.5" size={16} />
          <p className="leading-relaxed relative z-10">
            Анонимно и бережно. Здесь можно спросить, выговориться и получить опыт других родителей без осуждения и рекламы методик.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="px-6 py-4 grid grid-cols-2 gap-2 shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "opora-community-filter text-left px-3 py-2.5 rounded-2xl text-sm transition-colors border cursor-pointer min-h-[62px]",
              activeCategory === cat 
                ? "bg-opora-navy text-white border-opora-navy" 
                : "bg-white text-opora-text border-black/5 hover:border-opora-sage/40"
            )}
          >
            <span className="block font-extrabold leading-tight">{cat}</span>
            <span className={cn(
              "block text-[11px] leading-snug mt-0.5",
              activeCategory === cat ? "text-white/75" : "text-opora-text/70"
            )}>{categoryHints[cat]}</span>
          </button>
        ))}
      </div>

      {/* Safe Post Creation Floating Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-center items-end"
            onClick={() => setIsCreating(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="opora-community-modal bg-white rounded-t-3xl w-full max-w-[390px] p-6 shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <span className="text-sm font-bold text-opora-navy">Новая публикация в Своих</span>
                <button onClick={() => setIsCreating(false)} className="text-sm text-opora-sage font-medium">Закрыть</button>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-opora-peach flex items-center justify-center text-opora-navy text-sm font-bold font-serif">
                  {profile.childName ? profile.childName[0] : "Р"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-opora-navy">Родитель {profile.childName || "малыша"}</p>
                  <p className="text-[11px] text-opora-sage font-medium">{profile.diagnosticStatus}</p>
                </div>
              </div>

              <form onSubmit={handleCreateThread} className="space-y-4">
                <textarea
                  value={newThreadContent}
                  onChange={e => setNewThreadContent(e.target.value)}
                  placeholder="Поделитесь новостью, наболевшим или спросите совета у родителей РК..."
                  className="w-full min-h-[120px] bg-opora-sand p-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-opora-sage resize-none text-opora-navy placeholder:text-opora-text/50 leading-relaxed"
                  maxLength={400}
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-black/30 font-medium">{newThreadContent.length}/400</span>
                  <button 
                    type="submit" 
                    disabled={!newThreadContent.trim()}
                    className="bg-opora-navy text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-opacity-90 disabled:opacity-40 transition-colors"
                  >
                    Опубликовать
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Threads List Feed */}
      <div className="px-5 sm:px-6 space-y-5 pb-8">
        {filteredThreads.length === 0 && (
          <div className="opora-community-card p-6 rounded-2xl text-center">
            <p className="text-sm font-bold text-opora-navy">Пока нет публикаций</p>
            <p className="text-xs text-opora-text/75 mt-1 leading-relaxed">
              Можно первым задать вопрос или поделиться опытом в этой теме.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-opora-navy text-white text-sm font-semibold"
            >
              <PlusCircle size={15} /> Написать
            </button>
          </div>
        )}
        {filteredThreads.map(thread => (
          <div 
            key={thread.id} 
            onClick={() => setSelectedThreadId(thread.id)}
            className="opora-community-card p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-opora-sage/35 transition-colors cursor-pointer select-none relative overflow-hidden"
          >
            <div className="flex gap-3 relative">
              {/* Left visual line matching Threads app */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-opora-sage/25 border-2 border-white flex items-center justify-center text-opora-navy text-sm font-bold font-serif shrink-0">
                  {thread.author[0]}
                </div>
                {thread.replies.length > 0 && (
                  <div className="w-[1.5px] bg-black/5 flex-1 my-2"></div>
                )}
              </div>

              {/* Thread Content */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-opora-navy">{thread.author}</h4>
                    <p className="text-[11px] text-opora-sage font-medium leading-snug break-words">{thread.badge}</p>
                  </div>
                  <span className="text-[11px] text-opora-text/60 font-medium shrink-0">{thread.time}</span>
                </div>

                <p className="text-sm text-opora-navy leading-relaxed break-words">
                  {thread.content}
                </p>

                {/* Subtag Category */}
                <span className="inline-block text-[11px] bg-opora-sand font-semibold text-opora-text/90 px-2 py-0.5 rounded">
                  {thread.category}
                </span>

                {/* Thread Actions */}
                <div className="flex items-center gap-5 pt-3 border-t border-black/5 mt-3 text-opora-sage">
                  <button 
                    onClick={(e) => handleLike(thread.id, e)}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer hover:text-red-500 active:scale-90",
                      thread.hasLiked ? "text-red-500 font-bold" : ""
                    )}
                  >
                    <Heart size={14} className={thread.hasLiked ? "fill-red-500 text-red-500 transition-all hover:scale-110" : "transition-all hover:scale-110"} />
                    <span>{thread.likes}</span>
                  </button>

                  <button className="flex items-center gap-1.5 text-[11px] font-bold hover:text-opora-navy transition-all active:scale-90">
                    <MessageCircle size={14} className="transition-all hover:scale-110" />
                    <span>{thread.replies.length}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(thread.content);
                      alert("Скопировано в буфер обмена");
                    }} 
                    className="ml-auto text-black/25 hover:text-opora-navy transition-all p-1 active:scale-90"
                  >
                    <Share2 size={14} className="hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick preview of nested replies matching elegant Threads-nest style */}
            {thread.replies.length > 0 && (
            <div className="ml-11 mt-4 space-y-3">
                {thread.replies.slice(0, 1).map(reply => (
                  <div key={reply.id} className="opora-community-reply p-3.5 rounded-2xl">
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <span className="text-xs font-bold text-opora-navy leading-snug">{reply.author}</span>
                      <span className="text-[10px] text-opora-text/55 shrink-0">{reply.time}</span>
                    </div>
                    <p className="text-[12px] text-opora-text leading-relaxed break-words">{reply.content}</p>
                  </div>
                ))}
                {thread.replies.length > 1 && (
                  <p className="text-[11px] text-opora-sage font-semibold hover:underline">
                    Посмотреть еще {thread.replies.length - 1} ответа...
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expand Thread Replies Modal (Active Discussion Room) */}
      <AnimatePresence>
        {selectedThreadId && (() => {
          const activeThread = threads.find(t => t.id === selectedThreadId);
          if (!activeThread) return null;

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-center items-end"
              onClick={() => setSelectedThreadId(null)}
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="opora-community-modal bg-white rounded-t-3xl w-full max-w-[390px] max-h-[85vh] overflow-y-auto px-6 pt-5 pb-10 shadow-2xl space-y-4"
                onClick={e => e.stopPropagation()}
              >
                {/* Header of Modal */}
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span className="text-sm font-bold text-opora-navy">Ветка обсуждения</span>
                  <button 
                    onClick={() => setSelectedThreadId(null)}
                    className="p-1 hover:bg-opora-sand rounded-full text-opora-navy text-sm font-semibold"
                  >
                    Закрыть
                  </button>
                </div>

                {/* Original Post */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-opora-peach flex items-center justify-center text-opora-navy text-sm font-bold font-serif shrink-0">
                    {activeThread.author[0]}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-opora-navy">{activeThread.author}</h4>
                    <span className="text-[11px] text-opora-sage font-medium">{activeThread.badge}</span>
                    <p className="text-sm text-opora-navy leading-relaxed mt-1.5 break-words">{activeThread.content}</p>
                  </div>
                </div>

                {/* Replies container */}
                <div className="border-t border-black/5 pt-4 space-y-3.5">
                  <span className="text-xs font-bold text-opora-sage uppercase tracking-wider block">Ответы ({activeThread.replies.length})</span>
                  {activeThread.replies.length === 0 ? (
                    <p className="text-[11px] text-black/30 italic py-4 text-center">Станьте первыми, кто поддержит беседу.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeThread.replies.map(reply => (
                        <div key={reply.id} className="opora-community-reply p-4 rounded-2xl">
                          <div className="flex justify-between items-start gap-3 mb-1">
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-opora-navy">{reply.author}</span>
                              <span className="text-[11px] text-opora-sage block leading-snug break-words">{reply.badge}</span>
                            </div>
                            <span className="text-[11px] text-opora-text/55 shrink-0">{reply.time}</span>
                          </div>
                          <p className="text-sm text-opora-navy leading-relaxed mt-1 break-words">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Reply Box */}
                <form 
                  onSubmit={(e) => handleCreateReply(e, activeThread.id)} 
                  className="flex gap-2 border-t border-black/5 pt-4 items-end"
                >
                  <textarea
                    value={newReplyContent}
                    onChange={e => setNewReplyContent(e.target.value)}
                    placeholder="Бережный ответ поддержки..."
                    className="flex-1 bg-opora-sand rounded-2xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-opora-sage resize-none text-opora-navy placeholder:text-opora-text/50"
                    rows={1}
                    style={{ minHeight: '40px' }}
                  />
                  <button 
                    type="submit"
                    disabled={!newReplyContent.trim()}
                    className="p-2.5 bg-opora-navy text-white rounded-2xl disabled:opacity-40 transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

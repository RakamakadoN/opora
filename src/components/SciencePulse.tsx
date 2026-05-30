import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ExternalLink, Activity, BookOpen, Loader } from 'lucide-react';
import Markdown from 'react-markdown';

export interface ResearchArticle {
  id: string;
  title: string;
  source: string;
  summary: string;
  content: string;
  link: string;
}

export function SciencePulse() {
  const [news, setNews] = useState<ResearchArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch('/api/research/latest');
        if (!response.ok) {
          throw new Error('Не удалось загрузить новости');
        }
        const data = await response.json();
        setNews(data);
      } catch (err: unknown) {
        console.error(err);
        setError('Не удалось загрузить свежие исследования. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-opora-sage/20 relative overflow-hidden">
      {/* Decorative pulse background */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-opora-peach/30 rounded-full blur-3xl opacity-60 mix-blend-multiply"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="font-serif text-xl text-opora-navy font-medium flex items-center gap-2">
            Пульс науки <Activity className="text-opora-sage" size={18} />
          </h2>
          <p className="text-xs text-opora-sage font-medium uppercase tracking-wider mt-1">
            Синтез знаний из США • AI перевод
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-opora-sand flex items-center justify-center">
          <BookOpen size={16} className="text-opora-navy" />
        </div>
      </div>

      <p className="text-sm text-opora-text/80 mb-6 leading-relaxed relative z-10">
        Специально для вас мы подтягиваем самые важные доказательные исследования от <strong>CDC, NIH и AAP</strong>. Искусственный интеллект заботливо перевел их и адаптировал, чтобы вы были в курсе мировых трендов.
      </p>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader className="animate-spin text-opora-sage" size={24} />
          <p className="text-sm font-medium text-opora-navy text-center animate-pulse">
            Анализируем последние медицинские статьи в Америке... <br/>
            <span className="text-xs text-opora-sage font-normal">Это может занять несколько секунд</span>
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl font-medium border border-red-100">
          {error}
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="text-sm text-center text-opora-text/60 py-8">
          Нет актуальных новостей на данный момент.
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="space-y-4 relative z-10">
          {news.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              key={item.id} 
              className="bg-opora-sand/50 rounded-2xl p-5 border border-black/[0.03] hover:border-opora-sage/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block text-[11px] font-bold text-opora-navy bg-opora-peach/50 px-2.5 py-1 rounded-full">
                  {item.source}
                </span>
              </div>
              
              <h3 className="font-semibold text-base text-opora-navy mb-2 leading-snug">
                {item.title}
              </h3>
              
              <p className="text-sm text-opora-text/90 mb-4 leading-relaxed font-medium bg-white/50 p-3 rounded-2xl">
                {item.summary}
              </p>

              {expandedId === item.id ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-black/5"
                >
                  <div className="text-sm text-opora-navy/80 space-y-3 leading-relaxed markdown-body">
                    <Markdown components={{
                      a: ({node, ...props}) => <a {...props} className="text-opora-sage underline hover:text-opora-navy font-semibold" target="_blank" rel="noopener noreferrer" />
                    }}>
                      {item.content}
                    </Markdown>
                  </div>
                  
                  <div className="mt-5 flex justify-between items-center">
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-opora-sage hover:text-opora-navy flex items-center gap-1 transition-colors"
                    >
                      Оригинал на английском <ExternalLink size={10} />
                    </a>
                    <button 
                      onClick={() => setExpandedId(null)}
                      className="text-xs font-bold text-opora-navy bg-white px-3 py-1.5 rounded-full border border-black/5"
                    >
                      Скрыть
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button 
                  onClick={() => setExpandedId(item.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-opora-sage hover:text-opora-navy transition-colors"
                >
                  Читать подробнее <ArrowRight size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

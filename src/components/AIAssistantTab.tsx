import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Compass,
  FileText,
  HelpCircle,
  Pill,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  Utensils,
  Video
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useProfile } from '../context/ProfileContext';
import { cn } from '../lib/utils';
import type { TrackerView } from './CareTrackerTab';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AssistantCardTone = 'violet' | 'blue' | 'amber' | 'mint' | 'rose' | 'soft';

const quickPrompts = [
  {
    label: 'Плохо спит',
    prompt: 'Мой ребенок плохо спит. Помоги понять, какие наблюдения записать сегодня и что обсудить со специалистом.'
  },
  {
    label: 'Новая реакция',
    prompt: 'У ребенка появилась новая реакция. Помоги спокойно описать ее и понять следующий безопасный шаг.'
  },
  {
    label: 'Подготовка к врачу',
    prompt: 'Помоги подготовиться к приему: какие вопросы задать врачу и что взять с собой.'
  },
  {
    label: 'Результаты анализа',
    prompt: 'Я не понимаю результаты анализа. Помоги составить список вопросов врачу простыми словами.'
  },
  {
    label: 'Найти специалиста',
    prompt: 'Нужно найти специалиста для ребенка. Помоги понять, какой специалист нужен и по каким критериям выбирать.'
  }
];

export function AIAssistantTab({
  onChangeTab,
  onOpenTrackerView
}: {
  onChangeTab?: (tab: 'navigator' | 'ai' | 'tracker' | 'directory' | 'community' | 'profile' | 'doctor') => void;
  onOpenTrackerView?: (view: TrackerView) => void;
}) {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestAnswerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
  }, [inputValue]);

  useEffect(() => {
    if (!messages.length) return;
    latestAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  const sendPrompt = async (prompt: string) => {
    if (isTyping || !prompt.trim()) return;
    const userQuery = prompt.trim();
    const nextMessages = [...messages, { id: `${Date.now()}-user`, role: 'user' as const, content: userQuery }];

    setMessages(nextMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          profile
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMessages(prev => [...prev, { id: `${Date.now()}-assistant`, role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Failed to send assistant prompt:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: 'Связь с помощником сейчас нестабильна. Самый бережный следующий шаг: запишите один факт, время, что было до реакции и что помогло. Потом покажите это специалисту.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendPrompt(inputValue);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const childName = profile.childName || 'Амаль';
  const latestAssistantAnswer = [...messages].reverse().find(message => message.role === 'assistant');
  const navigatorCards: Array<{
    title: string;
    desc: string;
    icon: React.ElementType;
    tone: AssistantCardTone;
    size?: 'hero' | 'wide';
    cta?: string;
    onClick: () => void;
  }> = [
    {
      title: 'Что делать дальше?',
      desc: `Получите персональный маршрут помощи для ${childName}`,
      icon: Compass,
      tone: 'violet',
      size: 'hero',
      cta: 'Получить маршрут',
      onClick: () => sendPrompt(`Составь спокойный персональный маршрут помощи для ${childName}. Этап: ${profile.diagnosticStatus}. Нужен один следующий шаг на сегодня и план на ближайшие недели.`)
    },
    {
      title: 'Подготовиться к врачу',
      desc: 'Соберем важное для приема',
      icon: ClipboardCheck,
      tone: 'blue',
      onClick: () => sendPrompt('Помоги подготовиться к врачу: вопросы, наблюдения, документы и как коротко описать состояние ребенка.')
    },
    {
      title: 'Разобрать назначения',
      desc: 'Понятно о лекарствах, дозировках и схемах',
      icon: Pill,
      tone: 'amber',
      onClick: () => {
        if (onOpenTrackerView) onOpenTrackerView('meds');
        else sendPrompt('Помоги разобрать назначения врача простыми словами и подготовить вопросы по лекарствам.');
      }
    },
    {
      title: 'Сформировать отчет',
      desc: 'PDF отчет по данным ребенка за любой период',
      icon: BarChart3,
      tone: 'mint',
      onClick: () => {
        if (onOpenTrackerView) onOpenTrackerView('report');
        else sendPrompt('Помоги сформировать краткий отчет для врача по наблюдениям ребенка.');
      }
    },
    {
      title: 'Видео-отчет',
      desc: 'Короткое видео для врача или семьи',
      icon: Video,
      tone: 'rose',
      onClick: () => {
        if (onOpenTrackerView) onOpenTrackerView('video');
        else sendPrompt('Помоги подготовить безопасный видео-отчет для врача.');
      }
    },
    {
      title: 'Задать вопрос',
      desc: 'О состоянии, развитии, анализах',
      icon: HelpCircle,
      tone: 'soft',
      size: 'wide',
      onClick: () => inputRef.current?.focus()
    }
  ];

  return (
    <div className="opora-ai-navigator min-h-full pb-6 pt-6">
      <section className="opora-ai-hero mx-5">
        <div className="opora-ai-hero-copy">
          <div className="opora-ai-title-row">
            <h1>Помощник Опоры</h1>
            <span className="opora-ai-mini-logo">
              <Sparkles size={18} />
            </span>
          </div>
          <p className="opora-ai-subtitle">Помогаю разобраться в следующем шаге</p>

          <div className="opora-ai-today-block">
            <button type="button" onClick={() => onChangeTab?.('navigator')} className="opora-ai-child-link">
              Сегодня для <strong>{childName}</strong>
              <ChevronRight size={16} />
            </button>
            <div className="opora-ai-today-list">
              <div>
                <span className="opora-ai-today-icon violet"><Clock3 size={17} /></span>
                <span>1 лекарство через 40 минут</span>
              </div>
              <div>
                <span className="opora-ai-today-icon mint"><FileText size={17} /></span>
                <span>Новый отчет готов</span>
              </div>
              <div>
                <span className="opora-ai-today-icon amber"><Utensils size={17} /></span>
                <span>Есть 2 незавершенные записи питания</span>
              </div>
            </div>
          </div>
        </div>

        <div className="opora-ai-orb-wrap" aria-hidden="true">
          <div className="opora-ai-orb">
            <span className="mountain one" />
            <span className="mountain two" />
            <span className="road" />
            <span className="star" />
          </div>
          <div className="opora-ai-orb-base" />
        </div>
      </section>

      <section className="opora-ai-bento px-5 pt-5">
        {navigatorCards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className={cn('opora-ai-nav-card', `tone-${card.tone}`, card.size === 'hero' && 'hero', card.size === 'wide' && 'wide')}
            >
              <span className="opora-ai-nav-icon">
                <Icon size={30} />
              </span>
              <span className="opora-ai-nav-copy">
                <strong>{card.title}</strong>
                <span>{card.desc}</span>
              </span>
              {card.cta ? (
                <span className="opora-ai-route-button">
                  {card.cta}
                  <ArrowUp size={16} />
                </span>
              ) : (
                <span className="opora-ai-nav-arrow">
                  <ChevronRight size={18} />
                </span>
              )}
            </button>
          );
        })}
      </section>

      {(latestAssistantAnswer || isTyping) && (
        <section ref={latestAnswerRef} className="opora-ai-answer mx-5 mt-5">
          <div className="opora-ai-answer-label">
            <Sparkles size={15} />
            Ответ помощника
          </div>
          {isTyping ? (
            <div className="opora-ai-thinking">
              <span />
              <span />
              <span />
            </div>
          ) : latestAssistantAnswer ? (
            <div className="markdown-body">
              <Markdown>{latestAssistantAnswer.content}</Markdown>
            </div>
          ) : null}
        </section>
      )}

      <section className="opora-ai-composer mx-5 mt-5">
        <div className="opora-ai-input-shell">
          <Sparkles size={20} className="opora-ai-input-spark" />
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Что вас беспокоит сегодня?"
            rows={1}
            className="opora-ai-navigator-input"
          />
          <button type="button" onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="opora-ai-send">
            <Send size={18} />
          </button>
        </div>

        <div className="opora-ai-quick-actions">
          {quickPrompts.map(prompt => (
            <button key={prompt.label} type="button" onClick={() => setInputValue(prompt.prompt)}>
              {prompt.label === 'Плохо спит' && '😴 '}
              {prompt.label === 'Новая реакция' && '😟 '}
              {prompt.label === 'Подготовка к врачу' && '🩺 '}
              {prompt.label === 'Результаты анализа' && '📄 '}
              {prompt.label === 'Найти специалиста' && '👨‍⚕️ '}
              {prompt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

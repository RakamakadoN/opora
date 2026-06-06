import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Sparkles, ClipboardList, FileText, MapPinned, ShieldCheck, Scale, SearchCheck, FilePenLine, Stethoscope, Languages, HandHeart, Hospital, CheckCircle2, Circle, Clock3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../context/ProfileContext';
import Markdown from 'react-markdown';
import {
  buildDefaultMedicalCaseTracker,
  buildMedicalCaseRoute,
  calculateMedicalCaseProgress,
  getNextMedicalCaseAction,
  type MedicalCaseItemStatus,
  type MedicalCaseTracker
} from '../lib/medicalCaseManager';

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

const medicalNavigatorActions = [
  {
    label: 'Остановить прогрессию',
    hint: 'врач, досье, фонды',
    icon: Stethoscope,
    prompt: 'Моя цель — найти врача, который оценит, можно ли замедлить или остановить прогрессию болезни у ребенка. Диагноз/подозрение: [укажите]. Город: [город]. Что ухудшается: [симптомы и сроки]. Какие документы есть: [перечислите]. Нужны: узкий специалист, перевод выписок, фонды и письма в клиники.'
  },
  {
    label: 'Досье в клинику',
    hint: 'список и письмо',
    icon: Hospital,
    prompt: 'Помоги собрать медицинское досье для зарубежной клиники. Диагноз: [укажите]. Страна/язык: [Германия/Израиль/США/другое]. Документы на руках: [перечислите]. Подготовь список недостающих документов, требования к переводу и письмо в клинику.'
  },
  {
    label: 'Фонд на лечение',
    hint: 'Казахстан и заявки',
    icon: HandHeart,
    prompt: 'Найди фонды в Казахстане, которые могут помочь оплатить диагностику, лечение, реабилитацию или поездку. Диагноз: [укажите]. Сумма/услуга: [укажите]. Город: [город]. Подготовь черновик обращения и список приложений.'
  },
  {
    label: 'Перевод выписок',
    hint: 'точно для врачей',
    icon: Languages,
    prompt: 'Помоги подготовить технический медицинский перевод выписок для клиники. Язык: [английский/немецкий/иврит]. Текст выписки: [вставьте]. Сохрани диагнозы, дозировки, даты, единицы измерения и названия обследований.'
  }
];

const legalActions = [
  {
    label: 'Составить обращение',
    hint: 'адресат и текст письма',
    icon: FilePenLine,
    prompt: 'Помоги составить официальное обращение в госорган РК. Ситуация: [коротко опишите, что произошло]. Город: [город]. Категория: алименты / инвалидность / детский сад / другое. Документы на руках: [перечислите]. Что хочу получить: [результат]. Определи адресата и подготовь письмо для ручной подачи через e-Otinish/eGov/канцелярию.'
  },
  {
    label: 'Проверить ответ',
    hint: 'найти противоречия',
    icon: SearchCheck,
    prompt: 'Проанализируй ответ госоргана РК на предмет противоречий и проигнорированных прав. Моя просьба была: [вставьте кратко]. Ответ органа: [вставьте полный текст ответа]. Проверь, удовлетворена ли просьба, есть ли отписка, какие права ребенка или родителя могли быть проигнорированы.'
  },
  {
    label: 'Подготовить опровержение',
    hint: 'жалоба или эскалация',
    icon: Scale,
    prompt: 'Подготовь письмо-претензию/опровержение на ответ госоргана РК. Первичное обращение: [вставьте]. Полученный ответ: [вставьте]. Что, по моему мнению, проигнорировали: [перечислите]. Укажи следующую инстанцию и составь текст для ручной подачи.'
  }
];

export function AIAssistantTab() {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [medicalCaseTracker, setMedicalCaseTracker] = useState<MedicalCaseTracker | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Initialize companion messages using the child's profile details
  useEffect(() => {
    const welcomeText = `Я рядом. Для ${profile.childName || "ребенка"} (${profile.childAge} лет) сейчас этап: «${profile.diagnosticStatus}».\n\nМогу простыми словами объяснить термины, подсказать первые шаги в Казахстане, помочь найти врача, собрать документы, подготовить перевод, письма в клиники и обращения в фонды.`;
    
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

  useEffect(() => {
    const saved = localStorage.getItem(`opora_medical_case_tracker_${profile.id}`);
    setMedicalCaseTracker(saved ? JSON.parse(saved) : null);
  }, [profile.id]);

  useEffect(() => {
    if (!medicalCaseTracker) return;
    localStorage.setItem(`opora_medical_case_tracker_${profile.id}`, JSON.stringify(medicalCaseTracker));
  }, [medicalCaseTracker, profile.id]);

  const startMedicalCaseTracker = () => {
    const route = buildMedicalCaseRoute(profile, 'найти врача который оценит прогрессию');
    const tracker = buildDefaultMedicalCaseTracker(route, profile.id);
    setMedicalCaseTracker(tracker);
    setInputValue(medicalNavigatorActions[0].prompt);
  };

  const updateMedicalCaseItemStatus = (id: string, status: MedicalCaseItemStatus) => {
    setMedicalCaseTracker(prev => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        updatedAt: now,
        items: prev.items.map(item => item.id === id
          ? {
              ...item,
              status,
              completedAt: status === 'done' ? now : undefined
            }
          : item)
      };
    });
  };

  const medicalCaseProgress = medicalCaseTracker ? calculateMedicalCaseProgress(medicalCaseTracker) : null;
  const nextMedicalCaseAction = medicalCaseTracker ? getNextMedicalCaseAction(medicalCaseTracker) : null;

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

        <div className="opora-ai-intro rounded-2xl border border-opora-sage/20 bg-white/75 px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-opora-sage text-white">
              <Stethoscope size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">
                Медицинский навигатор до Точки Б
              </p>
              <p className="text-xs font-bold leading-snug text-opora-navy">
                Врач, досье, перевод, фонды и письма
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            {medicalNavigatorActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setInputValue(action.prompt)}
                  className="flex min-h-[58px] items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-left shadow-sm transition-all active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-opora-peach/35 text-opora-navy">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold leading-tight text-opora-navy">{action.label}</span>
                    <span className="block text-[11px] font-medium leading-snug text-opora-text/70">{action.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="opora-ai-intro rounded-2xl border border-opora-peach/50 bg-white/80 px-4 py-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">
                Трекер медицинского кейса
              </p>
              <p className="text-sm font-extrabold leading-snug text-opora-navy">
                {medicalCaseTracker ? medicalCaseTracker.title : 'Дойти до Точки Б по шагам'}
              </p>
            </div>
            <button
              type="button"
              onClick={startMedicalCaseTracker}
              className="shrink-0 rounded-xl bg-opora-navy px-3 py-2 text-[11px] font-extrabold text-white shadow-sm active:scale-[0.98]"
            >
              {medicalCaseTracker ? 'Обновить' : 'Создать'}
            </button>
          </div>

          {medicalCaseTracker && medicalCaseProgress ? (
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-opora-text/70">
                  <span>{medicalCaseProgress.doneCount} из {medicalCaseProgress.totalCount} шагов готово</span>
                  <span>{medicalCaseProgress.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-opora-sand">
                  <div
                    className="h-full rounded-full bg-opora-sage transition-all"
                    style={{ width: `${medicalCaseProgress.percent}%` }}
                  />
                </div>
              </div>

              {nextMedicalCaseAction && (
                <div className="rounded-xl border border-opora-sage/20 bg-opora-sage/10 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">
                    <Clock3 size={13} />
                    Следующее действие
                  </div>
                  <p className="text-sm font-bold leading-snug text-opora-navy">{nextMedicalCaseAction.title}</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-opora-text/80">
                    {nextMedicalCaseAction.deadline}: {nextMedicalCaseAction.action}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {medicalCaseTracker.items.map(item => (
                  <div key={item.id} className="rounded-xl border border-black/5 bg-white px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => updateMedicalCaseItemStatus(item.id, item.status === 'done' ? 'todo' : 'done')}
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-opora-sand text-opora-sage"
                        aria-label={item.status === 'done' ? 'Отметить шаг как не готовый' : 'Отметить шаг готовым'}
                      >
                        {item.status === 'done' ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-extrabold leading-tight text-opora-navy">{item.title}</p>
                          <span className="rounded-full bg-opora-sand px-2 py-0.5 text-[10px] font-extrabold text-opora-text/70">
                            {item.deadline}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-opora-text/75">{item.output}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {([
                            ['todo', 'не начато'],
                            ['requested', 'запрошено'],
                            ['sent', 'отправлено'],
                            ['waiting', 'ждем ответ'],
                            ['done', 'готово']
                          ] as Array<[MedicalCaseItemStatus, string]>).map(([status, label]) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateMedicalCaseItemStatus(item.id, status)}
                              className={`rounded-full px-2 py-1 text-[10px] font-extrabold transition-all ${
                                item.status === status
                                  ? 'bg-opora-navy text-white'
                                  : 'bg-opora-sand text-opora-text/70'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-opora-sand/70 px-3 py-3">
              <p className="text-sm font-bold leading-snug text-opora-navy">
                Создайте кейс, и здесь появится прогресс: документы, перевод, фонды, клиники и следующий шаг.
              </p>
            </div>
          )}
        </div>

        <div className="opora-ai-intro rounded-2xl border border-opora-sage/20 bg-white/75 px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-opora-navy text-white">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">
                Письма и юридический контроль
              </p>
              <p className="text-xs font-bold leading-snug text-opora-navy">
                Черновики для e-Otinish, eGov и письменных обращений
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            {legalActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setInputValue(action.prompt)}
                  className="flex min-h-[58px] items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-left shadow-sm transition-all active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-opora-sage/10 text-opora-sage">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold leading-tight text-opora-navy">{action.label}</span>
                    <span className="block text-[11px] font-medium leading-snug text-opora-text/70">{action.hint}</span>
                  </span>
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
            placeholder="Спросите о медицинском маршруте, правах в РК или поделитесь..."
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

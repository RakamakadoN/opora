import React, { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { Activity, Brain, CheckCircle2, ClipboardList, Database, FileText, LockKeyhole, Send, ShieldCheck, Sparkles, Stethoscope, UserRound } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { cn } from '../lib/utils';

type DoctorMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type DoctorLanguage = 'ru' | 'kk' | 'en';

const t = {
  ru: {
    multiverse: 'Врачебная мультивселенная',
    title: 'Кабинет врача',
    subtitle: 'Карточки детей, сенсорный паспорт и ИИ-помощник по evidence-based поддержке.',
    patients: 'Пациенты',
    childCard: 'Карточка ребенка',
    communication: 'Коммуникация',
    calming: 'Успокаивает',
    sensory: 'Свет/звук',
    motivation: 'Мотивация',
    planTitle: 'План помощи по исследованиям США',
    planSubtitle: 'Не “лечение аутизма”, а структурированный care plan: цели, подходы, мониторинг и безопасность.',
    goals: 'Цели на 8-12 недель',
    interventions: 'Подходы',
    monitoring: 'Мониторинг',
    safety: 'Когда направлять срочно',
    questsTitle: 'Квесты для родителя',
    questsSubtitle: 'Врач назначает маленькие задания на день или неделю. Родитель закрывает их как todo и получает поддержку.',
    dayQuest: 'На день',
    weekQuest: 'На неделю',
    addQuest: 'Выдать квест родителю',
    questAdded: 'Квест добавлен в маршрут родителя',
    customQuest: 'Свой квест врача',
    customTitle: 'Название квеста',
    customDescription: 'Что родителю сделать',
    activeQuests: 'Активные квесты',
    noActiveQuests: 'Пока нет активных квестов для этого ребенка.',
    progressTitle: 'Прогресс мамы и ребенка',
    childProgress: 'Прогресс ребенка',
    parentProgress: 'Ресурс мамы',
    noProgress: 'Пока нет записей от родителя.',
    assistant: 'ИИ-помощник врача',
    evidence: 'Evidence база',
    evidenceTitle: 'Подходы и исследования',
    disclaimer: 'Кабинет врача не ставит диагноз и не назначает лечение автоматически. Он помогает структурировать прием, видеть сенсорный паспорт и проверять актуальные источники перед клиническим решением.',
    placeholder: 'Задайте вопрос: сон, поведение, терапия, подготовка приема...',
    loading: 'Анализирую карточку и источники...',
    intro: 'Врачебный помощник готов. Выберите карточку ребенка и задайте клинический вопрос: первый прием, сон, поведение, сенсорная адаптация, подходы помощи или исследования.',
    quickQuestions: [
      'Распиши care plan на 8-12 недель согласно исследованиям США.',
      'Составь план первого приема для ребенка с сенсорной чувствительностью.',
      'Какие evidence-based подходы уместно обсудить с семьей при РАС?',
      'Как безопасно обсудить сон, тревогу и возможные сопутствующие симптомы?',
      'Подготовь вопросы для родителей перед направлением к логопеду и OT.'
    ]
  },
  kk: {
    multiverse: 'Дәрігер кабинеті',
    title: 'Дәрігер бөлмесі',
    subtitle: 'Баланың картасы, сенсорлық паспорты және дәлелді көмекші.',
    patients: 'Балалар',
    childCard: 'Баланың картасы',
    communication: 'Қарым-қатынас',
    calming: 'Тыныштандырады',
    sensory: 'Жарық/дыбыс',
    motivation: 'Мотивация',
    planTitle: 'АҚШ зерттеулеріне сүйенген көмек жоспары',
    planSubtitle: 'Бұл “аутизмді емдеу” емес, мақсат, қолдау, бақылау және қауіпсіздік жоспары.',
    goals: '8-12 апта мақсаты',
    interventions: 'Қолдау тәсілдері',
    monitoring: 'Бақылау',
    safety: 'Қашан шұғыл жолдау керек',
    questsTitle: 'Ата-анаға квесттер',
    questsSubtitle: 'Дәрігер күнге немесе аптаға шағын тапсырма береді. Ата-ана оны todo сияқты жауып, қолдау алады.',
    dayQuest: 'Бір күнге',
    weekQuest: 'Бір аптаға',
    addQuest: 'Квест беру',
    questAdded: 'Квест ата-ананың маршрутына қосылды',
    customQuest: 'Дәрігердің өз квесті',
    customTitle: 'Квест атауы',
    customDescription: 'Ата-ана не істейді',
    activeQuests: 'Белсенді квесттер',
    noActiveQuests: 'Бұл балаға белсенді квест әзірге жоқ.',
    progressTitle: 'Ана мен баланың прогресі',
    childProgress: 'Баланың прогресі',
    parentProgress: 'Ананың ресурсы',
    noProgress: 'Ата-ана енгізген жазба әзірге жоқ.',
    assistant: 'Дәрігерге арналған ИИ көмекші',
    evidence: 'Дәлелді база',
    evidenceTitle: 'Тәсілдер және зерттеулер',
    disclaimer: 'Бұл кабинет диагноз қоймайды және емді автоматты түрде тағайындамайды. Ол қабылдауды құрылымдауға және дереккөздерді тексеруге көмектеседі.',
    placeholder: 'Сұрақ қойыңыз: ұйқы, мінез-құлық, терапия, қабылдауға дайындық...',
    loading: 'Картаны және дереккөздерді талдап жатырмын...',
    intro: 'Дәрігер көмекшісі дайын. Баланың картасын таңдап, клиникалық сұрақ қойыңыз.',
    quickQuestions: [
      'АҚШ зерттеулеріне сүйеніп 8-12 апталық care plan жаз.',
      'Сенсорлық сезімталдығы бар балаға алғашқы қабылдау жоспарын жаса.',
      'РАС кезінде отбасымен қандай дәлелді тәсілдерді талқылауға болады?',
      'Ұйқы, мазасыздық және қосымша симптомдарды қалай қауіпсіз талқылауға болады?',
      'Логопед пен OT маманына жолдамас бұрын ата-анаға сұрақтар дайында.'
    ]
  },
  en: {
    multiverse: 'Clinician Multiverse',
    title: 'Clinician Room',
    subtitle: 'Child cards, sensory passport, and evidence-based AI support.',
    patients: 'Patients',
    childCard: 'Child card',
    communication: 'Communication',
    calming: 'Calming supports',
    sensory: 'Light/sound',
    motivation: 'Motivation',
    planTitle: 'US evidence-informed care plan',
    planSubtitle: 'Not a “cure for autism”, but goals, supports, monitoring, and safety planning.',
    goals: '8-12 week goals',
    interventions: 'Approaches',
    monitoring: 'Monitoring',
    safety: 'Urgent referral',
    questsTitle: 'Parent quests',
    questsSubtitle: 'The clinician gives tiny daily or weekly tasks. The parent completes them like a todo and receives encouragement.',
    dayQuest: 'Daily',
    weekQuest: 'Weekly',
    addQuest: 'Assign quest',
    questAdded: 'Quest added to the parent route',
    customQuest: 'Custom clinician quest',
    customTitle: 'Quest title',
    customDescription: 'What the parent should do',
    activeQuests: 'Active quests',
    noActiveQuests: 'No active quests for this child yet.',
    progressTitle: 'Parent and child progress',
    childProgress: 'Child progress',
    parentProgress: 'Parent resource',
    noProgress: 'No parent-entered notes yet.',
    assistant: 'Clinician AI assistant',
    evidence: 'Evidence base',
    evidenceTitle: 'Approaches and studies',
    disclaimer: 'The clinician room does not diagnose or prescribe automatically. It helps structure the visit, view the sensory passport, and check current sources before clinical decisions.',
    placeholder: 'Ask about sleep, behavior, therapy, visit prep...',
    loading: 'Reviewing child card and sources...',
    intro: 'Clinician assistant is ready. Select a child card and ask a clinical support question.',
    quickQuestions: [
      'Build an 8-12 week care plan based on US evidence.',
      'Create a first-visit plan for a sensory-sensitive child.',
      'Which evidence-based approaches should be discussed with the family?',
      'How should sleep, anxiety, and co-occurring symptoms be discussed safely?',
      'Prepare parent questions before referral to speech therapy and OT.'
    ]
  }
} as const;

const questTemplates = {
  ru: [
    {
      cadence: 'day',
      title: 'Квест: 5 минут спокойной коммуникации',
      description: 'Сегодня один раз провести короткую игру без требований: следовать за интересом ребенка, хвалить любой контакт и остановиться до перегруза.',
      category: 'home'
    },
    {
      cadence: 'day',
      title: 'Квест: заметить один триггер',
      description: 'Записать один момент, где ребенку стало сложно: звук, свет, переход, ожидание или усталость. Без обвинений, только наблюдение.',
      category: 'home'
    },
    {
      cadence: 'week',
      title: 'Квест недели: визуальная рутина',
      description: 'Выбрать одну повторяющуюся ситуацию и сделать 3 простых шага-картинки: сначала, потом, завершили.',
      category: 'therapy'
    },
    {
      cadence: 'week',
      title: 'Квест недели: ресурс мамы',
      description: 'Три раза за неделю отметить ресурс мамы и одну вещь, которая помогла чуть-чуть выдохнуть.',
      category: 'home'
    }
  ],
  kk: [
    {
      cadence: 'day',
      title: 'Квест: 5 минут тыныш байланыс',
      description: 'Бүгін бір рет талапсыз қысқа ойын өткізу: баланың қызығуына еру, кез келген байланысын мақтау және шаршатпай тоқтау.',
      category: 'home'
    },
    {
      cadence: 'day',
      title: 'Квест: бір триггерді байқау',
      description: 'Балаға қиын болған бір сәтті жазу: дыбыс, жарық, ауысу, күту немесе шаршау. Кінәлау емес, тек бақылау.',
      category: 'home'
    },
    {
      cadence: 'week',
      title: 'Апта квесті: визуалды рутина',
      description: 'Бір қайталанатын жағдайды таңдап, 3 қарапайым қадам жасау: алдымен, кейін, аяқталды.',
      category: 'therapy'
    },
    {
      cadence: 'week',
      title: 'Апта квесті: ананың ресурсы',
      description: 'Апта ішінде үш рет ананың ресурсын және аздап тыныстауға көмектескен бір нәрсені белгілеу.',
      category: 'home'
    }
  ],
  en: [
    {
      cadence: 'day',
      title: 'Quest: 5 minutes of calm communication',
      description: 'Today, do one short no-demand play moment: follow the child’s interest, praise any connection, and stop before overload.',
      category: 'home'
    },
    {
      cadence: 'day',
      title: 'Quest: notice one trigger',
      description: 'Write down one moment that was hard for the child: sound, light, transition, waiting, or fatigue. Observation, not blame.',
      category: 'home'
    },
    {
      cadence: 'week',
      title: 'Weekly quest: visual routine',
      description: 'Choose one repeated situation and create 3 simple visual steps: first, then, finished.',
      category: 'therapy'
    },
    {
      cadence: 'week',
      title: 'Weekly quest: caregiver resource',
      description: 'Three times this week, note the parent’s energy and one thing that helped them breathe a little.',
      category: 'home'
    }
  ]
} as const;

const communicationLabels: Record<DoctorLanguage, Record<string, string>> = {
  ru: {
    'simple-words': 'короткие пошаговые фразы',
    visuals: 'визуальные карточки / PECS',
    silence: 'минимум лишних разговоров',
    praise: 'активная похвала'
  },
  kk: {
    'simple-words': 'қысқа қадамдық сөздер',
    visuals: 'визуалды карточкалар / PECS',
    silence: 'артық сөзді азайту',
    praise: 'белсенді мадақтау'
  },
  en: {
    'simple-words': 'short step-by-step phrases',
    visuals: 'visual cards / PECS',
    silence: 'minimal extra talking',
    praise: 'active praise'
  }
};


export function DoctorCabinetTab() {
  const {
    profiles,
    activeProfileId,
    switchProfile,
    progressEntries,
    parentJournalEntries,
    parentTasks,
    addParentTask,
    doctorCareRequests,
    accessAuditLogs,
    doctorAcceptCareRequest,
    doctorCompleteFirstConsult,
    declineDoctorCareRequest
  } = useProfile();
  const activeChild = profiles.find(profile => profile.id === activeProfileId) || profiles[0];
  const passport = activeChild?.sensoryPassport;
  const [language, setLanguage] = useState<DoctorLanguage>('ru');
  const [question, setQuestion] = useState('');
  const [questAddedTitle, setQuestAddedTitle] = useState('');
  const [customQuestTitle, setCustomQuestTitle] = useState('');
  const [customQuestDescription, setCustomQuestDescription] = useState('');
  const [customQuestCadence, setCustomQuestCadence] = useState<'day' | 'week'>('day');
  const [messages, setMessages] = useState<DoctorMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: t.ru.intro
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const assistantSectionRef = useRef<HTMLElement | null>(null);
  const [evidence, setEvidence] = useState<{ treatmentApproaches: any[]; clinicalTrials: any[] }>({
    treatmentApproaches: [],
    clinicalTrials: []
  });

  const scrollToAssistant = () => {
    window.setTimeout(() => {
      assistantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  useEffect(() => {
    setMessages(current => current.length === 1 && current[0].id === 'intro'
      ? [{ id: 'intro', role: 'assistant', content: t[language].intro }]
      : current
    );
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/directory/us?limit=1')
      .then(response => response.json())
      .then(data => {
        if (!cancelled) {
          setEvidence({
            treatmentApproaches: data.treatmentApproaches || [],
            clinicalTrials: data.clinicalTrials || []
          });
        }
      })
      .catch(() => {
        if (!cancelled) setEvidence({ treatmentApproaches: [], clinicalTrials: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const childSummary = useMemo(() => {
    if (!activeChild) return 'Нет активной карточки ребенка.';
    return `${activeChild.childName}, ${activeChild.childAge} лет. Этап: ${activeChild.diagnosticStatus}. Город: ${activeChild.userCity}.`;
  }, [activeChild]);

  const ui = t[language];
  const activeAccessRequest = doctorCareRequests
    .filter(request => request.childId === activeChild?.id && request.status !== 'declined')
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
  const hasFullAccess = activeAccessRequest?.status === 'full_access';
  const canRunFirstConsult = activeAccessRequest?.status === 'doctor_accepted';
  const pendingParentConfirmation = activeAccessRequest?.status === 'first_consult_done';
  const accessStepIndex = activeAccessRequest
    ? ['parent_requested', 'doctor_accepted', 'first_consult_done', 'full_access'].indexOf(activeAccessRequest.status)
    : -1;
  const doctorNextAction = !activeAccessRequest
    ? 'Ждем запрос от родителя'
    : activeAccessRequest.status === 'parent_requested'
      ? 'Нажмите “Принять запрос”'
      : activeAccessRequest.status === 'doctor_accepted'
        ? 'Проведите первую консультацию'
        : activeAccessRequest.status === 'first_consult_done'
          ? 'Ждем решение родителя'
          : 'Можно работать с документами';
  const childProgress = progressEntries
    .filter(entry => entry.childId === activeChild?.id)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const parentProgress = parentJournalEntries
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const activeDoctorQuests = parentTasks
    .filter(task => task.childId === activeChild?.id && task.status === 'todo')
    .filter(task => task.title.toLowerCase().includes('quest') || task.title.toLowerCase().includes('квест'))
    .slice(0, 3);

  const carePlan = [
    {
      title: ui.goals,
      items: [
        language === 'en' ? 'Define 2-3 functional goals with the family.' : language === 'kk' ? 'Отбасымен 2-3 нақты функционалдық мақсат белгілеу.' : 'Согласовать с семьей 2-3 функциональные цели.',
        language === 'en' ? 'Track communication, adaptive skills, sleep, and distress triggers.' : language === 'kk' ? 'Коммуникация, бейімделу дағдылары, ұйқы және триггерлерді бақылау.' : 'Отслеживать коммуникацию, адаптивные навыки, сон и триггеры.'
      ]
    },
    {
      title: ui.interventions,
      items: [
        'Behavioral approaches / ABA-informed goals',
        'Speech therapy and communication supports',
        'Occupational therapy for sensory and daily living skills',
        'CBT-style support for anxiety when developmentally appropriate'
      ]
    },
    {
      title: ui.monitoring,
      items: [
        language === 'en' ? 'Baseline and weekly parent-entered progress notes.' : language === 'kk' ? 'Бастапқы деңгей және ата-ана енгізетін апталық прогресс.' : 'Baseline и еженедельные записи прогресса от родителя.',
        language === 'en' ? 'Review caregiver burnout and access barriers.' : language === 'kk' ? 'Ата-ананың шаршауын және қолжетімділік кедергілерін қарау.' : 'Отслеживать ресурс мамы и барьеры доступа к помощи.'
      ]
    },
    {
      title: ui.safety,
      items: [
        language === 'en' ? 'Regression, seizures, self-injury, dangerous aggression, dehydration, or medication adverse effects.' : language === 'kk' ? 'Регресс, ұстама, өзіне зиян, қауіпті агрессия, сусыздану немесе дәрі жанама әсері.' : 'Регресс, судороги, самоагрессия, опасная агрессия, обезвоживание или побочные эффекты лекарств.'
      ]
    }
  ];

  const addQuest = (quest: typeof questTemplates[DoctorLanguage][number]) => {
    if (!activeChild) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (quest.cadence === 'week' ? 7 : 1));
    addParentTask({
      childId: activeChild.id,
      title: quest.title,
      description: quest.description,
      category: quest.category,
      dueDate: dueDate.toISOString().slice(0, 10)
    });
    setQuestAddedTitle(quest.title);
    window.setTimeout(() => setQuestAddedTitle(''), 2600);
  };

  const addCustomQuest = () => {
    if (!activeChild || !customQuestTitle.trim() || !customQuestDescription.trim()) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (customQuestCadence === 'week' ? 7 : 1));
    const titlePrefix = language === 'en' ? 'Quest' : 'Квест';
    const title = customQuestTitle.trim().toLowerCase().includes('quest') || customQuestTitle.trim().toLowerCase().includes('квест')
      ? customQuestTitle.trim()
      : `${titlePrefix}: ${customQuestTitle.trim()}`;
    addParentTask({
      childId: activeChild.id,
      title,
      description: customQuestDescription.trim(),
      category: 'home',
      dueDate: dueDate.toISOString().slice(0, 10)
    });
    setQuestAddedTitle(title);
    setCustomQuestTitle('');
    setCustomQuestDescription('');
    window.setTimeout(() => setQuestAddedTitle(''), 2600);
  };

  const handleSend = async (override?: string) => {
    const text = (override || question).trim();
    if (!text || !activeChild || isLoading) return;

    if (!hasFullAccess) {
      setMessages(prev => [...prev, {
        id: `assistant-access-${Date.now()}`,
        role: 'assistant',
        content: 'Сначала нужно подтверждение родителя. После первой консультации родитель сможет открыть врачу документы ребенка, прогресс и сенсорный паспорт.'
      }]);
      scrollToAssistant();
      return;
    }

    const nextMessages: DoctorMessage[] = [...messages, { id: `user-${Date.now()}`, role: 'user', content: text }];
    setMessages(nextMessages);
    setQuestion('');
    setIsLoading(true);
    scrollToAssistant();

    try {
      const response = await fetch('/api/doctor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.filter(message => message.id !== 'intro'),
          childProfile: activeChild,
          sensoryPassport: passport,
          clinicalContext: {
            appScope: 'clinician support',
            language,
            parentProgress,
            childProgress,
            sources: ['CDC ASD Treatment', 'ClinicalTrials.gov', 'NPPES NPI Registry']
          }
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Не удалось получить ответ. Попробуйте уточнить вопрос.'
      }]);
      scrollToAssistant();
      if (data.evidence) setEvidence(data.evidence);
    } catch {
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Связь с врачебным помощником временно недоступна. Карточки детей и evidence-база остаются доступны.'
      }]);
      scrollToAssistant();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-opora-sand/30 pt-12 pb-28">
      <div className="opora-doctor-header sticky top-0 z-20 border-b border-black/5 bg-opora-sand/90 px-6 pb-4 pt-2 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">{ui.multiverse}</span>
            <h1 className="font-serif text-2xl font-semibold text-opora-navy">{ui.title}</h1>
            <p className="mt-1 text-xs leading-relaxed text-opora-text">{ui.subtitle}</p>
          </div>
          <div className="rounded-2xl bg-opora-sage/10 p-2.5 text-opora-sage">
            <Stethoscope size={22} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-white/80 p-1">
          {[
            { id: 'ru', label: 'Рус' },
            { id: 'kk', label: 'Қаз' },
            { id: 'en', label: 'Eng' }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLanguage(item.id as DoctorLanguage)}
              className={cn(
                'rounded-xl px-3 py-2 text-xs font-extrabold transition-all',
                language === item.id ? 'bg-opora-navy text-white' : 'text-opora-navy'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-6 pt-5">
        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-opora-text/60">{ui.patients}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {profiles.map(profile => {
              const active = profile.id === activeChild?.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => switchProfile(profile.id)}
                  className={cn(
                    'opora-doctor-chip min-w-[148px] rounded-2xl border p-3 text-left transition-all',
                    active ? 'border-opora-navy bg-opora-navy text-white' : 'border-black/5 bg-white text-opora-navy'
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-extrabold">
                    <UserRound size={15} /> {profile.childName}
                  </span>
                  <span className={cn('mt-1 block text-[11px] leading-snug', active ? 'text-white/75' : 'text-opora-text/75')}>
                    {profile.childAge} лет · {profile.diagnosticStatus}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">Что сейчас сделать врачу</p>
              <h2 className="text-base font-extrabold leading-tight text-opora-navy">
                {doctorNextAction}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-opora-text">
                Документы ребенка открываются только после того, как родитель сам подтвердит работу с врачом.
              </p>
            </div>
            {hasFullAccess ? <CheckCircle2 size={22} className="shrink-0 text-opora-sage" /> : <LockKeyhole size={22} className="shrink-0 text-opora-sage" />}
          </div>

          {activeAccessRequest ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 rounded-2xl bg-opora-sand/60 p-2 text-left">
                {[
                  { id: 'parent_requested', number: '1', label: 'Родитель отправил запрос' },
                  { id: 'doctor_accepted', number: '2', label: 'Врач принимает запрос' },
                  { id: 'first_consult_done', number: '3', label: 'Первая консультация проведена' },
                  { id: 'full_access', number: '4', label: 'Родитель открыл документы' }
                ].map((step, index) => {
                  const done = accessStepIndex >= index;
                  const current = accessStepIndex === index;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-extrabold',
                        done ? 'bg-opora-navy text-white' : 'bg-white/70 text-opora-text'
                      )}
                    >
                      <span className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                        done ? 'bg-white/15 text-white' : 'bg-opora-sage/10 text-opora-sage'
                      )}>
                        {done && !current ? '✓' : step.number}
                      </span>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-opora-sand/55 p-3">
                <p className="text-sm font-extrabold text-opora-navy">{activeAccessRequest.childName}, {activeAccessRequest.childAge} лет</p>
                <p className="mt-1 text-xs leading-relaxed text-opora-text">
                  Заметка родителя: {activeAccessRequest.parentNote || 'хотим сначала познакомиться на первой консультации.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {activeAccessRequest.status === 'parent_requested' && (
                  <button
                    type="button"
                    onClick={() => doctorAcceptCareRequest(activeAccessRequest.id)}
                    className="rounded-xl bg-opora-navy px-3 py-2.5 text-xs font-extrabold text-white"
                  >
                    Принять запрос
                  </button>
                )}
                {canRunFirstConsult && (
                  <button
                    type="button"
                    onClick={() => doctorCompleteFirstConsult(activeAccessRequest.id)}
                    className="rounded-xl bg-opora-sage px-3 py-2.5 text-xs font-extrabold text-white"
                  >
                    Я провел(а) первую консультацию
                  </button>
                )}
                {pendingParentConfirmation && (
                  <div className="rounded-xl border border-opora-sage/20 bg-opora-sage/10 p-4 text-sm font-bold leading-relaxed text-opora-navy">
                    Теперь ход родителя. Он решит: открыть вам документы ребенка или нет.
                  </div>
                )}
                {hasFullAccess && (
                  <div className="rounded-xl border border-opora-sage/20 bg-opora-sage/10 p-4 text-sm font-bold leading-relaxed text-opora-navy">
                    Родитель подтвердил вас. Ниже открыты паспорт, прогресс и материалы ребенка.
                  </div>
                )}
                {activeAccessRequest.status !== 'full_access' && (
                  <button
                    type="button"
                    onClick={() => declineDoctorCareRequest(activeAccessRequest.id)}
                    className="rounded-xl bg-opora-sand px-3 py-2.5 text-xs font-extrabold text-opora-navy"
                  >
                    Не беру этот запрос
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-opora-sand/60 p-3 text-xs leading-relaxed text-opora-text">
              Когда родитель отправит запрос врачу, он появится здесь как входящая заявка.
            </p>
          )}
        </section>

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">Журнал доступа</p>
              <h2 className="text-base font-extrabold text-opora-navy">Кто и когда открыл данные</h2>
            </div>
            <ShieldCheck size={20} className="text-opora-sage" />
          </div>
          <div className="space-y-2">
            {accessAuditLogs
              .filter(log => log.childId === activeChild?.id)
              .slice(0, 5)
              .map(log => (
                <div key={log.id} className="rounded-xl bg-opora-sand/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold text-opora-navy">{log.actorName}</p>
                    <span className="rounded-lg bg-white/70 px-2 py-1 text-[10px] font-bold text-opora-text">
                      {new Date(log.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-opora-text">{log.note}</p>
                </div>
              ))}
            {!accessAuditLogs.some(log => log.childId === activeChild?.id) && (
              <p className="rounded-xl bg-opora-sand/60 p-3 text-xs leading-relaxed text-opora-text">
                Пока нет действий доступа. Здесь появятся принятие запроса, первая консультация и подтверждение родителя.
              </p>
            )}
          </div>
        </section>

        {hasFullAccess ? (
          <>
        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">Duolingo style</p>
              <h2 className="text-base font-extrabold text-opora-navy">{ui.questsTitle}</h2>
              <p className="mt-1 text-xs leading-relaxed text-opora-text">{ui.questsSubtitle}</p>
            </div>
            <Sparkles size={20} className="shrink-0 text-opora-sage" />
          </div>

          {questAddedTitle && (
            <div className="mb-3 rounded-xl border border-opora-sage/20 bg-opora-sage/10 px-3 py-2 text-xs font-bold text-opora-navy">
              {ui.questAdded}: {questAddedTitle}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {questTemplates[language].map(quest => (
              <div key={quest.title} className="rounded-xl border border-black/5 bg-opora-sand/60 p-3">
                <span className="rounded-lg bg-white/70 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-opora-sage">
                  {quest.cadence === 'week' ? ui.weekQuest : ui.dayQuest}
                </span>
                <h3 className="mt-2 text-sm font-extrabold leading-tight text-opora-navy">{quest.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-opora-text">{quest.description}</p>
                <button
                  type="button"
                  onClick={() => addQuest(quest)}
                  className="mt-3 w-full rounded-xl bg-opora-sage px-3 py-2 text-xs font-extrabold text-white"
                >
                  {ui.addQuest}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-opora-sage/20 bg-white/70 p-3">
            <p className="text-sm font-extrabold text-opora-navy">{ui.customQuest}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-opora-sand/60 p-1">
              {[
                { id: 'day', label: ui.dayQuest },
                { id: 'week', label: ui.weekQuest }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCustomQuestCadence(item.id as 'day' | 'week')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs font-extrabold transition-all',
                    customQuestCadence === item.id ? 'bg-opora-navy text-white' : 'text-opora-navy'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              value={customQuestTitle}
              onChange={event => setCustomQuestTitle(event.target.value)}
              placeholder={ui.customTitle}
              className="mt-2 w-full rounded-xl border border-black/5 bg-white px-3 py-2.5 text-sm font-bold text-opora-navy outline-none"
            />
            <textarea
              value={customQuestDescription}
              onChange={event => setCustomQuestDescription(event.target.value)}
              placeholder={ui.customDescription}
              className="mt-2 min-h-[76px] w-full resize-none rounded-xl border border-black/5 bg-white px-3 py-2.5 text-sm text-opora-navy outline-none"
            />
            <button
              type="button"
              onClick={addCustomQuest}
              disabled={!customQuestTitle.trim() || !customQuestDescription.trim()}
              className="mt-2 w-full rounded-xl bg-opora-navy px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-45"
            >
              {ui.addQuest}
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-black/5 bg-opora-sand/45 p-3">
            <p className="text-sm font-extrabold text-opora-navy">{ui.activeQuests}</p>
            <div className="mt-2 space-y-2">
              {activeDoctorQuests.length ? activeDoctorQuests.map(task => (
                <div key={task.id} className="rounded-lg bg-white/75 px-3 py-2">
                  <p className="text-xs font-extrabold leading-tight text-opora-navy">{task.title}</p>
                  {task.dueDate && <p className="mt-1 text-[10px] font-bold text-opora-text/60">{new Date(task.dueDate).toLocaleDateString()}</p>}
                </div>
              )) : (
                <p className="text-xs leading-relaxed text-opora-text">{ui.noActiveQuests}</p>
              )}
            </div>
          </div>
        </section>

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">{ui.childCard}</p>
              <h2 className="mt-1 text-lg font-extrabold leading-tight text-opora-navy">{childSummary}</h2>
            </div>
            <ShieldCheck className="shrink-0 text-opora-sage" size={20} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-opora-sand/60 p-3">
              <span className="font-bold text-opora-navy">{ui.communication}</span>
              <p className="mt-1 leading-relaxed text-opora-text">{communicationLabels[language][passport?.communicationStyle || 'simple-words'] || 'не указано'}</p>
            </div>
            <div className="rounded-xl bg-opora-sand/60 p-3">
              <span className="font-bold text-opora-navy">{ui.calming}</span>
              <p className="mt-1 leading-relaxed text-opora-text">{passport?.comfortTriggers || 'уточнить у родителя'}</p>
            </div>
            <div className="rounded-xl bg-opora-sand/60 p-3">
              <span className="font-bold text-opora-navy">{ui.sensory}</span>
              <p className="mt-1 leading-relaxed text-opora-text">
                {[...(passport?.soundSensitivity || []), ...(passport?.lightSensitivity || [])].join(', ') || 'уточнить'}
              </p>
            </div>
            <div className="rounded-xl bg-opora-sand/60 p-3">
              <span className="font-bold text-opora-navy">{ui.motivation}</span>
              <p className="mt-1 leading-relaxed text-opora-text">{passport?.favoriteReward || 'уточнить перед приемом'}</p>
            </div>
          </div>
        </section>

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">US evidence care plan</p>
              <h2 className="text-base font-extrabold text-opora-navy">{ui.planTitle}</h2>
              <p className="mt-1 text-xs leading-relaxed text-opora-text">{ui.planSubtitle}</p>
            </div>
            <ClipboardList size={20} className="shrink-0 text-opora-sage" />
          </div>
          <div className="space-y-2">
            {carePlan.map(block => (
              <div key={block.title} className="rounded-xl bg-opora-sand/60 p-3">
                <p className="text-sm font-extrabold text-opora-navy">{block.title}</p>
                <ul className="mt-1 space-y-1 text-xs leading-relaxed text-opora-text">
                  {block.items.map(item => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleSend(ui.quickQuestions[0])}
            disabled={isLoading}
            className="mt-3 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.99] disabled:opacity-60"
          >
            {isLoading
              ? ui.loading
              : language === 'en'
                ? 'Ask AI to expand this plan'
                : language === 'kk'
                  ? 'ИИ-ден жоспарды кеңейтуді сұрау'
                  : 'Попросить ИИ расписать план'}
          </button>
          <p className="mt-2 text-center text-[11px] font-semibold leading-relaxed text-opora-text">
            {language === 'en'
              ? 'The answer will appear below in the clinician AI assistant.'
              : language === 'kk'
                ? 'Жауап төмендегі дәрігерге арналған ИИ көмекші бөлімінде пайда болады.'
                : 'Ответ появится ниже в блоке “ИИ-помощник врача”.'}
          </p>
        </section>

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">{ui.progressTitle}</p>
              <h2 className="text-base font-extrabold text-opora-navy">{activeChild?.childName}</h2>
            </div>
            <Activity size={20} className="text-opora-sage" />
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-extrabold text-opora-navy">{ui.childProgress}</p>
              <div className="space-y-2">
                {childProgress.length ? childProgress.map(entry => (
                  <div key={entry.id} className="rounded-xl bg-opora-sand/60 p-3">
                    <p className="text-xs font-bold text-opora-sage">{new Date(entry.date).toLocaleDateString()} · {entry.type}</p>
                    <p className="mt-1 text-sm font-bold text-opora-navy">{entry.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-opora-text">{entry.details}</p>
                  </div>
                )) : (
                  <p className="rounded-xl bg-opora-sand/60 p-3 text-xs text-opora-text">{ui.noProgress}</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-extrabold text-opora-navy">{ui.parentProgress}</p>
              <div className="space-y-2">
                {parentProgress.length ? parentProgress.map(entry => (
                  <div key={entry.id} className="rounded-xl bg-opora-sand/60 p-3">
                    <p className="text-xs font-bold text-opora-sage">{new Date(entry.date).toLocaleDateString()} · burnout {entry.burnoutScore}/10</p>
                    <p className="mt-1 text-sm font-bold text-opora-navy">{entry.moodOption}</p>
                    {entry.difficulties && <p className="mt-1 text-xs leading-relaxed text-opora-text">{entry.difficulties}</p>}
                  </div>
                )) : (
                  <p className="rounded-xl bg-opora-sand/60 p-3 text-xs text-opora-text">{ui.noProgress}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section ref={assistantSectionRef} className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Brain size={18} className="text-opora-sage" />
            <h2 className="text-base font-extrabold text-opora-navy">{ui.assistant}</h2>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-2">
            {ui.quickQuestions.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => handleSend(item)}
                className="rounded-xl border border-black/5 bg-opora-sand/60 px-3 py-2 text-left text-xs font-semibold leading-snug text-opora-navy transition-all active:scale-[0.99]"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-xl border border-black/5 bg-opora-sand/35 p-3">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm leading-relaxed',
                  message.role === 'user' ? 'ml-8 bg-opora-navy text-white' : 'mr-4 bg-white text-opora-navy'
                )}
              >
                {message.role === 'assistant' ? <Markdown>{message.content}</Markdown> : message.content}
              </div>
            ))}
            {isLoading && (
              <div className="mr-4 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-opora-sage">{ui.loading}</div>
            )}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder={ui.placeholder}
              className="min-h-[48px] flex-1 resize-none rounded-2xl border border-black/5 bg-white px-3 py-3 text-sm font-medium text-opora-navy outline-none"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!question.trim() || isLoading}
              className="rounded-2xl bg-opora-navy p-3 text-white disabled:opacity-45"
            >
              <Send size={18} />
            </button>
          </div>
        </section>
          </>
        ) : (
          <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex gap-3">
              <LockKeyhole size={20} className="mt-0.5 shrink-0 text-opora-sage" />
              <div>
                <h2 className="text-base font-extrabold text-opora-navy">Документация закрыта</h2>
                <p className="mt-1 text-xs leading-relaxed text-opora-text">
                  До подтверждения родителем врач видит только входящий запрос и данные для первой консультации. После подтверждения откроются сенсорный паспорт, прогресс ребенка, ресурс мамы, возраст, карточка приема и ИИ-помощник по документам.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">{ui.evidence}</p>
              <h2 className="text-base font-extrabold text-opora-navy">{ui.evidenceTitle}</h2>
            </div>
            <Database size={20} className="text-opora-sage" />
          </div>

          <div className="space-y-2">
            {evidence.treatmentApproaches.map(item => (
              <a
                key={item.id}
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-black/5 bg-opora-sand/60 p-3"
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-opora-navy">
                  <ClipboardList size={15} className="text-opora-sage" /> {item.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-opora-text">{item.summary}</span>
              </a>
            ))}
            {evidence.clinicalTrials.map(item => (
              <a
                key={item.id}
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-opora-sage/20 bg-opora-sage/10 p-3"
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-opora-navy">
                  <Activity size={15} className="text-opora-sage" /> {item.id} · {item.status}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-opora-text">{item.title}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="opora-doctor-card rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex gap-3">
            <FileText size={18} className="mt-0.5 shrink-0 text-opora-sage" />
            <p className="text-xs leading-relaxed text-opora-text">
              {ui.disclaimer}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

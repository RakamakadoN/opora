import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, CheckCircle2, Circle, ArrowRight, BookOpen, Quote, Bookmark, X, Sparkles, ClipboardCheck, FileText, Info, Bell, BellRing, Settings2, Clock, Volume2, Heart, ChevronLeft, ChevronRight, ChevronDown, HelpCircle, Printer, Share2, ShieldAlert, VolumeX, Phone, Activity, Smile, Send } from 'lucide-react';
import { useProfile, ARTICLES_DATABASE, DiagnosticStatus, type MessageTemplate, type ParentTask, type VisitCardDraft } from '../context/ProfileContext';
import Markdown from 'react-markdown';
import { SciencePulse } from './SciencePulse';
import { BureaucracyHelperScreen } from './BureaucracyHelperScreen';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import {
  calculateBureaucracyProgress,
  getBureaucracyChecklist,
  getNearestDeadline,
  parseStoredBureaucracyState,
  type BureaucracyDeadline
} from '../lib/disabilityBureaucracy';


const STAGES = [
  { 
    id: 1, 
    title: 'Только узнали', 
    desc: 'Первые шаги после диагноза или первых подозрений. Как справиться с тревожностью и куда бежать за помощью.', 
    matchingStatus: "Только подозреваем",
    articleIds: ["red_flags"]
  },
  { 
    id: 2, 
    title: 'Диагностика', 
    desc: 'Какие обследования действительно необходимы, а какие нет. Поиск доказательных врачей.', 
    matchingStatus: "В процессе диагностики",
    articleIds: ["red_flags", "rights_kz", "disability_docs_flashcards"]
  },
  { 
    id: 3, 
    title: 'Адаптация', 
    desc: 'Выстраиваем безопасную, предсказуемую домашнюю среду для ребенка. Сенсорная разгрузка.', 
    matchingStatus: "Диагноз подтвержден",
    articleIds: ["sensory_integration"]
  },
  { 
    id: 4, 
    title: 'Терапия', 
    desc: 'Разница между ABA, логопедами, дефектологами и ЛФК. Как выбрать терапевта.', 
    matchingStatus: "Проходим адаптацию и подбор терапии",
    articleIds: ["aba_guide", "latest_research"]
  },
  { 
    id: 5, 
    title: 'Социум', 
    desc: 'Подготовка к садику, инклюзивным классам или школе. Социализация и права семьи.', 
    matchingStatus: "Социализация и школа", // fallback/future
    articleIds: ["rights_kz", "disability_docs_flashcards", "preschool_queue_quiz"]
  },
];

function generateLastWeek() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

const formatDate = (d: Date) => {
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDayOfWeek = (d: Date) => {
   const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
   return days[d.getDay()];
};

const THERAPY_TYPES = [
  { id: 'aba', label: 'ABA', dotClass: 'bg-opora-navy', activeClass: 'bg-opora-navy text-white text-[10px]' },
  { id: 'speech', label: 'Логопед', dotClass: 'bg-opora-sage', activeClass: 'bg-opora-sage text-white text-[10px]' },
  { id: 'sensory', label: 'Сенсорика', dotClass: 'bg-opora-peach', activeClass: 'bg-opora-peach text-opora-navy text-[10px]' },
];

const RUSSIAN_ASD_PODCASTS = [
  {
    id: 'vasia-in-space',
    title: 'Vasia in space',
    source: 'Apple Podcasts',
    tone: 'родительский опыт',
    duration: 'серия выпусков',
    summary: 'Подкаст родителей, которые рассказывают о жизни семьи, где у ребенка РАС: быт, принятие, усталость и маленькие победы.',
    bestFor: 'Когда хочется услышать не лекцию, а живой голос родителей.',
    url: 'https://podcasts.apple.com/ru/podcast/vasia-in-space/id1588576715',
    audioTitle: 'Трейлер Vasia in space',
    audioUrl: 'https://api.mave.digital/storage/podcasts/836d4a7d-0c64-417f-ad50-a6ba7f2aa315/episodes/f560707d-030e-414f-acf1-16e81879af22.mp3'
  },
  {
    id: 'autism-regions',
    title: 'Аутизм Регионы',
    source: 'MyBook',
    tone: 'НКО и маршруты помощи',
    duration: 'серия выпусков',
    summary: 'Ассоциация «Аутизм-Регионы» говорит о родителях, НКО, ресурсных классах, мастерских и качестве жизни людей с РАС.',
    bestFor: 'Когда семье нужен системный взгляд: права, проекты, сообщества, организация помощи.',
    url: 'https://mybook.ru/series/autizm-regiony/'
  },
  {
    id: 'mir-naoborot',
    title: 'Мир наоборот',
    source: 'Podtail',
    tone: 'инклюзия и голос людей с РАС',
    duration: 'серия выпусков',
    summary: 'Инклюзивный подкаст с разговорами о РАС, адаптивном спорте, буллинге, творчестве и жизни аутичных людей.',
    bestFor: 'Когда важно услышать не только специалистов, но и самих людей с особенностями.',
    url: 'https://podtail.com/podcast/a28a6238/'
  },
  {
    id: 'vse-ne-kak-vse',
    title: 'Все не как все: быть родителем ребенка с аутизмом',
    source: 'RED BARN',
    tone: 'бережный разговор',
    duration: 'эпизод',
    summary: 'Выпуск о том, что чувствуют родители детей с РАС, какая поддержка нужна семье и как она справляется.',
    bestFor: 'Для первого прослушивания после диагноза или в период усталости.',
    url: 'https://redbarn.ru/audio/byt-roditelem-rebenka-s-autizmom-kakovo-eto/'
  },
  {
    id: 'tolk-parent-daily',
    title: 'У ребенка аутизм. С чем сталкиваются родители каждый день',
    source: 'КИОН Строки',
    tone: 'принятие и страхи',
    duration: 'эпизод',
    summary: 'Разговор о повседневных трудностях родителей ребенка с РАС, принятии новых обстоятельств и страхах семьи.',
    bestFor: 'Когда родителю нужно почувствовать, что его переживания нормальны.',
    url: 'https://stroki.mts.ru/podcast/episode/u-rebenka-autizm-s-chem-stalkivayutsya-yego-roditeli-kazhdiy-den-274862'
  },
  {
    id: 'ya-bolshe-asd-adhd',
    title: 'Аутизм и СДВГ: жизнь с осознанностью',
    source: 'Я больше!',
    tone: 'нейроотличия взрослого опыта',
    duration: 'эпизод',
    summary: 'Выпуск о РАС и СДВГ через призму осознанности и личного опыта.',
    bestFor: 'Для родителей подростков и взрослых, которым важно шире понимать нейроотличия.',
    url: 'https://imore.mave.digital/ep-10'
  }
];

type PodcastEpisode = {
  id: string;
  title: string;
  summary: string;
  link: string;
  audioUrl: string;
  publishedAt: string;
  duration?: string;
};

interface PMPKDoc {
  id: string;
  title: string;
  desc: string;
  required: boolean;
}

const PMPK_DOCUMENTS_BY_STATUS: Record<DiagnosticStatus, { title: string; subtitle: string; docs: PMPKDoc[] }> = {
  "Только подозреваем": {
    title: "Первичное ПМПК (подозрения)",
    subtitle: "Для семей на этапе первых шагов и подозрений. Важно зафиксировать базовый статус ребенка для назначения ранней помощи.",
    docs: [
      { id: "birth_cert", title: "Свидетельство о рождении ребенка", desc: "Оригинал + копия для личного дела", required: true },
      { id: "parent_id", title: "Удостоверение личности родителя / опекуна", desc: "Оригинал + копия лица, проходящего комиссию совместно с ребенком", required: true },
      { id: "pediatrician_027", title: "Заключение педиатра (Форма 027/у)", desc: "Выписка из медицинской карты амбулаторного больного о состоянии здоровья", required: true },
      { id: "psych_ped_feedback", title: "Психолого-педагогическая характеристика", desc: "Из яслей, детского сада или развивающего центра, если ребенок их посещает", required: false },
    ]
  },
  "В процессе диагностики": {
    title: "Сбор досье для комиссии ПМПК",
    subtitle: "Для прохождения детальной комиссии ПМПК с целью постановки официального диагноза и разработки первой программы.",
    docs: [
      { id: "birth_cert_iin", title: "Свидетельство о рождении ребенка + ИИН", desc: "Подготовьте копию с четко читаемым ИИН ребенка", required: true },
      { id: "parent_id", title: "Удостоверение личности родителя", desc: "Оригинал + копия. Кто-то из родителей обязан лично сопровождать ребенка", required: true },
      { id: "ambulatory_112", title: "История развития ребенка (Форма 112/у)", desc: "Амбулаторная карта ребенка из поликлиники по месту жительства", required: true },
      { id: "narrow_conclusions", title: "Заключения узких специалистов", desc: "Детский психиатр, невропатолог, офтальмолог, а также ЛОР-врач (для подтверждения сохранности слуха обязательно!)", required: true },
      { id: "vaccination_063", title: "Карта профилактических прививок (Форма 063/у)", desc: "Копия карты прививок, если имеются противопоказания или медотвод — заключение ВКК", required: false }
    ]
  },
  "Диагноз подтвержден": {
    title: "Оформление программы ПМПК",
    subtitle: "Для назначения бесплатных коррекционных часов социального характера (ABA, логопед, дефектолог, ЛФК, коррекционный сад).",
    docs: [
      { id: "disability_cert", title: "Справка об инвалидности", desc: "Если оформлена инвалидность — копия и оригинал справки МСЭ нарушений", required: false },
      { id: "psychiatrist_mkb10", title: "Заключение лечащего психиатра", desc: "Подробная выписка из истории болезни с кодированием по МКБ-10 (F84.0, F84.1 и др.)", required: true },
      { id: "pmpk_previous", title: "Предыдущее заключение ПМПК", desc: "Если проходили комиссию ранее — оригинал предыдущего заключения для оценки динамики", required: false },
      { id: "development_recs", title: "Заключение дефектолога / ABA-специалиста", desc: "Оценка текущего уровня навыков из частного центра, если в данный момент занимаетесь", required: false }
    ]
  },
  "Проходим адаптацию и подбор терапии": {
    title: "Продление и корректировка ПМПК",
    subtitle: "Для повторной комиссии, корректировки часов или изменения образовательного маршрута (инклюзия, ассистент-тьютор).",
    docs: [
      { id: "school_report", title: "Характеристика из детского сада / школы", desc: "Психолого-педагогическая характеристика, заверенная печатью учреждения", required: true },
      { id: "child_works", title: "Примеры работ ребенка (тетради, рисунки)", desc: "Трафареты, прописи, рисунки или поделки для демонстрации мелкой моторики и когнитивных навыков", required: false },
      { id: "aba_log_progress", title: "Динамический отчет от текущих терапевтов", desc: "Логопедическое представление и отчет ABA-терапевта за последние 3-6 месяцев", required: false },
      { id: "medical_form_027", title: "Обновленная форма 027/у и заключение ВКК", desc: "При наличии изменений в соматическом здоровье или у узких врачей", required: true }
    ]
  }
};

const WARM_TIPS_BY_STATUS: Record<DiagnosticStatus, string[]> = {
  "Только подозреваем": [
    "Ваша тревога сейчас естественна, но помните: вы уже помогаете ребенку тем, что ищете ответы. Сделайте глубокий вдох.",
    "Вы любящий и внимательный родитель. Ваша интуиция — это главный компас на этом пути. Доверяйте ей.",
    "Не пытайтесь прочесть всё и сразу. Сегодня сфокусируйтесь на одной простой игре или бережном обнимании с ребенком.",
    "Вы не одиноки. В Казахстане тысячи семей проходили через этот этап растерянности. Ваша сила растет с каждым днем.",
    "Позвольте себе отдохнуть. Уставший родитель не может быть надежным контейнером эмоций. Начните сегодня с чашки чая в полной тишине."
  ],
  "В процессе диагностики": [
    "Диагностика — это только поиск карты, а не приговор. Маршрут скоро прояснится, и вы увидите четкие ориентиры.",
    "Записывайте вопросы врачам заранее в блокнот. Во время приемов эмоции могут мешать вспомнить важное.",
    "Ребенок остается тем же замечательным малышом со своими теплыми улыбками, какими бы медицинскими терминами его ни описывали.",
    "Помните о балансе: кроме обследований, должно быть время для привычных радостей — мыльных пузырей или игры.",
    "Мнение одного врача — это не истина в последней инстанции. Спокойно собирайте 'второе мнение' у проверенных экспертов."
  ],
  "Диагноз подтвержден": [
    "Официальный диагноз — это лишь ключ к получению господдержки и бесплатных коррекционных часов ПМПК, а не потолок развития.",
    "Горевать, плакать или злиться — это нормальные этапы принятия диагноза. Не ругайте себя за тяжелые мысли.",
    "Теперь у вас есть ясность. Сфокусируйтесь на сильных сторонах ребенка — именно на них будет строиться обучение.",
    "Начните с малого: 15 минут качественных занятий дома в игровой форме эффективнее, чем утомление ребенка часами.",
    "Каждый шаг вперед, пусть даже крошечный — это огромная победа. Медленный прогресс — это тоже надежный прогресс."
  ],
  "Проходим адаптацию и подбор терапии": [
    "Адаптация к регулярным занятиям требует времени. Если в первые недели ребенок протестует — это естественная реакция.",
    "Хвалите ребенка за малейшее сотрудничество во время занятий. Игровая мотивация на старте важнее академических результатов.",
    "Терапия — это бережный марафон, а не спринт. Распределяйте свои силы экономно, планируйте дни без упоминания диагнозов.",
    "Качественная ABA-терапия всегда строится на уважении и согласии ребенка, без принуждения и бережно.",
    "Доверяйте своим терапевтам, но оставайтесь главным защитником ребенка. Вы лучше всех чувствуете его эмоциональное состояние."
  ]
};

const CRISIS_GUIDELINES = [
  {
    id: 'meltdown',
    title: '🔥 Истерика (мелтдаун) прямо сейчас',
    subtitle: 'Когда нервная система ребенка перегружена до предела',
    steps: [
      '**Не пытайтесь воспитывать или наказывать:** Во время мелтдауна ребенок физиологически теряет способность слышать разумные аргументы.',
      '**Снизьте сенсорный приток:** Выключите яркий свет, выключите телевизор, закройте окна от уличного шума.',
      '**Обеспечьте пространство:** Попросите посторонних отойти. Не прикасайтесь к ребенку насильно, если это не требуется для безопасности.',
      '**Будьте предсказуемым якорем:** Говорите очень тихим, мягким и ровным голосом. Используйте минимум слов (например: «Я рядом. Ты в безопасности»).'
    ]
  },
  {
    id: 'selfharm',
    title: '⚠️ Самоповреждающее поведение',
    subtitle: 'Бьется головой, кусает себя или царапает',
    steps: [
      '**Физическая защита на первом месте:** Подложите мягкую подушку, свернутое одеяло или свою ладонь под место удара. Не боритесь с ребенком.',
      '**Глубокое сенсорное давление (если любит):** Мягко, но крепко обнимите ребенка со спины («принцип кокона»), если тактильный контакт помогает ему успокоиться.',
      '**Переключение внимания через сенсорику:** Предложите сжать любимый резиновый эспандер или подергать эластичную игрушку-тянучку.',
      '**Создайте тихий барьер:** Исключите любые крики со своей стороны. Ваше физическое хладнокровие — его главный регулятор.'
    ]
  },
  {
    id: 'public_overload',
    title: '🏢 Перегрузка в общественном месте (ТЦ, самолет)',
    subtitle: 'Когда вокруг много людей и осуждающих взглядов',
    steps: [
      '**Срочно уйдите в тихое место:** Направляйтесь в туалет для людей с инвалидностью, в пустую примерочную, тихий коридор или вашу машину.',
      '**Сенсорная изоляция:** Наденьте на ребенка шумоподавляющие наушники или натяните капюшон поглубже, чтобы ограничить поле зрения.',
      '**Используйте социальный скрипт:** Покажите прохожим или администрации экран «Помощь прохожих» из соседней вкладки (кнопка в Быстром поиске).',
      '**Игнорируйте советчиков:** Здоровье вашего ребенка и ваш покой сейчас важнее чужого мнения. Дышите.'
    ]
  },
  {
    id: 'parent_panic',
    title: '🧡 Я больше не могу (паника у родителя)',
    subtitle: 'Как вернуть самообладание за 60 секунд',
    steps: [
      '**Помните о правиле самосострадания:** Вы замечательный родитель. Вы проходите тяжелейший стресс, чувствовать злость или бессилие — это нормально.',
      '**Заземлитесь физически:** Почувствуйте стопами пол. Умойте лицо ледяной водой или подержите ладони под холодной струей 15 секунд.',
      '**Используйте дыхательный круг:** Дышите вместе с пульсирующим кругом вверху этого экрана. 4 секунды вдох — 4 задержка — 4 выдох.',
      '**Дайте себе перерыв:** Если ребенок в физической безопасности в комнате, выйдите в ванную на 3-5 минут. Сначала кислородную маску на себя.'
    ]
  }
];

export function NavigatorTab({
  onChangeTab,
  onOpenDirectoryRecommendations
}: {
  onChangeTab?: (tab: 'navigator' | 'ai' | 'directory' | 'community' | 'profile' | 'doctor') => void;
  onOpenDirectoryRecommendations?: () => void;
}) {
  const { 
    profile, 
    savedArticles, 
    toggleSaveArticle, 
    readArticles, 
    toggleReadArticle, 
    updateProfile,
    diaryEntries,
    addDiaryEntry,
    therapySessions,
    toggleTherapySession,
    medicalBookings,
    progressEntries,
    addProgressEntry,
    parentTasks,
    toggleParentTask,
    getRecommendedTasksForProfile,
    messageTemplates,
    renderTemplate,
    visitCards,
    createVisitCardFromBooking,
    createVisitCardForChild,
    doctorCareRequests,
    parentConfirmDoctorAccess,
    declineDoctorCareRequest
  } = useProfile();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [celebratedStage, setCelebratedStage] = useState<{ id: number; title: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'schedule' | 'pmpk' | 'route' | 'science' | 'friendly' | 'podcasts'>('all');
  const [activeVisitCard, setActiveVisitCard] = useState<VisitCardDraft | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<MessageTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState('');
  const [quickObservationType, setQuickObservationType] = useState<'success' | 'trigger' | 'routine' | 'note'>('note');
  const [quickObservationNote, setQuickObservationNote] = useState('');
  const [navigatorSubscreen, setNavigatorSubscreen] = useState<'main' | 'bureaucracy'>('main');
  const [softScreeningDone, setSoftScreeningDone] = useState<boolean>(() => {
    const saved = localStorage.getItem(`opora_soft_screening_done_${profile.id}`);
    return saved === 'true';
  });
  
  // Режим состояния
  const [stateMode, setStateMode] = useState<'normal' | 'panic' | 'urgent'>('normal');
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);
  const [activeAudioType, setActiveAudioType] = useState<'none' | 'brown' | 'heart' | 'rain'>('none');
  const [activePodcastId, setActivePodcastId] = useState<string | null>(null);
  const [podcastPlayerNote, setPodcastPlayerNote] = useState('');
  const [favoritePodcastIds, setFavoritePodcastIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('opora_favorite_podcasts');
    return saved ? JSON.parse(saved) : [];
  });
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [podcastEpisodes, setPodcastEpisodes] = useState<Record<string, PodcastEpisode[]>>({});
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioSourceRef = React.useRef<any>(null);
  const podcastAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [crisisQuery, setCrisisQuery] = useState('');
  const [crisisAiReply, setCrisisAiReply] = useState('');
  const [isCrisisAiTyping, setIsCrisisAiTyping] = useState(false);
  const [expandedCrisisTip, setExpandedCrisisTip] = useState<string | null>(null);
  const [isSocialCardFullScreen, setIsSocialCardFullScreen] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem(`opora_soft_screening_done_${profile.id}`);
    setSoftScreeningDone(saved === 'true');
  }, [profile.id]);

  // Audio actions
  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        if (typeof audioSourceRef.current.stop === 'function') {
          audioSourceRef.current.stop();
        } else if (typeof audioSourceRef.current.disconnect === 'function') {
          audioSourceRef.current.disconnect();
        }
      } catch (e) {
        console.warn('Audio stop failed', e);
      }
      audioSourceRef.current = null;
    }
    setActiveAudioType('none');
  };

  const stopPodcast = () => {
    if (podcastAudioRef.current) {
      podcastAudioRef.current.pause();
      podcastAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActivePodcastId(null);
    setPodcastCurrentTime(0);
    setPodcastDuration(0);
  };

  const playPodcast = (podcast: typeof RUSSIAN_ASD_PODCASTS[number]) => {
    if (activePodcastId === podcast.id) {
      stopPodcast();
      setPodcastPlayerNote('');
      return;
    }

    stopPodcast();
    stopAudio();

    if ('audioUrl' in podcast && podcast.audioUrl) {
      const audio = new Audio(podcast.audioUrl);
      podcastAudioRef.current = audio;
      setActivePodcastId(podcast.id);
      setPodcastPlayerNote(`Играет: ${'audioTitle' in podcast ? podcast.audioTitle : podcast.title}`);
      audio.addEventListener('loadedmetadata', () => setPodcastDuration(audio.duration || 0));
      audio.addEventListener('timeupdate', () => {
        setPodcastCurrentTime(audio.currentTime || 0);
        setPodcastDuration(audio.duration || 0);
      });
      audio.addEventListener('ended', () => {
        setActivePodcastId(null);
        setPodcastPlayerNote('');
        setPodcastCurrentTime(0);
        setPodcastDuration(0);
      });
      audio.addEventListener('error', () => {
        setActivePodcastId(null);
        setPodcastPlayerNote('Не удалось загрузить аудио. Откройте выпуск на площадке.');
      });
      audio.play().catch(() => {
        setActivePodcastId(null);
        setPodcastPlayerNote('Браузер не разрешил воспроизведение. Нажмите еще раз или откройте выпуск.');
      });
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`${podcast.title}. ${podcast.summary} ${podcast.bestFor}`);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.95;
      utterance.onend = () => {
        setActivePodcastId(null);
        setPodcastPlayerNote('');
      };
      setActivePodcastId(podcast.id);
      setPodcastPlayerNote(`Озвучиваю обзор: ${podcast.title}`);
      window.speechSynthesis.speak(utterance);
      return;
    }

    setPodcastPlayerNote('В этом браузере нет встроенного озвучивания. Откройте выпуск на площадке.');
  };

  const playPodcastEpisode = (podcast: typeof RUSSIAN_ASD_PODCASTS[number], episode: PodcastEpisode) => {
    const playbackId = `${podcast.id}:${episode.id}`;
    if (activePodcastId === playbackId) {
      stopPodcast();
      setPodcastPlayerNote('');
      return;
    }

    stopPodcast();
    stopAudio();

    const audio = new Audio(episode.audioUrl);
    podcastAudioRef.current = audio;
    setActivePodcastId(playbackId);
    setPodcastPlayerNote(`Играет: ${episode.title}`);
    audio.addEventListener('loadedmetadata', () => setPodcastDuration(audio.duration || 0));
    audio.addEventListener('timeupdate', () => {
      setPodcastCurrentTime(audio.currentTime || 0);
      setPodcastDuration(audio.duration || 0);
    });
    audio.addEventListener('ended', () => {
      setActivePodcastId(null);
      setPodcastPlayerNote('');
      setPodcastCurrentTime(0);
      setPodcastDuration(0);
    });
    audio.addEventListener('error', () => {
      setActivePodcastId(null);
      setPodcastPlayerNote('Не удалось загрузить выпуск из RSS. Откройте источник.');
    });
    audio.play().catch(() => {
      setActivePodcastId(null);
      setPodcastPlayerNote('Браузер не разрешил воспроизведение. Нажмите еще раз.');
    });
  };

  React.useEffect(() => {
    localStorage.setItem('opora_favorite_podcasts', JSON.stringify(favoritePodcastIds));
  }, [favoritePodcastIds]);

  React.useEffect(() => {
    if (activeCategory !== 'podcasts') return;
    let cancelled = false;
    setIsPodcastLoading(true);
    fetch('/api/podcasts/ru')
      .then(response => response.json())
      .then(data => {
        if (!cancelled) setPodcastEpisodes(data.feeds || {});
      })
      .catch(() => {
        if (!cancelled) setPodcastEpisodes({});
      })
      .finally(() => {
        if (!cancelled) setIsPodcastLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const toggleFavoritePodcast = (podcastId: string) => {
    setFavoritePodcastIds(prev => prev.includes(podcastId)
      ? prev.filter(id => id !== podcastId)
      : [podcastId, ...prev]
    );
  };

  const openPodcastExternal = (url: string) => {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = url;
    }
  };

  const seekPodcast = (seconds: number) => {
    if (!podcastAudioRef.current) return;
    const nextTime = Math.min(Math.max(podcastAudioRef.current.currentTime + seconds, 0), podcastAudioRef.current.duration || Infinity);
    podcastAudioRef.current.currentTime = nextTime;
    setPodcastCurrentTime(nextTime);
  };

  const formatPodcastTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const playAudio = (type: 'brown' | 'heart' | 'rain') => {
    stopAudio();
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'brown') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // boost
        }
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        
        source.connect(filter);
        filter.connect(ctx.destination);
        source.start();
        audioSourceRef.current = source;
        setActiveAudioType('brown');
      } else if (type === 'rain') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(0.7, ctx.currentTime);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        audioSourceRef.current = source;
        setActiveAudioType('rain');
      } else if (type === 'heart') {
        const intervalId = setInterval(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(55, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.28);
            
            gain.gain.setValueAtTime(0.75, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.28);
            
            setTimeout(() => {
              try {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                
                osc2.frequency.setValueAtTime(50, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.24);
                
                gain2.gain.setValueAtTime(0.55, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
                
                osc2.start();
                osc2.stop(ctx.currentTime + 0.24);
              } catch (e) {}
            }, 180);
          } catch (e) {}
        }, 1100);
        
        audioSourceRef.current = { stop: () => clearInterval(intervalId) };
        setActiveAudioType('heart');
      }
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  React.useEffect(() => {
    if (stateMode !== 'panic') {
      stopAudio();
    }
  }, [stateMode]);

  React.useEffect(() => {
    if (stateMode !== 'panic') return;
    
    setBreathPhaseIndex(0);
    const interval = setInterval(() => {
      setBreathPhaseIndex(prev => (prev + 1) % 4);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [stateMode]);

  const askCrisisAi = async (customPrompt?: string) => {
    const promptToSend = customPrompt || crisisQuery;
    if (!promptToSend.trim()) return;
    
    setIsCrisisAiTyping(true);
    setCrisisAiReply('');
    
    const crisisMessages = [
      {
        role: 'user',
        content: `ЭКСТРЕННЫЙ ВОПРОС РОДИТЕЛЯ В РЕЖИМЕ ТРЕВОГИ: "${promptToSend}". Ответь максимально лаконично, структурированно по шагам (буллетами), бережно и спокойно. Дай только прямые действия и практический совет без длинных вступлений. Напомни, что ты ИИ и не заменяешь скорую помощь при угрозе здоровью.`
      }
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: crisisMessages,
          profile: profile
        }),
      });

      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setCrisisAiReply(data.reply);
    } catch (e) {
      console.error(e);
      setCrisisAiReply('Извините, сейчас не удалось связаться с облаком ИИ. Вот главный совет: обеспечьте безопасность ребенка от травм, уменьшите сенсорные раздражители (выключите свет/звуки), будьте рядом теплым спокойным присутствием. Это состояние обязательно пройдет.');
    } finally {
      setIsCrisisAiTyping(false);
    }
  };

  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, number[]>>(() => {
    const saved = localStorage.getItem(`opora_weekly_schedule_${profile.id}`);
    return saved ? JSON.parse(saved) : {
      aba: [1, 3, 5],       // Mon, Wed, Fri
      speech: [2, 4],       // Tue, Thu
      sensory: [2, 6]       // Tue, Sat
    };
  });

  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'simulated'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
    }
    const saved = localStorage.getItem(`opora_push_simulated_${profile.id}`);
    return saved === 'true' ? 'simulated' : 'default';
  });

  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [sessionTimes, setSessionTimes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`opora_session_times_${profile.id}`);
    return saved ? JSON.parse(saved) : {
      aba: '11:00',
      speech: '14:30',
      sensory: '16:00'
    };
  });

  const [showPushToast, setShowPushToast] = useState(false);
  const [pushToastContent, setPushToastContent] = useState('');

  const triggerPushNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.error('Push notification block:', e);
      }
    }
    setPushToastContent(`${title}: ${body}`);
    setShowPushToast(true);
    setTimeout(() => {
      setShowPushToast(false);
    }, 5000);
  };

  const handleTogglePushPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setPushStatus('granted');
          triggerPushNotification(
            "🔔 Напоминания включены", 
            `Опора бережно скоординирует сегодняшний график для ребенка!`
          );
        } else {
          setPushStatus('denied');
          triggerPushNotification(
            "🧡 Внутренний радар вкл.", 
            "Системные пуши недоступны. Опора будет выводить напоминания внутри панели приложения!"
          );
        }
      });
    } else {
      const nextStatus = pushStatus === 'simulated' ? 'default' : 'simulated';
      setPushStatus(nextStatus);
      localStorage.setItem(`opora_push_simulated_${profile.id}`, nextStatus === 'simulated' ? 'true' : 'false');
      if (nextStatus === 'simulated') {
        triggerPushNotification(
          "🔔 Симуляция уведомлений", 
          `Будем согревать напоминаниями прямо на главном экране Опоры!`
        );
      }
    }
  };

  const handleDayToggle = (therapyId: string, dayNum: number) => {
    const currentDays = weeklySchedule[therapyId] || [];
    const updatedDays = currentDays.includes(dayNum)
      ? currentDays.filter(d => d !== dayNum)
      : [...currentDays, dayNum].sort();
    
    const updated = {
      ...weeklySchedule,
      [therapyId]: updatedDays
    };
    setWeeklySchedule(updated);
    localStorage.setItem(`opora_weekly_schedule_${profile.id}`, JSON.stringify(updated));
  };

  const handleTimeChange = (therapyId: string, newTime: string) => {
    const updated = {
      ...sessionTimes,
      [therapyId]: newTime
    };
    setSessionTimes(updated);
    localStorage.setItem(`opora_session_times_${profile.id}`, JSON.stringify(updated));
  };

  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`opora_pmpk_docs_checked_${profile.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  React.useEffect(() => {
    const saved = localStorage.getItem(`opora_pmpk_docs_checked_${profile.id}`);
    setCheckedDocs(saved ? JSON.parse(saved) : {});
  }, [profile.id]);

  const toggleDocChecked = (docId: string) => {
    const updated = {
      ...checkedDocs,
      [docId]: !checkedDocs[docId]
    };
    setCheckedDocs(updated);
    localStorage.setItem(`opora_pmpk_docs_checked_${profile.id}`, JSON.stringify(updated));
  };

  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  React.useEffect(() => {
    setCurrentTipIndex(0);
  }, [profile.id, profile.diagnosticStatus]);

  const handleNextTip = (maxCount: number) => {
    setCurrentTipIndex(prev => (prev + 1) % maxCount);
  };

  const handlePrevTip = (maxCount: number) => {
    setCurrentTipIndex(prev => (prev - 1 + maxCount) % maxCount);
  };

  const handlePrintFaq = () => {
    const faqData = [
      {
        q: "Зачем нужно проходить ПМПК в Казахстане?",
        a: "ПМПК — это государственный «ключ» к бесплатной помощи. Только с этим заключением вашего ребенка смогут бесплатно принять в специальные детские сады, КППК (Кабинеты коррекции), реабилитационные центры, а также предоставить бесплатного ассистента (тьютора) в школе и специальные условия обучения."
      },
      {
        q: "Как записаться на комиссию и долго ли ждать очереди?",
        a: "Запись проходит онлайн через портал eGov.kz (услуга «Запись на прием в ПМПК») или при личном визите в региональное отделение. Очереди могут составлять от нескольких недель до 2-3 месяцев, поэтому рекомендуем бронировать дату заранее, параллельно собирая справки у педиатра."
      },
      {
        q: "Может ли ПМПК поставить окончательный диагноз?",
        a: "Нет, ПМПК дает исключительно педагогическое заключение, определяющее программу обучения ребенка. Окончательный медицинский диагноз в Казахстане имеет право устанавливать только детский врач-психиатр. Комиссия лишь подтверждает особые образовательные потребности."
      },
      {
        q: "Что происходит на самой комиссии? Стоит ли бояться?",
        a: "Бояться не стоит — это больше похоже на игру. Специалисты (логопед, дефектолог, психолог) в бережной форме понаблюдают, как ребенок собирает пирамидку, реагирует на просьбы, общается или использует жесты. Они оценивают уровень развития, чтобы подобрать подходящую программу."
      },
      {
        q: "Обязан ли я строго следовать рекомендациям ПМПК?",
        a: "Для родителей заключение ПМПК носит рекомендательный характер — вы полностью свободны выбирать, идти ли в предложенный спецсадик/класс или остаться дома. Однако для всех образовательных учреждений заключение является обязательным к исполнению: садик или школа обязаны создать все необходимые условия."
      },
      {
        q: "На какой срок выдается заключение и что делать дальше?",
        a: "Обычно заключение выдается на определенную возрастную ступень (например, дошкольный возраст до 6-7 лет) либо на 1 академический год для отслеживания динамики. По истечении этого срока или при переходе из детского сада в школу комиссию ПМПК проходят повторно."
      }
    ];

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Вопросы и ответы о ПМПК - Опора</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
            body { 
              font-family: 'Nunito', -apple-system, sans-serif; 
              padding: 40px; 
              color: #1C2B39; 
              line-height: 1.6;
              background: #fff;
            }
            .header { 
              border-bottom: 3px solid #81A18F; 
              padding-bottom: 16px; 
              margin-bottom: 32px; 
            }
            .title { 
              font-size: 24px; 
              font-weight: 700; 
              margin: 0; 
              color: #1C2B39;
            }
            .subtitle { 
              font-size: 13px; 
              color: #81A18F; 
              margin: 6px 0 0; 
              text-transform: uppercase; 
              letter-spacing: 1px;
              font-weight: 700; 
            }
            .faq-list {
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
            .faq-item { 
              page-break-inside: avoid; 
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 20px;
            }
            .faq-item:last-child {
              border-bottom: none;
            }
            .question { 
              font-size: 16px; 
              font-weight: 700; 
              color: #1C2B39; 
              margin-bottom: 10px; 
              display: flex;
              gap: 8px;
            }
            .answer { 
              font-size: 14.5px; 
              color: #4A4A48; 
              text-align: justify;
              padding-left: 24px;
            }
            .footer { 
              margin-top: 60px; 
              border-top: 1px solid #E2E8F0; 
              padding-top: 16px; 
              font-size: 12px; 
              color: #81A18F; 
              text-align: center; 
              font-weight: 600;
            }
            @media print {
              body { padding: 20px; }
              .footer { position: fixed; bottom: 0; left: 0; right: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Ответы на частые вопросы о ПМПК</h1>
            <p class="subtitle">База знаний семейного навигатора поддержки «Опора» (Казахстан)</p>
          </div>
          <div class="faq-list">
            ${faqData.map((item, idx) => `
              <div class="faq-item">
                <div class="question">
                  <span>${idx + 1}.</span>
                  <span>${item.q}</span>
                </div>
                <div class="answer">${item.a}</div>
              </div>
            `).join('')}
          </div>
          <div class="footer">
            Материал подготовлен службой поддержки семей «Опора» — opora.kz
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 300);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleShareFaq = async () => {
    const faqData = [
      {
        q: "Зачем нужно проходить ПМПК в Казахстане?",
        a: "ПМПК — это государственный «ключ» к бесплатной помощи. Только с этим заключением вашего ребенка смогут бесплатно принять в специальные детские сады, КППК (Кабинеты коррекции), реабилитационные центры, а также предоставить бесплатного ассистента (тьютора) в школе и специальные условия обучения."
      },
      {
        q: "Как записаться на комиссию и долго ли ждать очереди?",
        a: "Запись проходит онлайн через портал eGov.kz (услуга «Запись на прием в ПМПК») или при личном визите в региональное отделение. Очереди могут составлять от нескольких недель до 2-3 месяцев, поэтому рекомендуем бронировать дату заранее, параллельно собирая справки у педиатра."
      },
      {
        q: "Может ли ПМПК поставить окончательный диагноз?",
        a: "Нет, ПМПК дает исключительно педагогическое заключение, определяющее программу обучения ребенка. Окончательный медицинский диагноз в Казахстане имеет право устанавливать только детский врач-психиатр. Комиссия лишь подтверждает особые образовательные потребности."
      },
      {
        q: "Что происходит на самой комиссии? Стоит ли бояться?",
        a: "Бояться не стоит — это больше похоже на игру. Специалисты (логопед, дефектолог, психолог) в бережной форме понаблюдают, как ребенок собирает пирамидку, реагирует на просьбы, общается или использует жесты. Они оценивают уровень развития, чтобы подобрать подходящую программу."
      },
      {
        q: "Обязан ли я строго следовать рекомендациям ПМПК?",
        a: "Для родителей заключение ПМПК носит рекомендательный характер — вы полностью свободны выбирать, идти ли в предложенный спецсадик/класс или остаться дома. Однако для всех образовательных учреждений заключение является обязательным к исполнению: садик или школа обязаны создать все необходимые условия."
      },
      {
        q: "На какой срок выдается заключение и что делать дальше?",
        a: "Обычно заключение выдается на определенную возрастную ступень (например, дошкольный возраст до 6-7 лет) либо на 1 академический год для отслеживания динамики. По истечении этого срока или при переходе из детского сада в школу комиссию ПМПК проходят повторно."
      }
    ];

    const shareTitle = "Частые вопросы о ПМПК в Казахстане - Опора";
    const shareText = "Частые вопросы о ПМПК в Казахстане:\n\n" + 
      faqData.map((item, idx) => `${idx + 1}. ${item.q}\nОтвет: ${item.a}`).join("\n\n") + 
      "\n\nПодготовлено в приложении «Опора»";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        triggerPushNotification(
          "✨ Отправлено!", 
          "Вы поделились базой часто задаваемых вопросов о ПМПК."
        );
      } catch (err) {
        console.error("Ошибка при использовании Share API:", err);
        try {
          await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}`);
          triggerPushNotification(
            "📋 Скопировано!", 
            "Текст FAQ скопирован в буфер обмена для отправки в мессенджеры."
          );
        } catch (clipErr) {
          console.error("Clipboard failure", clipErr);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}`);
        triggerPushNotification(
          "📋 Скопировано!", 
          "База FAQ скопирована в буфер обмена."
        );
      } catch (clipErr) {
        console.error("Clipboard fallback failure", clipErr);
      }
    }
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerPushNotification("Скопировано", successMessage);
    } catch (error) {
      console.error("Clipboard failure", error);
    }
  };

  const shareText = async (title: string, text: string, successMessage: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        triggerPushNotification("Поделились", successMessage);
        return;
      } catch (error) {
        console.error("Share API failed", error);
      }
    }
    await copyText(text, successMessage);
  };

  const childProgress = progressEntries
    .filter(entry => entry.childId === profile.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const childDiaryEntries = diaryEntries
    .filter(entry => entry.childId === profile.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestSuccess = childProgress.find(entry => entry.type === 'success');
  const latestTrigger = childProgress.find(entry => entry.type === 'trigger');
  const latestRoutine = childProgress.find(entry => entry.type === 'routine');
  const recommendedTasks = getRecommendedTasksForProfile(profile);
  const openTasks = recommendedTasks.filter(task => task.status === 'todo');
  const parentQuestTasks = openTasks
    .filter(task => task.title.toLowerCase().includes('quest') || task.title.toLowerCase().includes('квест'))
    .slice(0, 4);
  const completedQuestTasks = recommendedTasks
    .filter(task => task.status === 'done')
    .filter(task => task.title.toLowerCase().includes('quest') || task.title.toLowerCase().includes('квест'));
  const questXp = completedQuestTasks.length * 10;
  const questsDoneToday = completedQuestTasks.filter(task => {
    if (!task.completedAt) return false;
    return new Date(task.completedAt).toDateString() === new Date().toDateString();
  }).length;

  const completeParentQuest = (task: ParentTask) => {
    toggleParentTask(task);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.72 },
      colors: ['#2A3C44', '#7D8C74', '#F4B9A7', '#D4A373']
    });
    triggerPushNotification(
      'Квест выполнен!',
      `Вы сделали маленький, но настоящий шаг для ${profile.childName}. Это очень ценно.`
    );
  };

  const upcomingBooking = medicalBookings
    .filter(booking => booking.childId === profile.id)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .find(booking => new Date(`${booking.date}T${booking.time}`).getTime() >= Date.now() - 3600000);

  const latestVisitCard = [...visitCards]
    .filter(card => card.childId === profile.id)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];

  const progressDateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

  const getTherapyLabel = (type: string) => THERAPY_TYPES.find(item => item.id === type)?.label || type;
  const getStatusGuidance = (status: DiagnosticStatus) => {
    switch (status) {
      case "Только подозреваем":
        return "Сегодня важнее всего спокойно фиксировать наблюдения и выбрать первого специалиста.";
      case "В процессе диагностики":
        return "Соберите бумаги и вопросы к врачу, чтобы не нести всё в голове в момент стресса.";
      case "Диагноз подтвержден":
        return "Сейчас самое полезное — сделать среду более предсказуемой и заполнить сенсорный паспорт.";
      case "Проходим адаптацию и подбор терапии":
        return "Держим ритм терапии, не перегружаем неделю и замечаем даже маленькие успехи.";
      default:
        return "Один спокойный шаг за раз тоже считается движением вперед.";
    }
  };

  const renderTemplateForProfile = (template: MessageTemplate) => renderTemplate(template.id, {
    childName: profile.childName,
    childAge: String(profile.childAge),
    diagnosticStatus: profile.diagnosticStatus,
    comfortTriggers: profile.sensoryPassport?.comfortTriggers || 'спокойный темп, минимум лишних слов и немного времени на адаптацию'
  }).trim();

  const openTemplatePreview = (template: MessageTemplate) => {
    setActiveTemplate(template);
    setTemplatePreview(renderTemplateForProfile(template));
  };

  const openVisitCard = () => {
    const card = upcomingBooking
      ? createVisitCardFromBooking(upcomingBooking.id)
      : createVisitCardForChild(profile.id);
    setActiveVisitCard(card);
  };

  const completeSoftScreening = () => {
    localStorage.setItem(`opora_soft_screening_done_${profile.id}`, 'true');
    setSoftScreeningDone(true);
    triggerPushNotification(
      'Скрининг сохранен',
      'Это не диагноз. Данные могут помочь специалисту при дальнейшем обследовании.'
    );
    openArticle('red_flags');
  };

  const saveQuickObservation = () => {
    const fallbackText = {
      success: 'Сегодня заметили небольшой успех.',
      trigger: 'Сегодня заметили ситуацию, где ребенку было сложно.',
      routine: 'Сегодня отметили важную деталь рутины.',
      note: 'Сегодня добавили короткое наблюдение.'
    }[quickObservationType];
    const text = quickObservationNote.trim() || fallbackText;
    addProgressEntry({
      childId: profile.id,
      type: quickObservationType,
      title: quickObservationType === 'success'
        ? 'Маленький успех'
        : quickObservationType === 'trigger'
          ? 'Возможный триггер'
          : quickObservationType === 'routine'
            ? 'Рутина дня'
            : 'Наблюдение за днем',
      details: text,
      tags: ['60 секунд'],
      energy: 3
    });
    addDiaryEntry(profile.id, text);
    setQuickObservationNote('');
    triggerPushNotification(
      'Наблюдение добавлено',
      'Вы спокойно зафиксировали факт. Это уже помогает будущему разговору со специалистом.'
    );
  };

  const visitCardText = (card: VisitCardDraft) => {
    return [
      card.title,
      '',
      card.summary,
      '',
      'Что важно учитывать:',
      ...card.sensoryNotes.map(note => `- ${note}`),
      '',
      'Как общаться:',
      ...card.communicationNotes.map(note => `- ${note}`),
      '',
      'Что может помочь после приема:',
      ...(card.rewardNotes.length ? card.rewardNotes.map(note => `- ${note}`) : ['- Спокойное завершение и короткая пауза']),
      '',
      'Просьба родителя:',
      card.parentRequest
    ].join('\n');
  };

  const openArticle = (id: string) => {
    setSelectedArticleId(id);
    if (!readArticles.includes(id)) {
      toggleReadArticle(id);
    }
  };

  const handleCompleteStage = (currentStageId: number) => {
    const statusMap: Record<number, DiagnosticStatus> = {
      1: "В процессе диагностики",
      2: "Диагноз подтвержден",
      3: "Проходим адаптацию и подбор терапии",
    };

    if (currentStageId in statusMap) {
      updateProfile({ diagnosticStatus: statusMap[currentStageId] });
    }
  };

  // Determine current stage based on profile status
  const getStageState = (matchingStatus: string, stageId: number) => {
    const statusMap: Record<DiagnosticStatus, number> = {
      "Только подозреваем": 1,
      "В процессе диагностики": 2,
      "Диагноз подтвержден": 3,
      "Проходим адаптацию и подбор терапии": 4
    };

    const currentActiveStageId = statusMap[profile.diagnosticStatus] || 2;

    if (stageId < currentActiveStageId) return 'completed';
    if (stageId === currentActiveStageId) return 'current';
    return 'upcoming';
  };

  const statusMapForProgress: Record<DiagnosticStatus, number> = {
    "Только подозреваем": 1,
    "В процессе диагностики": 2,
    "Диагноз подтвержден": 3,
    "Проходим адаптацию и подбор терапии": 4
  };
  const currentActiveStageId = statusMapForProgress[profile.diagnosticStatus] || 2;
  const currentStageInfo = STAGES.find(s => s.id === currentActiveStageId);
  const totalArticlesForStage = currentStageInfo ? currentStageInfo.articleIds.length : 1;
  const readArticlesForStage = currentStageInfo ? currentStageInfo.articleIds.filter(id => readArticles.includes(id)).length : 0;
  const progressPercentage = Math.round((readArticlesForStage / totalArticlesForStage) * 100);

  const selectedArticle = ARTICLES_DATABASE.find(a => a.id === selectedArticleId);

  // Pre-computations for the Bento Categories
  const todayRaw = new Date();
  const todayDayOfWeek = todayRaw.getDay(); // 0-6
  const todayDateStr = formatDate(todayRaw);

  const todayPlanned = THERAPY_TYPES.filter(type => {
    return weeklySchedule[type.id]?.includes(todayDayOfWeek);
  });

  const completedTodayCount = todayPlanned.filter(type => 
    therapySessions.some(s => s.childId === profile.id && s.date === todayDateStr && s.type === type.id && s.completed)
  ).length;

  const pmpkData = PMPK_DOCUMENTS_BY_STATUS[profile.diagnosticStatus] || PMPK_DOCUMENTS_BY_STATUS["Только подозреваем"];
  const docs = pmpkData.docs;
  const totalDocsCount = docs.length;
  const checkedDocsCount = docs.filter(doc => checkedDocs[doc.id]).length;
  const bureaucracyChecklist = getBureaucracyChecklist(profile.diagnosticStatus);
  const storedBureaucracyState = parseStoredBureaucracyState<{
    checkedIds: string[];
    deadlines: BureaucracyDeadline[];
    currentStage?: string;
  }>(
    localStorage.getItem(`opora_bureaucracy_helper_${profile.id}`),
    { checkedIds: [], deadlines: [] }
  );
  const bureaucracyProgress = calculateBureaucracyProgress(bureaucracyChecklist, storedBureaucracyState.checkedIds || []);
  const bureaucracyNearestDeadline = getNearestDeadline(storedBureaucracyState.deadlines || []);
  const observationCount = childProgress.length + childDiaryEntries.length;
  const hasNextStep = Boolean(upcomingBooking || checkedDocsCount > 0 || savedArticles.includes('rights_kz'));
  const pendingDoctorAccessConfirmation = doctorCareRequests
    .filter(request => request.childId === profile.id && request.status === 'first_consult_done')
    .sort((a, b) => new Date(b.firstConsultAt || b.requestedAt).getTime() - new Date(a.firstConsultAt || a.requestedAt).getTime())[0];
  const specialistReadySteps = [
    {
      id: 'profile',
      label: 'Профиль ребенка',
      done: Boolean(profile.childName && profile.childAge && profile.userCity),
      action: 'Заполнено'
    },
    {
      id: 'observations',
      label: '5 наблюдений',
      done: observationCount >= 5,
      action: `${Math.min(observationCount, 5)}/5`
    },
    {
      id: 'screening',
      label: 'Мягкий скрининг',
      done: softScreeningDone,
      action: softScreeningDone ? 'Пройден' : 'Начать'
    },
    {
      id: 'report',
      label: 'Отчет врачу',
      done: Boolean(latestVisitCard),
      action: latestVisitCard ? 'Готов' : 'Создать'
    },
    {
      id: 'next-step',
      label: 'Следующий шаг',
      done: hasNextStep,
      action: hasNextStep ? 'Выбран' : 'Выбрать'
    }
  ];
  const specialistReadyCount = specialistReadySteps.filter(step => step.done).length;
  const specialistReadyPercent = Math.round((specialistReadyCount / specialistReadySteps.length) * 100);
  const nextBestAction = !softScreeningDone
    ? 'Пройдите мягкий скрининг без диагноза'
    : observationCount < 5
      ? 'Добавьте одно наблюдение за день'
      : !latestVisitCard
        ? 'Сформируйте карточку для специалиста'
        : !hasNextStep
          ? 'Выберите следующий шаг в Казахстане'
          : 'Вы готовы к спокойному разговору со специалистом';

  // Segmented State control handler and visual renders
  const BREATH_PHASES = [
    { text: 'Вдох...', scale: 1.4, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { text: 'Задержите...', scale: 1.4, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    { text: 'Выдох...', scale: 0.9, color: 'bg-opora-sage/20 text-opora-sage border-opora-sage/30' },
    { text: 'Задержите...', scale: 0.9, color: 'bg-[#1C2B39]/40 text-slate-400 border-slate-700/30' }
  ];

  if (stateMode === 'panic') {
    const activeBreath = BREATH_PHASES[breathPhaseIndex];
    return (
      <div className="min-h-full bg-[#080E14] text-slate-100 flex flex-col pt-12 transition-all duration-500 pb-24">
        {/* State selector still visible in panic for quick return */}
        <div className="px-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Activity size={12} /> Режим поддержки РАС
            </span>
            <button 
              type="button"
              onClick={() => { setStateMode('normal'); stopAudio(); }}
              className="text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full transition-all cursor-pointer"
            >
              На главную
            </button>
          </div>
          
          <div className="bg-slate-900/95 p-1.5 rounded-2xl border border-white/15 flex items-center justify-between shadow-inner select-none mb-4">
            <button 
              type="button"
              onClick={() => { setStateMode('normal'); stopAudio(); }}
              className="flex-1 py-2 text-[13px] font-extrabold rounded-xl transition-all text-slate-100 hover:text-white cursor-pointer bg-white/5"
            >
              🌿 Главная
            </button>
            <button 
              type="button"
              onClick={() => setStateMode('panic')}
              className="flex-1 py-2 text-[13px] font-extrabold rounded-xl transition-all bg-red-600 text-white shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              🚨 Тревога
            </button>
            <button 
              type="button"
              onClick={() => { setStateMode('urgent'); stopAudio(); }}
              className="flex-1 py-2 text-[13px] font-extrabold rounded-xl transition-all text-slate-100 hover:text-white flex items-center justify-center gap-1 cursor-pointer bg-white/5"
            >
              ⚡️ Срочно
            </button>
          </div>
        </div>

        {/* Breathing Circle Regulator */}
        <div className="px-6 mb-8 flex flex-col items-center justify-center bg-slate-950/40 py-6 rounded-3xl border border-white/5 mx-6">
          <h2 className="text-sm font-bold text-slate-300 text-center mb-1">Дышите глубоко вместе</h2>
          <p className="text-[11px] text-slate-400/80 text-center mb-6 max-w-[240px]">
            Чтобы успокоить ребенка, верните контроль над своим дыханием. Мы рядом.
          </p>
          
          {/* Animated pulsing circle */}
          <div className="relative flex items-center justify-center h-44 w-44 mb-4">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-2xl animate-pulse"></div>
            
            {/* Outer rings */}
            <div className="absolute inset-1 border border-white/5 rounded-full scale-110"></div>
            <div className="absolute inset-2 border border-white/5 rounded-full scale-125"></div>
            
            {/* Main pulsing circle */}
            <div 
              style={{ 
                transform: `scale(${activeBreath.scale})`,
                transition: 'transform 4000ms cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
              className={`h-28 w-28 rounded-full border flex flex-col items-center justify-center shadow-lg transition-colors duration-[4000ms] ${activeBreath.color}`}
            >
              <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-60 mb-0.5">Вдохи</span>
              <span className="text-[11px] font-bold text-center leading-tight px-3">{activeBreath.text}</span>
            </div>
          </div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  breathPhaseIndex === idx ? 'w-5 bg-teal-400' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Soothing Sounds Panel (Web Audio API Synthesizer) */}
        <div className="px-6 mb-8">
          <h2 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-1.5 text-left">
            <Volume2 size={15} /> Успокаивающие звуки (ИИ-синтез)
          </h2>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed text-left">
            Поставьте телефон рядом. Эти частоты создаются прямо в браузере и успокаивают слуховую систему.
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => activeAudioType === 'brown' ? stopAudio() : playAudio('brown')}
              className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeAudioType === 'brown'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
              }`}
            >
              <span className="text-lg">💨</span>
              <span className="text-[9px] font-bold">Бурый шум</span>
              <span className="text-[8px] text-slate-400 font-medium opacity-80 leading-none">низкий гул</span>
            </button>
            
            <button
              type="button"
              onClick={() => activeAudioType === 'rain' ? stopAudio() : playAudio('rain')}
              className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeAudioType === 'rain'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
              }`}
            >
              <span className="text-lg">🌧️</span>
              <span className="text-[9px] font-bold">Шум дождя</span>
              <span className="text-[8px] text-slate-400 font-medium opacity-80 leading-none">розовый спектр</span>
            </button>

            <button
              type="button"
              onClick={() => activeAudioType === 'heart' ? stopAudio() : playAudio('heart')}
              className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeAudioType === 'heart'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
              }`}
            >
              <span className="text-lg">💓</span>
              <span className="text-[9px] font-bold">Стук сердца</span>
              <span className="text-[8px] text-slate-400 font-medium opacity-80 leading-none">ритм объятия</span>
            </button>
          </div>
          
          {activeAudioType !== 'none' && (
            <button
              type="button"
              onClick={stopAudio}
              className="w-full mt-3 py-2 bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <VolumeX size={13} /> Остановить звук
            </button>
          )}
        </div>

        {/* Crisis Guidelines */}
        <div className="px-6 mb-8">
          <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5 text-left">
            <ShieldAlert className="text-red-500" size={15} /> Что делать прямо сейчас?
          </h2>
          
          <div className="space-y-2">
            {CRISIS_GUIDELINES.map((tip) => {
              const isExpanded = expandedCrisisTip === tip.id;
              return (
                <div 
                  key={tip.id}
                  className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCrisisTip(isExpanded ? null : tip.id)}
                    className="w-full text-left p-4 flex justify-between items-center hover:bg-white/10 transition-all select-none cursor-pointer"
                  >
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-200">{tip.title}</h3>
                      <p className="text-[9px] text-slate-400 mt-0.5">{tip.subtitle}</p>
                    </div>
                    <ChevronDown 
                      size={15} 
                      className={`text-slate-400 transition-all ${isExpanded ? 'rotate-180 text-teal-400' : ''}`} 
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-slate-950/20 space-y-2.5">
                      {tip.steps.map((step, sIdx) => {
                        const cleanStep = step.replace(/\*\*/g, '');
                        return (
                          <div key={sIdx} className="flex gap-2 items-start text-[11px] text-slate-300 leading-relaxed text-left">
                            <span className="h-1.5 w-1.5 bg-teal-400 rounded-full mt-1.5 flex-shrink-0" />
                            <p>{cleanStep}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => copyText(
                renderTemplate('public_place_help', {}),
                'Короткий текст для прохожих уже в буфере обмена.'
              )}
              className="py-3 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200"
            >
              Скопировать текст для рядом
            </button>
            <button
              type="button"
              onClick={() => openTemplatePreview(messageTemplates.find(template => template.id === 'public_place_help') || messageTemplates[0])}
              className="py-3 px-3 rounded-2xl bg-red-950/35 hover:bg-red-950/55 border border-red-500/20 text-xs font-bold text-red-200"
            >
              Открыть шаблон сообщения
            </button>
          </div>
        </div>

        {/* Crisis AI Assistant */}
        <div className="px-6 mb-4">
          <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-left">
              <Sparkles className="text-teal-400" size={13} /> Быстрый ИИ-советник
            </h2>
            <p className="text-[10px] text-slate-400 leading-normal mb-4 text-left">
              Выберите быстрый опрос или напишите кратко ваш вопрос для мгновенного руководства:
            </p>
            
            {/* One-tap prompts */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
              <button 
                type="button"
                onClick={() => { setCrisisQuery('Ребенок бьет себя. Как защитить?'); askCrisisAi('Ребенок бьет себя. Как защитить?'); }}
                className="whitespace-nowrap flex-shrink-0 text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full text-slate-300 cursor-pointer"
              >
                Ребенок бьет себя
              </button>
              <button 
                type="button"
                onClick={() => { setCrisisQuery('Как быстро остановить истерику в ТЦ?'); askCrisisAi('Как быстро остановить истерику в ТЦ?'); }}
                className="whitespace-nowrap flex-shrink-0 text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full text-slate-300 cursor-pointer"
              >
                Истерика в ТЦ
              </button>
              <button 
                type="button"
                onClick={() => { setCrisisQuery('Мне очень страшно, я теряю контроль над эмоциями.'); askCrisisAi('Мне очень страшно, я теряю контроль над эмоциями.'); }}
                className="whitespace-nowrap flex-shrink-0 text-[10px] font-bold bg-red-950/40 hover:bg-red-950/60 border border-red-500/20 px-2.5 py-1.5 rounded-full text-red-300 cursor-pointer"
              >
                Я теряю контроль
              </button>
            </div>
            
            <div className="flex gap-2">
              <input
                value={crisisQuery}
                onChange={(e) => setCrisisQuery(e.target.value)}
                placeholder="Что происходит прямо сейчас?"
                className="flex-1 bg-black/40 text-slate-200 text-xs border border-white/10 py-2 pl-3 rounded-xl focus:outline-none focus:border-teal-400 placeholder:text-slate-500"
              />
              <button 
                type="button"
                onClick={() => askCrisisAi()}
                disabled={isCrisisAiTyping || !crisisQuery.trim()}
                className="px-3.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                {isCrisisAiTyping ? '...' : <Send size={12} />}
              </button>
            </div>

            {/* AI Response SPEECH bubble */}
            <AnimatePresence>
              {(isCrisisAiTyping || crisisAiReply) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-teal-950/20 border border-teal-500/20 rounded-2xl text-[11px] text-teal-100 leading-relaxed relative text-left"
                >
                  <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#0A111A] border-t border-l border-teal-500/20 rotate-45" />
                  <div className="font-semibold text-teal-400 mb-1 flex items-center gap-1">
                    <Sparkles size={10} /> Экспресс-совет ИИ Опоры:
                  </div>
                  
                  {isCrisisAiTyping ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{crisisAiReply}</Markdown>
                    </div>
                  )}
                  
                  <div className="mt-2 text-[8px] text-teal-400/60 text-right uppercase tracking-wider font-semibold">
                    ИИ не ставит диагнозы • Только ориентиры
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  if (stateMode === 'urgent') {
    return (
      <div className="min-h-full bg-amber-50/20 text-opora-navy flex flex-col pt-12 transition-all duration-500 pb-24 dark:bg-slate-900/20">
        <div className="px-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} /> Карманная информация & SOS
            </span>
            <button 
              type="button"
              onClick={() => setStateMode('normal')}
              className="text-xs font-bold text-opora-sage hover:text-opora-navy bg-white dark:bg-slate-800 border border-black/5 dark:border-white/10 px-3 py-1 rounded-full transition-all cursor-pointer"
            >
              На главную
            </button>
          </div>
          
          <div className="bg-white/95 dark:bg-slate-800/95 p-1.5 rounded-2xl border border-black/10 dark:border-white/15 flex items-center justify-between shadow-inner select-none mb-4 animate-fade-in">
            <button 
              type="button"
              onClick={() => setStateMode('normal')}
              className="flex-1 py-2 text-[13px] font-extrabold rounded-xl transition-all text-opora-navy hover:text-opora-navy dark:text-slate-100 cursor-pointer bg-opora-sand/60 dark:bg-white/5"
            >
              🌿 Главная
            </button>
            <button 
              type="button"
              onClick={() => setStateMode('panic')}
              className="flex-1 py-2 text-[13px] font-extrabold rounded-xl transition-all text-red-600 hover:text-red-700 flex items-center justify-center gap-1 cursor-pointer bg-red-50/70 dark:bg-white/5 dark:text-red-300"
            >
              🚨 Тревога
            </button>
            <button 
              type="button"
              onClick={() => setStateMode('urgent')}
              className="flex-1 py-2 text-[13px] font-extrabold rounded-xl transition-all bg-amber-500 text-white shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              ⚡️ Срочно
            </button>
          </div>
        </div>

        {/* Social Card for Bystanders */}
        <div className="px-6 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-black/5 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
            <div className="flex gap-3 items-start mb-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Smile size={18} />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-sm font-bold text-opora-navy leading-tight">Объяснение для прохожих</h3>
                <p className="text-[10px] text-opora-text/60 leading-normal mt-0.5">
                  Покажите этот экран людям или полиции при мелтдауне в ТЦ или на улице.
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 rounded-2xl text-[11.5px] text-opora-text dark:text-slate-300 leading-relaxed mb-3 text-left font-medium">
              «У моего ребенка РАС (аутизм). Сейчас у него сенсорная перегрузка. Это не каприз и не баловство. Лучшая помощь — дать нам 5 минут тишины и не снимать на видео.»
            </div>
            
            <button
              type="button"
              onClick={() => setIsSocialCardFullScreen(true)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Развернуть на весь экран (Крупно)
            </button>
          </div>
        </div>

        {/* Emergency Kazakhstani Contacts */}
        <div className="px-6 mb-6">
          <h2 className="text-xs font-bold text-opora-sage uppercase tracking-wider mb-2.5 text-left">
            📞 Горячие линии Казахстана
          </h2>
          
          <div className="space-y-2">
            <a 
              href="tel:111"
              className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-black/5 hover:bg-opora-sand/40 transition-all flex items-center justify-between select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl font-serif font-bold text-sm">
                  111
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-opora-navy leading-tight">Национальная линия доверия</h4>
                  <p className="text-[9px] text-opora-text/60 leading-none mt-0.5">Защита прав детей в Казахстане</p>
                </div>
              </div>
              <Phone size={13} className="text-opora-sage" />
            </a>

            <a 
              href="tel:150"
              className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-black/5 hover:bg-opora-sand/40 transition-all flex items-center justify-between select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl font-serif font-bold text-sm">
                  150
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-opora-navy leading-tight">Служба психологической помощи</h4>
                  <p className="text-[9px] text-opora-text/60 leading-none mt-0.5">Кризисный Союз семейных центров</p>
                </div>
              </div>
              <Phone size={13} className="text-opora-sage" />
            </a>

            <a 
              href="tel:103"
              className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-black/5 hover:bg-opora-sand/40 transition-all flex items-center justify-between select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl font-serif font-bold text-sm">
                  103
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-opora-navy leading-tight">Скорая медицинская помощь</h4>
                  <p className="text-[9px] text-opora-text/60 leading-none mt-0.5">При травмах или соматических угрозах</p>
                </div>
              </div>
              <Phone size={13} className="text-opora-sage" />
            </a>
          </div>
        </div>

        {/* Special Dentist Quick-Link (Redirect to Map) */}
        <div className="px-6 mb-4">
          <h2 className="text-xs font-bold text-opora-sage uppercase tracking-wider mb-2.5 text-left">
            🦷 Срочная медицинская помощь
          </h2>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-black/5 shadow-xs relative text-left">
            <h3 className="font-serif text-sm font-bold text-opora-navy leading-tight mb-1">
              Детский стоматолог-адаптолог РАС
            </h3>
            <p className="text-[10px] text-opora-text/80 leading-relaxed mb-3">
              Даниил Ким — особенный стоматолог в Алматы. Лечит без белых халатов, готовит сенсорно через «Tell-Show-Do» (Покажи-Сделай), принимает в клинике с наушниками и светофильтрами.
            </p>
            
            <button
              type="button"
              onClick={() => {
                // Instantly redirect to the directory tab
                onChangeTab?.('directory');
              }}
              className="w-full py-2 bg-opora-navy text-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 hover:bg-opora-navy/90 cursor-pointer"
            >
              <MapPin size={12} /> Записаться на карте «Дружелюбных мест»
            </button>
          </div>
        </div>

        {/* Social Card Fullscreen Overlay */}
        <AnimatePresence>
          {isSocialCardFullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0B131E] z-[1000] flex flex-col justify-between p-8 text-center"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSocialCardFullScreen(false)}
                  className="bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full p-2.5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-6 text-center justify-center flex-1 max-w-sm mx-auto">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 animate-bounce">
                  <Smile size={32} />
                </div>
                <h1 className="font-sans text-2xl font-extrabold text-white leading-tight uppercase tracking-wide">
                  Мой ребенок имеет особенности
                </h1>
                <p className="font-sans text-[17px] font-bold text-amber-100 leading-relaxed bg-white/5 border border-white/10 p-6 rounded-3xl shadow-2xl">
                  «У него аутизм (РАС). Сейчас у нас сенсорный срыв (мелтдаун). Он не капризничает — его нервная система перегружена звуками и светом. Лучшая помощь — дать нам немного тишины и личного пространства. Пожалуйста, не окружайте нас. Спасибо!»
                </p>
              </div>
              
              <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Семейный навигатор «Опора»
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (navigatorSubscreen === 'bureaucracy') {
    return (
      <BureaucracyHelperScreen
        childId={profile.id}
        childName={profile.childName}
        diagnosticStatus={profile.diagnosticStatus}
        onBack={() => setNavigatorSubscreen('main')}
      />
    );
  }

  return (
    <div className="h-full flex flex-col pt-12">
      <div className="px-6 mb-6">
        <span className="text-xs font-bold text-opora-sage uppercase tracking-wider">Опора сегодня</span>
        <h1 className="font-serif text-3xl font-medium text-opora-navy mb-1">Маршрут {profile.childName}</h1>
        <p className="text-opora-text text-base">Выберите один понятный шаг. Остальное не обязательно читать сейчас.</p>
      </div>

      <div className="px-6 mb-6">
        <button
          type="button"
          onClick={() => setNavigatorSubscreen('bureaucracy')}
          className="w-full rounded-2xl border border-black/5 bg-white p-5 text-left shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-xl bg-opora-sage/10 p-2 text-opora-sage">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-opora-sage">МСЭ и документы</p>
                <h3 className="mt-1 font-serif text-[18px] font-bold leading-tight text-opora-navy">Бюрократический помощник</h3>
                <p className="mt-1 text-xs leading-relaxed text-opora-text">
                  {bureaucracyNearestDeadline
                    ? `Ближайший срок: ${bureaucracyNearestDeadline.title}, ${bureaucracyNearestDeadline.date}`
                    : 'Соберите документы, сроки и этапы в одном месте.'}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="mt-1 shrink-0 text-opora-text/50" />
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] font-bold text-opora-text">
              <span>Готовность</span>
              <span>{bureaucracyProgress.checkedCount} из {bureaucracyProgress.totalCount}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-opora-sand">
              <motion.div className="h-full rounded-full bg-opora-sage" style={{ width: `${bureaucracyProgress.percent}%` }} />
            </div>
          </div>
        </button>
      </div>

      {pendingDoctorAccessConfirmation && (
        <div className="px-6 mb-5">
          <div className="rounded-3xl border border-opora-sage/20 bg-opora-sage/10 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/95">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">После первой консультации</p>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-opora-navy dark:text-slate-50">
              Продолжить с врачом {pendingDoctorAccessConfirmation.doctorName}?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-opora-text dark:text-slate-300">
              Если вы подтверждаете, врачу откроются паспорт ребенка, возраст, прогресс, дневник и материалы для плана помощи. До подтверждения полный доступ закрыт.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => parentConfirmDoctorAccess(pendingDoctorAccessConfirmation.id)}
                className="rounded-2xl bg-opora-navy px-4 py-3 text-xs font-extrabold text-white"
              >
                Да, открыть доступ
              </button>
              <button
                type="button"
                onClick={() => declineDoctorCareRequest(pendingDoctorAccessConfirmation.id)}
                className="rounded-2xl bg-white px-4 py-3 text-xs font-extrabold text-opora-navy dark:bg-slate-900 dark:text-slate-100"
              >
                Нет, не продолжаем
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 mb-5">
        <div className="rounded-3xl border border-black/5 bg-white/95 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/95">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">Сегодня один шаг</p>
              <h2 className="mt-1 text-xl font-extrabold leading-tight text-opora-navy dark:text-slate-50">{nextBestAction}</h2>
              <p className="mt-2 text-xs leading-relaxed text-opora-text dark:text-slate-300">
                Опора не ставит диагноз. Она помогает спокойно собрать факты для специалиста и не потеряться в маршруте.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-opora-sage/10 px-3 py-2 text-center">
              <p className="text-lg font-extrabold text-opora-navy dark:text-slate-50">{specialistReadyPercent}%</p>
              <p className="text-[9px] font-bold uppercase tracking-wide text-opora-sage">готово</p>
            </div>
          </div>

          <div className="mb-4 h-2 overflow-hidden rounded-full bg-opora-sand dark:bg-slate-900">
            <div className="h-full rounded-full bg-opora-sage transition-all" style={{ width: `${specialistReadyPercent}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={completeSoftScreening}
              className="rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white"
            >
              Пройти скрининг
            </button>
            <button
              type="button"
              onClick={openVisitCard}
              className="rounded-2xl bg-opora-sand px-4 py-3 text-sm font-extrabold text-opora-navy dark:bg-slate-900 dark:text-slate-100"
            >
              Отчет врачу
            </button>
          </div>

          <details className="mt-3 rounded-2xl bg-opora-sand/45 p-3 dark:bg-slate-900/70">
            <summary className="cursor-pointer text-xs font-extrabold text-opora-navy dark:text-slate-100">
              Что уже собрано для специалиста
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {specialistReadySteps.map(step => (
                <div key={step.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/75 px-3 py-2 dark:bg-slate-800">
                  <span className="flex items-center gap-2 text-xs font-bold text-opora-navy dark:text-slate-100">
                    {step.done ? <CheckCircle2 size={15} className="text-opora-sage" /> : <Circle size={15} className="text-opora-text/45" />}
                    {step.label}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-opora-text/65 dark:text-slate-400">{step.action}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="px-6 mb-5">
        <div className="rounded-3xl border border-black/5 bg-white/95 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/95">
          <div className="mb-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">Дневник на 60 секунд</p>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-opora-navy dark:text-slate-50">Записать один факт</h2>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1 rounded-2xl bg-opora-sand/70 p-1 dark:bg-slate-900">
            {[
              { id: 'note', label: 'Факт' },
              { id: 'success', label: 'Успех' },
              { id: 'trigger', label: 'Триггер' },
              { id: 'routine', label: 'Рутина' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuickObservationType(item.id as typeof quickObservationType)}
                className={`rounded-xl px-2 py-2 text-[11px] font-extrabold transition-all ${
                  quickObservationType === item.id ? 'bg-opora-navy text-white' : 'text-opora-navy dark:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <textarea
            value={quickObservationNote}
            onChange={event => setQuickObservationNote(event.target.value)}
            placeholder="Например: откликнулся на имя; закрыл уши в магазине; уснул быстрее после тихой рутины..."
            className="min-h-[76px] w-full resize-none rounded-2xl border border-black/5 bg-opora-sand/45 px-3 py-3 text-sm font-medium text-opora-navy outline-none placeholder:text-opora-text/45 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={saveQuickObservation}
            className="mt-3 w-full rounded-2xl bg-opora-sage px-4 py-3 text-sm font-extrabold text-white"
          >
            Добавить наблюдение
          </button>
        </div>
      </div>

      <div className="px-6 mb-5">
        <div className="mb-3">
          <h2 className="text-lg font-extrabold text-opora-navy leading-tight dark:text-slate-50">Центр действий</h2>
          <p className="mt-1 text-xs text-opora-text dark:text-slate-300">Четыре понятных направления вместо длинной ленты.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory('schedule')}
            className="opora-home-bento min-h-[116px] p-3.5 text-left dark:border-white/10 dark:bg-slate-800"
          >
            <span className="opora-home-picture small">📅</span>
            <span className="block text-[15px] font-extrabold leading-tight text-opora-navy dark:text-slate-50">План дня</span>
            <span className="mt-1 block text-[12px] leading-snug text-opora-text dark:text-slate-300">
              {todayPlanned.length ? `${completedTodayCount}/${todayPlanned.length} занятий` : 'Без срочных задач'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab?.('directory')}
            className="opora-home-bento min-h-[116px] p-3.5 text-left dark:border-white/10 dark:bg-slate-800"
          >
            <span className="opora-home-picture small">🤝</span>
            <span className="block text-[15px] font-extrabold leading-tight text-opora-navy dark:text-slate-50">База доверия</span>
            <span className="mt-1 block text-[12px] leading-snug text-opora-text dark:text-slate-300">Опыт родителей о местах и специалистах.</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab?.('ai')}
            className="opora-home-bento min-h-[116px] p-3.5 text-left dark:border-white/10 dark:bg-slate-800"
          >
            <span className="opora-home-picture small">💬</span>
            <span className="block text-[15px] font-extrabold leading-tight text-opora-navy dark:text-slate-50">Помощник</span>
            <span className="mt-1 block text-[12px] leading-snug text-opora-text dark:text-slate-300">Объяснить результаты простым языком.</span>
          </button>

          <button
            type="button"
            onClick={() => setStateMode('panic')}
            className="opora-home-bento min-h-[116px] p-3.5 text-left dark:border-white/10 dark:bg-slate-800"
          >
            <span className="opora-home-picture small">🛟</span>
            <span className="block text-[15px] font-extrabold leading-tight text-opora-navy dark:text-slate-50">Помощь сейчас</span>
            <span className="mt-1 block text-[12px] leading-snug text-opora-text dark:text-slate-300">Когда ребенок перегружен.</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenDirectoryRecommendations}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-dashed border-opora-sage/30 bg-white/85 px-4 py-3 text-left transition-all active:scale-[0.99] dark:border-white/10 dark:bg-slate-800"
        >
          <span>
            <span className="block text-sm font-extrabold text-opora-navy dark:text-slate-50">Родители знают лучше всех</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-opora-text dark:text-slate-300">Поделитесь местом, где ребенку было бережно и понятно.</span>
          </span>
          <span className="rounded-xl bg-opora-sage/10 px-2.5 py-1.5 text-lg">🤝</span>
        </button>
      </div>

      <div className="px-6 mb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-opora-text/65">Еще разделы</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'pmpk', label: '📁 ПМПК' },
            { id: 'route', label: '🧭 Маршрут KZ' },
            { id: 'schedule', label: '📅 План дня' },
            { id: 'podcasts', label: '🎧 Подкасты' },
            { id: 'friendly', label: '☕ Места' },
            { id: 'science', label: '🔬 База знаний' },
          ].map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveCategory(activeCategory === section.id ? 'all' : section.id as any)}
              className={`whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                activeCategory === section.id
                  ? 'border-opora-navy bg-opora-navy text-white'
                  : 'border-black/5 bg-white text-opora-navy dark:border-white/10 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active category clear indicator banner */}
      {activeCategory !== 'all' && (
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between bg-opora-sand/50 p-2.5 rounded-xl border border-black/[0.01]">
            <span className="text-sm text-opora-navy font-semibold flex items-center gap-1.5 line-clamp-1">
              <span className="w-1.5 h-1.5 rounded-full bg-opora-sage animate-ping" />
              Показан раздел: {
                activeCategory === 'schedule' ? '📅 План & Занятия' :
                activeCategory === 'pmpk' ? '📂 Документы ПМПК' :
                activeCategory === 'route' ? '🧭 Карта маршрута' : 
                activeCategory === 'friendly' ? '☕ Дружелюбная среда' :
                activeCategory === 'podcasts' ? '🎧 Подкасты' : '🔬 Доказательные подходы'
              }
            </span>
            <button 
              type="button"
              onClick={() => setActiveCategory('all')}
              className="text-xs font-bold text-opora-sage hover:text-opora-navy tracking-wider pl-2 shrink-0 cursor-pointer"
            >
              Сбросить ×
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'route' && currentStageInfo && (
        <div className="px-6 mb-6">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-opora-sage/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-opora-sage/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-xl"></div>
            
            <div className="relative flex items-center justify-center shrink-0">
              <svg height="56" width="56" className="transform -rotate-90">
                <circle
                  stroke="currentColor"
                  fill="transparent"
                  strokeWidth="4.5"
                  r="24"
                  cx="28"
                  cy="28"
                  className="text-opora-sand"
                />
                <motion.circle
                  stroke="currentColor"
                  fill="transparent"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  r="24"
                  cx="28"
                  cy="28"
                  className="text-opora-sage"
                  initial={{ strokeDashoffset: Math.PI * 48 }}
                  animate={{ strokeDashoffset: (Math.PI * 48) * (1 - (readArticlesForStage / totalArticlesForStage)) }}
                  style={{ strokeDasharray: Math.PI * 48 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <span className="absolute flex flex-col items-center justify-center pt-0.5">
                <span className="text-[11px] font-bold text-opora-navy leading-none">{progressPercentage}%</span>
              </span>
            </div>
            
            <div className="relative z-10 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                 <p className="text-[11px] font-bold text-opora-sage uppercase tracking-wider">Текущий этап • Шаг {currentActiveStageId}</p>
                 {progressPercentage === 100 && (
                    <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-bold shrink-0">Готово</span>
                 )}
              </div>
              <h2 className="text-[13px] font-semibold text-opora-navy leading-snug break-words">«{currentStageInfo.title}»</h2>
              {progressPercentage < 100 ? (
                <p className="text-xs text-opora-text/80 mt-1">Осталось изучить: <span className="font-semibold text-opora-navy">{totalArticlesForStage - readArticlesForStage}</span></p>
              ) : (
                <p className="text-xs text-opora-text/80 mt-1">Все материалы этапа пройдены 🎉</p>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Today's Therapy Session Reminders & Notifications Component */}
      {activeCategory === 'schedule' && (() => {
        const todayRaw = new Date();
        const todayDayOfWeek = todayRaw.getDay(); // 0-6
        const todayDateStr = formatDate(todayRaw);

        const todayPlanned = THERAPY_TYPES.filter(type => {
          return weeklySchedule[type.id]?.includes(todayDayOfWeek);
        });

        const completedTodayCount = todayPlanned.filter(type => 
          therapySessions.some(s => s.childId === profile.id && s.date === todayDateStr && s.type === type.id && s.completed)
        ).length;

        const allTodayCompleted = todayPlanned.length > 0 && completedTodayCount === todayPlanned.length;

        return (
          <div className="px-6 mb-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 relative overflow-hidden text-left">
              <div className="absolute right-0 top-0 w-24 h-24 bg-opora-sage/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl shrink-0 ${allTodayCompleted ? 'bg-green-50 text-green-600' : 'bg-opora-sand text-opora-navy'}`}>
                    {allTodayCompleted ? (
                      <Sparkles size={18} className="animate-spin duration-1000 text-green-500" />
                    ) : (
                      <BellRing size={18} className="text-opora-sage animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-[17px] font-bold text-opora-navy leading-snug">Сегодня по плану</h3>
                    <p className="text-[10px] text-opora-sage font-bold tracking-wider uppercase mt-0.5">
                      Напоминания и сессии
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowScheduleSettings(!showScheduleSettings)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-opora-sand hover:bg-black/5 rounded-xl text-xs font-semibold text-opora-navy transition-all"
                >
                  <Settings2 size={13} className="text-opora-sage" />
                  <span>Настроить</span>
                </button>
              </div>

              {/* Weekly Settings Panel */}
              <AnimatePresence>
                {showScheduleSettings && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-opora-sand/50 rounded-xl border border-black/[0.02] space-y-4 overflow-hidden relative z-10"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-[12px] font-bold text-opora-navy font-serif">Дни проведения занятий</h4>
                      <p className="text-[10px] text-opora-text/60">Задайте расписание</p>
                    </div>
                    
                    <div className="space-y-3">
                      {THERAPY_TYPES.map(type => {
                        const scheduledDays = weeklySchedule[type.id] || [];
                        return (
                          <div key={type.id} className="bg-white/80 p-3 rounded-xl border border-black/[0.01]">
                            <div className="flex justify-between items-center mb-2.5">
                              <span className="text-xs font-bold text-opora-navy flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${type.dotClass}`} />
                                {type.label}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-opora-text/70">
                                <Clock size={11} className="text-opora-sage" />
                                <input 
                                  type="time" 
                                  value={sessionTimes[type.id] || '12:00'} 
                                  onChange={(e) => handleTimeChange(type.id, e.target.value)}
                                  className="bg-opora-sand/50 border border-black/10 text-xs rounded px-1.5 py-0.5 focus:border-opora-sage outline-none font-bold text-opora-navy"
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-between gap-1">
                              {[
                                { label: 'Пн', val: 1 },
                                { label: 'Вт', val: 2 },
                                { label: 'Ср', val: 3 },
                                { label: 'Чт', val: 4 },
                                { label: 'Пт', val: 5 },
                                { label: 'Сб', val: 6 },
                                { label: 'Вс', val: 0 }
                              ].map(day => {
                                const isActive = scheduledDays.includes(day.val);
                                return (
                                  <button
                                    key={day.val}
                                    type="button"
                                    onClick={() => handleDayToggle(type.id, day.val)}
                                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                                      isActive 
                                        ? 'bg-opora-sage text-white shadow-sm' 
                                        : 'bg-opora-sand hover:bg-black/5 text-opora-text/60'
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main therapy checklist or empty state */}
              <div className="space-y-2.5 relative z-10">
                {todayPlanned.length === 0 ? (
                  <div className="text-center py-5 bg-opora-sand/40 border border-dashed border-opora-sage/20 rounded-2xl flex flex-col items-center justify-center p-3">
                    <span className="text-xl mb-1.5">🌸</span>
                    <p className="text-xs font-semibold text-opora-navy">Сегодня занятий не запланировано</p>
                    <p className="text-[11px] text-opora-text/75 leading-relaxed mt-0.5 max-w-[240px] text-center">
                      Отличный день для отдыха на свежем воздухе, бережного массажа и накопления маминого ресурса.
                    </p>
                  </div>
                ) : (
                  todayPlanned.map(type => {
                    const isCompleted = therapySessions.some(s => s.childId === profile.id && s.date === todayDateStr && s.type === type.id && s.completed);
                    const timeLabel = sessionTimes[type.id] || '12:00';
                    return (
                      <div 
                        key={type.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isCompleted 
                            ? 'bg-green-50/40 border-green-200/50' 
                            : 'bg-opora-sand/35 border-black/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${type.dotClass} ${!isCompleted && 'animate-pulse'}`} />
                          <div>
                            <p className="text-[13px] font-bold text-opora-navy">{type.label}</p>
                            <span className="text-[10px] text-opora-text/60 font-semibold flex items-center gap-1">
                              <Clock size={10} /> {timeLabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg flex items-center gap-1 animate-in fade-in duration-300">
                              <CheckCircle2 size={10} className="stroke-[3]" /> Выполнено!
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                toggleTherapySession(profile.id, todayDateStr, type.id);
                                confetti({
                                  particleCount: 80,
                                  spread: 50,
                                  origin: { y: 0.8 }
                                });
                                triggerPushNotification(
                                  "✨ Занятие завершено!", 
                                  `Вы отметили сессию по ${type.label} ребенка ${profile.childName}. Вы большие молодцы!`
                                );
                              }}
                              className="text-[11px] font-bold bg-opora-navy text-white hover:bg-opacity-95 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                            >
                              Отметить
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Push System Custom Enablement Ribbon */}
              <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs relative z-10 text-left">
                <div className="flex items-center gap-1.5 text-opora-text/85">
                  <Bell size={13} className="text-opora-sage shrink-0" />
                  <span>Push-уведомления</span>
                  
                  {pushStatus === 'granted' && (
                    <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1 rounded border border-green-100 uppercase tracking-widest flex items-center gap-0.5 animate-pulse">
                      Разрешено
                    </span>
                  )}
                  {pushStatus === 'simulated' && (
                    <span className="text-[9px] font-bold bg-opora-peach/40 text-opora-navy px-1 rounded uppercase tracking-wider">
                      Внутри Опоры
                    </span>
                  )}
                  {pushStatus === 'denied' && (
                    <span className="text-[9px] font-bold bg-red-50 text-red-500 px-1 rounded uppercase tracking-wider">
                      Блок
                    </span>
                  )}
                </div>

                {pushStatus !== 'granted' && pushStatus !== 'simulated' ? (
                  <button 
                    onClick={handleTogglePushPermission}
                    className="text-[11px] font-extrabold text-opora-sage hover:text-opora-navy select-none"
                  >
                    Включить на устройстве
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      triggerPushNotification(
                        "🧪 Тестовый пуш", 
                        `Напоминание о занятии для ${profile.childName} настроено на отлично!`
                      );
                    }}
                    className="text-[11px] font-extrabold text-opora-sage hover:text-opora-navy flex items-center gap-0.5"
                  >
                    <Volume2 size={11} /> Тест пуша
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Теплые советы дня */}
      {activeCategory === 'route' && (() => {
        const tips = WARM_TIPS_BY_STATUS[profile.diagnosticStatus] || WARM_TIPS_BY_STATUS["Только подозреваем"];
        const currentTip = tips[currentTipIndex % tips.length] || "Для вашего ребенка сейчас важнее всего ваша внутренняя опора и любовь.";
        
        return (
          <div className="px-6 mb-6">
            <div className="bg-opora-peach/25 border border-opora-peach/40 p-5 rounded-2xl relative overflow-hidden text-left shadow-[0_4px_24px_rgba(251,191,189,0.15)] animate-in fade-in duration-300">
              {/* Soft decorative background quote and blobs */}
              <Quote className="absolute -top-1 -right-1 text-opora-navy/[0.03] w-24 h-24 pointer-events-none transform rotate-12" />
              <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>

              {/* Header with beating heart */}
              <div className="flex justify-between items-center mb-3.5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/85 rounded-lg text-red-400 shadow-sm shrink-0">
                    <Heart size={14} className="fill-red-400 stroke-red-400 animate-pulse" style={{ animationDuration: '2s' }} />
                  </div>
                  <span className="text-[12px] font-bold text-opora-navy uppercase tracking-wider font-sans">
                    Теплые советы дня
                  </span>
                </div>
                
                <span className="text-[10px] bg-white/60 text-opora-navy/80 px-2 py-0.5 rounded-full font-bold">
                  Совет {currentTipIndex + 1} из {tips.length}
                </span>
              </div>

              {/* Animated Text Block */}
              <div className="min-h-[76px] flex flex-col justify-center relative z-10 my-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm text-opora-navy font-medium italic leading-relaxed"
                  >
                    "{currentTip}"
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Pagination and Navigation Controls */}
              <div className="mt-4 pt-3 border-t border-opora-peach/30 flex justify-between items-center relative z-10">
                {/* Visual Dot Indicators */}
                <div className="flex gap-1.5">
                  {tips.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTipIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentTipIndex ? 'w-4 bg-opora-navy' : 'w-1.5 bg-opora-navy/20 hover:bg-opora-navy/40'
                      }`}
                      aria-label={`Go to tip ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow Navigation buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePrevTip(tips.length)}
                    className="p-1.5 bg-white/70 hover:bg-white rounded-lg border border-black/[0.05] text-opora-navy transition-all active:scale-95"
                    aria-label="Previous tip"
                  >
                    <ChevronLeft size={14} className="stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => handleNextTip(tips.length)}
                    className="p-1.5 bg-white/70 hover:bg-white rounded-lg border border-black/[0.05] text-opora-navy transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold pl-2.5 pr-2"
                    aria-label="Next tip"
                  >
                    <span>Далее</span>
                    <ChevronRight size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {activeCategory === 'schedule' && (
        <div className="px-6 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold text-opora-navy border-b-2 border-opora-sage/30 pb-1">Табель занятий (Неделя)</h3>
            </div>
            <p className="text-sm text-opora-text/80 mb-4 leading-relaxed tracking-tight">Отмечайте завершённые сессии, чтобы видеть регулярность.</p>
            
            <div className="bg-opora-sand/30 border border-black/[0.04] p-4 rounded-xl overflow-x-auto no-scrollbar">
             <div className="min-w-[320px]">
                <div className="flex w-full justify-between items-end mb-2">
                   <div className="w-16"></div> {/* Offset for labels */}
                   {generateLastWeek().map((d, i) => (
                      <div key={i} className={`flex flex-col items-center flex-1 ${d.getDate() === new Date().getDate() ? 'bg-opora-sage/10 rounded-lg p-1' : ''}`}>
                         <span className="text-[11px] font-bold text-opora-text/60 uppercase">{formatDayOfWeek(d)}</span>
                         <span className={`text-[13px] font-bold ${d.getDate() === new Date().getDate() ? 'text-opora-sage' : 'text-opora-navy'}`}>{d.getDate()}</span>
                      </div>
                   ))}
                </div>

                <div className="space-y-3">
                   {THERAPY_TYPES.map(type => (
                      <div key={type.id} className="flex w-full items-center">
                         <div className="w-16 text-[11px] font-bold text-opora-navy leading-tight shrink-0">{type.label}</div>
                         <div className="flex flex-1 justify-between gap-1 items-center px-1">
                            {generateLastWeek().map((d, i) => {
                               const dateStr = formatDate(d);
                               const isCompleted = therapySessions.some(s => s.childId === profile.id && s.date === dateStr && s.type === type.id && s.completed);
                               return (
                                  <div key={i} className="flex-1 flex justify-center">
                                     <button 
                                        onClick={() => toggleTherapySession(profile.id, dateStr, type.id)}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isCompleted ? type.activeClass : 'bg-white border border-black/10 hover:border-opora-sage/50 text-black/10'}`}
                                     >
                                        {isCompleted ? <CheckCircle2 size={14} className="animate-in zoom-in duration-200" /> : <div className={`w-1.5 h-1.5 rounded-full ${type.dotClass} opacity-30`}></div>}
                                     </button>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    )}

      {/* PMPK Documents Reminder Card */}
      {activeCategory === 'pmpk' && (() => {
        const pmpkData = PMPK_DOCUMENTS_BY_STATUS[profile.diagnosticStatus] || PMPK_DOCUMENTS_BY_STATUS["Только подозреваем"];
        const docs = pmpkData.docs;
        const totalDocsCount = docs.length;
        const checkedDocsCount = docs.filter(doc => checkedDocs[doc.id]).length;
        const allCompleted = checkedDocsCount === totalDocsCount;

        return (
          <div className="px-6 mb-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 relative overflow-hidden text-left">
              {/* Soft warm peach ambient glow */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-opora-peach/25 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl pointer-events-none"></div>
              
              <div className="flex items-start gap-2.5 mb-2 relative z-10">
                <div className="p-2 bg-opora-peach/40 rounded-xl text-opora-navy shrink-0">
                  <ClipboardCheck size={20} className="stroke-[2.25]" />
                </div>
                <div>
                  <h3 className="font-serif text-[17px] font-bold text-opora-navy leading-snug">
                    {pmpkData.title}
                  </h3>
                  <p className="text-[11px] text-opora-sage font-bold tracking-wider uppercase mt-0.5">
                    Инфо-помощник ПМПК
                  </p>
                </div>
              </div>

              <p className="text-sm text-opora-text/90 leading-relaxed mb-4 relative z-10">
                {pmpkData.subtitle} Текущий статус {profile.childName}: <span className="font-semibold text-opora-navy">«{profile.diagnosticStatus}»</span>.
              </p>

              {/* Progress Tracker */}
              <div className="bg-opora-sand/40 border border-black/[0.02] p-3 rounded-xl mb-4 relative z-10">
                <div className="flex justify-between items-center text-xs font-bold text-opora-navy mb-2">
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} className="text-opora-sage" />
                    Готовность документов
                  </span>
                  <span>{checkedDocsCount} из {totalDocsCount}</span>
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-black/[0.02]">
                  <motion.div 
                    className={`h-full transition-all duration-300 ${allCompleted ? 'bg-green-500' : 'bg-opora-sage'}`}
                    style={{ width: `${(checkedDocsCount / totalDocsCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Document List Checklist */}
              <div className="space-y-2.5 relative z-10">
                {docs.map(doc => {
                  const isChecked = !!checkedDocs[doc.id];
                  return (
                    <div 
                      key={doc.id}
                      onClick={() => toggleDocChecked(doc.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-opora-sage/5 border-opora-sage/30' 
                          : 'bg-white hover:bg-opora-sand border-black/[0.04]'
                      }`}
                    >
                      <button 
                        type="button"
                        className="mt-0.5 shrink-0 transition-all focus:outline-none"
                      >
                        {isChecked ? (
                          <div className="w-[18px] h-[18px] rounded-md bg-opora-sage flex items-center justify-center text-white scale-105 animate-in zoom-in-50 duration-200">
                            <CheckCircle2 size={12} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-md border-2 border-black/20 hover:border-opora-sage bg-white flex items-center justify-center"></div>
                        )}
                      </button>

                      <div className="flex-grow text-left space-y-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm font-semibold transition-all leading-tight ${isChecked ? 'text-opora-text/60 line-through' : 'text-opora-navy'}`}>
                            {doc.title}
                          </p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                            doc.required 
                              ? 'bg-red-50 text-red-500 border border-red-100' 
                              : 'bg-opora-sand text-opora-text/60 border border-black/5'
                          }`}>
                            {doc.required ? 'Обязательно' : 'Желательно'}
                          </span>
                        </div>
                        <p className="text-[11px] text-opora-text/75 leading-relaxed">
                          {doc.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kazakhstan Specific Warm Tips */}
              <div className="mt-4 pt-3.5 border-t border-black/[0.04] flex items-start gap-2 text-xs text-opora-text/75 leading-normal relative z-10">
                <Info size={14} className="text-opora-sage shrink-0 mt-0.5" />
                <p>
                  <strong>Рекомендация:</strong> Все оригиналы и копии документов лучше сложить в отдельную пластиковую папку-органайзер заранее. На комиссию ПМПК обязательно приходите в спокойном настроении, так как детки чутко сканируют состояние мамы или папы. Вы справитесь!
                </p>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ПМПК FAQ Accordion Component */}
      {activeCategory === 'pmpk' && (
        <div className="px-6 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 relative overflow-hidden text-left">
          {/* Decorative backdrop */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-opora-sage/5 rounded-full translate-x-1/3 translate-y-1/3 blur-xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-2.5 mb-4 relative z-10 w-full">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-opora-sand rounded-xl text-opora-navy shrink-0">
                <HelpCircle size={18} className="text-opora-sage stroke-[2.25]" />
              </div>
              <div>
                <h3 className="font-serif text-[17px] font-bold text-opora-navy leading-snug">
                  Частые вопросы о ПМПК
                </h3>
                <p className="text-[10px] text-opora-sage font-bold tracking-wider uppercase mt-0.5">
                  Ответы и база знаний Казахстана
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrintFaq}
                className="flex items-center gap-1 px-3 py-1.5 bg-opora-sand hover:bg-opora-sage/10 text-opora-navy rounded-xl border border-black/[0.04] text-xs font-semibold transition-all active:scale-95 group"
                title="Открыть чистую версию для печати"
              >
                <Printer size={13} className="text-opora-sage group-hover:text-opora-navy transition-colors" />
                <span>Печать FAQ</span>
              </button>
              
              <button
                type="button"
                onClick={handleShareFaq}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-100/55 text-xs font-semibold transition-all active:scale-95 group"
                title="Поделиться текстом FAQ"
              >
                <Share2 size={13} className="text-rose-500 group-hover:text-rose-700 transition-colors" />
                <span>Поделиться</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {[
              {
                q: "Зачем нужно проходить ПМПК в Казахстане?",
                a: "ПМПК — это государственный «ключ» к бесплатной помощи. Только с этим заключением вашего ребенка смогут бесплатно принять в специальные детские сады, КППК (Кабинеты коррекции), реабилитационные центры, а также предоставить бесплатного ассистента (тьютора) в школе и специальные условия обучения."
              },
              {
                q: "Как записаться на комиссию и долго ли ждать очереди?",
                a: "Запись проходит онлайн через портал **eGov.kz** (услуга «Запись на прием в ПМПК») или при личном визите в региональное отделение. Очереди могут составлять от нескольких недель до 2-3 месяцев, поэтому рекомендуем бронировать дату заранее, параллельно собирая справки у педиатра."
              },
              {
                q: "Может ли ПМПК поставить окончательный диагноз?",
                a: "Нет, ПМПК дает исключительно **педагогическое заключение**, определяющее программу обучения ребенка. Окончательный медицинский диагноз в Казахстане имеет право устанавливать только детский врач-психиатр. Комиссия лишь подтверждает особые образовательные потребности."
              },
              {
                q: "Что происходит на самой комиссии? Стоит ли бояться?",
                a: "Бояться не стоит — это больше похоже на игру. Специалисты (логопед, дефектолог, психолог) в бережной форме понаблюдают, как ребенок собирает пирамидку, реагирует на просьбы, общается или использует жесты. Они оценивают уровень развития, чтобы подобрать подходящую программу."
              },
              {
                q: "Обязан ли я строго следовать рекомендациям ПМПК?",
                a: "Для родителей заключение ПМПК носит **рекомендательный характер** — вы полностью свободны выбирать, идти ли в предложенный спецсадик/класс или остаться дома. Однако для всех образовательных учреждений заключение является **обязательным к исполнению**: садик или школа обязаны создать все необходимые условия."
              },
              {
                q: "На какой срок выдается заключение и что делать дальше?",
                a: "Обычно заключение выдается на определенную возрастную ступень (например, дошкольный возраст до 6-7 лет) либо на 1 академический год для отслеживания динамики. По истечении этого срока или при переходе из детского сада в школу комиссию ПМПК проходят повторно."
              }
            ].map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="border-b border-black/[0.03] last:border-0 pb-3 last:pb-0"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-start gap-3 py-1 text-left focus:outline-none group select-none"
                  >
                    <span className="text-sm font-semibold text-opora-navy group-hover:text-opora-sage transition-colors leading-snug">
                      {item.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-0.5 shrink-0 text-opora-sage"
                    >
                      <ChevronDown size={16} className="stroke-[2.5]" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 text-[13px] text-opora-text/95 leading-relaxed bg-opora-sand/35 p-3 rounded-xl mt-1.5 border border-black/[0.01]">
                          <Markdown>{item.a}</Markdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

      {activeCategory === 'friendly' && (
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="text-emerald-500" size={18} />
              <h2 className="font-serif text-lg font-semibold text-opora-navy">Дружелюбная среда</h2>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <MapPin size={64} />
            </div>
            
            <p className="text-sm text-opora-text leading-relaxed relative z-10 w-4/5">
              Мы собираем кафе, игровые и парикмахерские, где не посмотрят косо и знают об особенностях деток.
            </p>
            
            <div className="pt-2 relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 bg-opora-sand/50 rounded-xl border border-black/5">
                <div className="p-2 bg-white rounded-lg shadow-xs"><MapPin size={16} className="text-emerald-600"/></div>
                <div>
                  <p className="text-sm font-bold text-opora-navy">Барбершоп "Стриж"</p>
                  <p className="text-xs text-opora-text mt-0.5">Тихие триммеры, играют на ковре</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-opora-sand/50 rounded-xl border border-black/5">
                <div className="p-2 bg-white rounded-lg shadow-xs"><MapPin size={16} className="text-emerald-600"/></div>
                <div>
                  <p className="text-sm font-bold text-opora-navy">Кафе "Малышарики"</p>
                  <p className="text-xs text-opora-text mt-0.5">Тихая зона, можно со своей едой (БГБК)</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 relative z-10">
              <button 
                onClick={() => {
                  const navButton = document.querySelector('nav button:nth-child(3)') as HTMLButtonElement | null;
                  if (navButton) navButton.click();
                }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-bold py-3.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors active:scale-[0.98]"
              >
                Все места на карте
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'science' && (
        <div className="px-6 mb-8">
          <SciencePulse />
        </div>
      )}

      {activeCategory === 'podcasts' && (
        <div className="px-6 mb-8">
          <div className="mb-4 rounded-2xl border border-black/5 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-800/95">
            <div className="mb-2 flex items-center gap-2">
              <Volume2 size={18} className="text-opora-sage" />
              <h2 className="font-serif text-lg font-semibold text-opora-navy dark:text-slate-50">Подкасты о РАС на русском</h2>
            </div>
            <p className="text-sm leading-relaxed text-opora-text dark:text-slate-300">
              Аудио для родителей: живой опыт, инклюзия, принятие и маршруты помощи. Это не медицинское назначение, а спокойный способ узнать больше, когда читать тяжело.
            </p>
            {podcastPlayerNote && (
              <div className="mt-3 rounded-xl bg-opora-sage/10 p-3 text-xs font-bold text-opora-navy dark:bg-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <span>{podcastPlayerNote}</span>
                  <button
                    type="button"
                    onClick={stopPodcast}
                    className="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold text-opora-navy dark:bg-slate-800 dark:text-slate-100"
                  >
                    Стоп
                  </button>
                </div>
                {podcastDuration > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-opora-text dark:text-slate-300">
                      <span>{formatPodcastTime(podcastCurrentTime)}</span>
                      <span>{formatPodcastTime(podcastDuration)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={podcastDuration || 0}
                      value={Math.min(podcastCurrentTime, podcastDuration || podcastCurrentTime)}
                      onChange={event => {
                        if (!podcastAudioRef.current) return;
                        const next = Number(event.target.value);
                        podcastAudioRef.current.currentTime = next;
                        setPodcastCurrentTime(next);
                      }}
                      className="w-full accent-opora-sage"
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => seekPodcast(-15)}
                        className="rounded-lg bg-white px-2 py-2 text-[10px] font-extrabold text-opora-navy dark:bg-slate-800 dark:text-slate-100"
                      >
                        -15 сек
                      </button>
                      <button
                        type="button"
                        onClick={() => seekPodcast(30)}
                        className="rounded-lg bg-white px-2 py-2 text-[10px] font-extrabold text-opora-navy dark:bg-slate-800 dark:text-slate-100"
                      >
                        +30 сек
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {RUSSIAN_ASD_PODCASTS.map(podcast => {
              const episodes = podcastEpisodes[podcast.id] || [];
              return (
                <div
                  key={podcast.id}
                  className="block rounded-2xl border border-black/5 bg-white p-4 transition-all active:scale-[0.99] dark:border-white/10 dark:bg-slate-800"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-opora-sage/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-opora-sage">
                        {podcast.tone}
                      </span>
                      <h3 className="mt-2 text-base font-extrabold leading-tight text-opora-navy dark:text-slate-50">{podcast.title}</h3>
                      <p className="mt-1 text-[11px] font-bold text-opora-text/65 dark:text-slate-400">
                        {podcast.source} · {episodes.length ? `${episodes.length} RSS выпусков` : podcast.duration}
                      </p>
                    </div>
                    <span className="rounded-xl bg-opora-sand px-3 py-2 text-lg dark:bg-slate-900">🎧</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavoritePodcast(podcast.id)}
                    className={cn(
                      'mb-3 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold transition-all',
                      favoritePodcastIds.includes(podcast.id)
                        ? 'bg-opora-peach text-opora-navy'
                        : 'bg-opora-sand/70 text-opora-navy dark:bg-slate-900 dark:text-slate-100'
                    )}
                  >
                    <Bookmark size={13} className={favoritePodcastIds.includes(podcast.id) ? 'fill-opora-navy text-opora-navy' : ''} />
                    {favoritePodcastIds.includes(podcast.id) ? 'В избранном' : 'В избранное'}
                  </button>
                  <p className="text-sm leading-relaxed text-opora-text dark:text-slate-300">{podcast.summary}</p>
                  <div className="mt-3 rounded-xl bg-opora-sand/55 p-3 text-xs leading-relaxed text-opora-text dark:bg-slate-900/70 dark:text-slate-300">
                    {podcast.bestFor}
                  </div>

                  <div className="mt-3 space-y-2">
                    {episodes.length ? episodes.slice(0, 3).map(episode => {
                      const playbackId = `${podcast.id}:${episode.id}`;
                      return (
                        <div key={episode.id} className="rounded-xl border border-black/5 bg-opora-sand/45 p-3 dark:border-white/10 dark:bg-slate-900/70">
                          <p className="text-xs font-extrabold leading-tight text-opora-navy dark:text-slate-50">{episode.title}</p>
                          {episode.summary && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-opora-text dark:text-slate-300">{episode.summary}</p>}
                          <button
                            type="button"
                            onClick={() => playPodcastEpisode(podcast, episode)}
                            className={cn(
                              'mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-all',
                              activePodcastId === playbackId ? 'bg-opora-peach text-opora-navy' : 'bg-opora-navy text-white'
                            )}
                          >
                            {activePodcastId === playbackId ? 'Пауза' : 'Слушать RSS выпуск'}
                            <Volume2 size={13} />
                          </button>
                        </div>
                      );
                    }) : (
                      <div className="rounded-xl border border-dashed border-black/10 bg-opora-sand/35 p-3 text-xs leading-relaxed text-opora-text dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                        {isPodcastLoading ? 'Подтягиваю RSS выпуски...' : 'RSS/mp3 для этого источника пока не подключен. Можно открыть площадку и слушать там.'}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openPodcastExternal(podcast.url)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-black/5 bg-opora-sand/60 px-3 py-2.5 text-xs font-extrabold text-opora-navy dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  >
                    Открыть источник <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Separate Category: USA Treatment Innovations and Research */}
      {activeCategory === 'science' && (
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-opora-sage animate-pulse" size={18} />
          <h2 className="font-serif text-lg font-semibold text-opora-navy">Доказательные подходы</h2>
        </div>
        
        <p className="text-sm text-opora-text/90 mb-4 leading-relaxed bg-white/50 p-4 rounded-2xl border border-black/[0.02]">
          Не обещания “вылечить аутизм”, а подходы помощи, которые стоит обсуждать со специалистом: развитие коммуникации, навыков, сна, адаптации и снижение перегрузки.
        </p>

        <div className="space-y-3.5">
          {ARTICLES_DATABASE.filter(a => a.category === "Доказательные подходы").map((article) => {
            const isBookmarked = savedArticles.includes(article.id);
            return (
              <div 
                key={article.id}
                onClick={() => openArticle(article.id)}
                className="bg-white hover:bg-opora-sand p-4.5 rounded-2xl border border-black/5 hover:border-opora-sage/40 transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                {/* Visual Ambient Element */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-opora-sage/5 rounded-full translate-x-1/4 -translate-y-1/4"></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="inline-block text-[11px] font-bold text-opora-navy bg-opora-sage/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Доказательная база
                  </span>
                  <span className="text-xs text-opora-text/60 font-medium">{article.readTime}</span>
                </div>

                <h3 className="font-semibold text-sm text-opora-navy mb-1.5 leading-snug group-hover:text-opora-sage transition-colors relative z-10">
                  {article.title}
                </h3>
                
                <p className="text-[11px] text-opora-text/80 line-clamp-2 leading-relaxed mb-3 relative z-10">
                  {article.summary}
                </p>

                <div className="flex justify-between items-center pt-2.5 border-t border-black/[0.03] relative z-10">
                  <span className="text-xs font-bold text-opora-sage group-hover:underline flex items-center gap-1.5">
                    Читать исследование <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveArticle(article.id);
                    }}
                    className={`p-1.5 rounded-xl transition-colors ${
                      isBookmarked ? 'text-opora-navy bg-opora-sand' : 'text-black/30 hover:text-opora-navy'
                    }`}
                  >
                    <Bookmark size={13} className={isBookmarked ? "fill-opora-navy text-opora-navy" : ""} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* Main Roadmap */}
      {activeCategory === 'route' && (
        <div className="flex-1 px-6 relative pb-10">
        <div className="absolute left-[39px] top-4 bottom-20 w-[2px] bg-black/5" />
        
        <div className="space-y-6 relative z-10">
          {STAGES.map((stage) => {
            const stageState = getStageState(stage.matchingStatus, stage.id);
            return (
              <div key={stage.id} className="flex gap-4">
                
                {/* Left Indicator Ball */}
                <div className="flex flex-col items-center pt-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border-2 transition-all ${
                    stageState === 'completed' ? 'border-green-500 text-green-500 bg-green-50/50' : 
                    stageState === 'current' ? 'border-opora-navy text-opora-navy scale-110 shadow-md' : 
                    'border-black/5 text-black/20'
                  }`}>
                    {stageState === 'completed' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <span className="text-sm font-bold font-serif">{stage.id}</span>
                    )}
                  </div>
                </div>
                
                {/* Main Card */}
                <div className={`flex-1 rounded-2xl p-5 transition-all ${
                  stageState === 'current' ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-opora-sage/30' : 
                  'bg-white/40 border border-transparent opacity-65'
                }`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className={`font-medium text-base flex items-center gap-1.5 ${stageState === 'current' ? 'text-opora-navy font-semibold' : 'text-opora-text'}`}>
                      {stage.title}
                      {stageState === 'current' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-opora-sage/15 text-opora-navy">
                          Текущий этап
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-opora-text/90 leading-relaxed mb-4">
                    {stage.desc}
                  </p>
                  
                  {/* Step Actionable Recommendations */}
                  <div className="space-y-2.5 mt-2">
                    {stage.articleIds.map((articleId) => {
                      const article = ARTICLES_DATABASE.find(a => a.id === articleId);
                      if (!article) return null;
                      
                      const isBookmarked = savedArticles.includes(articleId);
                      const isRead = readArticles.includes(articleId);

                      return (
                        <div 
                          key={articleId}
                          onClick={() => openArticle(articleId)}
                          className="flex items-center justify-between w-full p-3 bg-opora-sand hover:bg-black/5 rounded-2xl transition-all text-sm text-opora-navy cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReadArticle(articleId);
                              }}
                              className="p-1 hover:bg-black/[0.04] rounded-xl transition-colors shrink-0"
                              title={isRead ? "Отметить как непрочитанное" : "Отметить как пройденное"}
                            >
                              {isRead ? (
                                <CheckCircle2 size={16} className="text-opora-sage fill-opora-sage/10 font-bold" />
                              ) : (
                                <Circle size={16} className="text-black/30 hover:text-opora-sage" />
                              )}
                            </button>
                            <div className="text-left">
                              <p className={`font-semibold line-clamp-1 ${isRead ? 'text-opora-text/60 line-through' : ''}`}>
                                {article.title}
                              </p>
                              <p className="text-xs text-opora-text/60 mt-0.5">Читать • {article.readTime}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveArticle(articleId);
                              }}
                              className={`p-1.5 rounded-xl transition-colors ${
                                isBookmarked ? 'text-opora-navy bg-white/60' : 'text-black/30 hover:text-opora-navy'
                              }`}
                            >
                              <Bookmark size={13} className={isBookmarked ? "fill-opora-navy text-opora-navy" : ""} />
                            </button>
                            <ArrowRight size={13} className="text-black/25 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage Progress Bar & Complete Action */}
                  {stageState === 'current' && (
                    <div className="mt-5 pt-4 border-t border-black/[0.04] space-y-4">
                      <div className="flex justify-between items-center text-xs font-semibold text-opora-navy">
                        <span>Прогресс этапа</span>
                        <span>{stage.articleIds.filter(id => readArticles.includes(id)).length} из {stage.articleIds.length} изучено</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-opora-sand rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-opora-sage" 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(stage.articleIds.filter(id => readArticles.includes(id)).length / stage.articleIds.length) * 100}%` 
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Complete Stage Button */}
                      <AnimatePresence mode="wait">
                        {stage.articleIds.every(id => readArticles.includes(id)) ? (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onClick={() => {
                              confetti({
                                particleCount: 150,
                                spread: 80,
                                origin: { y: 0.6 },
                                colors: ['#2A3C44', '#7D8C74', '#F4B9A7', '#D4A373']
                              });
                              setCelebratedStage({ id: stage.id, title: stage.title });
                            }}
                            className="w-full bg-opora-navy hover:bg-opora-navy/95 text-white font-medium text-sm py-2.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                          >
                            <Sparkles size={14} className="text-opora-peach animate-pulse" />
                            Завершить этап и двигаться дальше
                          </motion.button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-opora-sand/40 p-3 rounded-2xl border border-black/[0.02]"
                          >
                            <p className="text-xs text-opora-text/90 leading-normal">
                              🎯 Изучите и отметьте галочками все {stage.articleIds.length} {stage.articleIds.length === 1 ? 'обязательный шаг' : stage.articleIds.length < 5 ? 'обязательных шага' : 'обязательных шагов'} этого этапа, чтобы разблокировать переход дальше.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* Expandable Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-center items-end p-0"
            onClick={() => setSelectedArticleId(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-t-3xl w-full max-w-[390px] max-h-[85vh] overflow-y-auto px-6 pt-5 pb-10 shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <span className="text-sm font-semibold text-opora-sage tracking-wider uppercase">
                  {selectedArticle.category} • {selectedArticle.readTime}
                </span>
                <button 
                  onClick={() => setSelectedArticleId(null)}
                  className="p-1 hover:bg-opora-sand rounded-full text-opora-navy"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="font-serif text-xl font-semibold text-opora-navy leading-snug">
                {selectedArticle.title}
              </h3>

              <p className="text-sm text-opora-text p-3 bg-opora-peach/30 rounded-2xl leading-relaxed italic">
                {selectedArticle.summary}
              </p>

              <div className="text-sm text-opora-navy space-y-4 leading-relaxed font-sans markdown-body">
                <Markdown components={{
                  a: ({node, ...props}) => <a {...props} className="text-opora-sage underline hover:text-opora-navy font-semibold" target="_blank" rel="noopener noreferrer" />
                }}>
                  {selectedArticle.content}
                </Markdown>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => {
                    toggleSaveArticle(selectedArticle.id);
                  }}
                  className="w-full bg-opora-navy text-white text-sm font-medium py-3 rounded-2xl hover:bg-opacity-95 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Bookmark size={14} className={savedArticles.includes(selectedArticle.id) ? "fill-white shrink-0" : "shrink-0"} />
                  {savedArticles.includes(selectedArticle.id) ? "Убрать из закладок" : "Сохранить материал"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm flex justify-center items-end"
            onClick={() => setActiveTemplate(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26 }}
              className="bg-white rounded-t-3xl w-full max-w-[390px] max-h-[82vh] overflow-y-auto px-6 pt-5 pb-10 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start pb-2 border-b border-black/5">
                <div>
                  <span className="text-[10px] font-extrabold text-opora-sage uppercase tracking-wider">{activeTemplate.category}</span>
                  <h3 className="font-serif text-lg font-semibold text-opora-navy mt-1">{activeTemplate.title}</h3>
                </div>
                <button
                  type="button"
                  aria-label="Закрыть шаблон сообщения"
                  onClick={() => setActiveTemplate(null)}
                  className="p-1 hover:bg-opora-sand rounded-full text-opora-navy"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-opora-sand/60 rounded-2xl p-4 border border-black/5">
                <p className="text-sm text-opora-navy whitespace-pre-wrap leading-relaxed">{templatePreview}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyText(templatePreview, 'Шаблон сообщения уже в буфере обмена.')}
                  className="w-full bg-opora-sand text-opora-navy text-sm font-semibold py-3 rounded-2xl"
                >
                  Скопировать
                </button>
                <button
                  type="button"
                  onClick={() => shareText(activeTemplate.title, templatePreview, 'Шаблон сообщения можно отправить дальше.')}
                  className="w-full bg-opora-navy text-white text-sm font-semibold py-3 rounded-2xl"
                >
                  Поделиться
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeVisitCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[106] bg-black/40 backdrop-blur-sm flex justify-center items-end"
            onClick={() => setActiveVisitCard(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26 }}
              className="bg-white rounded-t-3xl w-full max-w-[390px] max-h-[86vh] overflow-y-auto px-6 pt-5 pb-10 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start pb-2 border-b border-black/5">
                <div>
                  <span className="text-[10px] font-extrabold text-opora-sage uppercase tracking-wider">Карточка приема</span>
                  <h3 className="font-serif text-lg font-semibold text-opora-navy mt-1">{activeVisitCard.title}</h3>
                </div>
                <button
                  type="button"
                  aria-label="Закрыть карточку приема"
                  onClick={() => setActiveVisitCard(null)}
                  className="p-1 hover:bg-opora-sand rounded-full text-opora-navy"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-opora-peach/35 rounded-2xl p-4 border border-opora-sage/15">
                <p className="text-sm text-opora-navy leading-relaxed">{activeVisitCard.summary}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-black/5 rounded-2xl p-4">
                  <p className="text-[11px] font-extrabold text-opora-sage uppercase tracking-wider mb-2">Что важно учитывать</p>
                  <div className="space-y-2">
                    {activeVisitCard.sensoryNotes.map(note => (
                      <p key={note} className="text-sm text-opora-navy leading-relaxed">- {note}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-4">
                  <p className="text-[11px] font-extrabold text-opora-sage uppercase tracking-wider mb-2">Как общаться</p>
                  <div className="space-y-2">
                    {activeVisitCard.communicationNotes.map(note => (
                      <p key={note} className="text-sm text-opora-navy leading-relaxed">- {note}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-4">
                  <p className="text-[11px] font-extrabold text-opora-sage uppercase tracking-wider mb-2">Просьба родителя</p>
                  <p className="text-sm text-opora-navy leading-relaxed">{activeVisitCard.parentRequest}</p>
                  {!!activeVisitCard.rewardNotes.length && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100">
                      {activeVisitCard.rewardNotes.map(note => (
                        <p key={note} className="text-xs font-semibold text-emerald-800">{note}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyText(visitCardText(activeVisitCard), 'Карточка приема уже в буфере обмена.')}
                  className="w-full bg-opora-sand text-opora-navy text-sm font-semibold py-3 rounded-2xl"
                >
                  Скопировать
                </button>
                <button
                  type="button"
                  onClick={() => shareText(activeVisitCard.title, visitCardText(activeVisitCard), 'Карточкой приема можно поделиться с врачом.')}
                  className="w-full bg-opora-navy text-white text-sm font-semibold py-3 rounded-2xl"
                >
                  Поделиться
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Modal */}
      <AnimatePresence>
        {celebratedStage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-opora-navy/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => {
              handleCompleteStage(celebratedStage.id);
              setCelebratedStage(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-[340px] text-center space-y-5 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-opora-peach/20 rounded-full -translate-y-1/2 blur-xl"></div>
              
              <div className="mx-auto w-16 h-16 bg-opora-peach/30 rounded-full flex items-center justify-center relative z-10">
                <Sparkles className="text-opora-navy w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2 relative z-10">
                <h3 className="font-serif text-lg font-bold text-opora-navy">Этап «{celebratedStage.title}» пройден! 🎉</h3>
                <p className="text-sm text-opora-text/90 leading-relaxed font-sans">
                  Потрясающе! Вы делаете огромную работу для {profile.childName}. Шаг за шагом, получая проверенную информацию, вы строите надежную опору.
                </p>
              </div>

              <button 
                onClick={() => {
                  handleCompleteStage(celebratedStage.id);
                  setCelebratedStage(null);
                }}
                className="w-full bg-opora-navy hover:bg-opacity-95 text-white text-sm font-semibold py-3 rounded-2xl transition-all relative z-10 shadow-sm"
              >
                {celebratedStage.id === 4 ? "Прекрасно!" : "Перейти на следующий этап"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warm Floating Notification Indicator */}
      <AnimatePresence>
        {showPushToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] w-[90%] max-w-sm bg-opora-navy text-white px-4 py-3.5 rounded-2xl shadow-xl border border-white/10 flex items-start gap-3"
          >
            <div className="p-1.5 bg-white/10 rounded-xl text-opora-peach shrink-0 mt-0.5 animate-bounce">
               <BellRing size={16} />
            </div>
            <div className="flex-grow text-left">
               <p className="text-xs font-bold text-white leading-tight">Бережное напоминание • Опора</p>
               <p className="text-[11px] text-white/80 mt-1 leading-normal">{pushToastContent}</p>
            </div>
            <button 
               onClick={() => setShowPushToast(false)}
               className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 shrink-0"
            >
               <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

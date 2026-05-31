import React, { createContext, useContext, useState, useEffect } from 'react';

export type DiagnosticStatus = 
  | "Только подозреваем" 
  | "В процессе диагностики" 
  | "Диагноз подтвержден" 
  | "Проходим адаптацию и подбор терапии";

export type AppRole = 'parent' | 'doctor';

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: string;
}

export interface DiaryEntry {
  id: string;
  childId: string;
  date: string;
  content: string;
}

export interface ParentJournalEntry {
  id: string;
  date: string;
  moodOption: string;
  burnoutScore: number;
  difficulties: string;
}

export interface TherapySession {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD format is best for matching
  type: string;
  completed: boolean;
}

export interface SensoryPassportData {
  soundSensitivity: string[];
  lightSensitivity: string[];
  tactileSensitivity: string[];
  communicationStyle: string;
  comfortTriggers: string;
  favoriteReward: string;
}

export interface MedicalBooking {
  id: string;
  childId: string;
  childName: string;
  doctorId: number;
  doctorName: string;
  doctorTitle: string;
  doctorCity: string;
  date: string;
  time: string;
  sensoryPassport: SensoryPassportData;
  status: 'confirmed' | 'completed';
}

export interface DoctorCareRequest {
  id: string;
  childId: string;
  childName: string;
  childAge: number;
  doctorId: number;
  doctorName: string;
  doctorTitle: string;
  doctorCity: string;
  requestedAt: string;
  doctorAcceptedAt?: string;
  firstConsultAt?: string;
  parentConfirmedAt?: string;
  status: 'parent_requested' | 'doctor_accepted' | 'first_consult_done' | 'full_access' | 'declined';
  parentNote?: string;
}

export interface AccessAuditLog {
  id: string;
  actorRole: AppRole;
  actorName: string;
  action: 'request_created' | 'doctor_accepted' | 'first_consult_done' | 'parent_confirmed_access' | 'request_declined' | 'booking_created';
  childId: string;
  doctorId?: number;
  requestId?: string;
  createdAt: string;
  note: string;
}

export interface ChildProgressEntry {
  id: string;
  childId: string;
  date: string;
  type: 'success' | 'trigger' | 'routine' | 'note';
  title: string;
  details: string;
  tags: string[];
  energy?: 1 | 2 | 3 | 4 | 5;
}

export interface ParentTask {
  id: string;
  childId: string;
  title: string;
  description: string;
  category: 'documents' | 'therapy' | 'school' | 'medical' | 'home';
  status: 'todo' | 'done';
  dueDate?: string;
  completedAt?: string;
  source: 'system' | 'manual';
  relatedBookingId?: string;
}

export interface MessageTemplate {
  id: string;
  category: 'doctor' | 'pmpk' | 'school' | 'family' | 'public_place';
  title: string;
  body: string;
  variables: string[];
}

export interface VisitCardDraft {
  id: string;
  childId: string;
  bookingId?: string;
  title: string;
  summary: string;
  sensoryNotes: string[];
  communicationNotes: string[];
  rewardNotes: string[];
  parentRequest: string;
  generatedAt: string;
}

export interface ProfileData {
  id: string;
  childName: string;
  childAge: number; // in years
  diagnosticStatus: DiagnosticStatus;
  userCity: string;
  sensoryPassport?: SensoryPassportData;
}

interface ProfileContextType {
  appRole: AppRole;
  setAppRole: (role: AppRole) => void;
  profile: ProfileData;
  profiles: ProfileData[];
  activeProfileId: string;
  switchProfile: (id: string) => void;
  addProfile: (data: Omit<ProfileData, 'id'>) => string;
  updateProfile: (data: Partial<ProfileData>) => void;
  updateProfileById: (id: string, data: Partial<ProfileData>) => void;
  deleteProfile: (id: string) => void;
  savedArticles: string[]; // array of article ids
  toggleSaveArticle: (id: string) => void;
  savedCenters: number[]; // array of center ids
  toggleSaveCenter: (id: number) => void;
  readArticles: string[]; // array of read/completed article ids
  toggleReadArticle: (id: string) => void;
  diaryEntries: DiaryEntry[];
  addDiaryEntry: (childId: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;
  parentJournalEntries: ParentJournalEntry[];
  addParentJournalEntry: (entry: Omit<ParentJournalEntry, 'id' | 'date'>) => void;
  deleteParentJournalEntry: (id: string) => void;
  therapySessions: TherapySession[];
  toggleTherapySession: (childId: string, date: string, type: string) => void;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Medical bookings and sensory passport methods
  medicalBookings: MedicalBooking[];
  addMedicalBooking: (booking: Omit<MedicalBooking, 'id' | 'status'>) => void;
  cancelMedicalBooking: (id: string) => void;
  doctorCareRequests: DoctorCareRequest[];
  createDoctorCareRequest: (request: Omit<DoctorCareRequest, 'id' | 'requestedAt' | 'status'>) => void;
  doctorAcceptCareRequest: (id: string) => void;
  doctorCompleteFirstConsult: (id: string) => void;
  parentConfirmDoctorAccess: (id: string) => void;
  declineDoctorCareRequest: (id: string) => void;
  accessAuditLogs: AccessAuditLog[];
  updateSensoryPassport: (childId: string, data: SensoryPassportData) => void;
  progressEntries: ChildProgressEntry[];
  addProgressEntry: (entry: Omit<ChildProgressEntry, 'id' | 'date'>) => void;
  updateProgressEntry: (id: string, entry: Partial<ChildProgressEntry>) => void;
  deleteProgressEntry: (id: string) => void;
  parentTasks: ParentTask[];
  addParentTask: (task: Omit<ParentTask, 'id' | 'status' | 'source'>) => void;
  toggleParentTask: (task: ParentTask) => void;
  deleteParentTask: (id: string) => void;
  getRecommendedTasksForProfile: (profile: ProfileData) => ParentTask[];
  messageTemplates: MessageTemplate[];
  renderTemplate: (templateId: string, variables: Record<string, string>) => string;
  visitCards: VisitCardDraft[];
  createVisitCardFromBooking: (bookingId: string) => VisitCardDraft;
  createVisitCardForChild: (childId: string) => VisitCardDraft;
}

const DEFAULT_SENSORY_PASSPORT: SensoryPassportData = {
  soundSensitivity: ["headphones", "breaks"],
  lightSensitivity: ["sunglasses"],
  tactileSensitivity: ["tell-show-do"],
  communicationStyle: "simple-words",
  comfortTriggers: "Успокаивается, удерживая в руках любимую силиконовую игрушку-динозавра.",
  favoriteReward: "Маленькая машинка или светящаяся наклейка на руку."
};

const DEFAULT_PROFILE: ProfileData = {
  id: "default-child-1",
  childName: "Алишер",
  childAge: 3,
  diagnosticStatus: "В процессе диагностики",
  userCity: "Алматы",
  sensoryPassport: DEFAULT_SENSORY_PASSPORT
};

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'doctor_first_visit',
    category: 'doctor',
    title: 'Врачу перед первым приемом',
    body: `Здравствуйте. Мы придем на прием с {{childName}}, {{childAge}} лет. У ребенка есть особенности сенсорного восприятия и коммуникации. Для спокойного приема очень помогают: {{comfortTriggers}}. Буду благодарна, если получится говорить короткими фразами и заранее показывать инструменты. Спасибо за бережный подход.`,
    variables: ['childName', 'childAge', 'comfortTriggers']
  },
  {
    id: 'pmpk_clarification',
    category: 'pmpk',
    title: 'Уточнение по ПМПК',
    body: `Здравствуйте. Подскажите, пожалуйста, какие документы сейчас актуальны для прохождения ПМПК для ребенка {{childName}}, {{childAge}} лет, статус: {{diagnosticStatus}}. Также буду благодарна, если подскажете ближайшие доступные даты записи.`,
    variables: ['childName', 'childAge', 'diagnosticStatus']
  },
  {
    id: 'school_support',
    category: 'school',
    title: 'Сообщение в школу или сад',
    body: `Здравствуйте. Хочу заранее поделиться важной информацией о {{childName}}. Ребенку проще адаптироваться, когда инструкции короткие и понятные, а изменения происходят постепенно. В стрессовой ситуации особенно помогают: {{comfortTriggers}}. Буду благодарна за спокойный контакт и короткую обратную связь по дню.`,
    variables: ['childName', 'comfortTriggers']
  },
  {
    id: 'family_explainer',
    category: 'family',
    title: 'Родственнику, который не понимает ситуацию',
    body: `Мне важно поделиться: особенности {{childName}} — это не избалованность и не вопрос воспитания. Сейчас нам особенно помогает спокойствие, предсказуемость и уважение к перегрузке ребенка. Самое ценное для нас сейчас — меньше оценок и больше поддержки.`,
    variables: ['childName']
  },
  {
    id: 'public_place_help',
    category: 'public_place',
    title: 'Персоналу в общественном месте',
    body: `Здравствуйте. У ребенка сейчас сенсорная перегрузка. Нам очень поможет тихое место, немного времени и минимум дополнительных вопросов. Спасибо за понимание и спокойное сопровождение.`,
    variables: []
  }
];

const STATUS_TASK_LIBRARY: Record<DiagnosticStatus, Omit<ParentTask, 'childId' | 'status'>[]> = {
  "Только подозреваем": [
    {
      id: 'system-suspect-observations',
      title: 'Зафиксировать наблюдения за 3 дня',
      description: 'Коротко записать, что тревожит: реакция на имя, жесты, сенсорные реакции и сон.',
      category: 'medical',
      source: 'system'
    },
    {
      id: 'system-suspect-first-consult',
      title: 'Записаться на первую консультацию',
      description: 'Выбрать специалиста или центр раннего маршрута и поставить дату первого разговора.',
      category: 'medical',
      source: 'system'
    }
  ],
  "В процессе диагностики": [
    {
      id: 'system-diagnostics-docs',
      title: 'Собрать ключевые документы для ПМПК',
      description: 'Проверить форму 112/у, заключения узких специалистов и удостоверение родителя.',
      category: 'documents',
      source: 'system'
    },
    {
      id: 'system-diagnostics-questions',
      title: 'Подготовить вопросы врачам',
      description: 'Собрать 3-5 вопросов, чтобы на приеме не держать все в голове.',
      category: 'medical',
      source: 'system'
    }
  ],
  "Диагноз подтвержден": [
    {
      id: 'system-confirmed-passport',
      title: 'Заполнить сенсорный паспорт',
      description: 'Зафиксировать триггеры, способы коммуникации и то, что помогает успокоиться.',
      category: 'home',
      source: 'system'
    },
    {
      id: 'system-confirmed-support',
      title: 'Выбрать первый формат поддержки',
      description: 'Определиться, что сейчас полезнее всего: логопед, ABA, сенсорика или домашняя адаптация.',
      category: 'therapy',
      source: 'system'
    }
  ],
  "Проходим адаптацию и подбор терапии": [
    {
      id: 'system-therapy-routine',
      title: 'Проверить расписание недели',
      description: 'Сверить занятия, время отдыха и один свободный вечер без перегруза.',
      category: 'therapy',
      source: 'system'
    },
    {
      id: 'system-therapy-progress',
      title: 'Зафиксировать один успех недели',
      description: 'Добавить в динамику даже маленький шаг вперед, чтобы видеть прогресс.',
      category: 'home',
      source: 'system'
    }
  ]
};

export const formatDiagnosticStatusLabel = (status: DiagnosticStatus) => status;

const mapCommunicationStyleLabel = (style: string) => {
  switch (style) {
    case 'simple-words':
      return 'Короткие и понятные пошаговые фразы';
    case 'visuals':
      return 'Визуальные карточки или расписание';
    case 'silence':
      return 'Минимум лишних слов и вопросов';
    case 'praise':
      return 'Много спокойной похвалы за сотрудничество';
    default:
      return style;
  }
};

const buildSensoryNotes = (passport?: SensoryPassportData) => {
  if (!passport) return ['Паспорт еще не заполнен, опираемся на спокойный темп и мягкую коммуникацию.'];
  const notes: string[] = [];
  if (passport.soundSensitivity.includes('headphones')) notes.push('При шуме помогают наушники.');
  if (passport.soundSensitivity.includes('breaks')) notes.push('Нужны паузы между шумными действиями.');
  if (passport.soundSensitivity.includes('music')) notes.push('Фоновая спокойная музыка может снижать тревогу.');
  if (passport.lightSensitivity.includes('sunglasses')) notes.push('Яркий свет лучше смягчить или предложить очки.');
  if (passport.lightSensitivity.includes('dimmed')) notes.push('Комфортнее при приглушенном освещении.');
  if (passport.lightSensitivity.includes('gradual')) notes.push('Резкие включения приборов лучше делать постепенно.');
  if (passport.tactileSensitivity.includes('tell-show-do')) notes.push('Помогает принцип Tell-Show-Do: показать и объяснить заранее.');
  if (passport.tactileSensitivity.includes('weighted-blanket')) notes.push('Глубокое давление или утяжеление могут успокаивать.');
  return notes.length ? notes : ['Лучше двигаться спокойно и без спешки, с мягким темпом приема.'];
};

export const ARTICLES_DATABASE: Article[] = [
  {
    id: "fda_ai_diagnostic",
    title: "ИИ как помощь врачу при оценке развития",
    category: "Доказательные подходы",
    readTime: "5 мин",
    summary: "ИИ может помогать структурировать наблюдения и материалы для врача, но не заменяет очную оценку специалиста.",
    content: "Некоторые цифровые инструменты помогают врачу быстрее собрать данные: анкеты родителей, короткие видео, наблюдения за реакцией на имя, совместным вниманием и коммуникацией.\n\n**Что важно:**\n1. ИИ не ставит диагноз самостоятельно.\n2. Отчет полезен как дополнительный материал для специалиста.\n3. Главная польза для семьи — не пропустить наблюдения и прийти на консультацию подготовленными.\n\nЕсли приложение анализирует видео или анкеты, результат должен звучать так: “обнаружены особенности, которые стоит обсудить со специалистом”, а не “у ребенка аутизм”."
  },
  {
    id: "esdm_california",
    title: "Развивающие игровые подходы: ESDM",
    category: "Доказательные подходы",
    readTime: "6 мин",
    summary: "Игровые развивающие подходы помогают маленьким детям тренировать коммуникацию, совместное внимание и бытовые навыки.",
    content: "ESDM — один из известных ранних развивающих подходов. Его смысл не в “исправлении ребенка”, а в обучении через игру, контакт и повседневные ситуации.\n\n**Что обычно тренируют:**\n- совместное внимание;\n- просьбы и коммуникацию;\n- подражание;\n- игру с взрослым;\n- гибкие переходы между действиями.\n\nТакой подход стоит обсуждать со специалистом раннего вмешательства, особенно если ребенок маленький и семье нужен мягкий план занятий дома и на терапии."
  },
  {
    id: "sleep_and_sdvg",
    title: "Сон, СДВГ и другие сопутствующие трудности",
    category: "Доказательные подходы",
    readTime: "5 мин",
    summary: "Лекарства не лечат основные симптомы РАС, но врач может помогать с сопутствующими состояниями: сном, тревогой, СДВГ, судорогами, самоагрессией.",
    content: "При РАС важно отдельно смотреть сопутствующие трудности: сон, тревожность, СДВГ, ЖКТ-дискомфорт, судороги, боль, регресс, самоагрессию.\n\n**Безопасная логика:**\n1. Сначала собрать наблюдения: сон, питание, поведение, триггеры, боль, лекарства.\n2. Обсудить с врачом, что именно мешает ребенку жить и учиться.\n3. Если нужна медикаментозная помощь, она назначается только очным врачом и только для конкретной сопутствующей проблемы.\n\nВажно: медикаменты не являются “лечением аутизма”."
  },
  {
    id: "red_flags",
    title: "Чек-лист: красные флаги у детей до 3 лет",
    category: "Диагностика",
    readTime: "4 мин",
    summary: "Перечень ключевых поведенческих маркеров, на которые стоит обратить внимание родителям.",
    content: "Этот перечень составлен на основе современных шкал M-CHAT-R и клинических рекомендаций. Обратите внимание на:\n1. Трудности с удержанием зрительного контакта (ребенок избегает взгляда или смотрит 'сквозь').\n2. Отсутствие указательного жеста (ребенок не показывает пальцем на то, что его интересует, до 1.5 лет).\n3. Отсутствие отклика на имя (при нормальном физическом слухе).\n4. Специфические движения (взмахи руками 'крылышками', хождение на носочках).\n5. Трудности в социальном взаимодействии (не разделяет радость с родителями).\nВажно: наличие одиночных признаков — не повод для паники, но весомый аргумент проконсультироваться у детского психиатра или невролога."
  },
  {
    id: "rights_kz",
    title: "Права в Казахстане: Квоты, ПМПК и Пособия",
    category: "Гос. поддержка",
    readTime: "6 мин",
    summary: "Пошаговый гид по оформлению документов, прохождению комиссии и получению льгот.",
    content: "Как получить поддержку в Казахстане:\n1. ПМПК (Психолого-медико-педагогическая консультация). Это обязательный шаг для получения бесплатных занятий в госучреждениях. Направление дает ваш педиатр.\n2. Статус инвалидности. Оформляется через МСЭ (Медико-социальную экспертизу) после официального заключения врача-психиатра.\n3. Пособия по инвалидности. Выплачиваются ежемесячно родителю или опекуну.\n4. Квоты на санаторное лечение и технические средства реабилитации.\nПомните: знание своих прав помогает существенно сэкономить ресурсы семьи."
  },
  {
    id: "aba_guide",
    title: "ABA-терапия: мифы и реальность для начинающих",
    category: "Терапия",
    readTime: "5 мин",
    summary: "Что такое прикладной анализ поведения и почему он считается золотым стандартом.",
    content: "Прикладной анализ поведения (ABA) — самый изученный метод помощи при аутизме. Основные принципы:\n- Дробление сложных навыков на поднавыки.\n- Позитивное подкрепление успехов ребенка.\n- Работа над нежелательным поведением через выявление его функции.\n- Постоянный сбор данных терапевтом.\nМиф: ABA — это дрессировка. Современный ABA-подход строится на игре (NET) и учитывает эмоциональное состояние ребенка."
  },
  {
    id: "sensory_integration",
    title: "Сенсорная диета дома: простые упражнения",
    category: "Адаптация",
    readTime: "7 мин",
    summary: "Как организовать пространство дома, чтобы снизить сенсорную перегрузку.",
    content: "Если у ребенка есть гиперчувствительность к звукам или запахам:\n1. Создайте домашний 'уголок тишины' с утяжеленным одеялом и мягким светом.\n2. Используйте шумоподавляющие наушники в поездках.\n3. Предлагайте вестибулярные игры (качание на фитболе, качели).\n4. Дозируйте тактильные материалы (крупы, кинетический песок).\nКонсультация квалифицированного эрготерапевта поможет составить точный профиль."
  },
  {
    id: "latest_research",
    title: "Доказательные подходы США: CDC, NIH и AAP",
    category: "Доказательные подходы",
    readTime: "8 мин",
    summary: "Актуальные данные американских медицинских институтов (CDC, NIH, AAP) о методах поддержки при аутизме.",
    content: "Современная доказательная медицина подчеркивает, что аутизм не \"лечится\" медикаментозно, однако существуют эффективные методы терапии, направленные на развитие навыков и социализацию.\n\n**1. CDC (Центры по контролю и профилактике заболеваний США)**\nCDC выделяет поведенческую терапию (особенно раннее вмешательство) как наиболее эффективный подход. Медикаменты могут применяться только для сопутствующих состояний (например, выраженная тревожность, проблемы со сном, СДВГ).\n[Подробнее на сайте CDC (на английском)](https://www.cdc.gov/ncbddd/autism/treatment.html)\n\n**2. NIH (Национальные институты здравоохранения США)**\nИсследования NIH подтверждают необходимость персонализированного подхода, сочетающего поведенческую терапию, логопедию и эрготерапию. Также активно исследуются и признаются генетические факторы аутизма.\n[Исследования на сайте NIH (на английском)](https://www.nichd.nih.gov/health/topics/autism/conditioninfo/treatments)\n\n**3. AAP (Американская академия педиатрии)**\nВ своих последних клинических рекомендациях AAP делает акцент на раннее выявление (скрининг в 18 и 24 месяца) и немедленное начало поведенческого вмешательства, даже не дожидаясь окончательного медицинского диагноза.\n[Рекомендации AAP (на английском)](https://publications.aap.org/pediatrics/article/145/1/e20193447/36971/Identification-Evaluation-and-Management-of)\n\n*Важно: всегда обсуждайте любые новые методы терапии с вашим лечащим врачом перед их применением. Не доверяйте методикам с 'гарантированным излечением', которые не подтверждены международным научным сообществом.*"
  },
  {
    id: "pecs_guide",
    title: "Как общаться с неговорящим ребенком (PECS)",
    category: "Терапия",
    readTime: "6 мин",
    summary: "Введение в систему карточек альтернативной коммуникации PECS.",
    content: "**Система общения с помощью обмена карточками (PECS)** — это всемирно признанный метод, позволяющий неговорящему ребенку выражать свои просьбы и потребности.\n\n**Главный миф**: «Если ребенок будет общаться карточками, он никогда не заговорит». \n**Правда**: Мировые исследования доказали, что карточки (или планшеты-коммуникаторы) наоборот стимулируют появление речи, так как снимают тревогу и разочарование ребенка, когда его не понимают.\n\n**С чего начать?**\nНе нужно сразу печатать 100 карточек. Начните с самых желанных предметов ребенка: любимое лакомство, планшет или качание. Суть в том, чтобы ребенок физически отдал карточку вам в обмен на желаемое. Для обучения первых этапов крайне желательно привлечь опытного ABA-инструктора."
  },
  {
    id: "burnout_parents",
    title: "Родительское выгорание: Как найти опору в себе",
    category: "Ресурс родителя",
    readTime: "4 мин",
    summary: "Практики самосострадания: почему забота о себе — это забота о ребенке.",
    content: "«Сначала наденьте кислородную маску на себя, затем на ребенка».\n\nИсследования показывают, что родители детей с РАС подвержены стрессу на уровне нейрофизиологии. **Жить в режиме хронического подвига — разрушительно.**\n\n**Три маленьких шага к ресурсу:**\n1. **Право на слабость**. Не вините себя за то, что вы устали или потеряли терпение. Это нормальная реакция психики на длительный стресс.\n2. **Микро-паузы**. Если нет возможности уйти на час, введите правило 10 минут абсолютной тишины в ванной. Пусть это станет непоколебимым ритуалом.\n3. **Комьюнити**. Изоляция усугубляет выгорание. Общение с «своими» — родителями, которые проходят тот же путь, — снижает уровень кортизола и дает мощнейшую поддержку."
  }
];

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appRole, setAppRoleState] = useState<AppRole>(() => {
    const saved = localStorage.getItem('opora_app_role');
    return saved === 'doctor' ? 'doctor' : 'parent';
  });

  const setAppRole = (role: AppRole) => {
    setAppRoleState(role);
  };

  const [profiles, setProfiles] = useState<ProfileData[]>(() => {
    const saved = localStorage.getItem('opora_profiles_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Migration of old single opora_profile
    const oldSaved = localStorage.getItem('opora_profile');
    if (oldSaved) {
      try {
        const parsedOld = JSON.parse(oldSaved);
        if (parsedOld && parsedOld.childName) {
          const migratedProfile: ProfileData = {
            id: parsedOld.id || 'default-child-1',
            ...parsedOld
          };
          return [migratedProfile];
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    return [DEFAULT_PROFILE];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const savedId = localStorage.getItem('opora_active_profile_id');
    if (savedId && savedId !== 'undefined') return savedId;
    return profiles[0]?.id || "default-child-1";
  });

  const [savedArticles, setSavedArticles] = useState<string[]>(() => {
    const saved = localStorage.getItem('opora_saved_articles');
    return saved ? JSON.parse(saved) : ["red_flags"]; // default saved for user delight
  });

  const [savedCenters, setSavedCenters] = useState<number[]>(() => {
    const saved = localStorage.getItem('opora_saved_centers');
    return saved ? JSON.parse(saved) : [1]; // default saved Asyl Miras
  });

  const [readArticles, setReadArticles] = useState<string[]>(() => {
    const saved = localStorage.getItem('opora_read_articles');
    return saved ? JSON.parse(saved) : [];
  });

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('opora_diary_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [parentJournalEntries, setParentJournalEntries] = useState<ParentJournalEntry[]>(() => {
    const saved = localStorage.getItem('opora_parent_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [therapySessions, setTherapySessions] = useState<TherapySession[]>(() => {
    const saved = localStorage.getItem('opora_therapy_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [medicalBookings, setMedicalBookings] = useState<MedicalBooking[]>(() => {
    const saved = localStorage.getItem('opora_medical_bookings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "sample-booking-1",
        childId: "default-child-1",
        childName: "Алишер",
        doctorId: 106,
        doctorName: "Даниил Ким",
        doctorTitle: "Детский особенный стоматолог, игровой терапевт",
        doctorCity: "Алматы",
        date: "2026-06-02",
        time: "11:00",
        sensoryPassport: DEFAULT_SENSORY_PASSPORT,
        status: "confirmed"
      }
    ];
  });

  const [doctorCareRequests, setDoctorCareRequests] = useState<DoctorCareRequest[]>(() => {
    const saved = localStorage.getItem('opora_doctor_care_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'care-request-default-1',
        childId: 'default-child-1',
        childName: 'Алишер',
        childAge: 3,
        doctorId: 106,
        doctorName: 'Даниил Ким',
        doctorTitle: 'Детский особенный стоматолог, игровой терапевт',
        doctorCity: 'Алматы',
        requestedAt: new Date().toISOString(),
        status: 'parent_requested',
        parentNote: 'Хотим сначала познакомиться и понять, подходит ли специалист ребенку.'
      }
    ];
  });

  const [accessAuditLogs, setAccessAuditLogs] = useState<AccessAuditLog[]>(() => {
    const saved = localStorage.getItem('opora_access_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [progressEntries, setProgressEntries] = useState<ChildProgressEntry[]>(() => {
    const saved = localStorage.getItem('opora_progress_entries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'progress-default-1',
        childId: 'default-child-1',
        date: new Date().toISOString(),
        type: 'success',
        title: 'Спокойно зашел в новое помещение',
        details: 'Сегодня Алишер легче вошел в кабинет и быстрее освоился рядом с новым взрослым.',
        tags: ['адаптация', 'кабинет'],
        energy: 3
      },
      {
        id: 'progress-default-2',
        childId: 'default-child-1',
        date: new Date(Date.now() - 86400000).toISOString(),
        type: 'trigger',
        title: 'Напрягся от яркой лампы',
        details: 'Стало заметно спокойнее, когда убрали прямой свет и дали паузу.',
        tags: ['свет', 'перегрузка'],
        energy: 2
      }
    ];
  });

  const [parentTasks, setParentTasks] = useState<ParentTask[]>(() => {
    const saved = localStorage.getItem('opora_parent_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [visitCards, setVisitCards] = useState<VisitCardDraft[]>(() => {
    const saved = localStorage.getItem('opora_visit_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [remoteProfileStateLoaded, setRemoteProfileStateLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('opora_app_role', appRole);
  }, [appRole]);
  useEffect(() => {
    localStorage.setItem('opora_medical_bookings', JSON.stringify(medicalBookings));
  }, [medicalBookings]);
  useEffect(() => {
    localStorage.setItem('opora_doctor_care_requests', JSON.stringify(doctorCareRequests));
  }, [doctorCareRequests]);
  useEffect(() => {
    localStorage.setItem('opora_access_audit_logs', JSON.stringify(accessAuditLogs));
  }, [accessAuditLogs]);

  useEffect(() => {
    let cancelled = false;
    const syncCareState = async () => {
      try {
        const [requestsResponse, auditResponse] = await Promise.all([
          fetch('/api/doctor-care/requests'),
          fetch('/api/access-audit-logs')
        ]);
        if (!requestsResponse.ok || !auditResponse.ok) return;
        const requestsData = await requestsResponse.json();
        const auditData = await auditResponse.json();
        if (cancelled) return;
        if (Array.isArray(requestsData.items)) {
          setDoctorCareRequests(requestsData.items);
        }
        if (Array.isArray(auditData.items)) {
          setAccessAuditLogs(auditData.items);
        }
      } catch (error) {
        console.warn('Care access API sync failed, local state is still available.', error);
      }
    };
    syncCareState();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    localStorage.setItem('opora_progress_entries', JSON.stringify(progressEntries));
  }, [progressEntries]);
  useEffect(() => {
    localStorage.setItem('opora_parent_tasks', JSON.stringify(parentTasks));
  }, [parentTasks]);
  useEffect(() => {
    localStorage.setItem('opora_visit_cards', JSON.stringify(visitCards));
  }, [visitCards]);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    const saved = localStorage.getItem('opora_onboarding_completed');
    return saved === 'true';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('opora_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile-state')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled) return;
        const state = data?.state;
        if (state && Array.isArray(state.profiles) && state.profiles.length) {
          setProfiles(state.profiles);
          setActiveProfileId(state.activeProfileId || state.profiles[0].id);
          setSavedArticles(Array.isArray(state.savedArticles) ? state.savedArticles : []);
          setSavedCenters(Array.isArray(state.savedCenters) ? state.savedCenters : []);
          setReadArticles(Array.isArray(state.readArticles) ? state.readArticles : []);
          setDiaryEntries(Array.isArray(state.diaryEntries) ? state.diaryEntries : []);
          setParentJournalEntries(Array.isArray(state.parentJournalEntries) ? state.parentJournalEntries : []);
          setTherapySessions(Array.isArray(state.therapySessions) ? state.therapySessions : []);
          setMedicalBookings(Array.isArray(state.medicalBookings) ? state.medicalBookings : []);
          setProgressEntries(Array.isArray(state.progressEntries) ? state.progressEntries : []);
          setParentTasks(Array.isArray(state.parentTasks) ? state.parentTasks : []);
          setVisitCards(Array.isArray(state.visitCards) ? state.visitCards : []);
          setHasSeenOnboarding(Boolean(state.hasSeenOnboarding));
          if (state.appRole === 'doctor' || state.appRole === 'parent') setAppRoleState(state.appRole);
          if (state.theme === 'dark' || state.theme === 'light') setTheme(state.theme);
        }
      })
      .catch(error => {
        console.warn('Profile state sync failed, using local browser state.', error);
      })
      .finally(() => {
        if (!cancelled) setRemoteProfileStateLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!remoteProfileStateLoaded) return;
    const timeout = window.setTimeout(() => {
      fetch('/api/profile-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: {
            appRole,
            profiles,
            activeProfileId,
            savedArticles,
            savedCenters,
            readArticles,
            diaryEntries,
            parentJournalEntries,
            therapySessions,
            medicalBookings,
            progressEntries,
            parentTasks,
            visitCards,
            hasSeenOnboarding,
            theme
          }
        })
      }).catch(error => {
        console.warn('Profile state save failed, local state is still available.', error);
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [
    remoteProfileStateLoaded,
    appRole,
    profiles,
    activeProfileId,
    savedArticles,
    savedCenters,
    readArticles,
    diaryEntries,
    parentJournalEntries,
    therapySessions,
    medicalBookings,
    progressEntries,
    parentTasks,
    visitCards,
    hasSeenOnboarding,
    theme
  ]);

  useEffect(() => {
    localStorage.setItem('opora_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    localStorage.setItem('opora_profiles_list', JSON.stringify(profiles));
    const active = profiles.find(p => p.id === activeProfileId) || profiles[0];
    if (active) {
      localStorage.setItem('opora_profile', JSON.stringify(active));
    }
  }, [profiles, activeProfileId]);

  useEffect(() => {
    localStorage.setItem('opora_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem('opora_saved_articles', JSON.stringify(savedArticles));
  }, [savedArticles]);

  useEffect(() => {
    localStorage.setItem('opora_saved_centers', JSON.stringify(savedCenters));
  }, [savedCenters]);

  useEffect(() => {
    localStorage.setItem('opora_read_articles', JSON.stringify(readArticles));
  }, [readArticles]);

  useEffect(() => {
    localStorage.setItem('opora_diary_entries', JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  useEffect(() => {
    localStorage.setItem('opora_parent_journal', JSON.stringify(parentJournalEntries));
  }, [parentJournalEntries]);

  useEffect(() => {
    localStorage.setItem('opora_therapy_sessions', JSON.stringify(therapySessions));
  }, [therapySessions]);

  const switchProfile = (id: string) => {
    if (profiles.some(p => p.id === id)) {
      setActiveProfileId(id);
    }
  };

  const addProfile = (data: Omit<ProfileData, 'id'>): string => {
    const newId = `child-${Date.now()}`;
    const newProfile: ProfileData = {
      id: newId,
      ...data
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
    return newId;
  };

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, ...data };
      }
      return p;
    }));
  };

  const updateProfileById = (id: string, data: Partial<ProfileData>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, ...data };
      }
      return p;
    }));
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) return; // Cannot delete the last profile
    const remaining = profiles.filter(p => p.id !== id);
    setProfiles(remaining);
    // If we deleted the active profile, switch to the first remaining one
    if (activeProfileId === id) {
      setActiveProfileId(remaining[0]?.id || "");
    }
  };

  const toggleSaveArticle = (id: string) => {
    setSavedArticles(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSaveCenter = (id: number) => {
    setSavedCenters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleReadArticle = (id: string) => {
    setReadArticles(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addDiaryEntry = (childId: string, content: string) => {
    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      childId,
      date: new Date().toISOString(),
      content
    };
    setDiaryEntries(prev => [newEntry, ...prev]);
  };

  const deleteDiaryEntry = (id: string) => {
    setDiaryEntries(prev => prev.filter(e => e.id !== id));
  };

  const addParentJournalEntry = (entryData: Omit<ParentJournalEntry, 'id' | 'date'>) => {
    const newEntry: ParentJournalEntry = {
      id: `parent-journal-${Date.now()}`,
      date: new Date().toISOString(),
      ...entryData
    };
    setParentJournalEntries(prev => [newEntry, ...prev]);
  };

  const deleteParentJournalEntry = (id: string) => {
    setParentJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  const toggleTherapySession = (childId: string, date: string, type: string) => {
    setTherapySessions(prev => {
      const existingToken = prev.find(s => s.childId === childId && s.date === date && s.type === type);
      if (existingToken) {
        return prev.filter(s => s.id !== existingToken.id); // Toggle off by removing
      } else {
        const newSession: TherapySession = {
          id: `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          childId,
          date,
          type,
          completed: true
        };
        return [...prev, newSession];
      }
    });
  };

  const addAccessLog = (log: Omit<AccessAuditLog, 'id' | 'createdAt'>) => {
    const newLog: AccessAuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    setAccessAuditLogs(prev => [newLog, ...prev].slice(0, 80));
  };

  const postCareRequest = (request: DoctorCareRequest, optimisticId: string) => {
    fetch('/api/doctor-care/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
      .then(response => response.ok ? response.json() : null)
      .then(saved => {
        if (!saved?.id) return;
        setDoctorCareRequests(prev => prev.map(item => item.id === optimisticId ? saved : item));
      })
      .catch(error => {
        console.warn('Care request API create failed, keeping local optimistic state.', error);
      });
  };

  const patchCareRequestStatus = (id: string, status: DoctorCareRequest['status']) => {
    fetch(`/api/doctor-care/requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(response => response.ok ? response.json() : null)
      .then(saved => {
        if (!saved?.id) return;
        setDoctorCareRequests(prev => prev.map(item => item.id === id ? saved : item));
      })
      .catch(error => {
        console.warn('Care request API status update failed, keeping local optimistic state.', error);
      });
  };

  const addMedicalBooking = (bookingData: Omit<MedicalBooking, 'id' | 'status'>) => {
    const newBooking: MedicalBooking = {
      id: `booking-${Date.now()}`,
      ...bookingData,
      status: 'confirmed'
    };
    setMedicalBookings(prev => [newBooking, ...prev]);
    const child = profiles.find(item => item.id === bookingData.childId) || profile;
    const careRequest: DoctorCareRequest = {
      id: `care-request-${Date.now()}`,
      childId: bookingData.childId,
      childName: bookingData.childName,
      childAge: child.childAge,
      doctorId: bookingData.doctorId,
      doctorName: bookingData.doctorName,
      doctorTitle: bookingData.doctorTitle,
      doctorCity: bookingData.doctorCity,
      requestedAt: new Date().toISOString(),
      status: 'parent_requested',
      parentNote: `Запрос на первую консультацию ${bookingData.date} в ${bookingData.time}.`
    };
    setDoctorCareRequests(prev => [careRequest, ...prev]);
    postCareRequest(careRequest, careRequest.id);
    addAccessLog({
      actorRole: 'parent',
      actorName: 'Родитель',
      action: 'booking_created',
      childId: bookingData.childId,
      doctorId: bookingData.doctorId,
      requestId: careRequest.id,
      note: `Создана запись и запрос к врачу ${bookingData.doctorName}.`
    });

    // Also update child's passport
    updateSensoryPassport(bookingData.childId, bookingData.sensoryPassport);
  };

  const cancelMedicalBooking = (id: string) => {
    setMedicalBookings(prev => prev.filter(b => b.id !== id));
  };

  const createDoctorCareRequest = (requestData: Omit<DoctorCareRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: DoctorCareRequest = {
      ...requestData,
      id: `care-request-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'parent_requested'
    };
    setDoctorCareRequests(prev => [newRequest, ...prev]);
    postCareRequest(newRequest, newRequest.id);
    addAccessLog({
      actorRole: 'parent',
      actorName: 'Родитель',
      action: 'request_created',
      childId: requestData.childId,
      doctorId: requestData.doctorId,
      requestId: newRequest.id,
      note: `Родитель отправил запрос врачу ${requestData.doctorName}.`
    });
  };

  const doctorAcceptCareRequest = (id: string) => {
    const request = doctorCareRequests.find(item => item.id === id);
    setDoctorCareRequests(prev => prev.map(request => request.id === id ? {
      ...request,
      status: 'doctor_accepted',
      doctorAcceptedAt: new Date().toISOString()
    } : request));
    patchCareRequestStatus(id, 'doctor_accepted');
    if (request) {
      addAccessLog({
        actorRole: 'doctor',
        actorName: request.doctorName,
        action: 'doctor_accepted',
        childId: request.childId,
        doctorId: request.doctorId,
        requestId: request.id,
        note: `Врач принял запрос на первую консультацию.`
      });
    }
  };

  const doctorCompleteFirstConsult = (id: string) => {
    const request = doctorCareRequests.find(item => item.id === id);
    setDoctorCareRequests(prev => prev.map(request => request.id === id ? {
      ...request,
      status: 'first_consult_done',
      firstConsultAt: new Date().toISOString()
    } : request));
    patchCareRequestStatus(id, 'first_consult_done');
    if (request) {
      addAccessLog({
        actorRole: 'doctor',
        actorName: request.doctorName,
        action: 'first_consult_done',
        childId: request.childId,
        doctorId: request.doctorId,
        requestId: request.id,
        note: `Врач отметил первую консультацию как проведенную.`
      });
    }
  };

  const parentConfirmDoctorAccess = (id: string) => {
    const request = doctorCareRequests.find(item => item.id === id);
    setDoctorCareRequests(prev => prev.map(request => request.id === id ? {
      ...request,
      status: 'full_access',
      parentConfirmedAt: new Date().toISOString()
    } : request));
    patchCareRequestStatus(id, 'full_access');
    if (request) {
      addAccessLog({
        actorRole: 'parent',
        actorName: 'Родитель',
        action: 'parent_confirmed_access',
        childId: request.childId,
        doctorId: request.doctorId,
        requestId: request.id,
        note: `Родитель открыл врачу ${request.doctorName} полный доступ к документам ребенка.`
      });
    }
  };

  const declineDoctorCareRequest = (id: string) => {
    const request = doctorCareRequests.find(item => item.id === id);
    setDoctorCareRequests(prev => prev.map(request => request.id === id ? {
      ...request,
      status: 'declined'
    } : request));
    patchCareRequestStatus(id, 'declined');
    if (request) {
      addAccessLog({
        actorRole: appRole,
        actorName: appRole === 'doctor' ? request.doctorName : 'Родитель',
        action: 'request_declined',
        childId: request.childId,
        doctorId: request.doctorId,
        requestId: request.id,
        note: `Запрос к врачу ${request.doctorName} отклонен.`
      });
    }
  };

  const updateSensoryPassport = (childId: string, sensoryData: SensoryPassportData) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === childId) {
        return {
          ...p,
          sensoryPassport: sensoryData
        };
      }
      return p;
    }));
  };

  const addProgressEntry = (entryData: Omit<ChildProgressEntry, 'id' | 'date'>) => {
    const newEntry: ChildProgressEntry = {
      ...entryData,
      id: `progress-${Date.now()}`,
      date: new Date().toISOString()
    };
    setProgressEntries(prev => [newEntry, ...prev]);
  };

  const updateProgressEntry = (id: string, entry: Partial<ChildProgressEntry>) => {
    setProgressEntries(prev => prev.map(item => item.id === id ? { ...item, ...entry } : item));
  };

  const deleteProgressEntry = (id: string) => {
    setProgressEntries(prev => prev.filter(item => item.id !== id));
  };

  const addParentTask = (taskData: Omit<ParentTask, 'id' | 'status' | 'source'>) => {
    const newTask: ParentTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      status: 'todo',
      source: 'manual'
    };
    setParentTasks(prev => [newTask, ...prev]);
  };

  const getRecommendedTasksForProfile = (activeProfile: ProfileData) => {
    const library = STATUS_TASK_LIBRARY[activeProfile.diagnosticStatus] || [];
    const childTasks = parentTasks.filter(task => task.childId === activeProfile.id);
    const mappedSystemTasks = library.map(task => {
      const existing = childTasks.find(savedTask => savedTask.id === `${task.id}-${activeProfile.id}`);
      return existing || {
        ...task,
        id: `${task.id}-${activeProfile.id}`,
        childId: activeProfile.id,
        status: 'todo' as const
      };
    });

    const manualTasks = childTasks.filter(task => task.source === 'manual');
    return [...mappedSystemTasks, ...manualTasks].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'todo' ? -1 : 1;
      return a.title.localeCompare(b.title, 'ru');
    });
  };

  const toggleParentTask = (task: ParentTask) => {
    setParentTasks(prev => {
      const existing = prev.find(item => item.id === task.id);
      if (existing) {
        return prev.map(item => item.id === task.id ? {
          ...item,
          status: item.status === 'todo' ? 'done' : 'todo',
          completedAt: item.status === 'todo' ? new Date().toISOString() : undefined
        } : item);
      }
      return [
        {
          ...task,
          status: task.status === 'done' ? 'todo' : 'done',
          completedAt: task.status === 'done' ? undefined : new Date().toISOString()
        },
        ...prev
      ];
    });
  };

  const deleteParentTask = (id: string) => {
    setParentTasks(prev => prev.filter(task => task.id !== id));
  };

  const renderTemplate = (templateId: string, variables: Record<string, string>) => {
    const template = MESSAGE_TEMPLATES.find(item => item.id === templateId);
    if (!template) return '';
    return template.body.replace(/\{\{(\w+)\}\}/g, (_, token: string) => variables[token] || '');
  };

  const createVisitCardForChild = (childId: string) => {
    const child = profiles.find(item => item.id === childId) || profile;
    const passport = child.sensoryPassport || DEFAULT_SENSORY_PASSPORT;
    const card: VisitCardDraft = {
      id: `visit-card-${Date.now()}`,
      childId: child.id,
      title: `Карточка приема для ${child.childName}`,
      summary: `${child.childName}, ${child.childAge} ${child.childAge === 1 ? 'год' : child.childAge < 5 ? 'года' : 'лет'}. Этап: ${child.diagnosticStatus}. Родителю важно сохранить спокойный, предсказуемый темп приема.`,
      sensoryNotes: buildSensoryNotes(passport),
      communicationNotes: [mapCommunicationStyleLabel(passport.communicationStyle)],
      rewardNotes: passport.favoriteReward ? [`После приема особенно помогает: ${passport.favoriteReward}`] : [],
      parentRequest: passport.comfortTriggers || 'Пожалуйста, говорите короткими фразами и заранее показывайте, что будет происходить.',
      generatedAt: new Date().toISOString()
    };
    setVisitCards(prev => [card, ...prev.filter(item => item.childId !== child.id || item.bookingId)]);
    return card;
  };

  const createVisitCardFromBooking = (bookingId: string) => {
    const booking = medicalBookings.find(item => item.id === bookingId);
    if (!booking) {
      return createVisitCardForChild(profile.id);
    }
    const child = profiles.find(item => item.id === booking.childId) || profile;
    const card: VisitCardDraft = {
      id: `visit-card-${Date.now()}`,
      childId: booking.childId,
      bookingId: booking.id,
      title: `Карточка приема: ${booking.doctorName}`,
      summary: `${booking.childName} идет на прием к ${booking.doctorName} (${booking.doctorCity}) ${booking.date} в ${booking.time}. Родителю важно, чтобы контакт был бережным и предсказуемым.`,
      sensoryNotes: buildSensoryNotes(booking.sensoryPassport),
      communicationNotes: [mapCommunicationStyleLabel(booking.sensoryPassport.communicationStyle)],
      rewardNotes: booking.sensoryPassport.favoriteReward ? [`После приема особенно помогает: ${booking.sensoryPassport.favoriteReward}`] : [],
      parentRequest: booking.sensoryPassport.comfortTriggers || `Пожалуйста, объясняйте шаги заранее и дайте ${booking.childName} время привыкнуть к кабинету.`,
      generatedAt: new Date().toISOString()
    };
    setVisitCards(prev => [card, ...prev.filter(item => item.bookingId !== booking.id)]);
    if (!child.sensoryPassport) {
      updateSensoryPassport(child.id, booking.sensoryPassport);
    }
    return card;
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem('opora_onboarding_completed', 'true');
  };

  const profile = profiles.find(p => p.id === activeProfileId) || profiles[0] || {
    id: "fallback",
    childName: "Алишер",
    childAge: 3,
    diagnosticStatus: "В процессе диагностики",
    userCity: "Алматы",
  };

  return (
    <ProfileContext.Provider value={{
      appRole,
      setAppRole,
      profile,
      profiles,
      activeProfileId,
      switchProfile,
      addProfile,
      updateProfile,
      updateProfileById,
      deleteProfile,
      savedArticles,
      toggleSaveArticle,
      savedCenters,
      toggleSaveCenter,
      readArticles,
      toggleReadArticle,
      diaryEntries,
      addDiaryEntry,
      deleteDiaryEntry,
      parentJournalEntries,
      addParentJournalEntry,
      deleteParentJournalEntry,
      therapySessions,
      toggleTherapySession,
      hasSeenOnboarding,
      completeOnboarding,
      theme,
      toggleTheme,
      medicalBookings,
      addMedicalBooking,
      cancelMedicalBooking,
      doctorCareRequests,
      createDoctorCareRequest,
      doctorAcceptCareRequest,
      doctorCompleteFirstConsult,
      parentConfirmDoctorAccess,
      declineDoctorCareRequest,
      accessAuditLogs,
      updateSensoryPassport,
      progressEntries,
      addProgressEntry,
      updateProgressEntry,
      deleteProgressEntry,
      parentTasks,
      addParentTask,
      toggleParentTask,
      deleteParentTask,
      getRecommendedTasksForProfile,
      messageTemplates: MESSAGE_TEMPLATES,
      renderTemplate,
      visitCards,
      createVisitCardFromBooking,
      createVisitCardForChild
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
};

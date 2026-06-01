import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Bookmark, X, MessageSquare, Send, Quote, User, Award, CheckCircle, Calendar, Clock, Sparkles, Heart, Info, FileText, LockKeyhole, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useProfile } from '../context/ProfileContext';
import { VERIFIED_DIRECTORY_ITEMS } from '../data/directory.generated';
import { KZ_GOOGLE_PLACES_ITEMS } from '../data/kz-google-places.generated';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface DirectoryItem {
  id: number;
  name: string;
  city: string;
  desc: string;
  tags: string[];
  type: 'doctor' | 'center' | 'org' | 'gov' | 'friendly';
  rating: number;
  ratingCount: number;
  phone: string;
  reviews: Review[];
  title?: string; // Optional medical title
  canBook?: boolean;
  address?: string;
  website?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  lastVerified?: string;
  verificationStatus?: 'verified' | 'needs_review';
  country?: 'KZ' | 'US';
  state?: string;
  npi?: string;
  sourceKind?: 'manual' | 'npi' | 'clinical_trials' | 'cdc';
  confidenceScore?: number;
  parentConfirmed?: boolean;
  needsReview?: boolean;
}

export type DirectoryFilter = 'all' | 'doctor' | 'center' | 'org' | 'gov' | 'bookings' | 'friendly' | 'recommendations' | 'dentistry' | 'haircut' | 'pmpk' | 'therapy' | 'usa';

interface DirectoryRecommendation {
  id: string;
  name: string;
  city: string;
  kind: 'dentistry' | 'haircut' | 'therapy' | 'other';
  contact: string;
  note: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const DEFAULT_US_CATALOG_META = {
  generatedAt: 'not-loaded',
  providerCount: 0,
  clinicalTrialCount: 0
};

type EvidenceApproach = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
};

const DEFAULT_EVIDENCE_APPROACHES: EvidenceApproach[] = [
  {
    id: 'behavioral-aba',
    title: 'Поведенческие подходы / ABA',
    summary: 'Лучше всего изучены для развития конкретных навыков и уменьшения поведения, которое мешает жизни. Важно: современная работа должна быть мягкой, функциональной и измерять прогресс.',
    sourceUrl: 'https://www.cdc.gov/autism/treatment/index.html'
  },
  {
    id: 'speech-language',
    title: 'Логопедия и коммуникация',
    summary: 'Помогает ребенку понимать речь, использовать речь, жесты, карточки или AAC. Цель — чтобы ребенок мог выражать потребности и участвовать в общении.',
    sourceUrl: 'https://www.cdc.gov/autism/treatment/index.html'
  },
  {
    id: 'occupational-therapy',
    title: 'Эрготерапия / OT и сенсорная поддержка',
    summary: 'Помогает с бытовыми навыками, сенсорной перегрузкой, одеванием, едой, самообслуживанием и участием в обычной жизни.',
    sourceUrl: 'https://www.cdc.gov/autism/treatment/index.html'
  },
  {
    id: 'developmental-esdm',
    title: 'Развивающие игровые подходы / ESDM',
    summary: 'Для маленьких детей полезны игровые подходы с совместным вниманием, социальным обменом и естественным обучением в повседневных ситуациях.',
    sourceUrl: 'https://www.cdc.gov/autism/treatment/index.html'
  },
  {
    id: 'cbt-anxiety',
    title: 'CBT при тревоге и сопутствующих трудностях',
    summary: 'Может помогать детям, которым по возрасту и уровню развития подходит работа с мыслями, эмоциями и поведением. Это не “лечение РАС”, а поддержка сопутствующей тревоги.',
    sourceUrl: 'https://www.cdc.gov/autism/treatment/index.html'
  },
  {
    id: 'medication-cooccurring',
    title: 'Лекарства только для сопутствующих симптомов',
    summary: 'Нет лекарства, которое лечит основные симптомы РАС. Медикаменты обсуждаются с врачом для сна, тревоги, СДВГ, судорог, самоагрессии или других сопутствующих состояний.',
    sourceUrl: 'https://www.cdc.gov/autism/treatment/index.html'
  }
];

const recommendationKindLabels: Record<DirectoryRecommendation['kind'], string> = {
  dentistry: 'Стоматология',
  haircut: 'Парикмахерская',
  therapy: 'Центр / терапия',
  other: 'Другое место'
};

const recommendationKindTags: Record<DirectoryRecommendation['kind'], string[]> = {
  dentistry: ['Стоматология', 'Рекомендация родителей', 'Проверено вручную'],
  haircut: ['Парикмахерская', 'Рекомендация родителей', 'Проверено вручную'],
  therapy: ['Терапия', 'Рекомендация родителей', 'Проверено вручную'],
  other: ['Дружелюбное место', 'Рекомендация родителей', 'Проверено вручную']
};

const scenarioFilters: Array<{ id: DirectoryFilter; label: string; icon: string; hint: string }> = [
  { id: 'dentistry', label: 'Стоматолог', icon: '🦷', hint: 'без страха и седация' },
  { id: 'haircut', label: 'Стрижка', icon: '✂️', hint: 'тихо, с паузами' },
  { id: 'pmpk', label: 'ПМПК', icon: '📁', hint: 'комиссия и документы' },
  { id: 'therapy', label: 'Терапия', icon: '🧩', hint: 'центры и занятия' },
  { id: 'usa', label: 'Что помогает', icon: '✅', hint: 'доказательные подходы' },
  { id: 'recommendations', label: 'Рекомендации', icon: '🤝', hint: 'от родителей' }
];

const itemText = (item: DirectoryItem) => [
  item.name,
  item.title,
  item.desc,
  item.address,
  item.sourceLabel,
  ...item.tags
].filter(Boolean).join(' ').toLowerCase();

const itemMatchesScenario = (item: DirectoryItem, scenario: DirectoryFilter) => {
  const text = itemText(item);
  if (scenario === 'dentistry') return /стомат|зуб|севоран|седац|наркоз|ортодонт|дент/i.test(text);
  if (scenario === 'haircut') return /парикмах|стриж|барбер|ножниц|машинк/i.test(text);
  if (scenario === 'pmpk') return /пмпк|кппк|комисс|психолого-медико|психолого-педагог|госуслуг|egov|заключени|документ/i.test(text);
  if (scenario === 'therapy') return item.type === 'center' || /aba|ава|терап|логопед|дефектолог|сенсор|центр|асыл мирас|аутизм-центр/i.test(text);
  if (scenario === 'usa') return false;
  return true;
};

const getTrustBadge = (item: DirectoryItem) => {
  if (item.tags.some(tag => tag.toLowerCase().includes('рекомендация родителей')) || item.sourceLabel?.toLowerCase().includes('рекомендация')) {
    return { label: 'Рекомендовано родителем', tone: 'parent' as const };
  }
  if (item.verificationStatus === 'needs_review') {
    return { label: 'Нужно уточнить', tone: 'review' as const };
  }
  if (/рас|аутизм|особ/i.test(itemText(item))) {
    return { label: 'Есть опыт с РАС', tone: 'autism' as const };
  }
  if (item.verificationStatus === 'verified' || item.sourceUrl) {
    return { label: 'Проверено', tone: 'verified' as const };
  }
  return { label: 'Отзывы родителей', tone: 'parent' as const };
};

const INITIAL_ITEMS: DirectoryItem[] = [
  { 
    id: 106, 
    name: 'Даниил Ким', 
    city: 'Алматы', 
    title: 'Детский стоматолог-адаптолог, игровой терапевт',
    desc: 'Специализируется на лечении зубов у детей с РАС, СДВГ и повышенной сенсорной чувствительностью к шуму. Проводит адаптационные приемы по протоколам Tell-Show-Do, принимает без белого халата. В кабинете есть утяжеленные пледы, шумоподавляющие наушники, телевизор на потолке и мягкая сенсорная подсветка.', 
    tags: ['🦷 Стоматолог РАС', 'Tell-Show-Do', 'Сенсорная адаптация'], 
    type: 'doctor', 
    rating: 4.9, 
    ratingCount: 57, 
    phone: '+7 (701) 880-12-34', 
    reviews: [
      { id: 'den1', author: 'Малика У.', rating: 5, text: 'Это чудо! Мой сын с сенсорным аутизмом даже рот не открывал у других стоматологов, плакал до рвоты при одном звуке жужжания. Даниил за один приём подружился с ним через игру, дал потрогать инструмент струей воздуха. Вылечили кариес абсолютно без единой слезинки!', date: '21.05.2026' },
      { id: 'den2', author: 'Анонимный папа', rating: 5, text: 'Очень чуткий доктор. Чистый кабинет с приглушенным освещением, никаких резких запахов спирта. Первый зуб лечили полчаса, но врач ни разу не потерял терпения.', date: '11.04.2026' }
    ],
    canBook: true
  },
  { 
    id: 107, 
    name: 'Дина Альжанова', 
    city: 'Астана', 
    title: 'Детский офтальмолог (окулист), специалист по РАС',
    desc: 'Специалист по бережной диагностике зрения особенных детей всех возрастов. Использует портативный бесконтактный рефрактометр, подстраивается под уровень тревоги ребенка, применяет индивидуальные визуальные карточки расписания PECS для неговорящих детей. Кабинет затенен, исключен ослепляющий свет.', 
    tags: ['👁️ Офтальмолог', 'Неговорящие дети', 'PECS адаптация', 'Минимум света'], 
    type: 'doctor', 
    rating: 4.8, 
    ratingCount: 42, 
    phone: '+7 (702) 220-40-50', 
    reviews: [
      { id: 'oc1', author: 'Карина С.', rating: 5, text: 'Долго искали офтальмолога, который проверит зрение неговорящей дочери с сильной светобоязнью. Дина Ерболовна провела осмотр в затемненной комнате, когда дочка сидела на коленях у папы. Все прошло спокойно и весело.', date: '19.05.2026' }
    ],
    canBook: true
  },
  { 
    id: 108, 
    name: 'Марат Асанов', 
    city: 'Астана', 
    title: 'Детский челюстно-лицевой хирург, особенный стоматолог',
    desc: 'Эксперт по бережной стоматологической помощи и хирургии лиц с ментальной инвалидностью. Проводит комплексное лечение зубов во сне (под безопасным наркозом Севоран), деликатно готовит детей с глубоким аутизмом к удалению и пластике уздечки без страха за халаты.', 
    tags: ['🦷 Стоматолог РАС', 'Лечение во сне', 'Севоран', 'Адаптолог'], 
    type: 'doctor', 
    rating: 4.9, 
    ratingCount: 38, 
    phone: '+7 (707) 555-43-21', 
    reviews: [
      { id: 'den3', author: 'Алина (г. Кокшетау)', rating: 5, text: 'Приезжали из Кокшетау на лечение зубов под наркозом Севоран. До этого был жуткий страх врачей. Марат Муратович детально объяснил каждый этап анестезии, успокоил, все анализы проверил. Зубки залечили идеально. Проснулся ребенок в игровой палате без испуга.', date: '12.05.2026' }
    ],
    canBook: true
  },
  { 
    id: 109, 
    name: 'Сауле Жакупбекова', 
    city: 'Алматы', 
    title: 'Детский офтальмолог высшей категории',
    desc: 'Опытный врач-окулист, работающий в тандеме с сенсорными реабилитологами. Предоставляет ребенку специальные антибликовые очки, обследует зрение в игровой игровой обстановке, давая покрутить цветные линзы на пальцах для снижения тактильного сопротивления.', 
    tags: ['👁️ Окулист', 'Сенсорный подход', 'Высшая категория'], 
    type: 'doctor', 
    rating: 4.7, 
    ratingCount: 29, 
    phone: '+7 (705) 111-99-00', 
    reviews: [
      { id: 'oc2', author: 'Гульмира', rating: 5, text: 'Обычно дочка бьет по рукам врачам с приборами. Здесь доктор сначала дала ей потрогать и самой „посветить“ фонариком на плюшевого мишку. Ролевая игра сняла напряжение.', date: '01.05.2026' }
    ],
    canBook: true
  },
  { 
    id: 101, 
    name: 'Халида Измайлова', 
    city: 'Астана', 
    title: 'Детский психиатр, высшая категория',
    desc: 'Ведущий эксперт по диагностике расстройств аутистического спектра (РАС) в Казахстане. Проводит бережное тестирование по золотому стандарту ADOS-2, помогает исключить сопутствующие патологии и подбирает научно доказанную терапию нарушений сна.', 
    tags: ['Детский психиатр', 'Диагностика РАС', 'ADOS-2', 'Высшая категория'], 
    type: 'doctor', 
    rating: 4.9, 
    ratingCount: 84, 
    phone: '+7 (701) 440-20-40', 
    reviews: [
      { id: 'dr1', author: 'Жанна К.', rating: 5, text: 'Невероятно чуткий и бережный врач. Сын обычно плачет при виде белых халатов, но Халида Ринатовна сразу нашла контакт через простые сенсорные игрушки и игру в машинки. Поставила точный диагноз без запугивания, дала ясный путь реабилитации.', date: '14.05.2026' },
      { id: 'dr2', author: 'Алина (г. Караганда)', rating: 5, text: 'Приезжали к ней специально из Караганды. Оправдала все ожидания. Самый бережный прием в моей жизни, подробнейшим образом объяснила каждый пункт в результатах ADOS-2. Низкий поклон за её отношение к особенным деткам!', date: '21.04.2026' },
      { id: 'dr3', author: 'Родитель Аланчика', rating: 5, text: 'Специалист высочайшего класса. Нет лишних ноотропов, только бережная коррекция сна и рекомендации по поведенческой терапии.', date: '02.04.2026' }
    ]
  },
  { 
    id: 102, 
    name: 'Марина Когай', 
    city: 'Алматы', 
    title: 'Поведенческий аналитик, супервизор BCBA',
    desc: 'Международно сертифицированный поведенческий аналитик и супервизор. Руководит составлением индивидуальных программ развития навыков, курирует инклюзивные классы в школах Казахстана и проводит тренинги для родителей.', 
    tags: ['ABA-терапевт', 'Супервизор BCBA', 'Запуск речи', 'Инклюзивные классы'], 
    type: 'doctor', 
    rating: 4.8, 
    ratingCount: 62, 
    phone: '+7 (705) 230-10-10', 
    reviews: [
      { id: 'dr4', author: 'Айбек С.', rating: 5, text: 'Лучший ABA-куратор в Алматы. Составила нам программу социализации. Уже через месяц снизилась частота самоагрессии, ребенок научился использовать карточки PECS для базовых потребностей. Очень рекомендуем!', date: '18.04.2026' },
      { id: 'dr5', author: 'Анонимно', rating: 4, text: 'Очень строгая, держит высокие поведенческие стандарты, но результаты колоссальные. Сын занимается с удовольствием.', date: '10.03.2026' }
    ]
  },
  { 
    id: 103, 
    name: 'Тимур Мустафин', 
    city: 'Алматы', 
    title: 'Детский невропатолог высшей категории',
    desc: 'Специализируется на нейродиагностике, задержках речевого и психомоторного развития, а также сенсорной дезинтеграции. Применяет доказательную медицину без назначения бесконечных курсов лекарств без одобрения FDA.', 
    tags: ['Невропатолог', 'Доказательная медицина', 'Нейропсихология'], 
    type: 'doctor', 
    rating: 4.7, 
    ratingCount: 45, 
    phone: '+7 (707) 880-99-00', 
    reviews: [
      { id: 'dr6', author: 'Гаухар Т.', rating: 5, text: 'Первый невропатолог в моей практике, который открыто сказал, что ноотропы не лечат аутизм, и направил нас на АВА и сенсорную интеграцию вместо уколов. Бесконечно благодарна за честность и профессионализм.', date: '22.04.2026' }
    ]
  },
  { 
    id: 104, 
    name: 'Алия Багланова', 
    city: 'Шымкент', 
    title: 'Логопед-дефектолог, сенсорный терапевт',
    desc: 'Сертифицированный специалист по запуску речи и игровой логопедии. Помогает прорабатывать сенсорные зажимы в артикуляции, работает с тяжелыми формами сенсорной и моторной алалии.', 
    tags: ['Логопед-дефектолог', 'Запуск речи', 'Геймификация', 'Сенсорная интеграция'], 
    type: 'doctor', 
    rating: 4.8, 
    ratingCount: 39, 
    phone: '+7 (702) 670-33-33', 
    reviews: [
      { id: 'dr7', author: 'Саида', rating: 5, text: 'Потрясающий специалист с невероятной энергетикой! Дочка молчала до 4 лет. Алия превратила запуск речи в увлекательную игру. Первые слова пошли через два месяца бережных тренировок.', date: '10.05.2026' }
    ]
  },
  { 
    id: 105, 
    name: 'Елена Ким', 
    city: 'Караганда', 
    title: 'Детский клинический нейропсихолог',
    desc: 'Организует коррекционное сенсорное пространство. Помогает ребятам с гиперчувствительностью адаптироваться к внешним шумам (пылесос, уличный гул), развивает крупную и мелкую моторику.', 
    tags: ['Нейропсихолог', 'Сенсорная реабилитация', 'Моторика'], 
    type: 'doctor', 
    rating: 4.6, 
    ratingCount: 28, 
    phone: '+7 (705) 303-44-55', 
    reviews: [
      { id: 'dr8', author: 'Ирина В.', rating: 5, text: 'Ребенок перестал бояться звука блендера и фена за 10 занятий со специальными наушниками и сенсорными качелями. Качество нашей жизни выросло в разы.', date: '04.05.2026' }
    ]
  },
  { 
    id: 1, 
    name: 'Asyl Miras (Фонд Булата Утемуратова)', 
    city: 'Алматы, Астана, Шымкент, Караганда', 
    desc: 'Бесплатные центры раннего вмешательства (до 3 лет), программы ABA, развитие навыков. Международно сертифицированные специалисты.', 
    tags: ['Бесплатно', 'Раннее вмешательство', 'ABA', 'Фонд'], 
    type: 'org', 
    rating: 4.9, 
    ratingCount: 142, 
    phone: '+7 (727) 313-25-30', 
    reviews: [
      { id: 'r1', author: 'Мадина Б.', rating: 5, text: 'Программа раннего вмешательства в Асыл Мирас спасла нашу семью от депрессии. Нам дали четкую карту действий.', date: '20.05.2026' },
      { id: 'r2', author: 'Динара К.', rating: 5, text: 'Отличные бесплатные занятия по АВА. Очередь большая, но специалисты потрясающе квалифицированы.', date: '11.04.2026' }
    ]
  },
  { 
    id: 2, 
    name: 'Инклюзивный центр "Жас Урпак"', 
    city: 'Астана', 
    desc: 'Терапия АВА, логопед, ЛФК, нейропсихолог. Опыт работы более 10 лет. Мягкая адаптация к школьной среде.', 
    tags: ['ABA', 'Платный', 'Логопед'], 
    type: 'center', 
    rating: 4.7, 
    ratingCount: 48, 
    phone: '+7 (701) 555-88-22', 
    reviews: [
      { id: 'r3', author: 'Анонимно', rating: 5, text: 'Ходим сюда на дефектологическую подготовку к школе. Отношение прекрасное.', date: '05.05.2026' }
    ]
  },
  { 
    id: 3, 
    name: 'Фонд "Аутизм. Победим!"', 
    city: 'Алматы', 
    desc: 'Ассоциация родителей детей с аутизмом. Тренинги для родителей, спортивные и творческие инклюзивные секции.', 
    tags: ['Спорт', 'Поддержка родителей', 'Бесплатно/Платно'], 
    type: 'org', 
    rating: 4.8, 
    ratingCount: 75, 
    phone: '+7 (702) 345-67-89', 
    reviews: [] 
  },
  { 
    id: 4, 
    name: 'Кабинеты ПМПК (государственные)', 
    city: 'Все регионы Казахстана', 
    desc: 'Психолого-медико-педагогическая комиссия. Первичная постановка на учет и назначение часов государственной коррекции.', 
    tags: ['Государство', 'Диагностика', 'Бесплатно'], 
    type: 'gov', 
    rating: 4.0, 
    ratingCount: 110, 
    phone: '1406', 
    reviews: [] 
  },
  { 
    id: 5, 
    name: 'Центр Томатис-Терапии', 
    city: 'Шымкент, Алматы', 
    desc: 'Метод Томатис, биоакустическая коррекция (БАК), микротоковая рефлексотерапия.', 
    tags: ['Аппаратная терапия', 'Платный'], 
    type: 'center', 
    rating: 4.2, 
    ratingCount: 19, 
    phone: '+7 (7252) 44-55-66', 
    reviews: [] 
  },
  { 
    id: 6, 
    name: 'КППК (Кабинеты психолого-педагогической коррекции)', 
    city: 'Поликлиники по месту жительства', 
    desc: 'Государственные кабинеты коррекции при поликлиниках. Занятия с дефектологом, психологом, логопедом (по направлению ПМПК).', 
    tags: ['Государство', 'Дефектолог', 'Бесплатно'], 
    type: 'gov', 
    rating: 4.1, 
    ratingCount: 64, 
    phone: '103', 
    reviews: [] 
  },
  { 
    id: 7, 
    name: 'Центр коррекции "Особый путь"', 
    city: 'Караганда', 
    desc: 'Сенсорная интеграция, флортайм-терапия, подготовка к инклюзивному детскому саду.', 
    tags: ['Сенсорная интеграция', 'Флортайм'], 
    type: 'center', 
    rating: 4.6, 
    ratingCount: 22, 
    phone: '+7 (707) 111-22-33', 
    reviews: [] 
  },
  { 
    id: 8, 
    name: 'Детский психиатр (Национальный научный центр материнства и детства)', 
    city: 'Астана', 
    desc: 'Официальная постановка диагноза, коррекция сопутствующих состояний (нарушение сна, тревожность).', 
    tags: ['Медицина', 'Государство', 'Диагностика'], 
    type: 'gov', 
    rating: 4.5, 
    ratingCount: 88, 
    phone: '+7 (7172) 70-15-50', 
    reviews: [] 
  },
  { 
    id: 110, 
    name: 'Семейное кафе "Малышарики"', 
    city: 'Алматы', 
    desc: 'В кафе есть отдельная тихая зона с приглушенным светом. Персонал обучен взаимодействию с особенными детьми. Нет громкой музыки и мигающих элементов. Доступно безглютеновое и безказеиновое (БГБК) меню. Разрешается приходить со своей едой для деток со строгой избирательностью в еде.', 
    tags: ['Кафе', 'Тихая зона', 'БГБК', 'Своя еда'], 
    type: 'friendly', 
    rating: 4.9, 
    ratingCount: 34, 
    phone: '+7 (777) 123-45-67', 
    reviews: [
      { id: 'f1', author: 'Аружан', rating: 5, text: 'Наконец-то мы смогли нормально попить кофе! Персонал не смотрел косо, когда сын начал вокализировать, наоборот - принесли ему тихие сенсорные игрушки.', date: '21.05.2026' }
    ] 
  },
  { 
    id: 111, 
    name: 'Барбершоп "Стриж"', 
    city: 'Астана', 
    title: 'Детская парикмахерская',
    desc: 'Детская парикмахерская, где мастера умеют стричь детскими бесшумными триммерами или только ножницами, если ребенок боится жужжания. Адаптированный свет, возможна стрижка на полу или на руках у мамы. Запись делается с увеличенным интервалом.', 
    tags: ['Парикмахерская', 'Сенсорный подход'], 
    type: 'friendly', 
    rating: 4.8, 
    ratingCount: 52, 
    phone: '+7 (701) 987-65-43', 
    reviews: [
      { id: 'f2', author: 'Диас', rating: 5, text: 'Раньше стрижка была истерикой на весь район. Здесь мастер минут 10 просто играл с сыном на ковре, и там же его подстриг. Фантастика.', date: '10.05.2026' }
    ] 
  },
  { 
    id: 112, 
    name: 'Игровая "Сенсорный Мир"', 
    city: 'Шымкент', 
    desc: 'Просторный игровой центр. Каждое воскресенье с 9:00 до 11:00 — «Тихие часы» для особенных деток. Отключают музыку, убирают стробоскопы, организуют сенсорные уголки с утяжеленными пледами.', 
    tags: ['Игровая', 'Тихие часы', 'Сенсорная разгрузка'], 
    type: 'friendly', 
    rating: 4.9, 
    ratingCount: 28, 
    phone: '+7 (705) 555-11-22', 
    reviews: [] 
  },
  { 
    id: 113, 
    name: 'Пиццерия "Добрая Пицца"', 
    city: 'Караганда', 
    desc: 'Толерантный персонал, есть понятное визуальное PECS-меню. Персонал знает, как общаться с неречевыми детками. Есть тихие столики в углах без кондиционеров.', 
    tags: ['Еда', 'PECS меню', 'Толерантность'], 
    type: 'friendly', 
    rating: 4.7, 
    ratingCount: 15, 
    phone: '+7 (7212) 44-55-66', 
    reviews: [] 
  },
];

const getDirectoryKey = (item: DirectoryItem) => `${item.name}|${item.city}`.toLowerCase().replace(/\s+/g, ' ').trim();

const mergeDirectoryItems = (...collections: DirectoryItem[][]) => {
  const map = new Map<string, DirectoryItem>();

  collections.flat().forEach(item => {
    const key = getDirectoryKey(item);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      return;
    }

    const hasParentReviews = existing.ratingCount > 0 || (existing.reviews?.length || 0) > 0;
    map.set(key, {
      ...item,
      ...existing,
      rating: hasParentReviews ? existing.rating : item.rating,
      ratingCount: hasParentReviews ? existing.ratingCount : item.ratingCount,
      reviews: hasParentReviews ? existing.reviews : item.reviews,
      sourceUrl: item.sourceUrl || existing.sourceUrl,
      sourceLabel: item.sourceLabel || existing.sourceLabel,
      lastVerified: item.lastVerified || existing.lastVerified,
      verificationStatus: item.verificationStatus || existing.verificationStatus
    });
  });

  return Array.from(map.values());
};

const DIRECTORY_SEED_ITEMS = mergeDirectoryItems(
  VERIFIED_DIRECTORY_ITEMS as unknown as DirectoryItem[],
  KZ_GOOGLE_PLACES_ITEMS as unknown as DirectoryItem[],
  INITIAL_ITEMS
);

export function DirectoryTab({ initialFilter }: { initialFilter?: DirectoryFilter }) {
  const { 
    savedCenters, 
    toggleSaveCenter,
    profiles,
    activeProfileId,
    medicalBookings,
    addMedicalBooking,
    cancelMedicalBooking,
    doctorCareRequests,
    parentConfirmDoctorAccess,
    declineDoctorCareRequest
  } = useProfile();
  const [filter, setFilter] = useState<DirectoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [recommendationName, setRecommendationName] = useState('');
  const [recommendationCity, setRecommendationCity] = useState('');
  const [recommendationKind, setRecommendationKind] = useState<DirectoryRecommendation['kind']>('dentistry');
  const [recommendationContact, setRecommendationContact] = useState('');
  const [recommendationAuthor, setRecommendationAuthor] = useState('');
  const [recommendationNote, setRecommendationNote] = useState('');
  const [usCatalogMeta, setUsCatalogMeta] = useState(DEFAULT_US_CATALOG_META);
  const [evidenceApproaches, setEvidenceApproaches] = useState<EvidenceApproach[]>(DEFAULT_EVIDENCE_APPROACHES);
  const [isLoadingUsCatalog, setIsLoadingUsCatalog] = useState(false);
  
  // Booking Wizard states
  const [bookingDoctor, setBookingDoctor] = useState<DirectoryItem | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-06-03');
  const [bookingTime, setBookingTime] = useState('11:30');
  const [bookingChildId, setBookingChildId] = useState(activeProfileId || '');
  
  // Sensory Passport checkbox elements
  const [soundNeeds, setSoundNeeds] = useState<string[]>([]);
  const [lightNeeds, setLightNeeds] = useState<string[]>([]);
  const [tactileNeeds, setTactileNeeds] = useState<string[]>([]);
  const [comStyle, setComStyle] = useState<string>('simple-words');
  const [comfortTriggers, setComfortTriggers] = useState<string>('');
  const [favReward, setFavReward] = useState<string>('');
  
  const [showSuccessBookingSlip, setShowSuccessBookingSlip] = useState(false);
  const [latestBookingCreated, setLatestBookingCreated] = useState<any>(null);
  const [viewingBooking, setViewingBooking] = useState<any>(null);

  // Auto-sync child selection when tab loads or active children update
  useEffect(() => {
    if (activeProfileId) {
      setBookingChildId(activeProfileId);
    }
  }, [activeProfileId]);

  // Read or reset child sensory passport values dynamically
  useEffect(() => {
    const kid = profiles.find(p => p.id === bookingChildId);
    if (kid?.sensoryPassport) {
      setSoundNeeds(kid.sensoryPassport.soundSensitivity || []);
      setLightNeeds(kid.sensoryPassport.lightSensitivity || []);
      setTactileNeeds(kid.sensoryPassport.tactileSensitivity || []);
      setComStyle(kid.sensoryPassport.communicationStyle || 'simple-words');
      setComfortTriggers(kid.sensoryPassport.comfortTriggers || '');
      setFavReward(kid.sensoryPassport.favoriteReward || '');
    } else {
      setSoundNeeds([]);
      setLightNeeds([]);
      setTactileNeeds([]);
      setComStyle('simple-words');
      setComfortTriggers('');
      setFavReward('');
    }
  }, [bookingChildId, bookingDoctor, profiles]);

  // Interactive Directory items with persistent reviews and ratings
  const [items, setItems] = useState<DirectoryItem[]>(() => {
    const saved = localStorage.getItem('opora_directory_items_v2');
    if (saved) {
      try {
        return mergeDirectoryItems(
          VERIFIED_DIRECTORY_ITEMS as unknown as DirectoryItem[],
          (JSON.parse(saved) as DirectoryItem[]).filter(item => item.country !== 'US')
        );
      } catch (e) {
        console.warn('Failed parsing local directory items, resorting to initial.', e);
      }
    }
    return DIRECTORY_SEED_ITEMS;
  });

  const [recommendations, setRecommendations] = useState<DirectoryRecommendation[]>(() => {
    const saved = localStorage.getItem('opora_directory_recommendations_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed parsing directory recommendations.', e);
      }
    }
    return [];
  });

  // Review Modal state
  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [ratingHover, setRatingHover] = useState(0);
  const [showPhoneInfo, setShowPhoneInfo] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    localStorage.setItem('opora_directory_items_v2', JSON.stringify(items.filter(item => item.country !== 'US')));
  }, [items]);

  useEffect(() => {
    let cancelled = false;

    const loadUsCatalog = async () => {
      setIsLoadingUsCatalog(true);
      try {
        const response = await fetch('/api/directory/us?limit=1');
        if (!response.ok) throw new Error(`US directory API ${response.status}`);
        const data = await response.json();
        if (cancelled) return;

        setUsCatalogMeta(data.meta || DEFAULT_US_CATALOG_META);
        setEvidenceApproaches((data.treatmentApproaches?.length ? data.treatmentApproaches : DEFAULT_EVIDENCE_APPROACHES) as EvidenceApproach[]);
      } catch (error) {
        console.warn('Failed loading US directory catalog.', error);
        if (!cancelled) setUsCatalogMeta(DEFAULT_US_CATALOG_META);
      } finally {
        if (!cancelled) setIsLoadingUsCatalog(false);
      }
    };

    loadUsCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadKzCandidates = async () => {
      try {
        const response = await fetch('/api/directory/kz?limit=500');
        if (!response.ok) throw new Error(`KZ directory API ${response.status}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length) {
          setItems(prev => mergeDirectoryItems(prev, data.items as DirectoryItem[]));
        }
      } catch (error) {
        console.warn('Failed loading KZ Google Places candidates.', error);
      }
    };

    loadKzCandidates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('opora_directory_recommendations_v1', JSON.stringify(recommendations));
  }, [recommendations]);

  const cities = ['Все города', ...Array.from(new Set(items.map(item => (
    item.country === 'US' && item.state ? `USA · ${item.state}` : item.city
  )).map(city => city.trim()).filter(city => city && !city.includes('Все регионы') && !city.includes('12 регионов'))))];
  const filterLabels: Record<typeof filter, string> = {
    all: 'Все направления',
    doctor: 'Специалисты',
    center: 'Терапия',
    org: 'Фонды',
    gov: 'Госуслуги',
    bookings: 'Мои записи',
    friendly: 'Дружелюбные места',
    recommendations: 'Рекомендации родителей',
    dentistry: 'Стоматологи и лечение зубов',
    haircut: 'Стрижка без перегруза',
    pmpk: 'ПМПК, КППК и госмаршрут',
    therapy: 'Терапия и центры',
    usa: 'Что реально помогает'
  };

  const itemTypeLabels: Record<DirectoryItem['type'], string> = {
    doctor: 'Специалист',
    center: 'Центр',
    org: 'Фонд',
    gov: 'Госуслуга',
    friendly: 'Дружелюбное место'
  };

  const filteredItems = items.filter(item => {
    const scenarioFilter = filter === 'dentistry' || filter === 'haircut' || filter === 'pmpk' || filter === 'therapy' || filter === 'usa';
    const matchesFilter = filter === 'all' || 
                          (scenarioFilter && itemMatchesScenario(item, filter)) ||
                          (filter !== 'bookings' && filter !== 'recommendations' && !scenarioFilter && item.type === filter);
    
    // Check city. For 'Все регионы' we want to match all as well.
    const matchesCity = selectedCity === 'Все города' || 
                        (item.country === 'US' && selectedCity === `USA · ${item.state}`) ||
                        item.city.includes(selectedCity) || 
                        item.city.includes('Все регионы') || 
                        item.city.includes('Поликлиники');
                        
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.address && item.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.sourceLabel && item.sourceLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                          
    return matchesFilter && matchesCity && matchesSearch;
  });

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newComment.trim()) return;

    const freshReview: Review = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim() || 'Анонимный родитель',
      rating: newRating,
      text: newComment.trim(),
      date: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: '2-digit',
        year: 'numeric'
      })
    };

    const updatedItems = items.map(item => {
      if (item.id === selectedItem.id) {
        const updatedReviews = [freshReview, ...(item.reviews || [])];
        const newRatingVal = Number(
          ((item.rating * item.ratingCount + newRating) / (item.ratingCount + 1)).toFixed(1)
        );
        const nextItem = {
          ...item,
          reviews: updatedReviews,
          rating: newRatingVal,
          ratingCount: item.ratingCount + 1
        };
        // Update currently opened modal's parent reference
        setSelectedItem(nextItem);
        return nextItem;
      }
      return item;
    });

    setItems(updatedItems);
    setNewAuthor('');
    setNewRating(5);
    setNewComment('');
  };

  const handleAddRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendationName.trim() || !recommendationCity.trim() || !recommendationNote.trim()) return;

    const nextRecommendation: DirectoryRecommendation = {
      id: `rec-${Date.now()}`,
      name: recommendationName.trim(),
      city: recommendationCity.trim(),
      kind: recommendationKind,
      contact: recommendationContact.trim() || 'Контакт не указан',
      author: recommendationAuthor.trim() || 'Родитель/опекун',
      note: recommendationNote.trim(),
      status: 'pending',
      createdAt: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: '2-digit',
        year: 'numeric'
      })
    };

    setRecommendations(prev => [nextRecommendation, ...prev]);
    setRecommendationName('');
    setRecommendationCity('');
    setRecommendationKind('dentistry');
    setRecommendationContact('');
    setRecommendationAuthor('');
    setRecommendationNote('');
  };

  const handleApproveRecommendation = (recommendation: DirectoryRecommendation) => {
    const approvedItem: DirectoryItem = {
      id: Date.now(),
      name: recommendation.name,
      city: recommendation.city,
      desc: `${recommendation.note} Рекомендовано родителем/опекуном, затем проверено вручную администратором.`,
      tags: recommendationKindTags[recommendation.kind],
      type: recommendation.kind === 'therapy' ? 'center' : 'friendly',
      rating: 0,
      ratingCount: 0,
      phone: recommendation.contact,
      reviews: [],
      address: recommendation.contact.includes('ул.') || recommendation.contact.includes('пр.') ? recommendation.contact : undefined,
      sourceLabel: `Рекомендация: ${recommendation.author}`,
      lastVerified: new Date().toISOString().slice(0, 10),
      verificationStatus: 'verified'
    };

    setItems(prev => mergeDirectoryItems([approvedItem], prev));
    setRecommendations(prev => prev.map(item => (
      item.id === recommendation.id ? { ...item, status: 'approved' } : item
    )));
  };

  const handleRejectRecommendation = (id: string) => {
    setRecommendations(prev => prev.map(item => (
      item.id === id ? { ...item, status: 'rejected' } : item
    )));
  };

  const openReviewsModal = (item: DirectoryItem) => {
    setSelectedItem(item);
    setNewAuthor('');
    setNewRating(5);
    setNewComment('');
  };

  return (
    <div className="min-h-full flex flex-col pt-9 pb-8 bg-opora-sand">
      <div className="px-6 mb-3">
        <h1 className="font-serif text-[27px] font-medium text-opora-navy mb-1">Справочник</h1>
        <p className="text-opora-text text-xs leading-relaxed">Живая база доверия: опыт родителей, проверка вручную и места, где детям было бережно.</p>
      </div>

      <div className="px-6 mb-3">
        <button
          type="button"
          onClick={() => setFilter('recommendations')}
          className="w-full rounded-[20px] border border-opora-sage/25 bg-white/90 p-4 text-left shadow-sm transition-all active:scale-[0.99] dark:border-white/10 dark:bg-slate-800"
        >
          <span className="mb-2 inline-flex rounded-full bg-opora-sage/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-opora-sage">
            Главная ценность базы
          </span>
          <span className="block text-[18px] font-extrabold leading-tight text-opora-navy dark:text-slate-50">
            Никто не знает ребенка лучше родителя
          </span>
          <span className="mt-1.5 block text-[12px] leading-relaxed text-opora-text dark:text-slate-300">
            Мы собираем не рекламные адреса, а живой опыт семей: где приняли спокойно, где дали паузу, кто умеет работать с сенсорикой и неговорящими детьми.
          </span>
          <span className="mt-3 inline-flex items-center rounded-2xl bg-opora-navy px-3 py-2 text-xs font-extrabold text-white">
            Добавить родительский опыт
          </span>
        </button>
      </div>

      <div className="px-6 mb-3 space-y-2">
        {/* Search Input bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-opora-sage transition-colors" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, специализации или тегам..." 
            className="opora-directory-field w-full border border-black/5 py-2.5 pl-11 pr-4 rounded-2xl text-sm focus:outline-none focus:border-opora-sage focus:ring-4 focus:ring-opora-sage/10 text-opora-navy placeholder:text-black/30 transition-all font-medium"
          />
        </div>

        {/* City/Region Filter Selector */}
        <div className="flex gap-2 relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-opora-sage transition-transform group-hover:scale-110" size={18} />
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="opora-directory-field w-full border border-black/5 py-2.5 pl-11 pr-4 rounded-2xl text-sm focus:outline-none focus:border-opora-sage focus:ring-4 focus:ring-opora-sage/10 text-opora-navy appearance-none transition-all cursor-pointer font-medium"
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="px-6 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-opora-text/60 mb-2">Что ищем?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFilter('recommendations')}
            className={cn(
              "opora-directory-scenario col-span-2 text-left p-3 rounded-2xl border transition-all active:scale-[0.98]",
              filter === 'recommendations'
                ? "bg-opora-navy text-white border-opora-navy"
                : "opora-directory-filter border-opora-sage/25 text-opora-navy"
            )}
          >
            <span className="text-xl leading-none">🤝</span>
            <span className="block text-sm font-extrabold mt-2 leading-tight">Проверено семьями</span>
            <span className={cn(
              "block text-[11px] mt-0.5 leading-snug",
              filter === 'recommendations' ? "text-white/75" : "text-opora-text/70"
            )}>
              добавить рекомендацию или посмотреть, что советуют родители
            </span>
          </button>
          {scenarioFilters.map(scenario => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setFilter(scenario.id)}
              className={cn(
                "opora-directory-scenario text-left p-3 rounded-2xl border transition-all active:scale-[0.98]",
                filter === scenario.id
                  ? "bg-opora-navy text-white border-opora-navy"
                  : "opora-directory-filter border-black/5 text-opora-navy"
              )}
            >
              <span className="text-xl leading-none">{scenario.icon}</span>
              <span className="block text-sm font-extrabold mt-2 leading-tight">{scenario.label}</span>
              <span className={cn(
                "block text-[11px] mt-0.5 leading-snug",
                filter === scenario.id ? "text-white/75" : "text-opora-text/70"
              )}>
                {scenario.hint}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              "opora-directory-scenario text-left p-3 rounded-2xl border transition-all active:scale-[0.98]",
              filter === 'all'
                ? "bg-opora-navy text-white border-opora-navy"
                : "opora-directory-filter border-black/5 text-opora-navy"
            )}
          >
            <span className="text-xl leading-none">🗺️</span>
            <span className="block text-sm font-extrabold mt-2 leading-tight">Все места</span>
            <span className={cn("block text-[11px] mt-0.5 leading-snug", filter === 'all' ? "text-white/75" : "text-opora-text/70")}>полный список</span>
          </button>
        </div>
      </div>

      {/* Categories Toggle Bar */}
      <div className="px-6 mb-2 flex gap-2 overflow-x-auto no-scrollbar py-1.5 shrink-0">
        {[
          { id: 'friendly', label: 'Дружелюбные' },
          { id: 'doctor', label: 'Специалисты' },
          { id: 'bookings', label: 'Записи' },
          { id: 'center', label: 'Терапия' },
          { id: 'gov', label: 'Госучреждения' },
          { id: 'org', label: 'Фонды' },
        ].map(cat => (
          <button 
            key={cat.id}
            onClick={() => setFilter(cat.id as any)}
            className={cn(
              "whitespace-nowrap px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95",
              filter === cat.id ? "bg-opora-navy text-white shadow-opora-navy/20" : "opora-directory-filter text-opora-text border border-black/5 hover:border-opora-sage/50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filter !== 'bookings' && filter !== 'recommendations' && (
        <div className="px-6 mb-1 flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-opora-navy">{filterLabels[filter]}</span>
          <span className="font-semibold text-opora-text/70">
            {filter === 'usa' ? `${(evidenceApproaches.length || DEFAULT_EVIDENCE_APPROACHES.length)} подходов` : `${filteredItems.length} вариантов`}
          </span>
        </div>
      )}

      {filter === 'usa' && (
        <div className="px-6 mb-3">
          <div className="opora-directory-subpanel rounded-2xl border border-black/5 p-3">
            <div className="flex items-start gap-2">
              <Info size={15} className="mt-0.5 shrink-0 text-opora-sage" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-opora-navy leading-snug">
                  Только подходы, а не адреса
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-opora-text/80">
                  Мы убрали список провайдеров США. Здесь остаются только направления помощи, которые стоит обсуждать со специалистом. Приложение не назначает лечение и не обещает “вылечить РАС”.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {filter === 'recommendations' && (
        <div className="px-6 mb-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-opora-navy dark:text-slate-50">Рекомендации родителей</span>
            <span className="font-semibold text-opora-text/70 dark:text-slate-300">
              {recommendations.filter(item => item.status === 'pending').length} на проверке
            </span>
          </div>
          <div className="rounded-2xl border border-opora-sage/20 bg-opora-sage/10 p-3 dark:border-white/10 dark:bg-slate-800">
            <p className="text-[12px] font-extrabold leading-snug text-opora-navy dark:text-slate-50">
              Здесь важен не рейтинг учреждения, а реальный опыт семьи.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-opora-text/80 dark:text-slate-300">
              Пишите простыми словами: что помогло ребенку, где было спокойно, где специалист услышал родителя, а что стоит перепроверить перед визитом.
            </p>
          </div>
        </div>
      )}

      {/* Directory Cards Section */}
      <div className="px-5 sm:px-6 space-y-4 pt-2">
        {filter === 'recommendations' ? (
          <>
            <form onSubmit={handleAddRecommendation} className="opora-directory-card p-4 rounded-[20px] shadow-sm space-y-3">
              <div>
                <p className="text-base font-bold text-opora-navy">Поделиться родительским опытом</p>
                <p className="text-xs text-opora-text/70 leading-relaxed mt-1">
                  Никто не знает ребенка так тонко, как родитель. Оставьте рекомендацию, а администратор проверит ее перед публикацией.
                </p>
              </div>

              <input
                value={recommendationName}
                onChange={(e) => setRecommendationName(e.target.value)}
                className="opora-directory-field w-full border border-black/5 py-2.5 px-3 rounded-2xl text-sm font-medium"
                placeholder="Название места или специалиста"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={recommendationCity}
                  onChange={(e) => setRecommendationCity(e.target.value)}
                  className="opora-directory-field w-full border border-black/5 py-2.5 px-3 rounded-2xl text-sm font-medium"
                  placeholder="Город"
                />
                <select
                  value={recommendationKind}
                  onChange={(e) => setRecommendationKind(e.target.value as DirectoryRecommendation['kind'])}
                  className="opora-directory-field w-full border border-black/5 py-2.5 px-3 rounded-2xl text-sm font-medium"
                >
                  {Object.entries(recommendationKindLabels).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>

              <input
                value={recommendationContact}
                onChange={(e) => setRecommendationContact(e.target.value)}
                className="opora-directory-field w-full border border-black/5 py-2.5 px-3 rounded-2xl text-sm font-medium"
                placeholder="Телефон, сайт, Instagram или адрес"
              />

              <textarea
                value={recommendationNote}
                onChange={(e) => setRecommendationNote(e.target.value)}
                className="opora-directory-field w-full border border-black/5 py-2.5 px-3 rounded-2xl text-sm font-medium min-h-[92px] resize-none"
                placeholder="Что вы заметили как родитель: ребенку дали паузу, не торопили, поняли сенсорику, нашли подход, объяснили план, приняли без осуждения..."
              />

              <input
                value={recommendationAuthor}
                onChange={(e) => setRecommendationAuthor(e.target.value)}
                className="opora-directory-field w-full border border-black/5 py-2.5 px-3 rounded-2xl text-sm font-medium"
                placeholder="Кто рекомендует (можно оставить пустым)"
              />

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-opora-navy text-white py-3 rounded-2xl text-sm font-bold active:scale-[0.98] transition-all"
              >
                <Send size={15} />
                Отправить на проверку
              </button>
            </form>

            {recommendations.length === 0 ? (
              <div className="opora-directory-card text-center py-10 px-4 shadow-sm rounded-2xl flex flex-col items-center">
                <Heart size={32} className="text-opora-sage/40 mb-3" />
                <p className="text-base text-opora-navy font-semibold mb-1">Пока нет рекомендаций</p>
                <p className="text-sm text-opora-text/60">Здесь будут места, которые предложили родители и опекуны.</p>
              </div>
            ) : (
              recommendations.map(recommendation => (
                <div key={recommendation.id} className="opora-directory-card p-4 rounded-[20px] shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2",
                        recommendation.status === 'approved'
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : recommendation.status === 'rejected'
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : "bg-opora-sage/10 text-opora-sage border border-opora-sage/20"
                      )}>
                        {recommendation.status === 'approved' ? 'Подтверждено' : recommendation.status === 'rejected' ? 'Отклонено' : 'На проверке'}
                      </span>
                      <h3 className="text-[16px] font-bold text-opora-navy leading-tight">{recommendation.name}</h3>
                      <p className="text-xs text-opora-sage font-semibold mt-1">
                        {recommendationKindLabels[recommendation.kind]} · {recommendation.city}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-opora-text/55 shrink-0">{recommendation.createdAt}</span>
                  </div>

                  <p className="text-[13px] text-opora-text leading-relaxed mb-3">{recommendation.note}</p>

                  <div className="opora-directory-subpanel rounded-2xl p-3 space-y-1 text-xs mb-3">
                    <p className="text-opora-text/75"><span className="font-bold text-opora-navy">Контакт:</span> {recommendation.contact}</p>
                    <p className="text-opora-text/75"><span className="font-bold text-opora-navy">Рекомендовал:</span> {recommendation.author}</p>
                  </div>

                  {recommendation.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveRecommendation(recommendation)}
                        className="flex items-center justify-center gap-1.5 bg-opora-navy text-white py-3 rounded-2xl text-xs font-bold active:scale-[0.98] transition-all"
                      >
                        <CheckCircle size={14} />
                        Подтвердить
                      </button>
                      <button
                        onClick={() => handleRejectRecommendation(recommendation.id)}
                        className="opora-directory-action flex items-center justify-center gap-1.5 border border-black/5 py-3 rounded-2xl text-xs font-bold text-opora-text active:scale-[0.98] transition-all"
                      >
                        <X size={14} />
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        ) : filter === 'usa' ? (
          <div className="space-y-3">
            <div className="opora-directory-card rounded-[20px] p-4 shadow-sm">
              <p className="text-base font-extrabold text-opora-navy">Подходы, которые имеют доказательную базу</p>
              <p className="mt-1 text-xs leading-relaxed text-opora-text">
                Важно: это не “лечение аутизма”. Это способы развивать навыки, коммуникацию, самостоятельность и снижать перегрузку. План подбирает очный специалист.
              </p>
              <div className="mt-3 rounded-2xl bg-opora-sage/10 p-3 text-xs font-bold leading-relaxed text-opora-navy">
                Красный флаг: если кто-то обещает “полностью вылечить аутизм”, “убрать РАС за курс” или продает чудо-протокол без оценки ребенка — лучше остановиться и обсудить с врачом.
              </div>
            </div>

            {(evidenceApproaches.length ? evidenceApproaches : DEFAULT_EVIDENCE_APPROACHES).map((approach) => (
              <a
                key={approach.id}
                href={approach.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="opora-directory-card block rounded-[20px] p-4 shadow-sm transition-all active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-opora-sage/10 text-opora-sage">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold leading-tight text-opora-navy">{approach.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-opora-text">{approach.summary}</p>
                    <span className="mt-3 inline-flex text-[10px] font-extrabold uppercase tracking-wider text-opora-sage">
                      Источник: CDC / доказательная база
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : filter === 'bookings' ? (
          medicalBookings.length === 0 ? (
            <div className="opora-directory-card text-center py-12 px-4 shadow-sm rounded-[24px] mt-4 flex flex-col items-center">
              <Calendar size={36} className="text-opora-sage/40 mb-3" />
              <p className="text-base text-opora-navy font-bold mb-1">У вас пока нет записей</p>
              <p className="text-xs text-opora-text/60 max-w-xs leading-relaxed">
                Записывайтесь к особенным стоматологам и окулистам. При записи вы можете составить Цифровой Сенсорный Паспорт ребенка, который автоматически отправляется врачу до начала приема.
              </p>
            </div>
          ) : (
            medicalBookings.map(b => {
              const patient = profiles.find(p => p.id === b.childId) || profiles[0];
              const accessRequest = doctorCareRequests
                .filter(request => request.childId === b.childId && request.doctorId === b.doctorId && request.status !== 'declined')
                .sort((a, z) => new Date(z.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
              const accessLabel = accessRequest?.status === 'full_access'
                ? 'Врач видит документы'
                : accessRequest?.status === 'first_consult_done'
                  ? 'Нужно ваше решение'
                  : accessRequest?.status === 'doctor_accepted'
                    ? 'Врач готов к первой консультации'
                    : 'Ждем ответ врача';
              return (
                <div 
                  key={b.id} 
                  className="opora-directory-card p-5 rounded-[24px] shadow-sm flex flex-col relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 mb-1.5">
                        ✓ {accessLabel}
                      </span>
                      <h3 className="font-bold text-opora-navy leading-tight text-[16px]">
                        {b.doctorName}
                      </h3>
                      <p className="text-xs text-opora-sage font-medium mt-0.5 leading-normal">
                        {b.doctorTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-opora-sage mb-3 bg-opora-sage/10 w-fit px-2 py-0.5 rounded-md">
                    <MapPin size={11} /> 
                    {b.doctorCity}
                  </div>

                  <div className="mb-4 rounded-2xl border border-opora-sage/20 bg-opora-sage/10 p-3">
                    <div className="flex items-start gap-2">
                      {accessRequest?.status === 'full_access' ? (
                        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-opora-sage" />
                      ) : (
                        <LockKeyhole size={17} className="mt-0.5 shrink-0 text-opora-sage" />
                      )}
                      <div>
                        <p className="text-sm font-extrabold text-opora-navy">
                          {accessRequest?.status === 'first_consult_done' ? 'Вы хотите продолжить с этим врачом?' : 'Что видит врач?'}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-opora-text">
                          {accessRequest?.status === 'full_access'
                            ? 'Вы разрешили врачу видеть паспорт, прогресс и карточку ребенка.'
                            : accessRequest?.status === 'first_consult_done'
                              ? 'Если вам подходит врач, откройте ему документы. Если нет — ничего открывать не нужно.'
                              : accessRequest?.status === 'doctor_accepted'
                                ? 'Врач видит только запись на первую консультацию. Паспорт и прогресс закрыты.'
                                : 'Пока врач видит только входящий запрос. Документы ребенка закрыты.'}
                        </p>
                      </div>
                    </div>

                    {accessRequest?.status === 'first_consult_done' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => parentConfirmDoctorAccess(accessRequest.id)}
                          className="rounded-xl bg-opora-navy px-3 py-2.5 text-xs font-extrabold text-white"
                        >
                          Да, открыть врачу
                        </button>
                        <button
                          type="button"
                          onClick={() => declineDoctorCareRequest(accessRequest.id)}
                          className="rounded-xl bg-white px-3 py-2.5 text-xs font-extrabold text-opora-navy"
                        >
                          Пока не открывать
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date & Time Widget */}
                  <div className="opora-directory-subpanel rounded-2xl p-3 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white rounded-xl text-opora-sage shadow-sm">
                        <Calendar size={15} />
                      </div>
                      <div>
                        <p className="text-[9px] text-opora-text/60 uppercase font-bold tracking-tight">Дата приёма</p>
                        <p className="text-xs font-bold text-opora-navy">
                          {new Date(b.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                      <div className="p-2 bg-white rounded-xl text-opora-sage shadow-sm">
                        <Clock size={15} />
                      </div>
                      <div>
                        <p className="text-[9px] text-opora-text/60 uppercase font-bold tracking-tight">Время</p>
                        <p className="text-xs font-bold text-opora-navy">{b.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Child tag */}
                  <div className="mb-4">
                    <p className="text-[10px] text-opora-text/50 font-bold uppercase tracking-wider">Пациент:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-opora-peach text-opora-navy text-[11px] font-bold flex items-center justify-center font-serif shadow-sm">
                        {b.childName?.[0] || 'Д'}
                      </div>
                      <span className="text-sm font-bold text-opora-navy">{b.childName}</span>
                    </div>
                  </div>

                  {/* Sensory Summary block */}
                  <div className="border-t border-black/5 pt-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[11px] text-opora-text/60">
                      <span className="font-semibold">Сенсорный паспорт ребенка:</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">Передан врачу до приёма</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {b.sensoryPassport.soundSensitivity.length > 0 ? b.sensoryPassport.soundSensitivity.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-xl">
                          🔉 {tag === 'headphones' ? 'Наушники' : tag === 'breaks' ? 'Паузы в звуке' : tag === 'music' ? 'Фоновая музыка' : tag}
                        </span>
                      )) : (
                        <span className="text-[10px] font-semibold bg-gray-50 text-gray-400 border border-black/5 px-2 py-0.5 rounded-xl">Звук: норма</span>
                      )}
                      
                      {b.sensoryPassport.lightSensitivity.length > 0 ? b.sensoryPassport.lightSensitivity.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-xl">
                          🕶️ {tag === 'sunglasses' ? 'Очки от лампы' : tag === 'dimmed' ? 'Приглушенный свет' : tag === 'gradual' ? 'Плавный свет' : tag}
                        </span>
                      )) : (
                        <span className="text-[10px] font-semibold bg-gray-50 text-gray-400 border border-black/5 px-2 py-0.5 rounded-xl">Свет: норма</span>
                      )}
                      
                      {b.sensoryPassport.tactileSensitivity.length > 0 ? b.sensoryPassport.tactileSensitivity.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-xl">
                          🧸 {tag === 'tell-show-do' ? 'Принцип Tell-Show-Do' : tag === 'weighted-blanket' ? 'Утяжеленная накидка' : tag}
                        </span>
                      )) : (
                        <span className="text-[10px] font-semibold bg-gray-50 text-gray-400 border border-black/5 px-2 py-0.5 rounded-xl">Тактильность: норма</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Booking Card */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-black/5">
                    <button 
                      onClick={() => setViewingBooking(b)}
                      className="flex items-center justify-center gap-1.5 text-xs font-bold bg-opora-sand text-opora-navy py-3 rounded-2xl hover:bg-opora-sage/15 transition-all active:scale-[0.98]"
                    >
                      <FileText size={13} className="text-opora-sage" />
                      <span>Паспорт приёма</span>
                    </button>

                    <button 
                      onClick={() => {
                        cancelMedicalBooking(b.id);
                      }}
                      className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50/50 py-3 rounded-2xl transition-all"
                    >
                      <X size={13} />
                      <span>Отменить запись</span>
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          filteredItems.map(item => {
            const isSaved = savedCenters.includes(item.id);
            const isDoctor = item.type === 'doctor';
            const visibleTags = item.tags.slice(0, 3);
            const hiddenTagsCount = Math.max(0, item.tags.length - visibleTags.length);
            const isVerified = item.verificationStatus === 'verified';
            const needsReview = item.verificationStatus === 'needs_review';
            const trustBadge = getTrustBadge(item);

            return (
              <div 
                key={item.id} 
                className={cn(
                  "opora-directory-card p-3.5 rounded-[20px] shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden",
                  isDoctor ? "border-opora-sage/30" : ""
                )}
              >
                {isDoctor && (
                  <div className="absolute top-0 right-14 w-12 h-12 bg-opora-sage/5 rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                )}

                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="opora-directory-type inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-opora-sage">
                    {itemTypeLabels[item.type]}
                  </span>
                  <button
                    onClick={() => openReviewsModal(item)}
                    className="opora-directory-rating flex items-center gap-1 px-2 py-1 rounded-xl text-sm font-bold shrink-0 transition-colors cursor-pointer select-none"
                    title={item.ratingCount > 0 ? "Посмотреть отзывы родителей" : needsReview ? "Нужно уточнить перед визитом" : "Источник проверен"}
                  >
                    {item.ratingCount > 0 ? (
                      <>
                        <Star size={12} className="fill-yellow-500 text-yellow-500" />
                        <span>{item.rating}</span>
                        <span className="text-[10px] font-semibold opacity-70">({item.ratingCount})</span>
                      </>
                    ) : (
                      <>
                        {needsReview ? <Info size={12} className="text-opora-sage" /> : <CheckCircle size={12} className="text-opora-sage" />}
                        <span className="text-[11px]">{needsReview ? 'Уточнить' : 'Проверено'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mb-3">
                  <div className="min-w-0">
                    <div className="flex items-start gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-opora-navy leading-tight text-[16px] group-hover:text-opora-sage transition-colors">
                        {item.name}
                      </h3>
                      {isDoctor && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white bg-opora-sage rounded-md">
                          <Award size={10} /> Эксперт
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-md",
                        trustBadge.tone === 'review'
                          ? "text-amber-700 bg-amber-50 border-amber-100"
                          : trustBadge.tone === 'autism'
                            ? "text-opora-sage bg-opora-sage/10 border-opora-sage/20"
                            : trustBadge.tone === 'parent'
                              ? "text-rose-700 bg-rose-50 border-rose-100"
                              : "text-opora-sage bg-opora-sage/10 border-opora-sage/20"
                      )}>
                        {trustBadge.tone === 'review' ? <Info size={10} /> : <CheckCircle size={10} />} {trustBadge.label}
                      </span>
                      {needsReview && !isDoctor && (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-md",
                          "text-amber-700 bg-amber-50 border-amber-100"
                        )}>
                          <Info size={10} /> Проверить перед визитом
                        </span>
                      )}
                    </div>
                    {item.title && (
                      <p className="text-xs text-opora-sage font-medium mt-1 leading-normal font-sans">
                        {item.title}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-opora-sage mb-2.5 bg-opora-sage/10 w-fit px-2 py-1 rounded-md">
                  <MapPin size={11} /> 
                  <span className="break-words">{item.city}</span>
                </div>

                {item.address && (
                  <p className="opora-directory-address text-[12px] leading-relaxed text-opora-text/75 mb-2">
                    {item.address}
                  </p>
                )}
                
                <p className="opora-directory-description text-[13px] text-opora-text mb-4 leading-relaxed break-words">
                  {item.desc}
                </p>

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="opora-directory-source mb-3 inline-flex w-fit items-center gap-1.5 rounded-xl border border-opora-sage/20 bg-opora-sage/10 px-2.5 py-1 text-[11px] font-semibold text-opora-sage"
                  >
                    <Info size={11} />
                    {needsReview ? `Уточнить перед визитом` : item.lastVerified ? `Проверено ${item.lastVerified}` : item.sourceLabel}
                  </a>
                )}

                {!item.sourceUrl && item.sourceLabel && (
                  <span className="opora-directory-source mb-3 inline-flex w-fit items-center gap-1.5 rounded-xl border border-opora-sage/20 bg-opora-sage/10 px-2.5 py-1 text-[11px] font-semibold text-opora-sage">
                    <Info size={11} />
                    {item.lastVerified ? `${item.sourceLabel} · проверено ${item.lastVerified}` : item.sourceLabel}
                  </span>
                )}

                {item.country === 'US' && (
                  <div className="opora-directory-subpanel mb-3 rounded-xl border border-black/5 px-3 py-2">
                    <p className="text-[11px] font-bold text-opora-navy leading-snug">
                      🇺🇸 США · confidence {Math.round((item.confidenceScore || 0) * 100)}%
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-opora-text/75">
                      NPI подтверждает регистрацию провайдера. Сенсорная дружелюбность и опыт с РАС требуют проверки родителями.
                    </p>
                    {item.npi && (
                      <p className="mt-1 text-[10px] font-semibold text-opora-sage">NPI: {item.npi}</p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {visibleTags.map(tag => (
                    <span key={tag} className="text-xs font-semibold bg-opora-sand border border-black/5 text-opora-text/80 px-2.5 py-1 rounded-xl">
                      {tag}
                    </span>
                  ))}
                  {hiddenTagsCount > 0 && (
                    <span className="text-xs font-bold bg-opora-sand border border-black/5 text-opora-sage px-2.5 py-1 rounded-xl">
                      +{hiddenTagsCount}
                    </span>
                  )}
                </div>
                
                {/* Card Footer interaction tools */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-black/5 pt-3 mt-auto">
                  {item.canBook ? (
                    <button 
                      onClick={() => setBookingDoctor(item)}
                      className="flex items-center justify-center gap-1.5 text-sm font-bold bg-opora-navy hover:bg-opora-navy/90 text-white py-3 rounded-2xl transition-all active:scale-[0.98] select-none cursor-pointer shadow-sm"
                    >
                      <Calendar size={14} />
                      <span>Записаться</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowPhoneInfo(showPhoneInfo === item.phone ? null : item.phone)}
                      className="flex items-center justify-center gap-2 text-sm font-semibold bg-opora-sand text-opora-navy py-3 rounded-2xl hover:bg-opora-sage/15 transition-all active:scale-[0.98] select-none"
                    >
                      <Phone size={14} className="text-opora-sage" /> 
                      <span>{showPhoneInfo === item.phone ? item.phone : 'Контакты'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => openReviewsModal(item)}
                    className="opora-directory-action flex items-center justify-center gap-1.5 text-sm font-semibold border border-black/5 text-opora-text hover:bg-opora-sand hover:text-opora-navy px-3 py-3 rounded-2xl transition-all"
                    title="Отзывы родителей"
                  >
                    <MessageSquare size={14} className="text-opora-sage" />
                    <span className="text-xs text-opora-text/55 font-bold">({item.reviews?.length || 0})</span>
                  </button>

                  <button 
                    onClick={() => toggleSaveCenter(item.id)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 text-sm font-semibold px-3 border py-3 rounded-2xl transition-all active:scale-[0.98] cursor-pointer",
                      isSaved 
                        ? "border-opora-navy bg-opora-navy text-white shadow-md shadow-opora-navy/20" 
                        : "border-black/5 opora-directory-action text-opora-navy hover:bg-opora-sand"
                    )}
                    title="Сохранить в закладки"
                  >
                    <Bookmark size={14} className={isSaved ? "fill-white" : ""} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {filter !== 'bookings' && filter !== 'recommendations' && filteredItems.length === 0 && (
          <div className="opora-directory-card text-center py-12 px-4 shadow-sm rounded-2xl mt-4 flex flex-col items-center">
             <Search size={32} className="text-opora-sage/40 mb-3" />
             <p className="text-base text-opora-navy font-semibold mb-1">Ничего не найдено</p>
             <p className="text-sm text-opora-text/60">Попробуйте ввести другой город или направление терапий.</p>
          </div>
        )}
      </div>

      {/* Full-width Modal Bottom-Sheet for Reading & Submitting Reviews */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:p-0">
          <div 
            className="bg-white rounded-t-3xl w-full max-w-[420px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
            style={{ 
              marginBottom: 0,
              boxShadow: '0 -20px 40px rgba(0,0,0,0.15)'
            }}
          >
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-4 border-b border-black/[0.05] flex justify-between items-start shrink-0">
              <div className="flex-1 pr-6">
                <span className="text-[10px] bg-opora-sage/10 text-opora-sage font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1">
                  {selectedItem.type === 'doctor' ? 'Рейтинг Специалистов' : selectedItem.type === 'friendly' ? 'Дружелюбная среда' : 'Рейтинг Организации'}
                </span>
                <h2 className="font-serif text-lg font-bold text-opora-navy leading-snug">
                  {selectedItem.name}
                </h2>
                {selectedItem.title && (
                  <p className="text-xs text-opora-sage mt-0.5 font-medium">{selectedItem.title}</p>
                )}
                <p className="text-[11px] text-opora-text/65 flex items-center gap-1 mt-1 font-semibold">
                  <MapPin size={10} /> {selectedItem.city}
                </p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 hover:bg-opora-sand rounded-xl text-black/40 hover:text-opora-navy transition-colors shrink-0 outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Scroll Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              
              {/* Summary Stats Card */}
              <div className="bg-opora-sand p-4 rounded-2xl border border-black/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-opora-navy font-serif flex items-baseline gap-1.5">
                    {selectedItem.rating}
                    <span className="text-xs text-opora-text/50 font-sans">/ 5.0</span>
                  </div>
                  <p className="text-xs text-opora-text/75 font-semibold mt-1">Основано на {selectedItem.ratingCount} отзывах родителей</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex gap-0.5 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const cleanRating = Math.round(selectedItem.rating);
                      return (
                        <Star 
                          key={star} 
                          size={18} 
                          className={cn("fill-current", star <= cleanRating ? "text-yellow-400" : "text-gray-200")} 
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold mt-2 inline-flex items-center gap-1">
                    <CheckCircle size={10} /> Проверено
                  </span>
                </div>
              </div>

              {/* Verified Parent Reviews Section */}
              <div className="space-y-4">
                <h4 className="font-serif text-[15px] font-bold text-opora-navy flex items-center gap-2">
                  <MessageSquare size={16} className="text-opora-sage" />
                  <span>Отзывы и Опыт родителей</span>
                </h4>

                <div className="space-y-3.5">
                  {(selectedItem.reviews || []).map((review) => (
                    <div key={review.id} className="bg-white p-4 rounded-2xl border border-black/[0.03] shadow-sm relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-opora-sage/10 text-opora-sage flex items-center justify-center">
                            <User size={12} className="stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold text-opora-navy">
                            {review.author}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-opora-text/40 font-bold">{review.date}</span>
                      </div>

                      {/* Client single Star Rating indicator */}
                      <div className="flex gap-0.5 text-yellow-400 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={11} 
                            className={cn("fill-current", star <= review.rating ? "text-yellow-400" : "text-gray-100")} 
                          />
                        ))}
                      </div>

                      <p className="text-xs text-opora-text leading-relaxed font-medium">
                        {review.text}
                      </p>
                    </div>
                  ))}

                  {(!selectedItem.reviews || selectedItem.reviews.length === 0) && (
                    <div className="text-center py-6 bg-opora-sand/20 rounded-2xl border border-dashed border-black/5 text-xs text-opora-text/50">
                      У этого специалиста еще нет расширенных описаний родителей. Будьте первыми!
                    </div>
                  )}
                </div>
              </div>

              {/* Form to submit review */}
              <div className="bg-opora-sand p-4 rounded-2xl border border-opora-sage/20 relative">
                <h4 className="font-serif text-[14px] font-bold text-opora-navy mb-1">
                  Написать отзыв и оценить
                </h4>
                <p className="text-[10px] text-opora-text/75 leading-normal mb-3">
                  Поделитесь опытом с другими мамами и папами. Ваш отзыв поможет найти правильную траекторию.
                </p>

                <form onSubmit={handleAddReview} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-opora-navy uppercase tracking-wider mb-1">Имя или Псевдоним:</label>
                    <input 
                      type="text" 
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Напр. Мама Темирлана, Анонимно..." 
                      className="w-full text-xs bg-white border border-black/5 rounded-xl px-3 py-2 text-opora-navy placeholder:text-black/20 focus:outline-none focus:border-opora-sage transition-all font-medium"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-opora-navy uppercase tracking-wider mb-1">Ваша оценка за приём:</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          className="p-1 text-yellow-400 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                        >
                          <Star 
                            size={20} 
                            className={cn(
                              "fill-current", 
                              star <= (ratingHover || newRating) ? "text-yellow-400" : "text-gray-200"
                            )} 
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-opora-sage ml-1 font-mono">
                        {newRating} из 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-opora-navy uppercase tracking-wider mb-1">Ваш подробный отзыв:</label>
                    <textarea 
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Как прошел прием? С чем помог врач? Нашел ли подход к поведению ребенка?.." 
                      rows={3}
                      className="w-full text-xs bg-white border border-black/5 rounded-xl px-3 py-2 text-opora-navy placeholder:text-black/25 focus:outline-none focus:border-opora-sage resize-none transition-all font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-opora-navy text-white text-xs font-bold py-3.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
                  >
                    <Send size={12} />
                    <span>Отправить отзыв</span>
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Booking Wizard Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:p-0">
          <div className="bg-white rounded-t-[32px] w-full max-w-[420px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="px-6 pt-5 pb-4 border-b border-b-black/[0.05] flex justify-between items-start shrink-0 bg-gradient-to-r from-opora-sand to-white">
              <div>
                <span className="text-[10px] bg-opora-navy text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1.5 shadow-sm">
                  Шаг 1 и 2: Оформление Записи
                </span>
                <h2 className="font-serif text-lg font-bold text-opora-navy leading-snug">
                  Запись к {bookingDoctor.name}
                </h2>
                <p className="text-xs text-opora-sage font-semibold mt-0.5">{bookingDoctor.title}</p>
              </div>
              <button 
                onClick={() => setBookingDoctor(null)}
                className="p-1.5 hover:bg-opora-sand rounded-xl text-black/40 hover:text-opora-navy transition-colors shrink-0 outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              
              {/* Info banner about specialized medical care */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex gap-3">
                <Sparkles className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <p className="font-bold mb-0.5 text-blue-950">Особая подготовка кабинета</p>
                  Этот приём адаптирован. Мы передадим составленный вами <strong>Сенсорный паспорт</strong> врачу заранее, чтобы ребенок чувствовал себя спокойно у стоматолога или окулиста.
                </div>
              </div>

              {/* Patient Child selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-opora-navy uppercase tracking-wider">
                  Имя и профиль ребёнка:
                </label>
                <select
                  value={bookingChildId}
                  onChange={(e) => setBookingChildId(e.target.value)}
                  className="w-full bg-opora-sand/50 border border-black/5 py-3 px-4 rounded-xl text-sm focus:outline-none focus:border-opora-sage text-opora-navy font-semibold appearance-none cursor-pointer transition-all"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      🧒 {p.childName} ({p.childAge} {p.childAge === 1 ? 'год' : p.childAge < 5 ? 'года' : 'лет'}) — {p.diagnosticStatus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-opora-navy uppercase tracking-wider">
                    Выберите дату:
                  </label>
                  <select
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-opora-sand/50 border border-black/5 py-3 px-3 rounded-xl text-xs focus:outline-none focus:border-opora-sage text-opora-navy font-semibold cursor-pointer"
                  >
                    <option value="2026-06-03">Ср, 3 июня (Завтра)</option>
                    <option value="2026-06-04">Чт, 4 июня</option>
                    <option value="2026-06-05">Пт, 5 июня</option>
                    <option value="2026-06-08">Пн, 8 июня</option>
                    <option value="2026-06-09">Вт, 9 июня</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-opora-navy uppercase tracking-wider">
                    Выберите время:
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-opora-sand/50 border border-black/5 py-3 px-3 rounded-xl text-xs focus:outline-none focus:border-opora-sage text-opora-navy font-semibold cursor-pointer"
                  >
                    <option value="10:00">10:00 (Свободно)</option>
                    <option value="11:30">11:30 (Свободно)</option>
                    <option value="14:00">14:00 (Адаптационный слот)</option>
                    <option value="15:30">15:30 (Свободно)</option>
                    <option value="17:00">17:00 (Вечерний слот)</option>
                  </select>
                </div>
              </div>

              {/* SECTION: Sensory Passport details */}
              <div className="border-t border-black/5 pt-5 space-y-4">
                <div className="flex items-center gap-1.5 pb-1">
                  <Heart className="text-rose-500 fill-rose-500 shrink-0" size={16} />
                  <h3 className="font-serif text-[15px] font-bold text-opora-navy">
                    Конфигурация Сенсорного Паспорта
                  </h3>
                </div>

                {/* Sound preferences checkbox lists */}
                <div className="space-y-2.5">
                  <span className="block text-[11px] font-bold text-opora-text/60 uppercase tracking-wide">
                    🔊 Звуковая адаптация:
                  </span>
                  <div className="space-y-2">
                    {[
                      { id: 'headphones', label: 'Предоставить пациенту специальные наушники' },
                      { id: 'breaks', label: 'Делать частые паузы во время сверления / шума для снятия сенсорного утомления' },
                      { id: 'music', label: 'Включить любимые детские песни или успокаивающий фоновый шум' }
                    ].map(opt => {
                      const active = soundNeeds.includes(opt.id);
                      return (
                        <label key={opt.id} className="flex items-center gap-2.5 bg-opora-sand/30 hover:bg-opora-sand/50 p-2.5 rounded-xl border border-black/[0.02] cursor-pointer transition-all">
                          <input 
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              setSoundNeeds(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                            }}
                            className="rounded text-opora-sage focus:ring-opora-sage w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs text-opora-navy font-medium">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Light sensitivity */}
                <div className="space-y-2.5 pt-1">
                  <span className="block text-[11px] font-bold text-opora-text/60 uppercase tracking-wide">
                    🕶️ Световая адаптация:
                  </span>
                  <div className="space-y-2">
                    {[
                      { id: 'sunglasses', label: 'Предоставить защитные тёмные очки от лампы стоматолога' },
                      { id: 'dimmed', label: 'Приглушить основной слепящий свет в операционной / кабинете' },
                      { id: 'gradual', label: 'Плавное приучение к свету диагностического офтальмоскопа' }
                    ].map(opt => {
                      const active = lightNeeds.includes(opt.id);
                      return (
                        <label key={opt.id} className="flex items-center gap-2.5 bg-opora-sand/30 hover:bg-opora-sand/50 p-2.5 rounded-xl border border-black/[0.02] cursor-pointer transition-all">
                          <input 
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              setLightNeeds(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                            }}
                            className="rounded text-opora-sage focus:ring-opora-sage w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs text-opora-navy font-medium">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Tactile interaction */}
                <div className="space-y-2.5 pt-1">
                  <span className="block text-[11px] font-bold text-opora-text/60 uppercase tracking-wide">
                    🧸 Тактильный контакт и Доверие:
                  </span>
                  <div className="space-y-2">
                    {[
                      { id: 'tell-show-do', label: 'Методика Tell-Show-Do (Показать и объяснить инструмент перед использованием)' },
                      { id: 'weighted-blanket', label: 'Использовать утяжеленный плед / накидку для проприоцептивного покоя' }
                    ].map(opt => {
                      const active = tactileNeeds.includes(opt.id);
                      return (
                        <label key={opt.id} className="flex items-center gap-2.5 bg-opora-sand/30 hover:bg-opora-sand/50 p-2.5 rounded-xl border border-black/[0.02] cursor-pointer transition-all">
                          <input 
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              setTactileNeeds(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                            }}
                            className="rounded text-opora-sage focus:ring-opora-sage w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs text-opora-navy font-medium">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Communication style selection dropdown */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-opora-text/60 uppercase tracking-wide">
                    🗣️ Стиль общения врача с ребёнком:
                  </label>
                  <select
                    value={comStyle}
                    onChange={(e) => setComStyle(e.target.value)}
                    className="w-full bg-opora-sand/50 border border-black/5 py-3 px-3 rounded-xl text-xs focus:outline-none focus:border-opora-sage text-opora-navy font-semibold cursor-pointer animate-none"
                  >
                    <option value="simple-words">Короткие простые фразы и пошаговые команды</option>
                    <option value="visuals">Визуальные карточки PECS / Пиктограммы расписания</option>
                    <option value="silence">Минимум лишних разговоров и вопросов, тихий голос</option>
                    <option value="praise">Постоянная похвала и выдача фишек за каждое действие</option>
                  </select>
                </div>

                {/* Custom input fields */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-opora-text/60 uppercase tracking-wide">
                    🧸 Что успокаивает ребенка при тревоге?
                  </label>
                  <textarea
                    value={comfortTriggers}
                    onChange={(e) => setComfortTriggers(e.target.value)}
                    placeholder="Напр., держать любимую силиконовую игрушку-динозавра, смотреть мультик про поезда на потолке."
                    rows={2}
                    className="w-full text-xs bg-opora-sand/30 border border-black/5 rounded-xl px-3 py-2.5 text-opora-navy focus:outline-none focus:border-opora-sage resize-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-opora-text/60 uppercase tracking-wide">
                    🎁 Желаемое вознаграждение в конце приема:
                  </label>
                  <input
                    type="text"
                    value={favReward}
                    onChange={(e) => setFavReward(e.target.value)}
                    placeholder="Дать выбрать светящуюся силиконовую наклейку или мыльные пузыри."
                    className="w-full text-xs bg-opora-sand/30 border border-black/5 rounded-xl px-3 py-2.5 text-opora-navy focus:outline-none focus:border-opora-sage transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Submit Action Block */}
            <div className="px-6 py-4 border-t border-black/[0.05] bg-gray-50 shrink-0">
              <button
                onClick={() => {
                  const patientChild = profiles.find(p => p.id === bookingChildId) || profiles[0];
                  if (!patientChild) return;
                  
                  const passport: any = {
                    soundSensitivity: soundNeeds,
                    lightSensitivity: lightNeeds,
                    tactileSensitivity: tactileNeeds,
                    communicationStyle: comStyle,
                    comfortTriggers: comfortTriggers.trim(),
                    favoriteReward: favReward.trim()
                  };

                  const bookingData = {
                    childId: bookingChildId,
                    childName: patientChild.childName,
                    doctorId: bookingDoctor.id,
                    doctorName: bookingDoctor.name,
                    doctorTitle: bookingDoctor.title || '',
                    doctorCity: bookingDoctor.city,
                    date: bookingDate,
                    time: bookingTime,
                    sensoryPassport: passport
                  };

                  addMedicalBooking(bookingData);
                  setLatestBookingCreated(bookingData);
                  setShowSuccessBookingSlip(true);
                  setBookingDoctor(null);
                }}
                className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-sm"
              >
                <CheckCircle size={16} />
                <span>Подтвердить запись с сенсорным паспортом</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Ticket Slip Modal */}
      {showSuccessBookingSlip && latestBookingCreated && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-[390px] overflow-hidden shadow-2xl animate-scale-in relative flex flex-col border border-opora-sage/40">
            {/* Soft Green Confetti Top */}
            <div className="bg-emerald-500 text-white px-6 py-8 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="font-serif text-xl font-bold">Вы записаны!</h2>
                  <p className="text-xs text-white/80 mt-1 max-w-[260px]">Запрос отправлен врачу. Полная документация откроется только после вашего подтверждения</p>
            </div>

            {/* Ticket Information Panel */}
            <div className="p-6 space-y-4 bg-white">
              <div className="border-b border-dashed border-gray-250 pb-4 text-center">
                <p className="text-[10px] text-opora-text/40 font-bold uppercase tracking-wider">Приём у специалиста</p>
                <p className="text-base font-serif font-bold text-opora-navy mt-0.5">{latestBookingCreated.doctorName}</p>
                <p className="text-xs text-opora-sage font-medium mt-0.5">{latestBookingCreated.doctorTitle}</p>
              </div>

              {/* Dotted parameters rows */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-opora-text/60 font-medium">🧒 Пациент:</span>
                  <span className="font-bold text-opora-navy">{latestBookingCreated.childName}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-opora-text/60 font-medium">📅 Дата приёма:</span>
                  <span className="font-bold text-opora-navy">
                    {new Date(latestBookingCreated.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-opora-text/60 font-medium">⏰ Время слота:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">{latestBookingCreated.time}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-opora-text/60 font-medium">📍 Город приёма:</span>
                  <span className="font-semibold text-opora-navy">{latestBookingCreated.doctorCity}</span>
                </div>
              </div>

              {/* Dotted Ticket Punch Cuts */}
              <div className="relative h-px w-full my-4 flex items-center justify-between">
                <div className="absolute -left-9 w-6 h-6 rounded-full bg-black/75"></div>
                <div className="border-t border-dashed border-gray-200 w-full"></div>
                <div className="absolute -right-9 w-6 h-6 rounded-full bg-black/75"></div>
              </div>

              {/* Note on sensor modifications */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 mb-1">
                  <Sparkles size={13} className="text-emerald-600 shrink-0" />
                  <span className="font-bold">Адаптированный кабинет готов!</span>
                </div>
                <p className="text-[11px] text-opora-text/70 leading-relaxed">
                  Врач увидит входящую заявку и минимальные данные для первой консультации. Паспорт, прогресс и документы ребенка останутся закрыты до вашего решения после консультации.
                </p>
              </div>
            </div>

            {/* Ticket foot button */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setShowSuccessBookingSlip(false);
                  setLatestBookingCreated(null);
                  setFilter('bookings');
                }}
                className="w-full bg-opora-navy hover:bg-opora-navy/90 text-white font-bold py-3 rounded-2xl transition-all shadow-md text-xs tracking-wider uppercase cursor-pointer"
              >
                Открыть Мои Записи 📅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sensory Passport Viewer Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:p-0">
          <div className="bg-white rounded-t-[32px] w-full max-w-[420px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="px-6 pt-5 pb-4 border-b border-black/[0.05] flex justify-between items-start shrink-0 bg-rose-50/50">
              <div>
                <span className="text-[10px] bg-rose-500 text-white font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1.5 shadow-sm">
                  АКТИВНЫЙ СЕНСОРНЫЙ ПАСПОРТ
                </span>
                <h2 className="font-serif text-lg font-bold text-opora-navy">
                  Пациент: {viewingBooking.childName}
                </h2>
                <p className="text-xs text-opora-sage font-semibold mt-0.5">Врач: {viewingBooking.doctorName}</p>
              </div>
              <button 
                onClick={() => setViewingBooking(null)}
                className="p-1.5 hover:bg-opora-sand rounded-xl text-black/40 hover:text-opora-navy transition-colors shrink-0 outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="text-xs text-opora-text/65 leading-relaxed bg-opora-sand/50 p-4 rounded-2xl border border-black/[0.01]">
                Этот электронный паспорт автоматически синхронизирован с клиникой. На приёме персонал обязуется следовать указанным адаптациям для минимизации тревожности ребенка.
              </div>

              {/* Sound Section detail */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-opora-navy uppercase tracking-wider flex items-center gap-1.5">
                  🔊 Звуковой Профиль:
                </span>
                <div className="space-y-1.5 pl-5">
                  {viewingBooking.sensoryPassport.soundSensitivity.length > 0 ? (
                    viewingBooking.sensoryPassport.soundSensitivity.map((x: string) => (
                      <div key={x} className="text-xs font-semibold text-opora-navy flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>
                          {x === 'headphones' ? 'Выдать пациенту специальные наушники на приёме' : 
                           x === 'breaks' ? 'Делать регулярные адаптационные паузы при шуме инструментов' : 
                           x === 'music' ? 'Включить фоновые релакс терапевтические детские звуки' : x}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Нормальная чувствительность к шумам</span>
                  )}
                </div>
              </div>

              {/* Light sensitivity detail */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-opora-navy uppercase tracking-wider flex items-center gap-1.5">
                  🕶️ Световой Профиль:
                </span>
                <div className="space-y-1.5 pl-5">
                  {viewingBooking.sensoryPassport.lightSensitivity.length > 0 ? (
                    viewingBooking.sensoryPassport.lightSensitivity.map((x: string) => (
                      <div key={x} className="text-xs font-semibold text-opora-navy flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>
                          {x === 'sunglasses' ? 'Обязательно предоставить защитные тёмные очки от лампы' : 
                           x === 'dimmed' ? 'Приглушить основное искусственное освещение кабинета / лампы' : 
                           x === 'gradual' ? 'Избегать резких вспышек направленного света устройств и рефрактометра' : x}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Нормальная светочувствительность</span>
                  )}
                </div>
              </div>

              {/* Tactile interaction detail */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-opora-navy uppercase tracking-wider flex items-center gap-1.5">
                  🧸 Тактильный & Контактный Профиль:
                </span>
                <div className="space-y-1.5 pl-5">
                  {viewingBooking.sensoryPassport.tactileSensitivity.length > 0 ? (
                    viewingBooking.sensoryPassport.tactileSensitivity.map((x: string) => (
                      <div key={x} className="text-xs font-semibold text-opora-navy flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>
                          {x === 'tell-show-do' ? 'Пошагово показывать и знакомить с инструментами (Tell-Show-Do)' : 
                           x === 'weighted-blanket' ? 'Применить на грудь / ноги утяжеленный плед для седации' : x}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Нормальный тактильный контакт</span>
                  )}
                </div>
              </div>

              {/* Communication style */}
              <div className="space-y-1 bg-gray-50 p-3.5 rounded-xl border border-black/[0.02]">
                <span className="text-[10px] text-opora-text/50 font-bold uppercase tracking-wider block">Оптимальная стратегия общения:</span>
                <span className="text-xs font-bold text-opora-navy mt-0.5 block">
                  {viewingBooking.sensoryPassport.communicationStyle === 'simple-words' ? '🗣️ Простые слова и конкретные пошаговые инструкции' : 
                   viewingBooking.sensoryPassport.communicationStyle === 'visuals' ? '📋 Визуальные терапевтические расписания (PECS)' : 
                   viewingBooking.sensoryPassport.communicationStyle === 'silence' ? '🤫 Соблюдать тишину, исключить лишние расспросы' : 
                   viewingBooking.sensoryPassport.communicationStyle === 'praise' ? '🎉 Голосовое поощрение, постоянное хваление за терпение' : viewingBooking.sensoryPassport.communicationStyle}
                </span>
              </div>

              {/* Comfort factors */}
              {viewingBooking.sensoryPassport.comfortTriggers && (
                <div className="space-y-1 bg-gray-50 p-3.5 rounded-xl border border-black/[0.02]">
                  <span className="text-[10px] text-opora-text/50 font-bold uppercase tracking-wider block">Что успокаивает ребенка при тревоге:</span>
                  <span className="text-xs text-opora-navy font-medium block leading-relaxed">{viewingBooking.sensoryPassport.comfortTriggers}</span>
                </div>
              )}

              {/* Reward */}
              {viewingBooking.sensoryPassport.favoriteReward && (
                <div className="space-y-1 bg-gray-50 p-3.5 rounded-xl border border-black/[0.02]">
                  <span className="text-[10px] text-opora-text/50 font-bold uppercase tracking-wider block">Желаемое вознаграждение после приёма:</span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 mt-1 inline-block">{viewingBooking.sensoryPassport.favoriteReward}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-black/[0.05] bg-gray-50 shrink-0 text-center">
              <button
                onClick={() => setViewingBooking(null)}
                className="w-full bg-opora-navy hover:bg-opora-navy/90 text-white font-bold py-3 rounded-2xl text-xs uppercase"
              >
                Закрыть сенсорный паспорт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

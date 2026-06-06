export type MedicalCaseProfile = {
  childName?: string;
  childAge?: number;
  userCity?: string;
  city?: string;
  diagnosticStatus?: string;
};

export type MedicalDocumentRequirement = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  owner: "parent" | "treating_doctor" | "clinic" | "translator";
};

export type MedicalFoundationResource = {
  id: string;
  name: string;
  url: string;
  fit: string;
  caveat: string;
  lastVerified: string;
};

export type MedicalLetterTemplate = {
  id: string;
  title: string;
  bodyRu: string;
  bodyEn: string;
};

export type MedicalRouteStep = {
  id: string;
  title: string;
  deadline: string;
  action: string;
  output: string;
};

export type MedicalCaseRoute = {
  title: string;
  criticalAction: string;
  documents: MedicalDocumentRequirement[];
  foundations: MedicalFoundationResource[];
  templates: MedicalLetterTemplate[];
  steps: MedicalRouteStep[];
  safetyNote: string;
};

const VERIFIED_AT = "2026-06-06";

const documentRequirements: MedicalDocumentRequirement[] = [
  {
    id: "treating_doctor_current_extract",
    title: "Актуальная выписка от лечащего врача",
    description: "Лечащий врач должен подготовить все текущие заключения и выписки: диагноз, динамику, что ухудшается, лечение, обследования, ограничения и цель второго мнения.",
    required: true,
    owner: "treating_doctor"
  },
  {
    id: "specialist_conclusions",
    title: "Заключения узких специалистов",
    description: "Нужны текущие заключения профильных врачей по диагнозу: невролог, генетик, ортопед, психиатр, кардиолог, офтальмолог, ЛОР/аудиолог или другие по ситуации.",
    required: true,
    owner: "treating_doctor"
  },
  {
    id: "diagnostic_tests",
    title: "Результаты обследований",
    description: "МРТ/КТ, ЭЭГ, УЗИ, анализы, генетические тесты, выписки из стационаров, заключения консилиумов. Сохраните даты, единицы измерения и референсы.",
    required: true,
    owner: "parent"
  },
  {
    id: "treatment_history",
    title: "История лечения и лекарств",
    description: "Список препаратов, дозировки, частота, длительность, эффект, побочные реакции, аллергии, реабилитация и причины отмены.",
    required: true,
    owner: "parent"
  },
  {
    id: "development_rehab_reports",
    title: "Отчеты реабилитации и развития",
    description: "Заключения реабилитолога, физиотерапевта, логопеда, ABA/дефектолога, эрготерапевта, динамика навыков и ограничений.",
    required: false,
    owner: "parent"
  },
  {
    id: "identity_consent",
    title: "Документы личности и согласие",
    description: "Паспорт/свидетельство о рождении, ИИН, документы родителя, согласие на обработку и передачу медицинских данных клинике или фонду.",
    required: true,
    owner: "parent"
  },
  {
    id: "technical_translation",
    title: "Технический медицинский перевод",
    description: "Перевод для первичного рассмотрения клиникой на английский, немецкий, иврит или другой нужный язык. Диагнозы, дозировки, даты и единицы измерения должны быть точными.",
    required: true,
    owner: "translator"
  }
];

const foundationResources: MedicalFoundationResource[] = [
  {
    id: "next_generation",
    name: "Next Generation Foundation",
    url: "https://nextfund.kz/ru",
    fit: "Поддержка проектов и помощи, связанных с аутизмом и развитием детей; подходит для первичной проверки при РАС и сопутствующих запросах.",
    caveat: "Нужно уточнить текущие правила приема заявок, диагнозы, документы и доступность финансирования; помощь не гарантирована.",
    lastVerified: VERIFIED_AT
  },
  {
    id: "bi_juldizai",
    name: "BI-Жулдызай / BI-Juldizai",
    url: "https://juldizai.kz/",
    fit: "Дети с особыми потребностями, реабилитационные и медицинские маршруты; подходит для проверки реабилитации и специализированной помощи.",
    caveat: "Нужно проверить актуальные программы, географию, возраст, диагноз и формат поддержки; финансирование не гарантировано.",
    lastVerified: VERIFIED_AT
  },
  {
    id: "botashym",
    name: "Боташым",
    url: "https://www.botashym.com/",
    fit: "Дети с ДЦП и неврологическими состояниями; диагностика, лечение, реабилитация, перелет и проживание по профилю фонда.",
    caveat: "Нужно уточнить соответствие диагноза, пакет документов, лимиты и сроки рассмотрения; фонд может отказать при несоответствии критериям.",
    lastVerified: VERIFIED_AT
  },
  {
    id: "ayala",
    name: "AYALA",
    url: "https://ayala.kz/ru/about/",
    fit: "Благотворительные проекты в детском здравоохранении и образовании; полезно проверить при запросах на диагностику, оборудование или медпомощь.",
    caveat: "Нужно проверить, есть ли открытая программа под конкретный диагноз и услугу; индивидуальная оплата лечения не гарантирована.",
    lastVerified: VERIFIED_AT
  }
];

function childLine(profile: MedicalCaseProfile) {
  const name = profile.childName || "[имя ребенка]";
  const age = profile.childAge ? `${profile.childAge} лет` : "[возраст]";
  const city = profile.userCity || profile.city || "[город]";
  return `${name}, ${age}, ${city}`;
}

export function getMedicalFoundationResources(): MedicalFoundationResource[] {
  return foundationResources.map(item => ({ ...item }));
}

export function getMedicalLetterTemplates(profile: MedicalCaseProfile = {}): MedicalLetterTemplate[] {
  const child = childLine(profile);

  return [
    {
      id: "foreign_clinic_second_opinion",
      title: "Письмо в зарубежную клинику для второго мнения",
      bodyRu: `Тема: Запрос на второе медицинское мнение и оценку прогрессии заболевания

Здравствуйте.

Меня зовут [ФИО родителя]. Я родитель ребенка: ${child}. Мы просим рассмотреть медицинские документы и сообщить, может ли ваша клиника провести консультацию/диагностику/лечение.

Диагноз или подозрение: [указать].
Что прогрессирует и с каких сроков: [описать динамику].
Текущий лечащий врач и страна наблюдения: [указать].
Что нам нужно: оценить, можно ли замедлить или остановить прогрессию, какие обследования нужны и возможна ли очная/онлайн-консультация.

Приложения:
1. Актуальная выписка лечащего врача.
2. Текущие заключения узких специалистов.
3. Результаты обследований.
4. История лечения и список лекарств.
5. Технический медицинский перевод документов.

Контакт: [телефон, email, WhatsApp].
Я подтверждаю согласие на обработку и рассмотрение переданных медицинских данных для организации консультации.`,
      bodyEn: `Subject: Request for medical second opinion and disease progression review

Dear Clinic Team,

My name is [parent full name]. I am the parent of ${child}. We would like to submit medical records for review and ask whether your clinic can provide consultation, diagnostics, or treatment.

Diagnosis or suspected diagnosis: [insert].
Progression and timeline: [describe].
Current treating physician and country of care: [insert].
Request: please assess whether the disease progression can be slowed or stopped, what additional diagnostics are required, and whether online or in-person consultation is possible.

Attachments:
1. Updated summary from the treating physician.
2. Current specialist reports.
3. Diagnostic test results.
4. Treatment history and medication list.
5. Technical medical translation of documents.

Contact: [phone, email, WhatsApp].
I consent to processing and reviewing the submitted medical data for the purpose of arranging a consultation.`
    },
    {
      id: "foundation_funding_request",
      title: "Обращение в благотворительный фонд",
      bodyRu: `Тема: Просьба о финансировании диагностики/лечения/реабилитации ребенка

Здравствуйте.

Меня зовут [ФИО родителя]. Я обращаюсь за помощью для ребенка: ${child}.

Диагноз или подозрение: [указать].
Суть проблемы: [что ухудшается, почему нужна срочная диагностика или лечение].
Что просим профинансировать: [консультация, диагностика, лечение, реабилитация, перелет, проживание, оборудование].
Ориентировочная сумма и клиника/центр: [если известно].

Приложения:
1. Актуальная выписка лечащего врача и текущие заключения.
2. Смета/счет клиники или центра, если есть.
3. Документы ребенка и родителя.
4. Фото/сканы обследований.
5. Контакты лечащего врача для подтверждения.

Контакт для связи: [телефон, email, WhatsApp].
Понимаю, что фонд должен проверить соответствие программы, документы и наличие финансирования.`,
      bodyEn: `Subject: Funding request for a child's diagnostics, treatment, or rehabilitation

Dear Foundation Team,

My name is [parent full name]. I am requesting support for my child: ${child}.

Diagnosis or suspected diagnosis: [insert].
Current concern: [describe progression and urgency].
Funding request: [consultation, diagnostics, treatment, rehabilitation, travel, accommodation, equipment].
Estimated amount and clinic/center: [insert if available].

Attachments:
1. Updated treating physician summary and current specialist reports.
2. Clinic or center quote, if available.
3. Child and parent identity documents.
4. Diagnostic test scans.
5. Treating physician contact for verification.

Contact: [phone, email, WhatsApp].
I understand that eligibility, documents, and available funding must be reviewed by the foundation.`
    },
    {
      id: "treating_doctor_document_request",
      title: "Запрос лечащему врачу на досье",
      bodyRu: `Тема: Просьба подготовить актуальную выписку и заключения для второго мнения

Здравствуйте, [имя врача].

Просим подготовить для ${child} актуальную медицинскую выписку и все текущие заключения для направления в профильную клинику/фонд.

Пожалуйста, включите: диагноз и коды, динамику состояния, что именно прогрессирует, проведенное лечение, препараты и дозировки, результаты обследований, ограничения, рекомендации и медицинское обоснование второго мнения.

Документы нужны для технического медицинского перевода и первичного рассмотрения клиникой/фондом.`,
      bodyEn: `Subject: Request for updated medical summary and reports for second opinion

Dear Dr. [name],

We kindly ask you to prepare an updated medical summary and all current reports for ${child} for submission to a specialized clinic/foundation.

Please include diagnosis and codes, disease dynamics, what is progressing, treatment history, medications and dosages, diagnostic results, functional limitations, recommendations, and the medical reason for second opinion.

The documents will be used for technical medical translation and initial review by a clinic/foundation.`
    }
  ];
}

export function buildMedicalCaseRoute(profile: MedicalCaseProfile = {}, _userGoal = ""): MedicalCaseRoute {
  const name = profile.childName || "ребенка";

  return {
    title: `Маршрут до Точки Б для ${name}`,
    criticalAction: "Сегодня запросите у лечащего врача актуальную выписку и все текущие заключения: без этого клиника или фонд не смогут оценить прогрессию и срочность.",
    documents: documentRequirements.map(item => ({ ...item })),
    foundations: getMedicalFoundationResources(),
    templates: getMedicalLetterTemplates(profile),
    steps: [
      {
        id: "stabilize",
        title: "Зафиксировать медицинскую цель",
        deadline: "Сегодня",
        action: "Запишите диагноз, что именно ухудшается, с какой даты, какие обследования уже сделаны и кто лечащий врач.",
        output: "Короткое резюме на 8-10 строк для врача, клиники и фонда."
      },
      {
        id: "doctor_extracts",
        title: "Запросить документы у лечащего врача",
        deadline: "24-48 часов",
        action: "Отправьте врачу шаблон запроса на актуальную выписку, текущие заключения, динамику и обоснование второго мнения.",
        output: "Подписанная выписка и комплект текущих медицинских заключений."
      },
      {
        id: "translate",
        title: "Подготовить медицинский перевод",
        deadline: "2-4 дня",
        action: "Сделайте технический медицинский перевод на язык клиники. Для визы, суда, страховой или госпитализации может потребоваться сертифицированный перевод.",
        output: "PDF/текст на нужном языке с сохраненными диагнозами, дозировками, датами и единицами."
      },
      {
        id: "specialist_search",
        title: "Найти профильного специалиста",
        deadline: "3-7 дней",
        action: "Сначала ищите узкого специалиста по заболеванию и осложнению, затем клинику для второго мнения в целевой стране.",
        output: "Список 3-5 врачей/клиник, кому отправить досье."
      },
      {
        id: "funding",
        title: "Подать заявки в фонды",
        deadline: "7-14 дней",
        action: "Отправьте обращения в подходящие фонды с выпиской, сметой, переводом и контактами лечащего врача.",
        output: "Входящие номера, ответы фондов и список недостающих документов."
      },
      {
        id: "logistics",
        title: "Подготовить логистику и реабилитацию",
        deadline: "14-30 дней",
        action: "После ответа врача уточните реабилитацию, оборудование, перелет, проживание, визовые и сопровождающие документы.",
        output: "План поездки или локального лечения с контактами и сроками."
      }
    ],
    safetyNote: "Цель маршрута - найти специалиста и собрать данные для медицинского решения. Назначения, отмена препаратов, госпитализация и срочные решения только через врача. При угрозе жизни, судорогах, дыхательных нарушениях, резком ухудшении, обезвоживании, потере сознания или тяжелой боли обращайтесь в экстренную службу."
  };
}

export function isMedicalCaseManagerQuery(query: string): boolean {
  const text = query.toLowerCase();
  return /прогресс|останов|замедл|зарубеж|клиник|втор(ое|ого) мнени|фонд|финансирован|перевод выпис|лечение за рубеж|досье/.test(text);
}

export function formatMedicalCaseRouteForChat(route: MedicalCaseRoute): string {
  const requiredDocs = route.documents
    .filter(item => item.required)
    .map(item => `- **${item.title}:** ${item.description}`)
    .join("\n");

  const foundations = route.foundations
    .map(item => `- [${item.name}](${item.url}) — ${item.fit} ${item.caveat}`)
    .join("\n");

  const steps = route.steps
    .map((item, index) => `${index + 1}. **${item.deadline}: ${item.title}.** ${item.action} Результат: ${item.output}`)
    .join("\n");

  const clinicTemplate = route.templates.find(item => item.id === "foreign_clinic_second_opinion");
  const foundationTemplate = route.templates.find(item => item.id === "foundation_funding_request");

  return `## ${route.title}

**Критическое действие:** ${route.criticalAction}

### Документы
${requiredDocs}

### Перевод
Загрузите или вставьте текст выписки для технического медицинского перевода. Язык выберите под клинику: английский, немецкий, иврит или другой. Для визы, суда, страховой или официальной госпитализации может потребоваться сертифицированный перевод.

### Фонды и ресурсы
${foundations}

### Дорожная карта
${steps}

### Черновик письма в клинику
${clinicTemplate?.bodyRu || ""}

### Черновик обращения в фонд
${foundationTemplate?.bodyRu || ""}

**Важно:** ${route.safetyNote}`;
}

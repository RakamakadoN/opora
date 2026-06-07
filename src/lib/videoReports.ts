import type {
  FoodLogSummary,
  MedicationEventSummary,
  MedicationPlanSummary,
  ReactionLogSummary
} from "./careTracker";

export type VideoReportType = "doctor" | "pre_consultation" | "caregiver";

export type VideoReportTemplateId = "doctor-report" | "pre-consultation" | "caregiver-card";

export type VideoReportSceneKind =
  | "disclaimer"
  | "title"
  | "summary"
  | "timeline"
  | "facts"
  | "questions"
  | "care";

export type VideoReportChild = {
  id: string;
  childName: string;
  childAge: number;
  diagnosticStatus?: string;
  userCity?: string;
  sensoryPassport?: {
    soundSensitivity: string[];
    lightSensitivity: string[];
    tactileSensitivity: string[];
    communicationStyle: string;
    comfortTriggers: string;
    favoriteReward: string;
  };
};

export type VideoReportInput = {
  reportType: VideoReportType;
  child: VideoReportChild;
  periodLabel: string;
  medications: MedicationPlanSummary[];
  medicationEvents: MedicationEventSummary[];
  foodLogs: FoodLogSummary[];
  reactions: ReactionLogSummary[];
  questions?: string[];
};

export type VideoReportScene = {
  id: string;
  kind: VideoReportSceneKind;
  title: string;
  lines: string[];
  durationSeconds: number;
};

export type VideoReportPreview = {
  reportType: VideoReportType;
  templateId: VideoReportTemplateId;
  childName: string;
  periodLabel: string;
  estimatedDurationSeconds: number;
  scenes: VideoReportScene[];
  warnings: string[];
  safetyIssues: VideoReportSafetyIssue[];
};

export type VideoReportSafetyIssue = {
  line: string;
  message: string;
};

export type VideoReportSafetyResult = {
  safeLines: string[];
  issues: VideoReportSafetyIssue[];
};

const disclaimerLines = [
  "Видео содержит только данные, внесенные родителем.",
  "Видео не является медицинским заключением.",
  "Опора не ставит диагнозы, не назначает лечение и не делает медицинских выводов."
];

const reportTemplates: Record<VideoReportType, VideoReportTemplateId> = {
  doctor: "doctor-report",
  pre_consultation: "pre-consultation",
  caregiver: "caregiver-card"
};

export function buildVideoReportPreview(input: VideoReportInput): VideoReportPreview {
  const scenes = buildScenes(input);
  const allLines = scenes.flatMap(scene => [scene.title, ...scene.lines]);
  const safety = validateVideoReportSafety(allLines);

  return {
    reportType: input.reportType,
    templateId: reportTemplates[input.reportType],
    childName: input.child.childName,
    periodLabel: input.periodLabel,
    estimatedDurationSeconds: scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0),
    scenes,
    warnings: buildWarnings(input.reportType),
    safetyIssues: safety.issues
  };
}

export function validateVideoReportSafety(lines: string[]): VideoReportSafetyResult {
  const issues: VideoReportSafetyIssue[] = [];
  const safeLines: string[] = [];

  for (const line of lines) {
    const issue = getSafetyIssue(line);
    if (issue) {
      issues.push({ line, message: issue });
    } else {
      safeLines.push(line);
    }
  }

  return { safeLines, issues };
}

export function formatVideoReportPreview(preview: VideoReportPreview) {
  return preview.scenes
    .map(scene => [
      scene.title,
      ...scene.lines.map(line => `- ${line}`)
    ].join("\n"))
    .join("\n\n");
}

function buildScenes(input: VideoReportInput): VideoReportScene[] {
  if (input.reportType === "caregiver") return buildCaregiverScenes(input);
  if (input.reportType === "pre_consultation") return buildPreConsultationScenes(input);
  return buildDoctorScenes(input);
}

function buildDoctorScenes(input: VideoReportInput): VideoReportScene[] {
  return [
    scene("disclaimer", "Безопасное предупреждение", disclaimerLines, 10),
    scene("title", "Видео-отчет для врача", [
      `Ребенок: ${input.child.childName}, ${input.child.childAge} лет.`,
      `Период: ${input.periodLabel}.`
    ], 8),
    scene("summary", "Краткая сводка", [
      `Записей питания: ${input.foodLogs.length}.`,
      `Отметок приема: ${input.medicationEvents.length}.`,
      `Реакций или симптомов: ${input.reactions.length}.`
    ], 14),
    scene("facts", "Факты за период", [
      ...formatMedicationFacts(input.medicationEvents),
      ...formatFoodReactionFacts(input.foodLogs),
      ...formatReactionFacts(input.reactions)
    ], 32),
    scene("questions", "Вопросы родителя", formatQuestions(input.questions), 18)
  ];
}

function buildPreConsultationScenes(input: VideoReportInput): VideoReportScene[] {
  return [
    scene("disclaimer", "Перед консультацией", [
      "Формулировки отражают наблюдения родителя.",
      "Решения по диагностике, лечению и назначениям принимает специалист."
    ], 10),
    scene("title", "Видео перед консультацией", [
      `Ребенок: ${input.child.childName}, ${input.child.childAge} лет.`,
      `Период подготовки: ${input.periodLabel}.`
    ], 8),
    scene("summary", "Что важно обсудить", [
      `За период есть ${input.reactions.length} записей реакций или симптомов.`,
      `За период есть ${input.foodLogs.length} записей питания.`,
      `За период есть ${input.medicationEvents.length} отметок приема.`
    ], 18),
    scene("questions", "Вопросы на прием", formatQuestions(input.questions), 24)
  ];
}

function buildCaregiverScenes(input: VideoReportInput): VideoReportScene[] {
  const passport = input.child.sensoryPassport;

  return [
    scene("disclaimer", "Бытовая памятка", [
      "Карточка описывает бытовые наблюдения и предпочтения.",
      "Это не медицинская инструкция."
    ], 8),
    scene("title", "Видео-карточка ребенка", [
      `Ребенок: ${input.child.childName}, ${input.child.childAge} лет.`
    ], 6),
    scene("care", "Как общаться", [
      passport?.communicationStyle || "Коммуникационные предпочтения пока не указаны."
    ], 12),
    scene("care", "Что может мешать", [
      ...formatList("Звук", passport?.soundSensitivity),
      ...formatList("Свет", passport?.lightSensitivity),
      ...formatList("Тактильно", passport?.tactileSensitivity)
    ], 18),
    scene("care", "Что обычно помогает", [
      passport?.comfortTriggers || "Поддерживающие действия пока не указаны.",
      passport?.favoriteReward ? `Поощрение: ${passport.favoriteReward}.` : "Поощрение пока не указано."
    ], 16)
  ];
}

function formatMedicationFacts(events: MedicationEventSummary[]) {
  if (!events.length) return ["Отметки приема за период не указаны."];
  const takenCount = events.filter(event => event.status === "taken").length;
  const skippedCount = events.filter(event => event.status === "skipped").length;
  return [
    `После приема препарата была зафиксирована отметка приема: ${takenCount}.`,
    `За период отмечено пропусков приема: ${skippedCount}.`
  ];
}

function formatFoodReactionFacts(logs: FoodLogSummary[]) {
  const logsWithReaction = logs.filter(log => log.reaction?.trim());
  if (!logsWithReaction.length) return ["После приема еды реакции в записях не указаны."];

  return logsWithReaction.slice(0, 4).map(log =>
    `После приема еды была зафиксирована реакция: ${log.reaction}.`
  );
}

function formatReactionFacts(reactions: ReactionLogSummary[]) {
  if (!reactions.length) return ["Реакции или симптомы за период не указаны."];

  return reactions.slice(0, 4).map(reaction =>
    `Родитель отметил реакцию: ${reaction.title}; интенсивность ${reaction.intensity}/5.`
  );
}

function formatQuestions(questions?: string[]) {
  const cleaned = (questions || []).map(question => question.trim()).filter(Boolean);
  if (!cleaned.length) return ["Вопросы к специалисту пока не добавлены."];
  return cleaned.slice(0, 5);
}

function formatList(label: string, values?: string[]) {
  const cleaned = (values || []).map(value => value.trim()).filter(Boolean);
  if (!cleaned.length) return [`${label}: не указано.`];
  return [`${label}: ${cleaned.join(", ")}.`];
}

function buildWarnings(reportType: VideoReportType) {
  if (reportType === "caregiver") {
    return [
      "Карточка не включает диагнозы и препараты по умолчанию.",
      "Перед отправкой проверьте контакты и бытовые инструкции."
    ];
  }

  return [
    "Видео не содержит медицинских рекомендаций.",
    "Реакции описываются только как факты после события, без вывода о причине."
  ];
}

function getSafetyIssue(line: string) {
  const lower = line.toLocaleLowerCase("ru-RU");

  if (/(причин|вызвал|вызвала|вызвало|из-за|из за|стал причиной|стала причиной)/i.test(lower)) {
    return "Строка содержит причинно-следственную формулировку. Оставьте только факт наблюдения.";
  }

  if (/(нужно|следует|необходимо)\s+(изменить|отменить|принимать|лечить|назначить)|назначить лечение|отменить препарат/i.test(lower)) {
    return "Строка похожа на медицинскую рекомендацию. Такие формулировки нельзя включать в видео.";
  }

  if (/(диагноз подтвержден|это признак|это означает)/i.test(lower)) {
    return "Строка похожа на диагностический вывод. Видео может показывать только наблюдения.";
  }

  return "";
}

function scene(kind: VideoReportSceneKind, title: string, lines: string[], durationSeconds: number): VideoReportScene {
  return {
    id: `${kind}-${slugify(title)}`,
    kind,
    title,
    lines,
    durationSeconds
  };
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

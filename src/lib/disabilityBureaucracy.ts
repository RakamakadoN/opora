import type { DiagnosticStatus } from "../context/ProfileContext";

export type BureaucracyStageId =
  | "medical_preparation"
  | "vkk_referral"
  | "mse_review"
  | "decision_received"
  | "benefits_services"
  | "renewal";

export type BureaucracyDeadlineType =
  | "collect_documents"
  | "mse_appointment"
  | "missing_documents"
  | "benefits_application"
  | "renewal";

export type BureaucracyAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
};

export type BureaucracyDocumentDefinition = {
  id: string;
  title: string;
  description: string;
  stage: BureaucracyStageId;
  required: boolean;
  source: string;
  needsIssueDate?: boolean;
  needsExpiryDate?: boolean;
  acceptsAttachment?: boolean;
  warning?: string;
};

export type BureaucracyDocumentRecord = {
  documentId: string;
  collected: boolean;
  title: string;
  source?: string;
  issueDate?: string;
  expiryDate?: string;
  note?: string;
  attachments: BureaucracyAttachment[];
  updatedAt?: string;
};

export type BureaucracyDeadline = {
  id: string;
  childId: string;
  title: string;
  type: BureaucracyDeadlineType;
  date: string;
  time?: string;
  note?: string;
  createdAt: string;
};

export type BureaucracyDeadlineWithStatus = BureaucracyDeadline & {
  status: "overdue" | "today" | "upcoming";
  daysUntil: number;
};

export type BureaucracyProgress = {
  checkedCount: number;
  totalCount: number;
  requiredChecked: number;
  requiredTotal: number;
  percent: number;
  requiredPercent: number;
};

export type CalendarReminderInput = {
  deadline: BureaucracyDeadline;
  childName: string;
  checklistSummary: string;
};

export const BUREAUCRACY_STAGES: Array<{
  id: BureaucracyStageId;
  title: string;
  description: string;
}> = [
  {
    id: "medical_preparation",
    title: "Медицина",
    description: "Заключения врачей, выписки и обследования"
  },
  {
    id: "vkk_referral",
    title: "ВКК",
    description: "Направление на МСЭ и медицинские формы"
  },
  {
    id: "mse_review",
    title: "МСЭ",
    description: "Очная или заочная экспертиза"
  },
  {
    id: "decision_received",
    title: "Решение",
    description: "Справка и ИПАР после решения"
  },
  {
    id: "benefits_services",
    title: "Поддержка",
    description: "Пособия, услуги, ПМПК/КППК и образование"
  },
  {
    id: "renewal",
    title: "Переоформление",
    description: "Контроль срока и повторная подготовка"
  }
];

const BASE_DOCUMENTS: BureaucracyDocumentDefinition[] = [
  {
    id: "parent_id",
    title: "Удостоверение личности родителя или опекуна",
    description: "Нужно для подтверждения законного представителя ребенка.",
    stage: "medical_preparation",
    required: true,
    source: "Семья",
    acceptsAttachment: true
  },
  {
    id: "birth_certificate_iin",
    title: "Свидетельство о рождении ребенка и ИИН",
    description: "Проверьте, что ИИН читается в копии или фото.",
    stage: "medical_preparation",
    required: true,
    source: "Семья",
    acceptsAttachment: true
  },
  {
    id: "ambulatory_extract",
    title: "Выписка из амбулаторной карты",
    description: "Медицинская база для оценки стойких нарушений функций.",
    stage: "medical_preparation",
    required: true,
    source: "Поликлиника",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "specialist_conclusions",
    title: "Заключения профильных и узких специалистов",
    description: "Для РАС обычно проверяют психиатра, невролога, ЛОР/аудиолога, офтальмолога и других специалистов по показаниям.",
    stage: "medical_preparation",
    required: true,
    source: "Медицинские специалисты",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "vkk_mse_referral",
    title: "Направление на МСЭ от медорганизации",
    description: "ВКК или медицинская организация готовит направление и медицинские формы для МСЭ.",
    stage: "vkk_referral",
    required: true,
    source: "Поликлиника/ВКК",
    needsIssueDate: true,
    acceptsAttachment: true,
    warning: "Часть сведений для МСЭ может поступать электронно через государственные информационные системы."
  },
  {
    id: "mse_appointment",
    title: "Запись или уведомление о МСЭ",
    description: "Зафиксируйте дату комиссии, формат рассмотрения и список того, что попросили донести.",
    stage: "mse_review",
    required: true,
    source: "МСЭ/eGov/ЦОН",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "missing_documents_note",
    title: "Письменная отметка о недостающих документах",
    description: "Если документы не приняли или попросили донести справку, сохраните письменную формулировку.",
    stage: "mse_review",
    required: false,
    source: "МСЭ или регистратура",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "disability_certificate",
    title: "Справка об инвалидности",
    description: "После решения проверьте срок инвалидности и данные ребенка.",
    stage: "decision_received",
    required: true,
    source: "МСЭ",
    needsIssueDate: true,
    needsExpiryDate: true,
    acceptsAttachment: true
  },
  {
    id: "ipar",
    title: "ИПАР",
    description: "Индивидуальная программа абилитации и реабилитации с назначенными мерами поддержки.",
    stage: "decision_received",
    required: true,
    source: "МСЭ",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "benefits_application",
    title: "Заявления на пособия и социальные услуги",
    description: "Сохраните входящие номера или заметки по подаче через eGov, ЦОН или соцзащиту.",
    stage: "benefits_services",
    required: true,
    source: "eGov/ЦОН/соцзащита",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "pmpk_kppk_route",
    title: "ПМПК/КППК и образовательный маршрут",
    description: "Отдельно проверьте заключение для коррекционных занятий, ассистента, сада или школы.",
    stage: "benefits_services",
    required: false,
    source: "ПМПК/КППК/образование",
    needsIssueDate: true,
    acceptsAttachment: true
  },
  {
    id: "renewal_plan",
    title: "План переоформления",
    description: "Поставьте напоминание заранее, чтобы обновить заключения до окончания срока.",
    stage: "renewal",
    required: true,
    source: "Семья и поликлиника",
    needsExpiryDate: true,
    acceptsAttachment: false
  }
];

export function getBureaucracyChecklist(_status: DiagnosticStatus): BureaucracyDocumentDefinition[] {
  return BASE_DOCUMENTS;
}

export function calculateBureaucracyProgress(
  checklist: BureaucracyDocumentDefinition[],
  checkedIds: string[]
): BureaucracyProgress {
  const checked = new Set(checkedIds);
  const required = checklist.filter(item => item.required);
  const checkedCount = checklist.filter(item => checked.has(item.id)).length;
  const requiredChecked = required.filter(item => checked.has(item.id)).length;

  return {
    checkedCount,
    totalCount: checklist.length,
    requiredChecked,
    requiredTotal: required.length,
    percent: checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0,
    requiredPercent: required.length ? Math.round((requiredChecked / required.length) * 100) : 0
  };
}

export function validateBureaucracyDocumentRecord(
  definition: BureaucracyDocumentDefinition,
  record: BureaucracyDocumentRecord
): Record<string, string> {
  const errors: Record<string, string> = {};
  const source = record.source?.trim();

  if (!record.title.trim()) errors.title = "Укажите название документа.";
  if (!source) errors.source = "Укажите, кто выдал или где хранится документ.";
  if (definition.needsIssueDate && !isValidDate(record.issueDate)) {
    errors.issueDate = "Укажите дату выдачи документа.";
  }
  if (definition.needsExpiryDate && !isValidDate(record.expiryDate)) {
    errors.expiryDate = "Укажите срок действия документа.";
  }
  if (isValidDate(record.issueDate) && isValidDate(record.expiryDate)) {
    const issueTime = new Date(`${record.issueDate}T00:00:00`).getTime();
    const expiryTime = new Date(`${record.expiryDate}T00:00:00`).getTime();
    if (expiryTime < issueTime) errors.expiryDate = "Срок действия не может быть раньше даты выдачи.";
  }
  if (record.collected && !record.attachments.length && !record.note?.trim()) {
    errors.attachment = "Добавьте скан/фото или напишите, где лежит оригинал.";
  }

  return errors;
}

export function validateAttachment(file: { type: string; size: number }) {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!supportedTypes.includes(file.type)) return "Поддерживаются JPG, PNG, WebP или PDF.";
  if (file.size > 1_500_000) return "Файл должен быть меньше 1.5 МБ для локального хранения.";
  return "";
}

export function getNearestDeadline(
  deadlines: BureaucracyDeadline[],
  today = toDateInputValue(new Date())
): BureaucracyDeadlineWithStatus | null {
  const withStatus = deadlines
    .map(deadline => decorateDeadline(deadline, today))
    .sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  return withStatus[0] || null;
}

export function getSuggestedReminderOffsets(type: BureaucracyDeadlineType) {
  if (type === "renewal") return [30, 14, 7, 1];
  if (type === "mse_appointment") return [14, 7, 1];
  return [7, 1];
}

export function buildCalendarReminderIcs(input: CalendarReminderInput) {
  const { deadline, childName, checklistSummary } = input;
  const start = formatIcsDateTime(deadline.date, deadline.time);
  const end = formatIcsDateTime(deadline.date, addOneHour(deadline.time));
  const description = [
    `Ребенок: ${childName}`,
    checklistSummary,
    deadline.note || "",
    "Проверьте актуальные требования в поликлинике, ВКК, МСЭ, eGov/ЦОН или соцзащите перед подачей."
  ].filter(Boolean).join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Opora//Bureaucracy Helper//RU",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${deadline.id}@opora.local`,
    `DTSTAMP:${formatIcsDateTime(toDateInputValue(new Date()))}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(deadline.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

export function parseStoredBureaucracyState<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function decorateDeadline(deadline: BureaucracyDeadline, today: string): BureaucracyDeadlineWithStatus {
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((new Date(`${deadline.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / dayMs);
  return {
    ...deadline,
    daysUntil: diff,
    status: diff < 0 ? "overdue" : diff === 0 ? "today" : "upcoming"
  };
}

function isValidDate(value?: string) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime());
}

function addOneHour(time?: string) {
  if (!time) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  const nextHour = Number.isFinite(hours) ? (hours + 1) % 24 : 1;
  return `${String(nextHour).padStart(2, "0")}:${String(Number.isFinite(minutes) ? minutes : 0).padStart(2, "0")}`;
}

function formatIcsDateTime(date: string, time?: string) {
  const normalizedTime = time || "09:00";
  const [year, month, day] = date.split("-");
  const [hours, minutes] = normalizedTime.split(":");
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

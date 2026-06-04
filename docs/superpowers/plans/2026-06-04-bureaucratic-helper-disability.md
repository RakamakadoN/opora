# Bureaucratic Helper Disability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-navigator "Бюрократический помощник" module for Kazakhstan disability paperwork with document tracking, attachments, deadlines, process stages, validation, and smartphone calendar export.

**Architecture:** Keep domain logic in a pure TypeScript helper at `src/lib/disabilityBureaucracy.ts` and test it with Node's built-in test runner. Add a focused React component at `src/components/BureaucracyHelperScreen.tsx`, then integrate it into `NavigatorTab` as a local sub-screen and compact entry card.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, `lucide-react`, `motion/react`, `localStorage`, browser `Blob` download for `.ics`.

---

## File Structure

- Create `src/lib/disabilityBureaucracy.ts`: document/stage/deadline types, checklist generation, progress calculation, validation, deadline sorting, `.ics` generation, safe storage parsing.
- Create `tests/disabilityBureaucracy.test.ts`: focused tests for the pure helper.
- Create `src/components/BureaucracyHelperScreen.tsx`: mobile UI for stage path, checklist, document form, deadline form, and calendar export.
- Modify `src/components/NavigatorTab.tsx`: import helper summary functions and the new screen, add local sub-screen state, add compact card in the existing navigator content.
- Optionally modify `src/index.css`: only if file input or compact helper styles need a reusable class; prefer existing Tailwind classes first.

---

### Task 1: Pure Bureaucracy Helper And Tests

**Files:**
- Create: `src/lib/disabilityBureaucracy.ts`
- Create: `tests/disabilityBureaucracy.test.ts`

- [ ] **Step 1: Write failing tests for checklist, validation, deadlines, and calendar generation**

Create `tests/disabilityBureaucracy.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarReminderIcs,
  calculateBureaucracyProgress,
  getBureaucracyChecklist,
  getNearestDeadline,
  validateBureaucracyDocumentRecord,
  type BureaucracyDeadline,
  type BureaucracyDocumentRecord
} from "../src/lib/disabilityBureaucracy";

test("checklist includes medical, MSE, decision, benefits, and renewal groups", () => {
  const checklist = getBureaucracyChecklist("Диагноз подтвержден");
  const stages = new Set(checklist.map(item => item.stage));

  assert.equal(stages.has("medical_preparation"), true);
  assert.equal(stages.has("vkk_referral"), true);
  assert.equal(stages.has("mse_review"), true);
  assert.equal(stages.has("decision_received"), true);
  assert.equal(stages.has("benefits_services"), true);
  assert.equal(stages.has("renewal"), true);
  assert.equal(checklist.some(item => /МСЭ/.test(item.title)), true);
  assert.equal(checklist.some(item => item.warning?.includes("электронно")), true);
});

test("progress counts required documents separately from total documents", () => {
  const checklist = getBureaucracyChecklist("Диагноз подтвержден");
  const checkedIds = checklist.slice(0, 3).map(item => item.id);
  const requiredCheckedIds = checklist.filter(item => item.required).slice(0, 2).map(item => item.id);
  const progress = calculateBureaucracyProgress(checklist, [...checkedIds, ...requiredCheckedIds]);

  assert.equal(progress.checkedCount >= 3, true);
  assert.equal(progress.totalCount, checklist.length);
  assert.equal(progress.requiredTotal > 0, true);
  assert.equal(progress.requiredChecked >= 2, true);
  assert.equal(progress.percent > 0, true);
  assert.equal(progress.percent <= 100, true);
});

test("document validation rejects missing required data and impossible expiry dates", () => {
  const checklist = getBureaucracyChecklist("Диагноз подтвержден");
  const expiringDoc = checklist.find(item => item.needsExpiryDate);
  assert.ok(expiringDoc);

  const invalidRecord: BureaucracyDocumentRecord = {
    documentId: expiringDoc.id,
    collected: true,
    title: expiringDoc.title,
    source: "",
    issueDate: "2026-06-10",
    expiryDate: "2026-06-01",
    note: "",
    attachments: []
  };

  const errors = validateBureaucracyDocumentRecord(expiringDoc, invalidRecord);
  assert.match(errors.source || "", /укажите/i);
  assert.match(errors.expiryDate || "", /раньше/i);
  assert.match(errors.attachment || "", /скан|оригинал/i);
});

test("nearest deadline prefers overdue first, then upcoming by date", () => {
  const deadlines: BureaucracyDeadline[] = [
    {
      id: "future",
      childId: "child-1",
      title: "МСЭ",
      type: "mse_appointment",
      date: "2026-06-20",
      createdAt: "2026-06-04T00:00:00.000Z"
    },
    {
      id: "overdue",
      childId: "child-1",
      title: "Донести справку",
      type: "missing_documents",
      date: "2026-06-01",
      createdAt: "2026-06-04T00:00:00.000Z"
    }
  ];

  const nearest = getNearestDeadline(deadlines, "2026-06-04");
  assert.equal(nearest?.id, "overdue");
  assert.equal(nearest?.status, "overdue");
});

test("calendar reminder generation produces escaped ICS text", () => {
  const deadline: BureaucracyDeadline = {
    id: "deadline-1",
    childId: "child-1",
    title: "МСЭ: комиссия, документы",
    type: "mse_appointment",
    date: "2026-06-20",
    time: "10:30",
    note: "Взять справку\\nи копии",
    createdAt: "2026-06-04T00:00:00.000Z"
  };

  const ics = buildCalendarReminderIcs({
    deadline,
    childName: "Алия",
    checklistSummary: "Готово 3 из 8"
  });

  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /SUMMARY:МСЭ: комиссия\\, документы/);
  assert.match(ics, /DTSTART:20260620T103000/);
  assert.match(ics, /Алия/);
  assert.match(ics, /Взять справку\\nи копии/);
  assert.match(ics, /END:VCALENDAR/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --import tsx tests/disabilityBureaucracy.test.ts
```

Expected: FAIL with a module-not-found error for `../src/lib/disabilityBureaucracy`.

- [ ] **Step 3: Implement `src/lib/disabilityBureaucracy.ts`**

Create `src/lib/disabilityBureaucracy.ts`:

```ts
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
  ].filter(Boolean).join("\\n");

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
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
node --import tsx tests/disabilityBureaucracy.test.ts
```

Expected: PASS for all five tests.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/disabilityBureaucracy.ts tests/disabilityBureaucracy.test.ts
git commit -m "feat: add disability bureaucracy helper logic"
```

---

### Task 2: React Helper Screen State And Basic Layout

**Files:**
- Create: `src/components/BureaucracyHelperScreen.tsx`
- Modify: `src/components/NavigatorTab.tsx`

- [ ] **Step 1: Create the helper screen component with local storage state**

Create `src/components/BureaucracyHelperScreen.tsx`:

```tsx
import React from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, FileText, Info, Plus, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import type { DiagnosticStatus } from "../context/ProfileContext";
import {
  BUREAUCRACY_STAGES,
  buildCalendarReminderIcs,
  calculateBureaucracyProgress,
  getBureaucracyChecklist,
  getNearestDeadline,
  parseStoredBureaucracyState,
  toDateInputValue,
  validateAttachment,
  validateBureaucracyDocumentRecord,
  type BureaucracyAttachment,
  type BureaucracyDeadline,
  type BureaucracyDeadlineType,
  type BureaucracyDocumentRecord,
  type BureaucracyStageId
} from "../lib/disabilityBureaucracy";

type BureaucracyHelperScreenProps = {
  childId: string;
  childName: string;
  diagnosticStatus: DiagnosticStatus;
  onBack: () => void;
};

type StoredState = {
  checkedIds: string[];
  records: Record<string, BureaucracyDocumentRecord>;
  currentStage: BureaucracyStageId;
  deadlines: BureaucracyDeadline[];
  exportedDeadlineIds: string[];
};

const DEFAULT_STAGE: BureaucracyStageId = "medical_preparation";

export function BureaucracyHelperScreen({
  childId,
  childName,
  diagnosticStatus,
  onBack
}: BureaucracyHelperScreenProps) {
  const storageKey = `opora_bureaucracy_helper_${childId}`;
  const checklist = React.useMemo(() => getBureaucracyChecklist(diagnosticStatus), [diagnosticStatus]);
  const [state, setState] = React.useState<StoredState>(() => parseStoredBureaucracyState<StoredState>(
    localStorage.getItem(storageKey),
    {
      checkedIds: [],
      records: {},
      currentStage: DEFAULT_STAGE,
      deadlines: [],
      exportedDeadlineIds: []
    }
  ));
  const [activeDocumentId, setActiveDocumentId] = React.useState(checklist[0]?.id || "");
  const [documentErrors, setDocumentErrors] = React.useState<Record<string, string>>({});
  const [deadlineTitle, setDeadlineTitle] = React.useState("");
  const [deadlineDate, setDeadlineDate] = React.useState("");
  const [deadlineTime, setDeadlineTime] = React.useState("");
  const [deadlineType, setDeadlineType] = React.useState<BureaucracyDeadlineType>("collect_documents");
  const [deadlineNote, setDeadlineNote] = React.useState("");
  const [calendarFallback, setCalendarFallback] = React.useState("");

  React.useEffect(() => {
    setState(parseStoredBureaucracyState<StoredState>(
      localStorage.getItem(storageKey),
      {
        checkedIds: [],
        records: {},
        currentStage: DEFAULT_STAGE,
        deadlines: [],
        exportedDeadlineIds: []
      }
    ));
    setActiveDocumentId(checklist[0]?.id || "");
  }, [storageKey, checklist]);

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const progress = calculateBureaucracyProgress(checklist, state.checkedIds);
  const nearestDeadline = getNearestDeadline(state.deadlines);
  const activeDocument = checklist.find(item => item.id === activeDocumentId) || checklist[0];
  const activeRecord = activeDocument ? state.records[activeDocument.id] || createRecordFromDefinition(activeDocument.id, activeDocument.title, activeDocument.source) : null;

  const updateRecord = (documentId: string, patch: Partial<BureaucracyDocumentRecord>) => {
    setDocumentErrors({});
    setState(prev => {
      const definition = checklist.find(item => item.id === documentId);
      const current = prev.records[documentId] || createRecordFromDefinition(documentId, definition?.title || "", definition?.source || "");
      const nextRecord = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString()
      };
      const checkedIds = nextRecord.collected
        ? Array.from(new Set([...prev.checkedIds, documentId]))
        : prev.checkedIds.filter(id => id !== documentId);
      return {
        ...prev,
        checkedIds,
        records: {
          ...prev.records,
          [documentId]: nextRecord
        }
      };
    });
  };

  const saveActiveRecord = () => {
    if (!activeDocument || !activeRecord) return;
    const errors = validateBureaucracyDocumentRecord(activeDocument, activeRecord);
    setDocumentErrors(errors);
    if (Object.keys(errors).length > 0) return;
    updateRecord(activeDocument.id, activeRecord);
  };

  const handleAttachment = (documentId: string, file: File | null) => {
    if (!file) return;
    const error = validateAttachment(file);
    if (error) {
      setDocumentErrors({ attachment: error });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const attachment: BureaucracyAttachment = {
        id: `${documentId}-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: typeof reader.result === "string" ? reader.result : undefined
      };
      const record = state.records[documentId] || createRecordFromDefinition(
        documentId,
        checklist.find(item => item.id === documentId)?.title || "",
        checklist.find(item => item.id === documentId)?.source || ""
      );
      updateRecord(documentId, {
        attachments: [attachment, ...record.attachments].slice(0, 3)
      });
    };
    reader.readAsDataURL(file);
  };

  const addDeadline = () => {
    if (!deadlineTitle.trim() || !deadlineDate) return;
    const deadline: BureaucracyDeadline = {
      id: `deadline-${Date.now()}`,
      childId,
      title: deadlineTitle.trim(),
      type: deadlineType,
      date: deadlineDate,
      time: deadlineTime || undefined,
      note: deadlineNote.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      deadlines: [deadline, ...prev.deadlines]
    }));
    setDeadlineTitle("");
    setDeadlineDate("");
    setDeadlineTime("");
    setDeadlineNote("");
  };

  const exportCalendar = (deadline: BureaucracyDeadline) => {
    const ics = buildCalendarReminderIcs({
      deadline,
      childName,
      checklistSummary: `Готово ${progress.checkedCount} из ${progress.totalCount} документов`
    });

    try {
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `opora-${deadline.id}.ics`;
      link.click();
      URL.revokeObjectURL(url);
      setState(prev => ({
        ...prev,
        exportedDeadlineIds: Array.from(new Set([...prev.exportedDeadlineIds, deadline.id]))
      }));
      setCalendarFallback("");
    } catch {
      setCalendarFallback(`${deadline.title}: ${deadline.date}${deadline.time ? ` ${deadline.time}` : ""}`);
    }
  };

  return (
    <div className="min-h-full bg-opora-sand/30 pb-24 pt-12 text-opora-navy">
      <div className="sticky top-0 z-20 border-b border-black/5 bg-opora-sand/90 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-xl bg-white p-2 text-opora-navy shadow-sm active:scale-95">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-opora-sage">Бюрократический помощник</p>
            <h2 className="font-serif text-xl font-bold leading-tight">{childName}</h2>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-5">
        <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-opora-sage">Готовность</p>
              <h3 className="mt-1 font-serif text-2xl font-bold">{progress.percent}%</h3>
              <p className="mt-1 text-xs text-opora-text">Обязательные: {progress.requiredChecked} из {progress.requiredTotal}</p>
            </div>
            <div className="rounded-2xl bg-opora-sage/10 p-3 text-opora-sage">
              <FileText size={24} />
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-opora-sand">
            <motion.div className="h-full rounded-full bg-opora-sage" style={{ width: `${progress.percent}%` }} />
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-serif text-lg font-bold">Путь оформления</h3>
            <span className="rounded-full bg-opora-sand px-3 py-1 text-[11px] font-bold text-opora-text">можно менять</span>
          </div>
          <div className="space-y-3">
            {BUREAUCRACY_STAGES.map((stage, index) => {
              const isActive = state.currentStage === stage.id;
              const isPast = BUREAUCRACY_STAGES.findIndex(item => item.id === state.currentStage) > index;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, currentStage: stage.id }))}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    isActive ? "border-opora-sage bg-opora-sage/10" : "border-black/5 bg-white"
                  }`}
                >
                  <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                    isPast || isActive ? "bg-opora-sage text-white" : "bg-opora-sand text-opora-text/50"
                  }`}>
                    {isPast ? <CheckCircle2 size={14} /> : <span className="text-[11px] font-bold">{index + 1}</span>}
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold">{stage.title}</span>
                    <span className="block text-xs leading-relaxed text-opora-text">{stage.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-opora-peach/30 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-opora-peach/40 p-2 text-opora-navy">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Ближайший срок</h3>
              <p className="mt-1 text-sm text-opora-text">
                {nearestDeadline
                  ? `${nearestDeadline.title}: ${nearestDeadline.date}${nearestDeadline.status === "overdue" ? " · просрочено" : ""}`
                  : "Добавьте дату МСЭ, подачи или переоформления."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0 text-opora-sage" />
            <p className="text-xs leading-relaxed text-opora-text">
              Чек-лист помогает семье подготовиться. Часть сведений МСЭ может получать электронно, а актуальные требования нужно сверять в поликлинике, ВКК, МСЭ, eGov/ЦОН или соцзащите.
            </p>
          </div>
          <div className="space-y-2">
            {checklist.map(document => {
              const isChecked = state.checkedIds.includes(document.id);
              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setActiveDocumentId(document.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    activeDocumentId === document.id ? "border-opora-sage bg-opora-sage/10" : "border-black/5 bg-white"
                  }`}
                >
                  <span className="mt-0.5 text-opora-sage">
                    {isChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-tight">{document.title}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-opora-text">{document.description}</span>
                    <span className="mt-2 inline-flex rounded-full bg-opora-sand px-2 py-1 text-[10px] font-bold text-opora-text">
                      {document.required ? "Обязательно" : "Желательно"} · {document.source}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {activeDocument && activeRecord && (
          <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <h3 className="font-serif text-lg font-bold">Карточка документа</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-xl bg-opora-sand/50 px-3 py-2 text-sm font-bold">
                Собрано
                <input
                  type="checkbox"
                  checked={activeRecord.collected}
                  onChange={event => updateRecord(activeDocument.id, { collected: event.target.checked })}
                  className="h-5 w-5 accent-opora-sage"
                />
              </label>
              <FieldError message={documentErrors.attachment} />
              <Input label="Кто выдал / где хранится" value={activeRecord.source || ""} onChange={value => updateRecord(activeDocument.id, { source: value })} error={documentErrors.source} />
              {activeDocument.needsIssueDate && (
                <Input label="Дата выдачи" type="date" value={activeRecord.issueDate || ""} onChange={value => updateRecord(activeDocument.id, { issueDate: value })} error={documentErrors.issueDate} />
              )}
              {activeDocument.needsExpiryDate && (
                <Input label="Срок действия" type="date" value={activeRecord.expiryDate || ""} onChange={value => updateRecord(activeDocument.id, { expiryDate: value })} error={documentErrors.expiryDate} />
              )}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-opora-text/70">Заметка</span>
                <textarea
                  value={activeRecord.note || ""}
                  onChange={event => updateRecord(activeDocument.id, { note: event.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-opora-sage"
                  placeholder="Например: оригинал лежит в синей папке, копию донести в ЦОН"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-opora-sage/50 bg-opora-sage/5 px-3 py-3 text-sm font-bold text-opora-sage">
                <Upload size={16} />
                Загрузить фото/скан
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={event => handleAttachment(activeDocument.id, event.target.files?.[0] || null)}
                />
              </label>
              {activeRecord.attachments.length > 0 && (
                <div className="space-y-2">
                  {activeRecord.attachments.map(file => (
                    <div key={file.id} className="flex items-center justify-between rounded-xl bg-opora-sand px-3 py-2 text-xs font-bold text-opora-text">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => updateRecord(activeDocument.id, { attachments: activeRecord.attachments.filter(item => item.id !== file.id) })}
                        className="rounded-lg bg-white p-1 text-opora-navy"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={saveActiveRecord} className="w-full rounded-xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white active:scale-[0.98]">
                Сохранить документ
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <h3 className="font-serif text-lg font-bold">Дедлайны и календарь</h3>
          <div className="mt-4 space-y-3">
            <Input label="Название срока" value={deadlineTitle} onChange={setDeadlineTitle} />
            <Input label="Дата" type="date" value={deadlineDate} onChange={setDeadlineDate} />
            <Input label="Время" type="time" value={deadlineTime} onChange={setDeadlineTime} />
            <select value={deadlineType} onChange={event => setDeadlineType(event.target.value as BureaucracyDeadlineType)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-opora-sage">
              <option value="collect_documents">Собрать документы</option>
              <option value="mse_appointment">Комиссия МСЭ</option>
              <option value="missing_documents">Донести документы</option>
              <option value="benefits_application">Пособия и услуги</option>
              <option value="renewal">Переоформление</option>
            </select>
            <textarea
              value={deadlineNote}
              onChange={event => setDeadlineNote(event.target.value)}
              rows={2}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-opora-sage"
              placeholder="Что взять с собой или что проверить"
            />
            <button type="button" onClick={addDeadline} className="flex w-full items-center justify-center gap-2 rounded-xl bg-opora-sage px-4 py-3 text-sm font-extrabold text-white active:scale-[0.98]">
              <Plus size={16} />
              Добавить срок
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {state.deadlines.map(deadline => (
              <div key={deadline.id} className="rounded-xl bg-opora-sand/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{deadline.title}</p>
                    <p className="text-xs text-opora-text">{deadline.date}{deadline.time ? ` · ${deadline.time}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => exportCalendar(deadline)} className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-opora-navy shadow-sm">
                    .ics
                  </button>
                </div>
              </div>
            ))}
          </div>
          {calendarFallback && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{calendarFallback}</p>}
        </section>
      </div>
    </div>
  );
}

function createRecordFromDefinition(documentId: string, title: string, source: string): BureaucracyDocumentRecord {
  return {
    documentId,
    collected: false,
    title,
    source,
    attachments: []
  };
}

function Input({
  label,
  value,
  onChange,
  error,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-opora-text/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-opora-sage"
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-bold text-red-600">{message}</p>;
}
```

- [ ] **Step 2: Add local sub-screen state and import in `NavigatorTab`**

Modify the imports at the top of `src/components/NavigatorTab.tsx`:

```tsx
import { BureaucracyHelperScreen } from "./BureaucracyHelperScreen";
import { calculateBureaucracyProgress, getBureaucracyChecklist, getNearestDeadline, parseStoredBureaucracyState, type BureaucracyDeadline } from "../lib/disabilityBureaucracy";
```

Add state near the other `useState` calls inside `NavigatorTab`:

```tsx
  const [navigatorSubscreen, setNavigatorSubscreen] = useState<"main" | "bureaucracy">("main");
```

Add the early return after the panic-mode return block and before the main navigator render:

```tsx
  if (navigatorSubscreen === "bureaucracy") {
    return (
      <BureaucracyHelperScreen
        childId={profile.id}
        childName={profile.childName}
        diagnosticStatus={profile.diagnosticStatus}
        onBack={() => setNavigatorSubscreen("main")}
      />
    );
  }
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no TypeScript errors. If errors mention unused imports from the compact summary helpers, keep only `BureaucracyHelperScreen` for this task and add the summary imports in Task 3.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/components/BureaucracyHelperScreen.tsx src/components/NavigatorTab.tsx
git commit -m "feat: add bureaucracy helper screen"
```

---

### Task 3: Compact Navigator Entry Card

**Files:**
- Modify: `src/components/NavigatorTab.tsx`

- [ ] **Step 1: Add summary calculations in `NavigatorTab`**

Near the existing PMPK document progress calculations in `src/components/NavigatorTab.tsx`, add:

```tsx
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
```

- [ ] **Step 2: Add the compact card to the main navigator content**

Insert this card near the existing PMPK card entry area, before the category-specific PMPK content block:

```tsx
      <div className="px-6 mb-6">
        <button
          type="button"
          onClick={() => setNavigatorSubscreen("bureaucracy")}
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
                    : "Соберите документы, сроки и этапы в одном месте."}
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
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/NavigatorTab.tsx
git commit -m "feat: add bureaucracy helper navigator card"
```

---

### Task 4: Tighten UX, Validation Feedback, And Calendar Download

**Files:**
- Modify: `src/components/BureaucracyHelperScreen.tsx`
- Modify: `tests/disabilityBureaucracy.test.ts`

- [ ] **Step 1: Add a test for attachment validation**

Append to `tests/disabilityBureaucracy.test.ts`:

```ts
import { validateAttachment } from "../src/lib/disabilityBureaucracy";

test("attachment validation accepts small images and rejects unsupported or large files", () => {
  assert.equal(validateAttachment({ type: "image/png", size: 500_000 }), "");
  assert.match(validateAttachment({ type: "text/plain", size: 10 }), /JPG|PNG|PDF/);
  assert.match(validateAttachment({ type: "application/pdf", size: 2_000_000 }), /меньше/);
});
```

If adding a second import causes duplicate import syntax, merge `validateAttachment` into the existing import list at the top of the file instead.

- [ ] **Step 2: Run the new test**

Run:

```bash
node --import tsx tests/disabilityBureaucracy.test.ts
```

Expected: PASS.

- [ ] **Step 3: Improve required validation feedback in the document screen**

In `src/components/BureaucracyHelperScreen.tsx`, change the `saveActiveRecord` function to mark the active document collected only after valid save:

```tsx
  const saveActiveRecord = () => {
    if (!activeDocument || !activeRecord) return;
    const nextRecord = {
      ...activeRecord,
      collected: true,
      updatedAt: new Date().toISOString()
    };
    const errors = validateBureaucracyDocumentRecord(activeDocument, nextRecord);
    setDocumentErrors(errors);
    if (Object.keys(errors).length > 0) return;
    updateRecord(activeDocument.id, nextRecord);
  };
```

Change the save button label to:

```tsx
                Проверить и отметить собранным
```

- [ ] **Step 4: Add delete deadline behavior**

In each deadline row in `src/components/BureaucracyHelperScreen.tsx`, replace the single `.ics` button:

```tsx
                  <button type="button" onClick={() => exportCalendar(deadline)} className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-opora-navy shadow-sm">
                    .ics
                  </button>
```

with this concrete button group:

```tsx
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => exportCalendar(deadline)}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-opora-navy shadow-sm"
                  >
                    .ics
                  </button>
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, deadlines: prev.deadlines.filter(item => item.id !== deadline.id) }))}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-opora-text shadow-sm"
                  >
                    Убрать
                  </button>
                </div>
```

- [ ] **Step 5: Run full validation**

Run:

```bash
node --import tsx tests/disabilityBureaucracy.test.ts
npm run lint
```

Expected: both commands PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/components/BureaucracyHelperScreen.tsx tests/disabilityBureaucracy.test.ts
git commit -m "feat: refine bureaucracy helper validation"
```

---

### Task 5: Final Verification And Handoff

**Files:**
- Verify: `src/lib/disabilityBureaucracy.ts`
- Verify: `src/components/BureaucracyHelperScreen.tsx`
- Verify: `src/components/NavigatorTab.tsx`
- Verify: `tests/disabilityBureaucracy.test.ts`

- [ ] **Step 1: Run all current tests**

Run:

```bash
node --import tsx tests/disabilityBureaucracy.test.ts
node --import tsx tests/careTracker.test.ts
node --import tsx tests/kzDisabilityGuide.test.ts
node --import tsx tests/legalLettersWorkflow.test.ts
```

Expected: all tests PASS.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: Vite build and server bundle complete successfully.

- [ ] **Step 4: Start local app for visual QA**

Run:

```bash
env PORT=5555 npm run dev
```

Expected: server starts on `http://localhost:5555`.

- [ ] **Step 5: Manual browser QA**

Open `http://localhost:5555` and verify:

- parent navigator loads;
- "Бюрократический помощник" compact card is visible inside the navigator;
- tapping the card opens the helper sub-screen;
- back button returns to the navigator;
- stage path can be changed;
- a document can be selected, validated, marked collected, and persisted after reload;
- unsupported attachment type shows an error;
- a deadline can be added, displayed, exported as `.ics`, and removed;
- no text overlaps in the narrow app frame.

- [ ] **Step 6: Stop dev server**

Stop the server with `Ctrl+C` in the running terminal session.

- [ ] **Step 7: Final commit if any QA fixes were needed**

If Task 5 required fixes, commit them:

```bash
git add src/lib/disabilityBureaucracy.ts src/components/BureaucracyHelperScreen.tsx src/components/NavigatorTab.tsx tests/disabilityBureaucracy.test.ts
git commit -m "fix: polish bureaucracy helper QA issues"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Dynamic checklist: Task 1 defines checklist and Task 2 renders it.
- Mark collected documents: Task 2 implements checked state and document records.
- Upload photo/scan: Task 2 implements file input and attachment storage; Task 4 verifies validation.
- Deadline reminders: Task 1 implements deadline helpers and `.ics`; Task 2 renders forms and export.
- Process stages: Task 1 defines stages and Task 2 renders manual stage path.
- Form validation: Task 1 implements validation and Task 2/4 wire inline errors.
- Smartphone calendar function: Task 1 implements `.ics`; Task 2 downloads it.
- Existing navigator integration: Task 2 adds sub-screen state and Task 3 adds compact card.

Placeholder scan:

- No `TBD`, `TODO`, "implement later", or unresolved function names remain in the plan.

Type consistency:

- `BureaucracyStageId`, `BureaucracyDeadlineType`, `BureaucracyDocumentRecord`, and `BureaucracyDeadline` are introduced in Task 1 and reused with the same names in later tasks.

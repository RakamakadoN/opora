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
  validateAttachment,
  validateBureaucracyDocumentRecord,
  type BureaucracyAttachment,
  type BureaucracyDeadline,
  type BureaucracyDeadlineType,
  type BureaucracyDocumentDefinition,
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

const emptyState: StoredState = {
  checkedIds: [],
  records: {},
  currentStage: DEFAULT_STAGE,
  deadlines: [],
  exportedDeadlineIds: []
};

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
    emptyState
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
    setState(parseStoredBureaucracyState<StoredState>(localStorage.getItem(storageKey), emptyState));
    setActiveDocumentId(checklist[0]?.id || "");
    setDocumentErrors({});
  }, [storageKey, checklist]);

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const progress = calculateBureaucracyProgress(checklist, state.checkedIds);
  const nearestDeadline = getNearestDeadline(state.deadlines);
  const activeDocument = checklist.find(item => item.id === activeDocumentId) || checklist[0];
  const activeRecord = activeDocument
    ? state.records[activeDocument.id] || createRecordFromDefinition(activeDocument)
    : null;

  const updateRecord = (documentId: string, patch: Partial<BureaucracyDocumentRecord>) => {
    setDocumentErrors({});
    setState(prev => {
      const definition = checklist.find(item => item.id === documentId);
      const current = prev.records[documentId] || createRecordFromDefinition(definition);
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

  const handleAttachment = (documentId: string, file: File | null) => {
    if (!file) return;
    const error = validateAttachment(file);
    if (error) {
      setDocumentErrors({ attachment: error });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const definition = checklist.find(item => item.id === documentId);
      const record = state.records[documentId] || createRecordFromDefinition(definition);
      const attachment: BureaucracyAttachment = {
        id: `${documentId}-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: typeof reader.result === "string" ? reader.result : undefined
      };
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
    <div className="min-h-full bg-opora-sand/30 pb-36 pt-12 text-opora-navy">
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
              const activeIndex = BUREAUCRACY_STAGES.findIndex(item => item.id === state.currentStage);
              const isActive = state.currentStage === stage.id;
              const isPast = activeIndex > index;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, currentStage: stage.id }))}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    isActive ? "border-opora-sage bg-opora-sage/10" : "border-black/5 bg-white"
                  }`}
                >
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
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
                  <span className="mt-0.5 shrink-0 text-opora-sage">
                    {isChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-tight">{document.title}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-opora-text">{document.description}</span>
                    <span className="mt-2 inline-flex rounded-full bg-opora-sand px-2 py-1 text-[10px] font-bold text-opora-text">
                      {document.required ? "Обязательно" : "Желательно"} · {document.source}
                    </span>
                    {document.warning && <span className="mt-2 block text-[11px] font-bold leading-relaxed text-opora-sage">{document.warning}</span>}
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
                    <div key={file.id} className="flex items-center justify-between gap-2 rounded-xl bg-opora-sand px-3 py-2 text-xs font-bold text-opora-text">
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
                Проверить и отметить собранным
              </button>
            </div>
          </section>
        )}

        <section className="mb-10 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
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

function createRecordFromDefinition(definition?: BureaucracyDocumentDefinition): BureaucracyDocumentRecord {
  return {
    documentId: definition?.id || "",
    collected: false,
    title: definition?.title || "",
    source: definition?.source || "",
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
        onInput={event => onChange(event.currentTarget.value)}
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

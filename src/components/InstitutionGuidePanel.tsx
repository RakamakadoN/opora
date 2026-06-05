import React from "react";
import { Building2, CheckCircle2, Circle, ExternalLink, FileText, Info, Loader2, MapPin, Phone, Search } from "lucide-react";
import { cn } from "../lib/utils";
import type { DiagnosticStatus } from "../context/ProfileContext";
import type { InstitutionChecklist, InstitutionGuide, InstitutionKind } from "../lib/institutionGuide";

type Props = {
  childId: string;
  city: string;
  diagnosticStatus: DiagnosticStatus;
  defaultKind?: InstitutionKind;
};

const kindLabels: Record<InstitutionKind, string> = {
  pmpk: "ПМПК / КППК",
  mse: "МСЭ",
  social_protection: "Соцзащита",
  egov_csc: "ЦОН / eGov",
  education_department: "Управление образования",
  clinic_vkk: "Поликлиника / ВКК"
};

const kindOptions: Array<{ id: InstitutionKind | "all"; label: string }> = [
  { id: "all", label: "Все" },
  { id: "pmpk", label: "ПМПК" },
  { id: "mse", label: "МСЭ" },
  { id: "social_protection", label: "Соцзащита" },
  { id: "egov_csc", label: "ЦОН/eGov" },
  { id: "education_department", label: "Образование" },
  { id: "clinic_vkk", label: "ВКК" }
];

export function InstitutionGuidePanel({ childId, city, diagnosticStatus, defaultKind = "pmpk" }: Props) {
  const [kind, setKind] = React.useState<InstitutionKind | "all">(defaultKind);
  const [query, setQuery] = React.useState("");
  const [institutions, setInstitutions] = React.useState<InstitutionGuide[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [checklist, setChecklist] = React.useState<InstitutionChecklist | null>(null);
  const [loadingInstitutions, setLoadingInstitutions] = React.useState(false);
  const [loadingChecklist, setLoadingChecklist] = React.useState(false);
  const [error, setError] = React.useState("");
  const [checkedIds, setCheckedIds] = React.useState<string[]>(() => readChecked(childId, ""));

  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ city, limit: "100" });
    if (kind !== "all") params.set("kind", kind);
    if (query.trim()) params.set("q", query.trim());

    setLoadingInstitutions(true);
    setError("");
    fetch(`/api/institutions?${params.toString()}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error("institutions_unavailable")))
      .then(data => {
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setInstitutions(items);
        setSelectedId(current => current && items.some((item: InstitutionGuide) => item.id === current) ? current : items[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить справочник учреждений.");
      })
      .finally(() => {
        if (!cancelled) setLoadingInstitutions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city, kind, query]);

  React.useEffect(() => {
    setCheckedIds(readChecked(childId, selectedId));
  }, [childId, selectedId]);

  React.useEffect(() => {
    if (!selectedId) {
      setChecklist(null);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      diagnosticStatus,
      checked: checkedIds.join(",")
    });

    setLoadingChecklist(true);
    fetch(`/api/institutions/${encodeURIComponent(selectedId)}/checklist?${params.toString()}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error("checklist_unavailable")))
      .then(data => {
        if (!cancelled) setChecklist(data);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить документы для выбранного учреждения.");
      })
      .finally(() => {
        if (!cancelled) setLoadingChecklist(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, diagnosticStatus, checkedIds]);

  const toggleChecked = (documentId: string) => {
    const next = checkedIds.includes(documentId)
      ? checkedIds.filter(id => id !== documentId)
      : [...checkedIds, documentId];
    setCheckedIds(next);
    writeChecked(childId, selectedId, next);
  };

  return (
    <section className="px-6 mb-4">
      <div className="rounded-2xl border border-opora-sage/20 bg-white p-4 shadow-sm text-left dark:bg-slate-800 dark:border-white/10">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-opora-sage/15 text-opora-navy flex items-center justify-center dark:bg-white/10 dark:text-white">
            <Building2 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg font-bold leading-tight text-opora-navy dark:text-white">
              Справочник учреждений
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-opora-text/75 dark:text-slate-300">
              Выберите место, и приложение подгрузит документы именно для этого маршрута.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {kindOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => setKind(option.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-extrabold transition-colors",
                kind === option.id
                  ? "bg-opora-navy text-white"
                  : "bg-opora-sand/60 text-opora-navy border border-black/5 dark:bg-slate-700 dark:text-slate-100"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-black/5 bg-opora-sand/45 px-3 py-2 dark:bg-slate-900 dark:border-white/10">
          <Search size={15} className="text-opora-sage" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Найти учреждение, район или услугу"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-opora-navy outline-none placeholder:text-opora-text/45 dark:text-white"
          />
        </label>

        {error && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {loadingInstitutions ? (
            <div className="col-span-full flex items-center gap-2 rounded-xl bg-opora-sand/50 p-3 text-xs font-bold text-opora-text/70">
              <Loader2 size={14} className="animate-spin" /> Загружаем учреждения
            </div>
          ) : institutions.map(institution => (
            <button
              key={institution.id}
              type="button"
              onClick={() => setSelectedId(institution.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                selectedId === institution.id
                  ? "border-opora-sage bg-opora-sage/10"
                  : "border-black/5 bg-white hover:border-opora-sage/40 dark:bg-slate-900 dark:border-white/10"
              )}
            >
              <p className="text-sm font-extrabold leading-snug text-opora-navy dark:text-white">{institution.name}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-opora-sage">
                <MapPin size={12} /> {institution.city}{institution.district ? ` · ${institution.district}` : ""}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-opora-text/50">
                {kindLabels[institution.kind]}
              </p>
            </button>
          ))}
        </div>

        {checklist && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-opora-sand/35 p-3 dark:bg-slate-900 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-opora-navy dark:text-white">{checklist.institution.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-opora-text/70 dark:text-slate-300">
                  {checklist.institution.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{checklist.institution.phone}</span>}
                  {checklist.institution.website && (
                    <a href={checklist.institution.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-opora-sage">
                      сайт <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-center shadow-sm dark:bg-slate-800">
                <p className="text-base font-black text-opora-navy dark:text-white">{checklist.progress.percent}%</p>
                <p className="text-[9px] font-bold uppercase text-opora-text/50">готово</p>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white dark:bg-slate-700">
              <div className="h-full rounded-full bg-opora-sage transition-all" style={{ width: `${checklist.progress.percent}%` }} />
            </div>

            {loadingChecklist ? (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-opora-text/70">
                <Loader2 size={14} className="animate-spin" /> Обновляем список документов
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {checklist.groups.map(group => (
                  <div key={group.stage}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-opora-navy dark:text-white">
                      <FileText size={14} className="text-opora-sage" /> {group.title}
                    </p>
                    <div className="space-y-2">
                      {group.documents.map(doc => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => toggleChecked(doc.id)}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-all",
                            doc.checked
                              ? "border-opora-sage/40 bg-white dark:bg-slate-800"
                              : "border-black/5 bg-white/70 dark:bg-slate-800/70 dark:border-white/10"
                          )}
                        >
                          {doc.checked ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-opora-sage" /> : <Circle size={18} className="mt-0.5 shrink-0 text-opora-text/35" />}
                          <span className="min-w-0">
                            <span className={cn("block text-sm font-bold leading-snug", doc.checked ? "text-opora-text/55 line-through" : "text-opora-navy dark:text-white")}>
                              {doc.title}
                            </span>
                            <span className="mt-1 block text-[11px] leading-relaxed text-opora-text/70 dark:text-slate-300">{doc.description}</span>
                            <span className={cn(
                              "mt-2 inline-flex rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider",
                              doc.required ? "bg-red-50 text-red-600" : "bg-opora-sand text-opora-text/60"
                            )}>
                              {doc.required ? "обязательно" : "желательно"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-opora-sage/15 bg-white/70 p-3 dark:bg-slate-800 dark:border-white/10">
              <Info size={14} className="mt-0.5 shrink-0 text-opora-sage" />
              <p className="text-[11px] leading-relaxed text-opora-text/75 dark:text-slate-300">{checklist.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function storageKey(childId: string, institutionId: string) {
  return `opora_institution_checklist_${childId}_${institutionId || "none"}`;
}

function readChecked(childId: string, institutionId: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(childId, institutionId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeChecked(childId: string, institutionId: string, ids: string[]) {
  localStorage.setItem(storageKey(childId, institutionId), JSON.stringify(ids));
}

import type { DiagnosticStatus } from "../context/ProfileContext";

export type InstitutionKind =
  | "pmpk"
  | "mse"
  | "social_protection"
  | "egov_csc"
  | "education_department"
  | "clinic_vkk";

export type DisabilityRouteStage =
  | "medical_preparation"
  | "pmpk_route"
  | "mse_review"
  | "benefits_services"
  | "education_route"
  | "appeals";

export type InstitutionGuide = {
  id: string;
  name: string;
  kind: InstitutionKind;
  regionCode: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  website?: string;
  sourceUrl?: string;
  sourceLabel: string;
  verifiedAt?: string;
  serviceAreaPopulation?: number;
  tags: string[];
  metadata: Record<string, unknown>;
};

export type InstitutionGuideDocument = {
  id: string;
  institutionId?: string;
  institutionKind: InstitutionKind;
  stage: DisabilityRouteStage;
  title: string;
  description: string;
  required: boolean;
  source: string;
  sortOrder: number;
  appliesToDiagnosticStatuses: DiagnosticStatus[];
  metadata: Record<string, unknown>;
};

export type InstitutionChecklistDocument = InstitutionGuideDocument & {
  checked: boolean;
};

export type InstitutionChecklist = {
  institution: InstitutionGuide;
  documents: InstitutionChecklistDocument[];
  groups: Array<{ stage: DisabilityRouteStage; title: string; documents: InstitutionChecklistDocument[] }>;
  progress: {
    checkedCount: number;
    totalCount: number;
    requiredChecked: number;
    requiredTotal: number;
    percent: number;
  };
  disclaimer: string;
};

export type InstitutionGuideRow = {
  id: string;
  name: string;
  kind: InstitutionKind;
  region_code: string;
  city: string;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  source_url?: string | null;
  source_label?: string | null;
  verified_at?: string | null;
  service_area_population?: number | null;
  tags?: unknown;
  metadata?: unknown;
};

export type InstitutionGuideDocumentRow = {
  id: string;
  institution_id?: string | null;
  institution_kind: InstitutionKind;
  stage: DisabilityRouteStage;
  title: string;
  description: string;
  required: boolean;
  source: string;
  sort_order?: number | null;
  applies_to_diagnostic_statuses?: unknown;
  metadata?: unknown;
};

const ALL_DIAGNOSTIC_STATUSES: DiagnosticStatus[] = [
  "Только подозреваем",
  "В процессе диагностики",
  "Диагноз подтвержден",
  "Проходим адаптацию и подбор терапии"
];

const STAGE_TITLES: Record<DisabilityRouteStage, string> = {
  medical_preparation: "Медицинская подготовка",
  pmpk_route: "ПМПК / КППК",
  mse_review: "МСЭ и инвалидность",
  benefits_services: "Пособия и соцуслуги",
  education_route: "Образовательный маршрут",
  appeals: "Отказы и обращения"
};

export const INSTITUTION_GUIDE_DISCLAIMER =
  "Список помогает собрать документы заранее. Перед подачей уточните актуальные требования в выбранном учреждении, поликлинике, МСЭ, ЦОН/eGov или управлении по месту проживания.";

const institutions: InstitutionGuide[] = [
  {
    id: "kz-almaty-pmpk-city",
    name: "Городская ПМПК / КППК",
    kind: "pmpk",
    regionCode: "kz-ala",
    city: "Алматы",
    district: "Городской маршрут",
    address: "Адрес уточняется по району проживания",
    phone: "Контакт уточнить в управлении образования",
    website: "https://www.gov.kz/",
    sourceUrl: "https://www.gov.kz/",
    sourceLabel: "gov.kz + источник о сборе документов",
    verifiedAt: "2026-06-04T00:00:00.000Z",
    serviceAreaPopulation: 1_000_000,
    tags: ["ПМПК", "КППК", "образовательный маршрут", "документы"],
    metadata: { appointment: "usually_by_queue", scale: "district" }
  },
  {
    id: "kz-almaty-mse-district",
    name: "Медико-социальная экспертиза по району",
    kind: "mse",
    regionCode: "kz-ala",
    city: "Алматы",
    district: "Районное бюро МСЭ",
    address: "Адрес зависит от района прикрепления",
    phone: "Уточнить через поликлинику или eGov",
    website: "https://egov.kz/",
    sourceUrl: "https://egov.kz/",
    sourceLabel: "eGov / МСЭ + источник о сборе документов",
    verifiedAt: "2026-06-04T00:00:00.000Z",
    serviceAreaPopulation: 1_000_000,
    tags: ["МСЭ", "инвалидность", "ИПАР", "ВКК"],
    metadata: { appointment: "clinic_referral", scale: "district" }
  },
  {
    id: "kz-almaty-social-protection",
    name: "Управление занятости и социальных программ",
    kind: "social_protection",
    regionCode: "kz-ala",
    city: "Алматы",
    district: "Город / район",
    address: "По месту регистрации семьи",
    phone: "Контакт уточнить на gov.kz",
    website: "https://www.gov.kz/",
    sourceUrl: "https://www.gov.kz/",
    sourceLabel: "gov.kz + источник о сборе документов",
    verifiedAt: "2026-06-04T00:00:00.000Z",
    serviceAreaPopulation: 1_000_000,
    tags: ["соцзащита", "пособия", "услуги", "ИПАР"],
    metadata: { afterMse: true, scale: "city" }
  },
  {
    id: "kz-egov-csc",
    name: "ЦОН / eGov",
    kind: "egov_csc",
    regionCode: "kz",
    city: "Все города",
    district: "Онлайн или ближайший ЦОН",
    address: "egov.kz или ЦОН по месту проживания",
    phone: "1414",
    website: "https://egov.kz/",
    sourceUrl: "https://egov.kz/",
    sourceLabel: "eGov + источник о сборе документов",
    verifiedAt: "2026-06-04T00:00:00.000Z",
    serviceAreaPopulation: 1_000_000,
    tags: ["ЦОН", "eGov", "заявления", "ЭЦП"],
    metadata: { channel: "online_or_csc", scale: "national" }
  },
  {
    id: "kz-almaty-education-department",
    name: "Управление образования",
    kind: "education_department",
    regionCode: "kz-ala",
    city: "Алматы",
    district: "Город / район",
    address: "Адрес уточняется на gov.kz",
    phone: "Контакт уточнить на gov.kz",
    website: "https://www.gov.kz/",
    sourceUrl: "https://www.gov.kz/",
    sourceLabel: "gov.kz + источник о сборе документов",
    verifiedAt: "2026-06-04T00:00:00.000Z",
    serviceAreaPopulation: 1_000_000,
    tags: ["образование", "сад", "школа", "инклюзия", "ПМПК"],
    metadata: { escalationRoute: true, scale: "city" }
  },
  {
    id: "kz-clinic-vkk",
    name: "Поликлиника / ВКК",
    kind: "clinic_vkk",
    regionCode: "kz",
    city: "Все города",
    district: "По месту прикрепления",
    address: "Поликлиника ребенка",
    phone: "Регистратура поликлиники",
    website: "https://egov.kz/",
    sourceUrl: "https://egov.kz/",
    sourceLabel: "медицинская организация + источник о сборе документов",
    verifiedAt: "2026-06-04T00:00:00.000Z",
    serviceAreaPopulation: 1_000_000,
    tags: ["ВКК", "поликлиника", "направление", "форма 088"],
    metadata: { firstStep: true, scale: "clinic" }
  }
];

const documents: InstitutionGuideDocument[] = [
  doc("birth_certificate", "pmpk", "pmpk_route", "Свидетельство о рождении ребенка", "Оригинал и копия. Проверьте, чтобы ИИН читался без ошибок.", true, 10),
  doc("parent_identity", "pmpk", "pmpk_route", "Удостоверение личности родителя / опекуна", "Оригинал и копия сопровождающего взрослого.", true, 20),
  doc("medical_form_027", "pmpk", "pmpk_route", "Форма 027/у или актуальная выписка", "Выписка о состоянии здоровья из поликлиники или профильного врача.", true, 30, ["Только подозреваем", "В процессе диагностики", "Диагноз подтвержден"]),
  doc("specialist_conclusions", "pmpk", "pmpk_route", "Заключения профильных специалистов", "Психиатр, невролог, ЛОР/аудиолог, офтальмолог и другие специалисты по состоянию ребенка.", true, 40),
  doc("education_characteristic", "pmpk", "education_route", "Характеристика из сада, школы или центра", "Нужна, если ребенок посещает организацию образования или коррекционный центр.", false, 50),
  doc("previous_pmpk_conclusion", "pmpk", "pmpk_route", "Предыдущее заключение ПМПК", "Берите оригинал и копию, если проходили комиссию раньше.", false, 60, ["Диагноз подтвержден", "Проходим адаптацию и подбор терапии"]),
  doc("mse_referral", "mse", "mse_review", "Направление на МСЭ от медицинской организации", "Оформляется через поликлинику/ВКК, часть сведений может передаваться электронно.", true, 10, ["Диагноз подтвержден", "Проходим адаптацию и подбор терапии"]),
  doc("ambulatory_extract", "mse", "medical_preparation", "Выписка из амбулаторной карты", "Медицинская база: диагноз, динамика, обследования, лечение и ограничения жизнедеятельности.", true, 20),
  doc("narrow_specialists_mse", "mse", "medical_preparation", "Заключения узких специалистов для МСЭ", "Для РАС обычно готовят детского психиатра, невролога, ЛОР/аудиолога, офтальмолога и других по показаниям.", true, 30),
  doc("mse_identity_pack", "mse", "mse_review", "Документы ребенка и родителя", "Свидетельство о рождении/ИИН ребенка и удостоверение личности родителя для сверки данных.", true, 40),
  doc("disability_certificate", "social_protection", "benefits_services", "Справка об инвалидности", "После решения МСЭ проверьте срок, группу/категорию и корректность данных.", true, 10, ["Диагноз подтвержден", "Проходим адаптацию и подбор терапии"]),
  doc("ipar", "social_protection", "benefits_services", "ИПАР / индивидуальная программа абилитации и реабилитации", "Основа для технических средств, соцуслуг и реабилитационных маршрутов.", true, 20, ["Диагноз подтвержден", "Проходим адаптацию и подбор терапии"]),
  doc("benefits_application", "social_protection", "benefits_services", "Заявление на пособия и соцуслуги", "Подается через ЦОН/eGov или соцзащиту в зависимости от услуги.", true, 30, ["Диагноз подтвержден", "Проходим адаптацию и подбор терапии"]),
  doc("bank_account", "social_protection", "benefits_services", "Банковский счет для выплат", "Реквизиты счета родителя или законного представителя, если требуется для пособия.", false, 40),
  doc("eds_access", "egov_csc", "benefits_services", "ЭЦП или доступ к eGov", "Проверьте доступ заранее: многие заявления проще подать онлайн.", true, 10),
  doc("statement_copies", "egov_csc", "appeals", "Копии заявлений и входящие номера", "Сохраняйте номера обращений, скриншоты статуса и письменные ответы.", false, 20),
  doc("education_request", "education_department", "education_route", "Заявление об образовательном маршруте", "Для сада, школы, ассистента, адаптаций или спорной ситуации с местом.", true, 10),
  doc("pmpk_conclusion_for_education", "education_department", "education_route", "Заключение ПМПК / КППК", "Подтверждает особые образовательные потребности и рекомендованный маршрут.", true, 20),
  doc("written_refusal", "education_department", "appeals", "Письменный отказ или официальный ответ", "Нужен для жалобы, если место, адаптации или сопровождение не предоставляют.", false, 30),
  doc("vkk_minutes", "clinic_vkk", "medical_preparation", "Решение ВКК / врачебной комиссии", "Попросите объяснить, какие формы и обследования нужны до направления на МСЭ.", true, 10),
  doc("test_results", "clinic_vkk", "medical_preparation", "Результаты обследований и анализов", "Собирайте только то, что назначил врач; сроки годности уточняйте в поликлинике.", false, 20)
].map(item => item.id.startsWith("mse_") || item.institutionKind === "mse"
  ? { ...item, institutionId: item.institutionKind === "mse" ? "kz-almaty-mse-district" : item.institutionId }
  : item
).map(item => item.institutionKind === "pmpk"
  ? { ...item, institutionId: "kz-almaty-pmpk-city" }
  : item
);

function doc(
  id: string,
  institutionKind: InstitutionKind,
  stage: DisabilityRouteStage,
  title: string,
  description: string,
  required: boolean,
  sortOrder: number,
  appliesToDiagnosticStatuses: DiagnosticStatus[] = ALL_DIAGNOSTIC_STATUSES
): InstitutionGuideDocument {
  return {
    id,
    institutionKind,
    stage,
    title,
    description,
    required,
    source: "Источник: сбор документов и маршрут госучреждений",
    sortOrder,
    appliesToDiagnosticStatuses,
    metadata: {}
  };
}

export function getDefaultInstitutionGuideSeed() {
  return {
    institutions,
    documents
  };
}

export function normalizeInstitutionGuideRows(
  institutionRows: InstitutionGuideRow[] = [],
  documentRows: InstitutionGuideDocumentRow[] = []
) {
  return {
    institutions: institutionRows.map(normalizeInstitutionRow),
    documents: documentRows.map(normalizeDocumentRow)
  };
}

export function normalizeInstitutionRow(row: InstitutionGuideRow): InstitutionGuide {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    regionCode: row.region_code,
    city: row.city,
    district: row.district || undefined,
    address: row.address || undefined,
    phone: row.phone || undefined,
    website: row.website || undefined,
    sourceUrl: row.source_url || undefined,
    sourceLabel: row.source_label || "Источник требует проверки",
    verifiedAt: row.verified_at || undefined,
    serviceAreaPopulation: row.service_area_population || undefined,
    tags: safeArray(row.tags),
    metadata: safeObject(row.metadata)
  };
}

export function normalizeDocumentRow(row: InstitutionGuideDocumentRow): InstitutionGuideDocument {
  return {
    id: row.id,
    institutionId: row.institution_id || undefined,
    institutionKind: row.institution_kind,
    stage: row.stage,
    title: row.title,
    description: row.description,
    required: row.required,
    source: row.source,
    sortOrder: row.sort_order || 0,
    appliesToDiagnosticStatuses: normalizeDiagnosticStatuses(row.applies_to_diagnostic_statuses),
    metadata: safeObject(row.metadata)
  };
}

export function matchInstitutionDocuments(
  allDocuments: InstitutionGuideDocument[],
  params: {
    institutionId: string;
    institutionKind: InstitutionKind;
    diagnosticStatus: DiagnosticStatus;
  }
) {
  return allDocuments
    .filter(doc =>
      (doc.institutionId === params.institutionId || (!doc.institutionId && doc.institutionKind === params.institutionKind) || doc.institutionKind === params.institutionKind) &&
      doc.appliesToDiagnosticStatuses.includes(params.diagnosticStatus)
    )
    .sort((a, b) => {
      const placeSpecificDiff = Number(Boolean(b.institutionId === params.institutionId)) - Number(Boolean(a.institutionId === params.institutionId));
      if (placeSpecificDiff !== 0) return placeSpecificDiff;
      return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru");
    });
}

export function buildInstitutionChecklist(params: {
  institution: InstitutionGuide;
  documents: InstitutionGuideDocument[];
  diagnosticStatus: DiagnosticStatus;
  checkedDocumentIds?: string[];
}): InstitutionChecklist {
  const checked = new Set(params.checkedDocumentIds || []);
  const matched = matchInstitutionDocuments(params.documents, {
    institutionId: params.institution.id,
    institutionKind: params.institution.kind,
    diagnosticStatus: params.diagnosticStatus
  }).map(doc => ({ ...doc, checked: checked.has(doc.id) }));

  const checkedCount = matched.filter(doc => doc.checked).length;
  const requiredDocs = matched.filter(doc => doc.required);
  const requiredChecked = requiredDocs.filter(doc => doc.checked).length;

  return {
    institution: params.institution,
    documents: matched,
    groups: groupInstitutionDocumentsByStage(matched),
    progress: {
      checkedCount,
      totalCount: matched.length,
      requiredChecked,
      requiredTotal: requiredDocs.length,
      percent: matched.length ? Math.round((checkedCount / matched.length) * 100) : 0
    },
    disclaimer: INSTITUTION_GUIDE_DISCLAIMER
  };
}

export function groupInstitutionDocumentsByStage<T extends InstitutionGuideDocument>(items: T[]) {
  const stageOrder: DisabilityRouteStage[] = ["medical_preparation", "pmpk_route", "mse_review", "benefits_services", "education_route", "appeals"];
  return stageOrder
    .map(stage => ({
      stage,
      title: STAGE_TITLES[stage],
      documents: items.filter(item => item.stage === stage)
    }))
    .filter(group => group.documents.length > 0);
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeDiagnosticStatuses(value: unknown): DiagnosticStatus[] {
  const values = safeArray(value).filter((item): item is DiagnosticStatus =>
    ALL_DIAGNOSTIC_STATUSES.includes(item as DiagnosticStatus)
  );
  return values.length ? values : ALL_DIAGNOSTIC_STATUSES;
}

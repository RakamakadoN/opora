export type MedicationEventInput = {
  plannedAt: string;
  takenAt?: string;
  status: "planned" | "taken" | "skipped";
  reminderWindowMinutes: number;
};

export type MedicationTimingStatus = "planned" | "on_time" | "late" | "skipped";

export type MedicationPlanSummary = {
  childId: string;
  childName: string;
  name: string;
  doseText: string;
  scheduleText: string;
  foodRelation: string;
  active: boolean;
};

export type MedicationEventSummary = MedicationEventInput & {
  id: string;
  planId?: string;
  childId: string;
  childName: string;
  planName: string;
  doseText: string;
  foodRelation?: string;
  skipReason?: string;
};

export type DietRuleSummary = {
  childId: string;
  childName: string;
  type: "allergen" | "medical" | "sensory" | "preference" | "other";
  title: string;
  details: string;
  active: boolean;
};

export type FoodLogSummary = {
  childId: string;
  childName: string;
  eatenAt: string;
  foodText: string;
  amountText?: string;
  texture?: string;
  reaction?: string;
};

export type ReactionLogSummary = {
  childId: string;
  childName: string;
  happenedAt: string;
  title: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  possibleTrigger?: string;
};

type DoctorTrackerReportInput = {
  childName: string;
  periodLabel: string;
  medications: MedicationPlanSummary[];
  medicationEvents: MedicationEventSummary[];
  dietRules: DietRuleSummary[];
  foodLogs: FoodLogSummary[];
  reactions: ReactionLogSummary[];
};

export function getMedicationEventStatus(event: MedicationEventInput): MedicationTimingStatus {
  if (event.status === "skipped") return "skipped";
  if (event.status === "planned" || !event.takenAt) return "planned";

  const plannedTime = new Date(event.plannedAt).getTime();
  const takenTime = new Date(event.takenAt).getTime();
  const diffMinutes = Math.abs(takenTime - plannedTime) / 60000;

  return diffMinutes <= event.reminderWindowMinutes ? "on_time" : "late";
}

export function sortMedicationEventsForDay(events: MedicationEventSummary[]) {
  return [...events].sort((a, b) => new Date(a.plannedAt).getTime() - new Date(b.plannedAt).getTime());
}

export function buildDoctorTrackerReport(input: DoctorTrackerReportInput) {
  const takenCount = input.medicationEvents.filter(event => event.status === "taken").length;
  const skippedCount = input.medicationEvents.filter(event => event.status === "skipped").length;
  const lateCount = input.medicationEvents.filter(event => getMedicationEventStatus(event) === "late").length;

  const lines = [
    `Отчет трекера: ${input.childName}`,
    `Период: ${input.periodLabel}`,
    "",
    "Важно: этот отчет фиксирует наблюдения семьи и не заменяет назначение врача.",
    "",
    "Лекарства и расписание:",
    ...formatMedicationPlans(input.medications),
    "",
    `Факты приема: принято: ${takenCount}, с опозданием: ${lateCount}, пропущено: ${skippedCount}.`,
    ...formatMedicationEvents(input.medicationEvents),
    "",
    "Диетические ограничения:",
    ...formatDietRules(input.dietRules),
    "",
    "Питание:",
    ...formatFoodLogs(input.foodLogs),
    "",
    "Реакции и симптомы:",
    ...formatReactions(input.reactions)
  ];

  return lines.join("\n");
}

function formatMedicationPlans(plans: MedicationPlanSummary[]) {
  const activePlans = plans.filter(plan => plan.active);
  if (!activePlans.length) return ["- Активные назначения не указаны."];
  return activePlans.map(plan => (
    `- ${plan.name}: ${plan.doseText}; ${plan.scheduleText}; связь с едой: ${plan.foodRelation || "не указана"}.`
  ));
}

function formatMedicationEvents(events: MedicationEventSummary[]) {
  if (!events.length) return ["- За выбранный период факты приема не указаны."];
  return sortMedicationEventsForDay(events).map(event => {
    const status = getMedicationEventStatus(event);
    const statusLabel = {
      planned: "запланировано",
      on_time: "вовремя",
      late: "с опозданием",
      skipped: "пропущено"
    }[status];
    const reason = event.skipReason ? `; причина: ${event.skipReason}` : "";
    return `- ${formatDateTime(event.plannedAt)}: ${event.planName}, ${event.doseText} - ${statusLabel}${reason}.`;
  });
}

function formatDietRules(rules: DietRuleSummary[]) {
  const activeRules = rules.filter(rule => rule.active);
  if (!activeRules.length) return ["- Активные ограничения не указаны."];
  return activeRules.map(rule => `- ${rule.title}: ${rule.details}`);
}

function formatFoodLogs(logs: FoodLogSummary[]) {
  if (!logs.length) return ["- Записи питания за период не указаны."];
  return logs.map(log => {
    const amount = log.amountText ? `; объем: ${log.amountText}` : "";
    const texture = log.texture ? `; текстура: ${log.texture}` : "";
    const reaction = log.reaction ? `; реакция: ${log.reaction}` : "";
    return `- ${formatDateTime(log.eatenAt)}: ${log.foodText}${amount}${texture}${reaction}.`;
  });
}

function formatReactions(reactions: ReactionLogSummary[]) {
  if (!reactions.length) return ["- Реакции или симптомы за период не указаны."];
  return reactions.map(reaction => {
    const trigger = reaction.possibleTrigger ? `; возможная связь: ${reaction.possibleTrigger}` : "";
    return `- ${formatDateTime(reaction.happenedAt)}: ${reaction.title}; интенсивность ${reaction.intensity}/5${trigger}.`;
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

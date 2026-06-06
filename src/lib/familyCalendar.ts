export type FamilyEventType = "medicine" | "appointment" | "queue" | "therapy" | "school" | "documents" | "home" | "family" | "other";
export type FamilyEventSource = "manual" | "medication_plan" | "medical_booking" | "government_queue" | "parent_task";
export type FamilyEventStatus = "scheduled" | "completed" | "cancelled";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type RecurrenceExceptionAction = "skip" | "move";
export type NotificationChannel = "web_push" | "email" | "sms" | "in_app";
export type NotificationJobStatus = "scheduled" | "sent" | "failed" | "cancelled";

export type FamilyCalendarEvent = {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  eventType: FamilyEventType;
  source: FamilyEventSource;
  sourceId?: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  status: FamilyEventStatus;
  childIds: string[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyRecurrenceRule = {
  eventId: string;
  frequency: RecurrenceFrequency;
  intervalCount: number;
  weekdays?: number[];
  monthDay?: number;
  startsOn: string;
  endsOn?: string;
};

export type FamilyRecurrenceException = {
  id: string;
  eventId: string;
  occurrenceDate: string;
  action: RecurrenceExceptionAction;
  movedStartsAt?: string;
  movedEndsAt?: string;
};

export type FamilyEventOccurrenceState = {
  id: string;
  eventId: string;
  occurrenceDate: string;
  status: "completed" | "cancelled";
  completedByUserId?: string;
  completedAt?: string;
};

export type FamilyCalendarOccurrence = FamilyCalendarEvent & {
  occurrenceId: string;
  occurrenceDate: string;
  occurrenceStartsAt: string;
  occurrenceEndsAt?: string;
  occurrenceStatus: FamilyEventStatus;
  recurrenceLabel?: string;
};

export type FamilyNotificationPreference = {
  id: string;
  familyId: string;
  childId?: string;
  channel: NotificationChannel;
  enabled: boolean;
  minutesBefore: number;
  recipientUserId: string;
};

export type FamilyNotificationJobDraft = {
  id: string;
  familyId: string;
  eventId: string;
  occurrenceId: string;
  occurrenceDate: string;
  channel: NotificationChannel;
  recipientUserId: string;
  deliverAt: string;
  status: NotificationJobStatus;
};

type ExpandFamilyEventOccurrencesInput = {
  events: FamilyCalendarEvent[];
  recurrenceRules: FamilyRecurrenceRule[];
  exceptions: FamilyRecurrenceException[];
  occurrenceStates: FamilyEventOccurrenceState[];
  rangeStart: string;
  rangeEnd: string;
};

type GenerateNotificationJobsInput = {
  familyId: string;
  occurrences: FamilyCalendarOccurrence[];
  preferences: FamilyNotificationPreference[];
  now: string;
  horizonDays: number;
};

export type FamilyCalendarMedicationPlanSource = {
  id: string;
  childId: string;
  childName: string;
  name: string;
  doseText: string;
  scheduleText: string;
  foodRelation: string;
  reminderTimes: string[];
  reminderWindowMinutes?: number;
  repeatEveryMinutes?: number;
  startDate: string;
  endDate?: string;
  active: boolean;
};

export type FamilyCalendarMedicalBookingSource = {
  id: string;
  childId: string;
  childName: string;
  doctorName: string;
  doctorTitle: string;
  doctorCity: string;
  date: string;
  time: string;
  status: "confirmed" | "completed";
};

export type FamilyCalendarGovernmentQueueSource = {
  id: string;
  childId: string;
  childName: string;
  serviceTitle: string;
  institutionName: string;
  institutionAddress: string;
  appointmentAt?: string;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyCalendarParentTaskSource = {
  id: string;
  childId: string;
  title: string;
  description: string;
  category: "documents" | "therapy" | "school" | "medical" | "home";
  status: "todo" | "done";
  dueDate?: string;
  completedAt?: string;
  source: "system" | "manual";
  relatedBookingId?: string;
};

export type BuildFamilyCalendarEventsInput = {
  familyId: string;
  createdByUserId: string;
  now: string;
  medicationPlans: FamilyCalendarMedicationPlanSource[];
  medicalBookings: FamilyCalendarMedicalBookingSource[];
  governmentQueueRecords: FamilyCalendarGovernmentQueueSource[];
  parentTasks: FamilyCalendarParentTaskSource[];
};

export type BuildFamilyCalendarEventsResult = {
  events: FamilyCalendarEvent[];
  recurrenceRules: FamilyRecurrenceRule[];
};

const colorTokens = ["rose", "amber", "emerald", "sky", "violet", "teal", "pink", "indigo"];

export function buildFamilyCalendarEventsFromSources(input: BuildFamilyCalendarEventsInput): BuildFamilyCalendarEventsResult {
  const events: FamilyCalendarEvent[] = [];
  const recurrenceRules: FamilyRecurrenceRule[] = [];

  for (const plan of input.medicationPlans) {
    if (!plan.active) {
      continue;
    }

    for (const time of plan.reminderTimes) {
      const eventId = `medication-${plan.id}-${time.replace(":", "-")}`;
      events.push({
        id: eventId,
        familyId: input.familyId,
        title: plan.name,
        description: [plan.doseText, plan.foodRelation, plan.scheduleText].filter(Boolean).join(" · "),
        eventType: "medicine",
        source: "medication_plan",
        sourceId: plan.id,
        startsAt: localDateTimeToIso(plan.startDate, time),
        allDay: false,
        status: "scheduled",
        childIds: [plan.childId],
        createdByUserId: input.createdByUserId,
        createdAt: input.now,
        updatedAt: input.now
      });
      recurrenceRules.push({
        eventId,
        frequency: "daily",
        intervalCount: 1,
        startsOn: plan.startDate,
        endsOn: plan.endDate
      });
    }
  }

  for (const booking of input.medicalBookings) {
    events.push({
      id: `medical-booking-${booking.id}`,
      familyId: input.familyId,
      title: `${booking.doctorTitle}: ${booking.doctorName}`,
      description: booking.doctorCity,
      eventType: "appointment",
      source: "medical_booking",
      sourceId: booking.id,
      startsAt: localDateTimeToIso(booking.date, booking.time),
      allDay: false,
      status: booking.status === "completed" ? "completed" : "scheduled",
      childIds: [booking.childId],
      createdByUserId: input.createdByUserId,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  for (const record of input.governmentQueueRecords) {
    if (!record.appointmentAt || record.status === "cancelled") {
      continue;
    }

    events.push({
      id: `government-queue-${record.id}`,
      familyId: input.familyId,
      title: record.serviceTitle,
      description: [record.institutionName, record.note].filter(Boolean).join(" · "),
      eventType: "queue",
      source: "government_queue",
      sourceId: record.id,
      startsAt: record.appointmentAt,
      allDay: false,
      status: record.status === "completed" ? "completed" : "scheduled",
      childIds: [record.childId],
      createdByUserId: input.createdByUserId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  for (const task of input.parentTasks) {
    if (!task.dueDate) {
      continue;
    }

    events.push({
      id: `parent-task-${task.id}`,
      familyId: input.familyId,
      title: task.title,
      description: task.description,
      eventType: mapParentTaskCategory(task.category),
      source: "parent_task",
      sourceId: task.id,
      startsAt: `${task.dueDate}T00:00:00.000Z`,
      allDay: true,
      status: task.status === "done" ? "completed" : "scheduled",
      childIds: [task.childId],
      createdByUserId: input.createdByUserId,
      createdAt: input.now,
      updatedAt: task.completedAt ?? input.now
    });
  }

  return {
    events: events.sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    recurrenceRules
  };
}

export function expandFamilyEventOccurrences(input: ExpandFamilyEventOccurrencesInput): FamilyCalendarOccurrence[] {
  const rulesByEventId = new Map(input.recurrenceRules.map(rule => [rule.eventId, rule]));
  const exceptionsByEventDate = groupByEventDate(input.exceptions);
  const occurrences: FamilyCalendarOccurrence[] = [];
  const rangeStart = new Date(input.rangeStart);
  const rangeEnd = new Date(input.rangeEnd);

  for (const event of input.events) {
    const rule = rulesByEventId.get(event.id);

    if (!rule) {
      const startsAt = new Date(event.startsAt);

      if (startsAt >= rangeStart && startsAt < rangeEnd) {
        occurrences.push(toOccurrence(event, toIsoDate(startsAt), event.startsAt, event.endsAt));
      }

      continue;
    }

    for (const occurrenceDate of eachDate(input.rangeStart, input.rangeEnd)) {
      if (!matchesRecurrenceDate(rule, occurrenceDate)) {
        continue;
      }

      const exception = exceptionsByEventDate.get(`${event.id}:${occurrenceDate}`);

      if (exception?.action === "skip") {
        continue;
      }

      const startsAt = exception?.movedStartsAt ?? moveTimeToDate(event.startsAt, occurrenceDate);
      const endsAt = exception?.movedEndsAt ?? (event.endsAt ? moveTimeToDate(event.endsAt, occurrenceDate) : undefined);
      occurrences.push(toOccurrence(event, occurrenceDate, startsAt, endsAt));
    }
  }

  return mergeOccurrenceStates(occurrences, input.occurrenceStates).sort((left, right) =>
    left.occurrenceStartsAt.localeCompare(right.occurrenceStartsAt)
  );
}

export function mergeOccurrenceStates(
  occurrences: FamilyCalendarOccurrence[],
  occurrenceStates: FamilyEventOccurrenceState[]
): FamilyCalendarOccurrence[] {
  const statesByEventDate = groupByEventDate(occurrenceStates);

  return occurrences.map(occurrence => {
    const state = statesByEventDate.get(`${occurrence.id}:${occurrence.occurrenceDate}`);

    return state ? { ...occurrence, occurrenceStatus: state.status } : occurrence;
  });
}

export function generateNotificationJobs(input: GenerateNotificationJobsInput): FamilyNotificationJobDraft[] {
  const now = new Date(input.now);
  const horizonEnd = new Date(now.getTime() + input.horizonDays * 24 * 60 * 60 * 1000);
  const jobs: FamilyNotificationJobDraft[] = [];

  for (const occurrence of input.occurrences) {
    if (occurrence.familyId !== input.familyId || occurrence.occurrenceStatus !== "scheduled") {
      continue;
    }

    for (const preference of input.preferences) {
      if (!preference.enabled || preference.familyId !== input.familyId) {
        continue;
      }

      if (preference.childId && !occurrence.childIds.includes(preference.childId)) {
        continue;
      }

      const deliverAt = new Date(new Date(occurrence.occurrenceStartsAt).getTime() - preference.minutesBefore * 60 * 1000);

      if (deliverAt < now || deliverAt > horizonEnd) {
        continue;
      }

      jobs.push({
        id: `${occurrence.id}:${occurrence.occurrenceDate}:${preference.channel}:${preference.recipientUserId}`,
        familyId: input.familyId,
        eventId: occurrence.id,
        occurrenceId: occurrence.occurrenceId,
        occurrenceDate: occurrence.occurrenceDate,
        channel: preference.channel,
        recipientUserId: preference.recipientUserId,
        deliverAt: deliverAt.toISOString(),
        status: "scheduled"
      });
    }
  }

  return jobs.sort((left, right) => left.deliverAt.localeCompare(right.deliverAt));
}

export function getChildColorToken(childId: string): string {
  let hash = 0;

  for (let index = 0; index < childId.length; index += 1) {
    hash = (hash * 31 + childId.charCodeAt(index)) >>> 0;
  }

  return colorTokens[hash % colorTokens.length];
}

function matchesRecurrenceDate(rule: FamilyRecurrenceRule, occurrenceDate: string): boolean {
  if (occurrenceDate < rule.startsOn || (rule.endsOn && occurrenceDate > rule.endsOn)) {
    return false;
  }

  const daysSinceStart = daysBetween(rule.startsOn, occurrenceDate);
  const intervalCount = Math.max(rule.intervalCount, 1);

  if (rule.frequency === "daily") {
    return daysSinceStart % intervalCount === 0;
  }

  if (rule.frequency === "weekly") {
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    const weekdays = rule.weekdays?.length ? rule.weekdays : [new Date(`${rule.startsOn}T00:00:00.000Z`).getUTCDay()];

    return weeksSinceStart % intervalCount === 0 && weekdays.includes(getCalendarWeekday(occurrenceDate));
  }

  const monthDay = rule.monthDay ?? new Date(`${rule.startsOn}T00:00:00.000Z`).getUTCDate();
  const monthsSinceStart = monthsBetween(rule.startsOn, occurrenceDate);

  return monthsSinceStart >= 0 && monthsSinceStart % intervalCount === 0 && new Date(`${occurrenceDate}T00:00:00.000Z`).getUTCDate() === monthDay;
}

function toOccurrence(
  event: FamilyCalendarEvent,
  occurrenceDate: string,
  occurrenceStartsAt: string,
  occurrenceEndsAt?: string
): FamilyCalendarOccurrence {
  return {
    ...event,
    occurrenceId: `${event.id}:${occurrenceDate}`,
    occurrenceDate,
    occurrenceStartsAt,
    occurrenceEndsAt,
    occurrenceStatus: event.status
  };
}

function eachDate(rangeStart: string, rangeEnd: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${toIsoDate(new Date(rangeStart))}T00:00:00.000Z`);
  const end = new Date(rangeEnd);

  while (cursor < end) {
    dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function groupByEventDate<T extends { eventId: string; occurrenceDate: string }>(items: T[]): Map<string, T> {
  return new Map(items.map(item => [`${item.eventId}:${item.occurrenceDate}`, item]));
}

function moveTimeToDate(timestamp: string, occurrenceDate: string): string {
  const original = new Date(timestamp);
  const moved = new Date(`${occurrenceDate}T00:00:00.000Z`);

  moved.setUTCHours(original.getUTCHours(), original.getUTCMinutes(), original.getUTCSeconds(), original.getUTCMilliseconds());

  return moved.toISOString();
}

function daysBetween(startDate: string, endDate: string): number {
  return Math.floor((new Date(`${endDate}T00:00:00.000Z`).getTime() - new Date(`${startDate}T00:00:00.000Z`).getTime()) / (24 * 60 * 60 * 1000));
}

function monthsBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getCalendarWeekday(occurrenceDate: string): number {
  return (new Date(`${occurrenceDate}T00:00:00.000Z`).getUTCDay() + 6) % 7;
}

function localDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function mapParentTaskCategory(category: FamilyCalendarParentTaskSource["category"]): FamilyEventType {
  if (category === "medical") return "appointment";
  return category;
}

export type GovernmentQueueStatus = "waiting" | "soon" | "ready" | "completed" | "cancelled";

export type GovernmentQueueRecordSummary = {
  id: string;
  childId: string;
  childName: string;
  serviceTitle: string;
  institutionName: string;
  institutionAddress: string;
  appointmentAt?: string;
  queueNumber?: number;
  currentQueueNumber?: number;
  status: GovernmentQueueStatus;
  note?: string;
  lastNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type GovernmentQueueReminder = {
  type: "queue_ready" | "visit_tomorrow" | "visit_today";
  message: "Очередь подошла" | "Визит завтра" | "Визит сегодня";
};

export function getGovernmentQueueStatus(
  record: GovernmentQueueRecordSummary,
  now: Date = new Date()
): GovernmentQueueStatus {
  if (record.status === "completed" || record.status === "cancelled") return record.status;
  if (isQueueReady(record)) return "ready";

  const appointment = parseDate(record.appointmentAt);
  if (!appointment) return "waiting";

  return isToday(appointment, now) || isTomorrow(appointment, now) ? "soon" : "waiting";
}

export function getGovernmentQueueReminder(
  record: GovernmentQueueRecordSummary,
  now: Date = new Date()
): GovernmentQueueReminder | null {
  if (record.status === "completed" || record.status === "cancelled") return null;
  if (isQueueReady(record)) return { type: "queue_ready", message: "Очередь подошла" };

  const appointment = parseDate(record.appointmentAt);
  if (!appointment) return null;
  if (isTomorrow(appointment, now)) return { type: "visit_tomorrow", message: "Визит завтра" };
  if (isToday(appointment, now)) return { type: "visit_today", message: "Визит сегодня" };

  return null;
}

export function sortGovernmentQueueRecords<T extends GovernmentQueueRecordSummary>(records: T[], now: Date = new Date()) {
  const priority: Record<GovernmentQueueStatus, number> = {
    ready: 0,
    soon: 1,
    waiting: 2,
    completed: 3,
    cancelled: 4
  };

  return [...records].sort((a, b) => {
    const statusDiff = priority[getGovernmentQueueStatus(a, now)] - priority[getGovernmentQueueStatus(b, now)];
    if (statusDiff !== 0) return statusDiff;
    return getAppointmentTime(a) - getAppointmentTime(b);
  });
}

export function buildMapsRouteUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

function isQueueReady(record: GovernmentQueueRecordSummary) {
  return (
    typeof record.queueNumber === "number" &&
    typeof record.currentQueueNumber === "number" &&
    record.currentQueueNumber >= record.queueNumber
  );
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAppointmentTime(record: GovernmentQueueRecordSummary) {
  return parseDate(record.appointmentAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function isToday(date: Date, now: Date) {
  return getLocalDateKey(date) === getLocalDateKey(now);
}

function isTomorrow(date: Date, now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateKey(date) === getLocalDateKey(tomorrow);
}

function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

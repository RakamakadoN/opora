import type {
  FamilyCalendarEvent,
  FamilyCalendarOccurrence,
  FamilyEventType,
  FamilyNotificationPreference,
  FamilyRecurrenceRule
} from "./familyCalendar";

const readApiJson = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error || "family_calendar_api_failed");
  return data;
};

export async function fetchFamilyCalendar(from: string, to: string): Promise<{ familyId: string; items: FamilyCalendarOccurrence[] }> {
  const response = await fetch(`/api/family-calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return readApiJson(response);
}

export async function createFamilyCalendarEvent(event: {
  title: string;
  startsAt: string;
  endsAt?: string;
  childIds?: string[];
  eventType?: FamilyEventType;
  description?: string;
  notifyMinutesBefore?: number;
  recurrenceRule?: Omit<FamilyRecurrenceRule, "eventId">;
}) {
  const response = await fetch("/api/family-calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  return readApiJson(response);
}

export async function updateFamilyCalendarEvent(id: string, event: Partial<FamilyCalendarEvent>) {
  const response = await fetch(`/api/family-calendar/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  return readApiJson(response);
}

export async function deleteFamilyCalendarEvent(id: string) {
  const response = await fetch(`/api/family-calendar/events/${encodeURIComponent(id)}`, { method: "DELETE" });
  return readApiJson(response);
}

export async function completeFamilyCalendarEvent(eventId: string, occurrenceDate: string) {
  const response = await fetch(`/api/family-calendar/events/${encodeURIComponent(eventId)}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ occurrenceDate })
  });
  return readApiJson(response);
}

export async function fetchFamilyNotificationPreferences(): Promise<{ items: FamilyNotificationPreference[] }> {
  const response = await fetch("/api/family-calendar/notification-preferences");
  return readApiJson(response);
}

export async function saveFamilyNotificationPreferences(items: FamilyNotificationPreference[]) {
  const response = await fetch("/api/family-calendar/notification-preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });
  return readApiJson(response);
}

# Bureaucratic Helper Disability Design

## Goal

Add a first version of the "Бюрократический помощник" workflow to Opora so a parent can track the paperwork route for оформление инвалидности ребенка in Kazakhstan.

The module should help the parent:

- see a dynamic document checklist for the current route;
- mark certificates and forms as collected;
- attach a photo or scan preview to a document item;
- set deadlines for submission, commission dates, and re-certification;
- see the current process stage from medical preparation to the final decision and follow-up support;
- validate document form input before saving;
- generate a smartphone-calendar reminder file for an important deadline.

The feature helps organize preparation. It does not submit documents to government systems and does not replace official requirements from the clinic, ВКК, МСЭ, eGov, public service center, or social protection authority.

## Product Scope

The first version lives inside the existing parent `NavigatorTab`, not as a new bottom-nav tab. The navigator already contains diagnostic status, ПМПК document prompts, and Kazakhstan disability-rights guidance, so the bureaucracy workflow should feel like a continuation of the current parent route.

The main navigator gets a compact "Бюрократический помощник" card showing:

- current stage;
- document completion percentage;
- nearest deadline;
- a button to open the full helper screen.

The full helper screen is a local sub-screen inside `NavigatorTab`. It uses a back button to return to the main navigator and keeps the bottom navigation unchanged.

## Process Stages

The first version uses a fixed Kazakhstan-oriented stage model:

- `medical_preparation`: medical conclusions, extracts, specialist visits, and diagnosis confirmation;
- `vkk_referral`: clinic or ВКК preparation of the МСЭ referral and required medical forms;
- `mse_review`: МСЭ appointment, expert review, or remote/proactive review when applicable;
- `decision_received`: disability status decision, certificate, and individual habilitation and rehabilitation program;
- `benefits_services`: пособия, social services, rehabilitation aids, ПМПК/КППК and education-route follow-up;
- `renewal`: re-certification or renewal before the disability term expires.

The screen visualizes these stages as a vertical progress path, which fits the app's narrow mobile frame better than a dense horizontal tracker. The current stage is derived from saved document completion and user-selected status, but the parent can override it manually.

## Document Checklist

The checklist is generated from a local document library in `src/lib/disabilityBureaucracy.ts`.

Each document definition includes:

- `id`;
- `title`;
- `description`;
- `stage`;
- `required`;
- `source`;
- `needsIssueDate`;
- `needsExpiryDate`;
- `acceptsAttachment`;
- `warning`, when the parent should verify official requirements.

Initial checklist groups:

- identity and family documents: parent ID, birth certificate, child IIN;
- medical base: ambulatory extract, pediatrician or profile-doctor conclusion, specialist conclusions, test results;
- МСЭ route: referral/form prepared by the medical organization, МСЭ appointment confirmation, written refusal or missing-document note if any;
- after decision: disability certificate, individual habilitation and rehabilitation program, benefit or social-service application notes;
- renewal: certificate expiry date, updated medical conclusions, renewal appointment.

Important wording: the UI should say that some documents can be obtained by МСЭ electronically through government information systems. The checklist is for family preparation and verification, not a promise that every item is physically submitted.

## Saved State

The first version stores state locally per child profile in `localStorage`.

Stored state shape:

- checked document ids;
- document records keyed by document id;
- attachment metadata and browser preview URL or base64 data for uploaded images/scans;
- selected current stage;
- user-created deadlines;
- calendar reminder export history.

This keeps the first release independent from database migrations and authentication changes. If a later release needs doctor sharing or cloud sync, the state can move into `ProfileContext` or the existing backend schema.

## Document Form Validation

`src/lib/disabilityBureaucracy.ts` exposes a pure validation function for document form values.

Validation rules:

- document title is required;
- source or issuing organization is required for manually added records;
- issue date must be a valid date when the document definition requires it;
- expiry date must be a valid date when the document definition requires it;
- expiry date cannot be earlier than issue date;
- a document marked as collected must have either an attachment or a note explaining where the original is stored;
- file attachments must be image or PDF-like file types and stay below a conservative size limit for local browser storage.

The UI shows validation errors inline near the affected input and prevents saving invalid records.

## Deadlines And Calendar Reminders

Parents can create deadlines for:

- finish collecting documents;
- attend МСЭ appointment;
- submit missing documents;
- apply for пособия or social services after the decision;
- renew or re-certify before the disability term expires.

The helper computes:

- nearest upcoming deadline;
- overdue deadlines;
- suggested reminder offsets, such as 30 days, 14 days, 7 days, and 1 day before renewal.

The calendar function creates an `.ics` file through a pure helper such as `buildCalendarReminderIcs(deadline)`. The UI downloads the file so the parent can open it on a smartphone calendar. This is more realistic for a web app than silently writing into a phone calendar.

Calendar event content includes:

- event title;
- deadline date and optional time;
- child name;
- checklist summary;
- safe note saying the parent should verify official requirements before submission.

## UI Behavior

The full helper screen contains:

- header with child name, current stage, and completion percentage;
- stage path;
- nearest-deadline panel;
- document checklist grouped by stage;
- document drawer or inline expandable form for status, dates, notes, and attachment;
- deadline creation form;
- calendar export button for each deadline.

The screen should use the existing Opora style: restrained cards, small icons from `lucide-react`, readable mobile spacing, and no marketing-style hero section.

## Error Handling

If `localStorage` data is malformed, the helper falls back to an empty state for the current child and keeps the screen usable.

If a file attachment is too large or an unsupported type, the UI rejects it with a clear message and keeps the previous document state.

If calendar export fails, the UI shows the event details as text so the parent can create the reminder manually.

## Testing

Add focused tests for the pure helper logic:

- checklist generation includes МСЭ, medical, decision, benefits, and renewal groups;
- progress calculation counts required and optional documents correctly;
- validation rejects missing required fields and expiry dates before issue dates;
- nearest-deadline logic identifies upcoming and overdue deadlines;
- calendar reminder generation produces a valid `.ics` payload with escaped Russian text.

Run `npm run lint` after implementation.

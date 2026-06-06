# Medical Case Manager Design

## Goal

Turn the existing Opora assistant into an active medical navigator and case manager for families who have a concrete "Point B": find a narrow specialist, slow or stop disease progression where medically possible, prepare a foreign clinic review, or organize funding and rehabilitation.

The first user story is:

> My goal is to find a doctor who can stop my daughter's disease progression.

The assistant should not answer with general advice. It should produce a route with documents, translation steps, funding targets, clinic/fund letters, direct links, contacts, and deadlines.

## Product Shape

Build this as three connected releases, not three separate products.

1. AI behavior upgrade: make `/api/chat` understand the "medical navigator / Point B" mode and answer in a stricter case-management format.
2. Critical route: add a structured route generator for specialist search, document dossier, medical translation, funding, and foreign clinic outreach.
3. Full case manager: connect the route to the directory, rehabilitation centers, special equipment suppliers, saved tasks, contacts, and reusable letter templates.

This keeps the app immediately useful while preserving a path to a richer workflow.

## Existing Fit

The implementation should reuse current surfaces:

- `src/components/AIAssistantTab.tsx` for quick-start actions and chat entry.
- `server.ts` `/api/chat` for the medical navigator system instruction and local fallback behavior.
- `src/components/DirectoryTab.tsx` and generated directory data for doctors, centers, institutions, and equipment suppliers.
- `src/lib/institutionGuide.ts` patterns for checklist-like route data.
- `ProfileContext` for child age, diagnostic status, city, saved tasks, and future route state.

Do not create a disconnected second assistant. The user should feel the same Opora companion became more capable and practical.

## Release 1: AI Navigator Mode

Add a visible quick-start section in the assistant:

- "Найти врача, который остановит прогрессию"
- "Собрать досье для зарубежной клиники"
- "Найти фонд для диагностики/лечения"
- "Подготовить письмо в клинику или фонд"

Each action inserts a structured prompt with placeholders for diagnosis, city, current doctors, available documents, target country, urgency, and budget constraints.

Update the system instruction so that when the user states a medical goal, the assistant replies with:

- Critical next action for the next 24-48 hours.
- Document checklist.
- What the treating doctor must prepare now.
- Specialist search criteria.
- Funding/foundation route.
- Translation step.
- Draft letters.
- Timeline with deadlines.
- Safety note that Opora does not diagnose, prescribe, or guarantee treatment.

Responses should stay practical and copy-ready.

## Release 2: Critical Route Generator

Create a small typed route module, for example `src/lib/medicalCaseManager.ts`, with:

- `MedicalCaseGoal`
- `MedicalDocumentRequirement`
- `MedicalFoundationResource`
- `ClinicOutreachTemplate`
- `MedicalRouteStep`
- `buildMedicalCaseRoute(profile, userGoal)`

Initial route sections:

1. Stabilize the request: define diagnosis, progression, current symptoms, red flags, treating physician, and country target.
2. Collect documents: discharge summaries, current diagnosis, treatment history, lab/imaging results, genetic tests if relevant, rehabilitation reports, medication list, vaccination/allergy data, growth/development history, passport/ID documents, consent for data sharing.
3. Ask treating doctor to prepare all current conclusions and extracts: an updated discharge summary, specialist conclusions, current treatment plan, objective dynamics, limitations, and why second opinion or foreign review is needed.
4. Translate documents: Russian/Kazakh to English, German, Hebrew, or another target language; keep medical terminology, dates, drug dosages, units, and diagnoses exact.
5. Find specialists: local narrow specialist first, then second opinion in target country if needed.
6. Apply for funding: match by diagnosis and need type.
7. Contact clinics and funds: generate letter drafts and attachment lists.
8. Plan logistics: appointment windows, travel documents, accommodation, rehab/equipment follow-up.

The route should be deterministic enough for tests and should not depend on live AI output.

## Release 3: Full Case Manager

Add a route panel or card group inside the assistant after a user asks for a medical route.

Expected user-facing tools:

- Checklist cards with "download/copy template" actions.
- Saved letter drafts for clinic and foundation outreach.
- Foundation cards with direct links, fit notes, and required attachments.
- Directory links for relevant doctors, rehab centers, institutions, and equipment suppliers.
- Task timeline: today, 48 hours, 7 days, 14 days, 30 days.
- Status chips: not started, requested, translated, sent, answered.

This can initially persist in local profile state. A later pass can move case routes to Postgres alongside profile state if multi-device continuity becomes important.

## Starter Resource Data

Add a curated seed list with `lastVerified` dates and "needs review" status when the fit is uncertain. The first Kazakhstan-oriented resources should include:

- Next Generation Foundation, autism-focused support: `https://nextfund.kz/ru`
- BI-Жулдызай / BI-Juldizai, children with special needs and rehabilitation-oriented support: `https://juldizai.kz/`
- Botashym, children with CP/neurological conditions, rehabilitation, diagnostics, treatment, travel support: `https://www.botashym.com/`
- AYALA, child healthcare and education charity projects: `https://ayala.kz/ru/about/`

These are starting points, not automatic eligibility promises. The UI and AI replies must say that the family needs to verify current intake rules, diagnosis coverage, document requirements, and funding availability before applying.

## Letter Templates

Create reusable templates in code or a data module:

- Foreign clinic second-opinion request.
- Foundation funding request.
- Treating physician document request.
- Rehabilitation center intake request.
- Equipment supplier quote request.

Each template should include:

- Recipient.
- Subject.
- Family and child summary.
- Diagnosis and current concern.
- What is being requested.
- Attachments.
- Contact details.
- Consent/data privacy line.

Templates should be copy-ready in Russian and English first. German and Hebrew can be added after the translation workflow has a stable UI.

## Translation Workflow

The product should not pretend to perform certified translation unless a certified translation provider is integrated.

Use this wording:

- "Технический медицинский перевод для первичного рассмотрения клиникой."
- "Для визы, суда, страховой или официальной госпитализации может потребоваться сертифицированный перевод."

The assistant should preserve:

- Diagnosis names and codes.
- Medication names, dosages, frequency, route.
- Lab units and reference ranges.
- Dates.
- Doctor names and institutions.
- Imaging and genetic test terminology.

## Safety And Ethics

The navigator must never promise to stop progression or choose treatment independently.

Required language:

- "Цель маршрута - найти специалиста и собрать данные для медицинского решения."
- "Назначения, отмена препаратов, госпитализация и срочные решения только через врача."
- "Если есть угроза жизни, судороги, дыхательные нарушения, резкое ухудшение, обезвоживание, потеря сознания или тяжелая боль - обращаться в экстренную службу."

Avoid creating false hope. The assistant can say "найти врача, который оценит, можно ли замедлить или остановить прогрессию", not "врач остановит прогрессию".

## Data Flow

1. User taps a medical navigator quick action or writes a goal.
2. The assistant detects the goal type and returns a structured route.
3. The route builder produces deterministic checklists and templates.
4. Directory filters surface matching doctors, centers, funds, institutions, and equipment suppliers.
5. The user copies letters, tracks document readiness, and follows deadlines.

AI should enrich wording and adapt the route to the family context, while deterministic code owns the core checklist and resource matching.

## Testing

Add focused tests for:

- Medical document checklist includes treating physician extracts and current conclusions.
- Foundation route includes direct links and clear eligibility caveats.
- Clinic and foundation letter templates include subject, request, attachments, and contact placeholders.
- Chat fallback returns a case-management route for progression/foreign treatment/funding prompts.
- UI quick actions insert the intended structured prompts.

Run:

- `npm run lint`
- `npm run build`

## Acceptance Criteria

- A parent can tap "Найти врача, который остановит прогрессию" and receive a concrete route, not general reassurance.
- The route tells the parent exactly what to request from the treating doctor.
- The route includes translation instructions and at least two copy-ready letter drafts.
- The route includes Kazakhstan foundation links with fit notes and caveats.
- The route connects to existing directory/institution patterns instead of duplicating the whole app.
- The safety note is present but does not drown out the practical steps.

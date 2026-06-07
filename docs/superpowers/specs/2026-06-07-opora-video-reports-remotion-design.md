# Opora Video Reports With Remotion Design

## Product Vision

The "Видео-отчеты Опоры" module turns parent-entered data into short, structured, privacy-aware videos for a specific recipient: doctor, specialist, caregiver, family member, foundation, or diagnostic center.

The module is not a creative video editor and not a medical interpretation engine. It is a controlled reporting layer over existing Opora data.

The product promise:

> Опора помогает родителю быстро собрать безопасный видео-отчет из наблюдений, чтобы разговор со специалистом или помощником был конкретным, спокойным и основанным на фактах.

The video must not diagnose, prescribe treatment, recommend medical actions, or infer cause. It can only present facts recorded in the app.

Allowed wording:

- "После приема еды была зафиксирована реакция."
- "После приема препарата была зафиксирована реакция."
- "За период родитель отметил 6 эпизодов нарушения сна."
- "Упражнение было отмечено как выполненное 12 раз за период."

Disallowed wording:

- "Еда вызвала реакцию."
- "Препарат стал причиной реакции."
- "Это признак диагноза."
- "Нужно изменить лечение."
- "Упражнение помогло вылечить/улучшить состояние."

## Why Remotion Fits Opora

Remotion is useful for Opora because the videos should be generated programmatically from structured data, not edited manually.

The main benefits:

- One controlled template system for sensitive family and child data.
- Deterministic scene generation from database records.
- Reusable React components for charts, timelines, cards, disclaimers, and recipient-specific layouts.
- Server-side rendering of MP4 files and preview stills.
- Strict parameter validation before rendering.
- Consistent safety language across all generated videos.
- Ability to log exactly which data fields were included in each generated report.
- Easy versioning of templates for compliance and product review.

Remotion should be treated as a reporting renderer, similar to PDF generation, but optimized for quick human review.

## Core Use Cases

1. A parent prepares for a consultation and generates a short video with recent observations and questions.
2. A doctor or specialist watches a concise timeline instead of reading a long diary.
3. A caregiver receives a safe daily-care card with communication notes, routines, and calming strategies.
4. A family member sees progress without accessing sensitive medical records.
5. A foundation receives a clear route-of-help summary with only explicitly approved data.
6. A parent keeps a monthly progress diary for themselves and future consultations.
7. A diagnostic center receives a factual pre-visit summary of observations and previous steps.

## Video Types

### 1. Видео-отчет для врача

Goal: help a doctor quickly understand the parent's recorded observations for a selected period.

Audience: doctor, narrow specialist, therapist, psychologist, rehabilitation specialist.

Data used:

- Child profile fields explicitly allowed by the parent.
- Observations by date and category.
- Sleep logs.
- Food logs.
- Reaction logs.
- Medication intake events only if the parent explicitly allows them.
- Exercise completion records.
- Parent questions.
- Selected attachments or documents, if manually included.

Scene structure:

1. Title: child, period, report type, disclaimer.
2. Summary: number of observations, active categories, selected period.
3. Timeline: key events by date.
4. Charts: frequency of selected observation categories.
5. Sleep/food/reaction facts, if selected.
6. Exercise completion facts, if selected.
7. Parent questions for the doctor.
8. Closing disclaimer and data-source note.

Duration: 90-150 seconds.

Data that must not be shown by default:

- Diagnosis details.
- Full medical documents.
- Medication names and dosages.
- Address, ID, insurance, payment data.
- Photos/videos of the child.
- Specialist names and contacts.

Required warnings:

- "Видео содержит только данные, внесенные родителем."
- "Видео не является медицинским заключением."
- "Опора не ставит диагнозы, не назначает лечение и не делает медицинских выводов."

MVP:

- 7/14/30-day period selector.
- Observation timeline.
- Category frequency chart.
- Parent questions.
- Manual section selection.
- Text preview before render.

Version 1.1:

- Compare current period with previous period.
- Include selected short media attachments.
- Include selected documents as closing slide thumbnails.
- Recipient-specific watermark.

### 2. Видео-карточка ребенка

Goal: provide a safe, practical introduction to the child for people who help with daily care.

Audience: caregiver, nanny, kindergarten teacher, tutor, relative, new specialist.

Data used:

- Name or nickname.
- Age.
- Preferred communication style.
- Daily routine.
- Food and sensory preferences.
- What usually helps during discomfort.
- Emergency contacts selected by the parent.
- Things to avoid in daily interaction, written as parent observations.

Scene structure:

1. Title: "Карточка ребенка".
2. Short introduction.
3. Communication preferences.
4. Routine and transitions.
5. Food/sensory notes.
6. What usually helps.
7. Contacts and access note.

Duration: 60-90 seconds.

Data that must not be shown by default:

- Diagnosis.
- Medication and treatment details.
- Medical documents.
- Financial or legal data.
- Sensitive behavioral notes not needed for care.

Required warnings:

- "Карточка описывает бытовые наблюдения и предпочтения."
- "Это не медицинская инструкция."

MVP:

- Basic profile.
- Communication notes.
- Routine.
- What helps.
- Parent-selected contacts.

Version 1.1:

- Separate versions for kindergarten, nanny, relatives, and short-term caregiver.
- Printable companion card.
- Multilingual output.

### 3. Видео перед консультацией

Goal: focus the upcoming consultation around facts, recent changes, and prepared questions.

Audience: doctor, specialist, psychologist, therapist, rehabilitation provider.

Data used:

- Consultation goal.
- Recent observations.
- Changes marked by the parent.
- Exercises or recommendations completed.
- Questions.
- Selected files.

Scene structure:

1. Consultation title: specialist type, date, child, period.
2. Goal of the visit in the parent's words.
3. Recent changes.
4. Frequent observations.
5. What the family has been tracking or doing.
6. Questions for the specialist.
7. Disclaimer.

Duration: 60-120 seconds.

Data that must not be shown by default:

- Cause-effect statements.
- Unverified diagnosis claims.
- Medication details.
- Raw private notes.
- Documents not manually selected.

Required warnings:

- "Формулировки отражают наблюдения родителя."
- "Решения по диагностике, лечению и назначениям принимает специалист."

MVP:

- Pre-consultation checklist.
- 3-5 parent questions.
- Auto-filled recent observations.
- Private link export.

Version 1.1:

- Auto-generation from calendar appointment.
- Specialist-specific templates.
- Attachments grouped by relevance.

### 4. Видео-дневник прогресса

Goal: help the parent and family see recorded progress over time without medical interpretation.

Audience: parent, family, specialist if the parent chooses to share.

Data used:

- Goals.
- Exercise completion.
- Skills or milestones tracked by the parent.
- Notes.
- Selected photos or short clips.
- Period summaries.

Scene structure:

1. Month/period title.
2. Selected goals.
3. What was practiced.
4. Completion chart.
5. Parent-noted moments of progress.
6. Open questions or next things to discuss with a specialist.

Duration: 60-180 seconds.

Data that must not be shown by default:

- Diagnosis comparison.
- "Normal/deviant" labels.
- Claims of treatment effectiveness.
- Sensitive incidents unless explicitly selected.

Required warnings:

- "Видео не оценивает развитие, а показывает зафиксированные события."
- "Динамика не является медицинским заключением."

MVP:

- Monthly progress template.
- Up to 3 goals.
- Exercise completion chart.
- Parent-selected notes.

Version 1.1:

- Media highlights.
- Family-safe version.
- Comparison by selected goals.

### 5. Видео для воспитателя/няни

Goal: help a caregiver support the child consistently during daily routines.

Audience: nanny, kindergarten teacher, tutor, assistant, temporary caregiver.

Data used:

- Routine.
- Communication preferences.
- Sensory and food notes.
- Situations that may be difficult.
- What usually helps.
- Emergency contacts.

Scene structure:

1. Short child card.
2. Daily routine.
3. Communication.
4. Food/sensory notes.
5. Difficult situations and parent-observed support methods.
6. Contacts.

Duration: 45-90 seconds.

Data that must not be shown by default:

- Diagnosis.
- Medical history.
- Medication details.
- Private documents.
- Family financial/legal information.

Required warnings:

- "Это бытовая памятка, не медицинская инструкция."
- "При ухудшении состояния свяжитесь с родителем или экстренной службой согласно правилам учреждения."

MVP:

- Short caregiver template.
- Routine.
- Communication notes.
- What helps.
- Contacts.

Version 1.1:

- Situation-specific versions: kindergarten, trip, therapy, babysitting.
- QR access with expiration.
- Printable summary.

### 6. Видео для категории "Диагностика"

Goal: organize factual observations and previous steps before diagnostic consultation or center intake.

Audience: diagnostic center, doctor, psychologist, speech therapist, parent.

Data used:

- Reason for diagnostic request in parent's words.
- Observations by category.
- Frequency and dates.
- Previous consultations.
- Completed questionnaires, if present.
- Selected documents.
- Parent questions.

Scene structure:

1. Diagnostic summary title.
2. Reason for request.
3. Observation categories.
4. Timeline of recorded facts.
5. Previous consultations and documents.
6. Questions for diagnostic appointment.
7. Disclaimer.

Duration: 120-180 seconds.

Data that must not be shown by default:

- App-generated diagnostic conclusions.
- Test interpretations.
- Claims that a diagnosis is confirmed.
- Documents not selected by the parent.

Required warnings:

- "Материал подготовлен для обсуждения со специалистом."
- "Опора не проводит диагностику и не интерпретирует результаты тестов."

MVP:

- Observation category summary.
- Timeline of prior appointments.
- Parent questions.

Version 1.1:

- Templates by institution type.
- Document appendix.
- Questionnaire result summary without interpretation.

### 7. Видео "маршрут помощи"

Goal: summarize the family's path, current support steps, and concrete request for help.

Audience: parent, foundation, coordinator, clinic, social worker, trusted family member.

Data used:

- Consultations.
- Recommendations recorded from specialists.
- Completed actions.
- Current goals.
- Current needs.
- Expenses only if explicitly selected.
- Documents only if explicitly selected.

Scene structure:

1. Route title and purpose.
2. Starting point in parent's words.
3. What has already been done.
4. Current specialists and activities, if selected.
5. Current needs or request.
6. Next planned steps.
7. Disclaimer and privacy note.

Duration: 90-150 seconds.

Data that must not be shown by default:

- Financial data.
- Full diagnosis and documents.
- Home address.
- IDs.
- Medical records.
- Contacts of specialists without consent.

Required warnings:

- "Видео описывает маршрут семьи на основе внесенных данных."
- "Данные показываются только после выбора родителем."

MVP:

- Timeline.
- Current needs.
- Selected next steps.
- Version for foundation without private diary notes.

Version 1.1:

- Document package.
- Status of applications.
- Updating shared link without regenerating from scratch.

## MVP Boundaries

MVP includes:

- Three templates:
  - doctor report;
  - pre-consultation video;
  - caregiver/nanny video.
- MP4 generation.
- Private share link.
- 7/14/30-day period selector.
- Manual section selector.
- Text preview before video render.
- Parent approval before generation.
- Safety wording filter for forbidden cause-effect and medical recommendation phrases.
- Report generation log.
- Template version stored with each generated video.
- Basic expiration for private links.

MVP does not include:

- Complex video editor.
- AI medical analysis.
- Automatic recommendations.
- Cause inference.
- Treatment suggestions.
- Automatic sending to doctors.
- Public gallery.
- Voiceover.
- Deep video customization.
- Auto-diagnosis or diagnostic scoring.

## UX Flow

1. Parent opens "Видео-отчеты".
2. Parent chooses video type.
3. Parent chooses recipient.
4. Parent selects period.
5. App proposes sections based on available data.
6. Parent turns sections on/off.
7. App shows a text preview of every scene.
8. Parent edits only allowed text fields, such as title, goal, and questions.
9. Safety validator highlights forbidden wording.
10. Parent confirms data and privacy scope.
11. App renders a preview still or low-resolution preview.
12. Parent taps "Сгенерировать видео".
13. App renders MP4 through Remotion.
14. Parent receives a private link and optional download.
15. Parent can revoke link access.

Important UX constraint: the parent must see and approve the factual text before rendering.

## Database Data Sources

The video module should read from structured app data, not scrape UI text.

Recommended entities:

- `children`: child name, nickname, age, avatar, profile visibility settings.
- `observations`: date, category, description, intensity, duration, source.
- `reactions`: date, time, preceding event type, description, intensity, notes.
- `food_entries`: time, meal, selected food items.
- `medication_events`: time and factual intake status, only if explicitly included.
- `sleep_logs`: sleep start/end, wake-ups, notes.
- `exercises`: recommendation title, source specialist, completion status, parent notes.
- `goals`: goal title, category, status, dates.
- `appointments`: date, specialist type, purpose, questions.
- `documents`: metadata only by default; full documents only if selected.
- `video_reports`: report type, child id, creator id, recipient type, template version, render status, storage URL, expiration, revoked status.
- `video_report_sources`: exact record IDs included in each render.
- `video_report_access_logs`: link views, timestamps, recipient marker where available.

Sensitive fields should require explicit inclusion:

- diagnosis;
- medication names;
- medication dosages;
- documents;
- photos/videos;
- specialist names;
- financial data;
- contact data beyond parent-approved contact fields.

## Remotion Template Requirements

Template system:

- Each video type should map to one Remotion composition.
- Each composition receives validated props.
- Props should be generated by backend report builders, not directly by frontend state.
- Zod schemas should validate report props before render.
- Each scene should be a reusable component: title, disclaimer, timeline, chart, question list, contact card.

Initial compositions:

- `DoctorReportComposition`
- `PreConsultationComposition`
- `CaregiverCardComposition`

Later compositions:

- `ProgressDiaryComposition`
- `DiagnosticsTimelineComposition`
- `HelpRouteComposition`
- `ChildCardComposition`

Common components:

- `ReportTitleScene`
- `DisclaimerScene`
- `ObservationTimelineScene`
- `FrequencyChartScene`
- `ReactionFactsScene`
- `ExerciseCompletionScene`
- `QuestionsScene`
- `CareRoutineScene`
- `ContactScene`
- `DataSourcesScene`

Format support:

- MVP: 16:9, 1080p.
- Version 1.1: 9:16 for mobile sharing.
- Version 2.0: export package with MP4 + PDF + source table.

## Safety Restrictions

The module must never:

- diagnose;
- prescribe;
- suggest medication changes;
- infer medical causes;
- say that food, medication, therapy, exercise, or environment caused a reaction;
- score child development against norms;
- claim treatment effectiveness;
- generate new medical recommendations;
- hide source uncertainty;
- include sensitive records without explicit parent action.

Forbidden phrase patterns should include:

- "причина";
- "вызвало";
- "из-за";
- "помогло вылечить";
- "нужно принимать";
- "нужно отменить";
- "диагноз подтвержден";
- "это означает";
- "следует лечить";

Safer replacements:

- "после ... была зафиксирована реакция";
- "родитель отметил";
- "в период наблюдения";
- "данные внесены родителем";
- "вопрос для обсуждения со специалистом";
- "требует оценки специалиста".

## Privacy Risks

Video has higher privacy risk than text because it is easy to forward, save, screen-record, and share out of context.

Main risks:

- A private video link is forwarded to an unintended recipient.
- MP4 is downloaded and stored outside Opora.
- Diagnosis or medical documents are included accidentally.
- A caregiver version exposes more than the caregiver needs.
- A foundation version exposes financial or identity data.
- Photos/videos of the child are included without clear consent.
- The recipient treats factual report text as medical conclusion.

Mitigations:

- Expiring links.
- Link revocation.
- Recipient-specific watermark.
- View access logs.
- High-sensitivity toggle for reports with diagnosis, medications, documents, or media.
- Separate consent step before including child media.
- Default exclusion of medical documents.
- Data-minimization presets by recipient.
- Clear disclaimer in video and share page.

## Roadmap

### MVP

- Three templates: doctor report, pre-consultation, caregiver/nanny.
- Backend report builder.
- Remotion render service.
- MP4 export.
- Private links with expiration and revocation.
- Text preview before render.
- Safety phrase validator.
- Generation and source logs.

### Version 1.1

- All seven video types.
- 9:16 format.
- Recipient-specific versions.
- Period comparison.
- Selected photo/video attachments.
- Document appendix scene.
- Multilingual templates.
- Improved access logs.
- QR access for caregiver cards.

### Version 2.0

- Video + PDF + source data package.
- Team sharing with parent consent.
- Specialist workspace view.
- Foundation/clinic white-label templates.
- Updating live report links.
- Partner integrations.
- Render queue monitoring and retry dashboard.

## Paid Feature Strategy

The paid value is not "beautiful videos." The paid value is saving parent time, reducing stress before important conversations, and creating safe, recipient-specific summaries.

Possible packaging:

- Free:
  - 1-2 videos per month;
  - basic doctor report;
  - short expiration links.
- Plus:
  - more monthly renders;
  - all MVP templates;
  - longer link expiration;
  - report history.
- Family:
  - child card and caregiver versions;
  - family-safe progress diary;
  - multiple recipients.
- Pro:
  - video + PDF + source table;
  - diagnostics and route-of-help templates;
  - watermarking and access logs.
- B2B:
  - specialist/clinic/foundation workspace;
  - template branding;
  - structured intake package;
  - admin controls.

Do not monetize safety basics. Preview, consent, data exclusion, disclaimers, and revocation should remain available wherever video sharing exists.

## Technical Architecture

Recommended backend flow:

1. Frontend sends report request: child, report type, period, recipient, selected sections.
2. Backend verifies ownership and permissions.
3. Backend fetches structured records.
4. Backend applies recipient privacy preset.
5. Backend builds report props.
6. Backend runs safety validation.
7. Backend returns text preview.
8. Parent confirms.
9. Backend creates `video_reports` row with `queued` status.
10. Render worker calls Remotion with validated props.
11. Output is stored in private object storage.
12. Backend creates private share link.
13. Access events are logged.

Core modules:

- `videoReportTypes.ts`: enums and shared types.
- `videoReportBuilder.ts`: maps app records to neutral report props.
- `videoReportSafety.ts`: phrase validator and field policy.
- `videoReportPrivacy.ts`: recipient presets and field exclusion.
- `videoReportRenderer.ts`: Remotion render orchestration.
- `videoReportTemplates/`: Remotion compositions.

## Acceptance Criteria

- Parent can generate a doctor video report for 7, 14, or 30 days.
- Parent can preview every text scene before rendering.
- The generated video contains required disclaimer language.
- The video does not contain medical recommendations.
- Reaction wording is factual and does not infer cause.
- Sensitive fields are excluded by default.
- The system stores which source records were included.
- Parent can revoke a generated share link.
- Caregiver video excludes diagnosis and medication data by default.
- Pre-consultation video includes parent questions and recent observations.

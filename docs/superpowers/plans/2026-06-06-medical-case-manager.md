# Medical Case Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three-stage Opora medical navigator: AI behavior upgrade, deterministic critical route, and a first case-manager UI surface.

**Architecture:** Add a focused `medicalCaseManager` library that owns route data, foundation resources, document requirements, and letter templates. Reuse the existing assistant tab for entry and display, then wire `/api/chat` fallback and system instruction to the same route language so cloud and local answers behave consistently.

**Tech Stack:** React 19, TypeScript, Node test runner, Express, existing Tailwind classes, lucide-react icons.

---

## File Structure

- Create `src/lib/medicalCaseManager.ts`: typed route builder, seed resources, templates, helper matchers.
- Create `tests/medicalCaseManager.test.ts`: deterministic tests for documents, funds, templates, and timeline.
- Modify `server.ts`: import route helpers, update `/api/chat` system instruction, add fallback response for medical navigation prompts.
- Modify `src/components/AIAssistantTab.tsx`: add medical navigator quick actions and render a compact route tool card.
- Optional if needed: Modify `src/index.css` only for small visual overflow fixes caused by the new cards.

## Task 1: Deterministic Route Library

**Files:**
- Create: `src/lib/medicalCaseManager.ts`
- Test: `tests/medicalCaseManager.test.ts`

- [ ] **Step 1: Write failing tests for route content**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMedicalCaseRoute,
  getMedicalFoundationResources,
  getMedicalLetterTemplates
} from "../src/lib/medicalCaseManager";

test("medical route includes treating physician documents and current extracts", () => {
  const route = buildMedicalCaseRoute({
    childName: "Алия",
    childAge: 7,
    userCity: "Алматы",
    diagnosticStatus: "Диагноз подтвержден"
  }, "найти врача который остановит прогрессию");

  const documentText = route.documents.map(item => `${item.title} ${item.description}`).join("\n");
  assert.match(documentText, /лечащ(ий|его) врач/i);
  assert.match(documentText, /текущие заключения/i);
  assert.match(documentText, /выписк/i);
  assert.equal(route.steps.some(step => /24-48/.test(step.deadline)), true);
});

test("foundation resources expose direct links with eligibility caveats", () => {
  const resources = getMedicalFoundationResources();

  assert.equal(resources.length >= 4, true);
  assert.equal(resources.every(item => item.url.startsWith("https://")), true);
  assert.equal(resources.some(item => /nextfund\.kz/i.test(item.url)), true);
  assert.equal(resources.some(item => /juldizai\.kz/i.test(item.url)), true);
  assert.equal(resources.every(item => /уточн|провер|не гарант/i.test(item.caveat)), true);
});

test("clinic and foundation templates include required copy-ready sections", () => {
  const templates = getMedicalLetterTemplates({
    childName: "Алия",
    childAge: 7,
    city: "Алматы"
  });

  const clinic = templates.find(item => item.id === "foreign_clinic_second_opinion");
  const foundation = templates.find(item => item.id === "foundation_funding_request");

  assert.ok(clinic);
  assert.ok(foundation);
  assert.match(clinic.bodyRu, /Тема:/);
  assert.match(clinic.bodyRu, /Приложения:/);
  assert.match(clinic.bodyEn, /Subject:/);
  assert.match(foundation.bodyRu, /финансирован/i);
  assert.match(foundation.bodyRu, /контакт/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/medicalCaseManager.test.ts`

Expected: FAIL with module not found for `src/lib/medicalCaseManager.ts`.

- [ ] **Step 3: Implement route library**

Create `src/lib/medicalCaseManager.ts` with exported types and functions:

```ts
export type MedicalCaseProfile = {
  childName?: string;
  childAge?: number;
  userCity?: string;
  diagnosticStatus?: string;
};

export type MedicalDocumentRequirement = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  owner: "parent" | "treating_doctor" | "clinic" | "translator";
};

export type MedicalFoundationResource = {
  id: string;
  name: string;
  url: string;
  fit: string;
  caveat: string;
  lastVerified: string;
};

export type MedicalLetterTemplate = {
  id: string;
  title: string;
  bodyRu: string;
  bodyEn: string;
};

export type MedicalRouteStep = {
  id: string;
  title: string;
  deadline: string;
  action: string;
  output: string;
};

export type MedicalCaseRoute = {
  title: string;
  criticalAction: string;
  documents: MedicalDocumentRequirement[];
  foundations: MedicalFoundationResource[];
  templates: MedicalLetterTemplate[];
  steps: MedicalRouteStep[];
  safetyNote: string;
};
```

Implementation must include:

- `getMedicalFoundationResources()`
- `getMedicalLetterTemplates(profile)`
- `buildMedicalCaseRoute(profile, userGoal)`
- `isMedicalCaseManagerQuery(query)`
- `formatMedicalCaseRouteForChat(route)`

- [ ] **Step 4: Run route tests**

Run: `node --import tsx --test tests/medicalCaseManager.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/medicalCaseManager.ts tests/medicalCaseManager.test.ts
git commit -m "Add medical case manager route library"
```

## Task 2: Chat Fallback And System Instruction

**Files:**
- Modify: `server.ts`
- Test: `tests/medicalCaseManager.test.ts`

- [ ] **Step 1: Add failing fallback test**

Append to `tests/medicalCaseManager.test.ts`:

```ts
test("chat fallback returns case-management route for progression goal", async () => {
  process.env.NODE_ENV = "test";
  const { getFallbackChatResponse } = await import("../server");

  const reply = getFallbackChatResponse("Моя цель найти врача который остановит прогрессию болезни у дочери", {
    childName: "Алия",
    childAge: 7,
    userCity: "Алматы"
  });

  assert.match(reply, /24-48/);
  assert.match(reply, /лечащ(ий|его) врач/i);
  assert.match(reply, /перевод/i);
  assert.match(reply, /фонд/i);
  assert.match(reply, /клиник/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/medicalCaseManager.test.ts`

Expected: FAIL because `getFallbackChatResponse` is not exported and has no medical route branch.

- [ ] **Step 3: Wire the route into server fallback**

Modify `server.ts`:

```ts
import {
  buildMedicalCaseRoute,
  formatMedicalCaseRouteForChat,
  isMedicalCaseManagerQuery
} from "./src/lib/medicalCaseManager";
```

Change:

```ts
function getFallbackChatResponse(userMsg: string, profile: any): string {
```

to:

```ts
export function getFallbackChatResponse(userMsg: string, profile: any): string {
```

Add this branch near the top after emotional distress handling:

```ts
if (isMedicalCaseManagerQuery(userMsg)) {
  return formatMedicalCaseRouteForChat(buildMedicalCaseRoute(profile, userMsg));
}
```

Update `/api/chat` system instruction with a medical navigator section that requires document checklist, treating doctor extracts, translation, funding, clinic letters, timeline, and safety language.

- [ ] **Step 4: Run fallback test**

Run: `node --import tsx --test tests/medicalCaseManager.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server.ts tests/medicalCaseManager.test.ts
git commit -m "Add medical navigator chat fallback"
```

## Task 3: Assistant Quick Actions And Route Card

**Files:**
- Modify: `src/components/AIAssistantTab.tsx`

- [ ] **Step 1: Add medical quick actions data**

Import icons:

```ts
import { Stethoscope, Languages, HandHeart, Hospital } from 'lucide-react';
```

Add `medicalNavigatorActions` with four prompts matching the design:

```ts
const medicalNavigatorActions = [
  {
    label: 'Остановить прогрессию',
    hint: 'врач, досье, фонды',
    icon: Stethoscope,
    prompt: 'Моя цель — найти врача, который оценит, можно ли замедлить или остановить прогрессию болезни у ребенка. Диагноз/подозрение: [укажите]. Город: [город]. Что ухудшается: [симптомы и сроки]. Какие документы есть: [перечислите]. Нужны: узкий специалист, перевод выписок, фонды и письма в клиники.'
  },
  {
    label: 'Досье в клинику',
    hint: 'список и письмо',
    icon: Hospital,
    prompt: 'Помоги собрать медицинское досье для зарубежной клиники. Диагноз: [укажите]. Страна/язык: [Германия/Израиль/США/другое]. Документы на руках: [перечислите]. Подготовь список недостающих документов, требования к переводу и письмо в клинику.'
  },
  {
    label: 'Фонд на лечение',
    hint: 'Казахстан и заявки',
    icon: HandHeart,
    prompt: 'Найди фонды в Казахстане, которые могут помочь оплатить диагностику, лечение, реабилитацию или поездку. Диагноз: [укажите]. Сумма/услуга: [укажите]. Город: [город]. Подготовь черновик обращения и список приложений.'
  },
  {
    label: 'Перевод выписок',
    hint: 'точно для врачей',
    icon: Languages,
    prompt: 'Помоги подготовить технический медицинский перевод выписок для клиники. Язык: [английский/немецкий/иврит]. Текст выписки: [вставьте]. Сохрани диагнозы, дозировки, даты, единицы измерения и названия обследований.'
  }
];
```

- [ ] **Step 2: Render the medical quick actions block**

Add a block above legal actions with title `Медицинский навигатор до Точки Б`. Use the same button pattern as `legalActions`, compact rows, and avoid nested cards.

- [ ] **Step 3: Update welcome and placeholder text**

Welcome text should mention that Opora can help with doctors, documents, translations, funds, and clinic letters. Placeholder should include "медицинском маршруте".

- [ ] **Step 4: Run TypeScript check**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AIAssistantTab.tsx
git commit -m "Add medical navigator assistant actions"
```

## Task 4: Full Verification

**Files:**
- No new files expected unless small CSS fixes are needed.

- [ ] **Step 1: Run focused tests**

Run: `node --import tsx --test tests/medicalCaseManager.test.ts`

Expected: PASS.

- [ ] **Step 2: Run existing related tests**

Run: `node --import tsx --test tests/institutionGuide.test.ts tests/legalLettersWorkflow.test.ts`

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit verification-only fixes if any**

Only if files changed:

```bash
git add <changed-files>
git commit -m "Fix medical case manager verification issues"
```

## Self-Review

Spec coverage:

- AI behavior upgrade: Task 2 and Task 3.
- Critical route generator: Task 1.
- Full case-manager first UI surface: Task 3 via quick actions and route-ready chat output.
- Foundation links and caveats: Task 1.
- Treating doctor document request: Task 1 and Task 2.
- Translation workflow: Task 1, Task 2, Task 3.
- Letter templates: Task 1.
- Safety language: Task 1 and Task 2.

No plan placeholders remain. Template placeholders are intentional user-facing fields.

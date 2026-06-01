# Kazakhstan Disability Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reliable Kazakhstan-specific disability оформление route for parents in the AI assistant and fallback knowledge base.

**Architecture:** Keep the legal route as a small server-side helper used by the local fallback response, while strengthening the model system instruction with the same mandatory topics. Update the in-app knowledge article so parents can read the route without starting a chat.

**Tech Stack:** Express, TypeScript, React content constants, Node built-in test runner with `tsx`.

---

### Task 1: Fallback Legal Route

**Files:**
- Create: `tests/kzDisabilityGuide.test.ts`
- Modify: `server.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getKazakhstanDisabilityRightsGuide } from "../server";

test("Kazakhstan disability guide includes medical, agency, ombudsman, alimony, and support routes", () => {
  const guide = getKazakhstanDisabilityRightsGuide({ childName: "Алия", userCity: "Алматы" });

  assert.match(guide, /Шаг 1: Медицинское заключение/);
  assert.match(guide, /узких специалистов/);
  assert.match(guide, /МСЭ/);
  assert.match(guide, /20 региональных уполномоченных по правам ребенка/);
  assert.match(guide, /детскому омбудсмену/);
  assert.match(guide, /надбавк[а-я]+ к алиментам|дополнительных расходах/);
  assert.match(guide, /содержание родителя/);
  assert.match(guide, /Birge/);
  assert.match(guide, /коррекционных нянь|GS/);
  assert.match(guide, /Кодекс РК «О браке/);
  assert.match(guide, /Социальный кодекс РК/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/kzDisabilityGuide.test.ts`
Expected: FAIL because `getKazakhstanDisabilityRightsGuide` is not exported.

- [ ] **Step 3: Implement minimal guide helper and wire it into fallback**

Add `getKazakhstanDisabilityRightsGuide(profile)` in `server.ts`, export it, and call it from `getFallbackChatResponse` when the parent asks about disability, МСЭ, пособия, алименты, or справки.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/kzDisabilityGuide.test.ts`
Expected: PASS.

### Task 2: Model Instruction And Knowledge Article

**Files:**
- Modify: `server.ts`
- Modify: `src/context/ProfileContext.tsx`

- [ ] **Step 1: Strengthen `/api/chat` system instruction**

Add a mandatory Kazakhstan social navigator block covering: MСЭ, narrow specialists, social protection, education/PMPK/KPPK, healthcare, regional child ombudsmen, Code on Marriage and Family alimony references, Birge, and GS correctional nanny support.

- [ ] **Step 2: Update in-app article**

Replace the short `rights_kz` article content with the same four-step parent route and official source anchors.

- [ ] **Step 3: Run project checks**

Run: `npm run lint`
Expected: TypeScript check passes.

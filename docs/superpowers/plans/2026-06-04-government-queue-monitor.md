# Government Queue Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local government queue and appointment monitor inside the existing care tracker.

**Architecture:** Pure queue/reminder logic lives in `src/lib/governmentQueueMonitor.ts` and is tested with Node tests. Persistent records live in `ProfileContext` beside the existing tracker data. `CareTrackerTab` adds an "Очереди" view for creation, status display, inline reminders, and route links.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS utilities, Node `node:test`, browser `localStorage`.

---

## File Structure

- Create `src/lib/governmentQueueMonitor.ts`: pure status, reminder, sort, and maps URL helpers.
- Create `tests/governmentQueueMonitor.test.ts`: behavior tests for the pure helper functions.
- Modify `src/context/ProfileContext.tsx`: add `GovernmentQueueRecord` type, storage, and CRUD/update methods.
- Modify `src/components/CareTrackerTab.tsx`: add the queue view, form, record list, timer-based status refresh, and route action.

## Task 1: Pure Monitor Logic

**Files:**
- Create: `src/lib/governmentQueueMonitor.ts`
- Test: `tests/governmentQueueMonitor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapsRouteUrl,
  getGovernmentQueueReminder,
  getGovernmentQueueStatus,
  sortGovernmentQueueRecords,
  type GovernmentQueueRecordSummary
} from "../src/lib/governmentQueueMonitor";

const baseRecord: GovernmentQueueRecordSummary = {
  id: "record-1",
  childId: "child-1",
  childName: "Алишер",
  serviceTitle: "ПМПК",
  institutionName: "Городская ПМПК",
  institutionAddress: "Алматы, Абая 10",
  appointmentAt: "2026-06-05T09:00:00.000Z",
  queueNumber: 42,
  currentQueueNumber: 10,
  status: "waiting",
  createdAt: "2026-06-04T06:00:00.000Z",
  updatedAt: "2026-06-04T06:00:00.000Z"
};

test("queue is ready when current queue number reaches the user's number", () => {
  assert.equal(
    getGovernmentQueueStatus({ ...baseRecord, currentQueueNumber: 42 }, new Date("2026-06-04T08:00:00.000Z")),
    "ready"
  );
  assert.equal(
    getGovernmentQueueReminder({ ...baseRecord, currentQueueNumber: 42 }, new Date("2026-06-04T08:00:00.000Z"))?.message,
    "Очередь подошла"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/governmentQueueMonitor.test.ts`

Expected: FAIL because `src/lib/governmentQueueMonitor.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create exported types and functions:

```ts
export type GovernmentQueueStatus = "waiting" | "soon" | "ready" | "completed" | "cancelled";

export type GovernmentQueueRecordSummary = {
  id: string;
  childId: string;
  childName: string;
  serviceTitle: string;
  institutionName: string;
  institutionAddress: string;
  appointmentAt: string;
  queueNumber?: number;
  currentQueueNumber?: number;
  status: GovernmentQueueStatus;
  note?: string;
  lastNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

Implement `getGovernmentQueueStatus`, `getGovernmentQueueReminder`, `sortGovernmentQueueRecords`, and `buildMapsRouteUrl` using local date comparisons.

- [ ] **Step 4: Add remaining tests**

Cover tomorrow reminder, today reminder, completed/cancelled silence, urgency sorting, and encoded map URL.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx tests/governmentQueueMonitor.test.ts`

Expected: PASS.

## Task 2: Profile Storage

**Files:**
- Modify: `src/context/ProfileContext.tsx`

- [ ] **Step 1: Add data type and context methods**

Add `GovernmentQueueRecord` based on `GovernmentQueueRecordSummary`, then expose:

```ts
governmentQueueRecords: GovernmentQueueRecord[];
addGovernmentQueueRecord: (record: Omit<GovernmentQueueRecord, "id" | "childName" | "status" | "createdAt" | "updatedAt">) => GovernmentQueueRecord;
updateGovernmentQueueRecord: (id: string, record: Partial<GovernmentQueueRecord>) => void;
deleteGovernmentQueueRecord: (id: string) => void;
```

- [ ] **Step 2: Add localStorage persistence**

Use key `opora_government_queue_records`, mirroring the medication and diet state blocks.

- [ ] **Step 3: Include records in remote profile hydration if present**

When reading remote profile state, set records only if `state.governmentQueueRecords` is an array.

## Task 3: Tracker UI

**Files:**
- Modify: `src/components/CareTrackerTab.tsx`

- [ ] **Step 1: Add the view**

Extend `TrackerView` to include `"queues"` and add a fifth segmented control item with a bell/clipboard-style icon and label `Очереди`.

- [ ] **Step 2: Add form state and create handler**

Add state for service title, institution, address, appointment datetime, queue number, current queue number, and note. `handleAddQueueRecord` validates service title and either appointment or queue number before calling `addGovernmentQueueRecord`.

- [ ] **Step 3: Render records**

Filter records by selected child, sort with `sortGovernmentQueueRecords`, and show status/reminder chips using `getGovernmentQueueStatus` and `getGovernmentQueueReminder`.

- [ ] **Step 4: Add background refresh**

Use `window.setInterval` while `CareTrackerTab` is mounted to recompute derived statuses every minute and call `updateGovernmentQueueRecord` only when the stored status changes.

- [ ] **Step 5: Add route action**

Use `buildMapsRouteUrl(record.institutionAddress)` in an anchor/button with `target="_blank"` and `rel="noreferrer"`.

## Task 4: Verification

**Files:**
- Existing test and source files.

- [ ] **Step 1: Run focused queue tests**

Run: `node --import tsx tests/governmentQueueMonitor.test.ts`

Expected: PASS.

- [ ] **Step 2: Run existing care tracker tests**

Run: `node --import tsx tests/careTracker.test.ts`

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Inspect git diff**

Run: `git diff -- src/lib/governmentQueueMonitor.ts tests/governmentQueueMonitor.test.ts src/context/ProfileContext.tsx src/components/CareTrackerTab.tsx`

Expected: only queue monitor changes are present.

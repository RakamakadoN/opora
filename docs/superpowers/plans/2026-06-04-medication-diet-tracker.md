# Medication And Diet Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a parent-facing MVP tracker for medication schedules, diet restrictions, food logs, reactions, and multi-child daily journal views.

**Architecture:** Keep the first version client-side and profile-scoped, using the existing `ProfileContext` local and remote profile-state persistence. Put reusable tracker logic in a small pure TypeScript module with tests, expose tracker state/actions through the profile context, and add one new bottom-nav tab for the parent tracker.

**Tech Stack:** React 19, TypeScript, Vite, lucide-react, Node test runner with `tsx`, existing localStorage and `/api/profile-state` sync.

---

### Task 1: Tracker Domain Logic

**Files:**
- Create: `src/lib/careTracker.ts`
- Create: `tests/careTracker.test.ts`

- [x] **Step 1: Write failing tests for status and doctor report behavior**
- [x] **Step 2: Run `node --import tsx --test tests/careTracker.test.ts` and verify failure**
- [x] **Step 3: Implement pure helpers for medication event status, event sorting, and report text**
- [x] **Step 4: Re-run tracker tests and verify pass**

### Task 2: Profile Context Persistence

**Files:**
- Modify: `src/context/ProfileContext.tsx`

- [x] **Step 1: Add tracker types and context methods**
- [x] **Step 2: Persist tracker arrays to localStorage and remote profile state**
- [x] **Step 3: Add add/update/delete methods for plans, diet rules, food logs, reactions, and medication events**
- [x] **Step 4: Run TypeScript check**

### Task 3: Parent Tracker UI

**Files:**
- Create: `src/components/CareTrackerTab.tsx`
- Modify: `src/App.tsx`

- [x] **Step 1: Add parent bottom-nav tab with a medical tracker icon**
- [x] **Step 2: Build daily family view with child filter and upcoming medication cards**
- [x] **Step 3: Build forms for medication plan, diet rule, food log, and reaction note**
- [x] **Step 4: Show doctor report preview and safety disclaimer**
- [x] **Step 5: Run TypeScript check and build**

### Task 4: Browser Verification

**Files:**
- No source files expected after this task.

- [ ] **Step 1: Start the dev server**
- [ ] **Step 2: Open the tracker in the in-app browser**
- [ ] **Step 3: Verify the tracker renders, forms fit in the mobile frame, and navigation works**

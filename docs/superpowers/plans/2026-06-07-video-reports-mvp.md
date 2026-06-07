# Video Reports MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first safe MVP slice of "Видео-отчеты Опоры": structured video-report scenes, privacy/safety validation, and a parent-facing preview inside the tracker.

**Architecture:** Add a pure TypeScript `videoReports` library that converts existing tracker/profile data into Remotion-ready scene props without rendering MP4 yet. Wire the tracker report tab to show video report type selection, scene preview, warnings, and copyable scene text. Keep Remotion as the next renderer layer by making the output composition-friendly.

**Tech Stack:** React 19, TypeScript, Node test runner, existing ProfileContext tracker data, future Remotion compositions.

---

## File Structure

- Create `src/lib/videoReports.ts`: report types, scene builder, privacy presets, safety phrase validator, preview text formatter.
- Create `tests/videoReports.test.ts`: TDD coverage for neutral wording, excluded sensitive fields, scene structure, and forbidden phrase detection.
- Modify `src/components/CareTrackerTab.tsx`: add "Видео" view in the tracker and render MVP preview controls.

## Tasks

### Task 1: Pure Video Report Builder

**Files:**
- Create: `src/lib/videoReports.ts`
- Test: `tests/videoReports.test.ts`

- [ ] Write failing tests for doctor report scenes, caregiver privacy defaults, and forbidden phrase detection.
- [ ] Run `node --import tsx --test tests/videoReports.test.ts` and verify the tests fail because `src/lib/videoReports.ts` does not exist.
- [ ] Implement minimal `buildVideoReportPreview`, `validateVideoReportSafety`, and `formatVideoReportPreview`.
- [ ] Run `node --import tsx --test tests/videoReports.test.ts` and verify the tests pass.

### Task 2: Tracker UI Preview

**Files:**
- Modify: `src/components/CareTrackerTab.tsx`
- Test: `npm run lint`

- [ ] Add `video` to `TrackerView`.
- [ ] Import `Video`, `ShieldCheck`, and the video report builder functions.
- [ ] Build report preview from active child tracker data.
- [ ] Add a "Видео" tab button.
- [ ] Add a "Видео-отчет" panel with type selector, scene cards, warnings, safety issues, and copy button.
- [ ] Run `npm run lint`.

### Task 3: Verification

**Files:**
- Review: `docs/superpowers/specs/2026-06-07-opora-video-reports-remotion-design.md`
- Review: `src/lib/videoReports.ts`
- Review: `src/components/CareTrackerTab.tsx`

- [ ] Run `node --import tsx --test tests/videoReports.test.ts`.
- [ ] Run `npm run lint`.
- [ ] Check `git diff --stat`.
- [ ] Confirm no generated video claims medical causality or recommendations.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildDefaultMedicalCaseTracker,
  buildMedicalCaseRoute,
  calculateMedicalCaseProgress,
  getMedicalFoundationResources,
  getMedicalLetterTemplates,
  getNextMedicalCaseAction
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

test("medical case tracker calculates visible progress and next action", () => {
  const route = buildMedicalCaseRoute({
    childName: "Алия",
    childAge: 7,
    userCity: "Алматы"
  }, "найти врача который оценит прогрессию");
  const tracker = buildDefaultMedicalCaseTracker(route, "child-1");
  const updated = {
    ...tracker,
    items: tracker.items.map(item => item.id === "stabilize"
      ? { ...item, status: "done" as const, completedAt: "2026-06-07T00:00:00.000Z" }
      : item)
  };

  const progress = calculateMedicalCaseProgress(updated);
  const next = getNextMedicalCaseAction(updated);

  assert.equal(progress.doneCount, 1);
  assert.equal(progress.totalCount, route.steps.length);
  assert.equal(progress.percent, Math.round(100 / route.steps.length));
  assert.equal(next?.id, "doctor_extracts");
  assert.match(next?.action || "", /врач/i);
});

test("assistant medical route card renders route details beyond prompt injection", async () => {
  const source = await readFile(new URL("../src/components/AIAssistantTab.tsx", import.meta.url), "utf8");

  assert.match(source, /medicalCaseRoute/);
  assert.match(source, /criticalAction/);
  assert.match(source, /documents\.filter/);
  assert.match(source, /foundations\.map/);
  assert.match(source, /templates\.map/);
  assert.match(source, /navigator\.clipboard\.writeText/);
});

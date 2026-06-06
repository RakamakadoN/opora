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

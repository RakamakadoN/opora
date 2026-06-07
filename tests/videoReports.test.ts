import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVideoReportPreview,
  formatVideoReportPreview,
  validateVideoReportSafety,
  type VideoReportInput
} from "../src/lib/videoReports";

const baseInput: VideoReportInput = {
  reportType: "doctor",
  child: {
    id: "child-1",
    childName: "Алия",
    childAge: 6,
    diagnosticStatus: "Диагноз подтвержден",
    userCity: "Алматы",
    sensoryPassport: {
      soundSensitivity: ["громкие звуки"],
      lightSensitivity: ["яркий свет"],
      tactileSensitivity: ["бирки на одежде"],
      communicationStyle: "короткие фразы и визуальные подсказки",
      comfortTriggers: "тихое место, вода, любимая игрушка",
      favoriteReward: "наклейки"
    }
  },
  periodLabel: "последние 14 дней",
  medications: [
    {
      childId: "child-1",
      childName: "Алия",
      name: "Препарат X",
      doseText: "1/2 таблетки",
      scheduleText: "каждое утро",
      foodRelation: "после еды",
      active: true
    }
  ],
  medicationEvents: [
    {
      id: "med-1",
      planId: "plan-1",
      childId: "child-1",
      childName: "Алия",
      planName: "Препарат X",
      doseText: "1/2 таблетки",
      foodRelation: "после еды",
      plannedAt: "2026-06-04T08:00:00.000Z",
      takenAt: "2026-06-04T08:10:00.000Z",
      status: "taken",
      reminderWindowMinutes: 30
    }
  ],
  foodLogs: [
    {
      childId: "child-1",
      childName: "Алия",
      eatenAt: "2026-06-04T12:00:00.000Z",
      foodText: "гречка",
      reaction: "покраснение щек"
    }
  ],
  reactions: [
    {
      childId: "child-1",
      childName: "Алия",
      happenedAt: "2026-06-04T13:00:00.000Z",
      title: "покраснение щек",
      intensity: 3,
      possibleTrigger: "гречка"
    }
  ],
  questions: ["Что обсудить на следующем приеме?"]
};

test("doctor video report builds neutral factual scenes without causal wording", () => {
  const preview = buildVideoReportPreview(baseInput);
  const text = formatVideoReportPreview(preview);

  assert.equal(preview.templateId, "doctor-report");
  assert.equal(preview.scenes[0].kind, "disclaimer");
  assert.match(text, /Видео не является медицинским заключением/);
  assert.match(text, /После приема препарата была зафиксирована отметка приема/);
  assert.match(text, /После приема еды была зафиксирована реакция: покраснение щек/);
  assert.match(text, /Родитель отметил реакцию: покраснение щек/);
  assert.doesNotMatch(text, /причин/i);
  assert.doesNotMatch(text, /вызвал/i);
  assert.doesNotMatch(text, /из-за/i);
  assert.doesNotMatch(text, /возможная связь/i);
});

test("caregiver video card excludes diagnosis and medication details by default", () => {
  const preview = buildVideoReportPreview({
    ...baseInput,
    reportType: "caregiver"
  });
  const text = formatVideoReportPreview(preview);

  assert.equal(preview.templateId, "caregiver-card");
  assert.match(text, /короткие фразы и визуальные подсказки/);
  assert.match(text, /тихое место, вода, любимая игрушка/);
  assert.doesNotMatch(text, /Диагноз подтвержден/);
  assert.doesNotMatch(text, /Препарат X/);
  assert.doesNotMatch(text, /1\/2 таблетки/);
});

test("safety validator flags medical recommendations and causal claims", () => {
  const result = validateVideoReportSafety([
    "Препарат стал причиной реакции.",
    "Нужно изменить лечение.",
    "После приема еды была зафиксирована реакция."
  ]);

  assert.deepEqual(result.safeLines, ["После приема еды была зафиксирована реакция."]);
  assert.equal(result.issues.length, 2);
  assert.match(result.issues[0].message, /причинно-следственную/);
  assert.match(result.issues[1].message, /медицинскую рекомендацию/);
});

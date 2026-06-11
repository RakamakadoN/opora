import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChildUpsertStatement,
  buildFamilyBackfillPlan,
  buildFamilyDisplayName,
  normalizeProfileState
} from "../src/lib/familyBackfill.ts";

test("normalizeProfileState keeps the current multi-profile shape intact", () => {
  const profiles = normalizeProfileState({
    profiles: [
      {
        id: "child-1",
        childName: "Алишер",
        childAge: 4,
        diagnosticStatus: "Диагноз подтвержден",
        userCity: "Алматы"
      },
      {
        id: "child-2",
        name: "Мира",
        age_years: 7,
        diagnostic_status: "В процессе диагностики",
        city: "Астана"
      }
    ]
  });

  assert.deepEqual(profiles, [
    {
      localChildId: "child-1",
      name: "Алишер",
      ageYears: 4,
      diagnosticStatus: "Диагноз подтвержден",
      city: "Алматы",
      colorToken: profiles[0].colorToken
    },
    {
      localChildId: "child-2",
      name: "Мира",
      ageYears: 7,
      diagnosticStatus: "В процессе диагностики",
      city: "Астана",
      colorToken: profiles[1].colorToken
    }
  ]);
});

test("normalizeProfileState falls back to the legacy single-profile shape", () => {
  const profiles = normalizeProfileState({
    id: "legacy-child",
    childName: "Нур",
    childAge: 3,
    diagnosticStatus: "В процессе диагностики",
    userCity: "Шымкент"
  });

  assert.deepEqual(profiles, [
    {
      localChildId: "legacy-child",
      name: "Нур",
      ageYears: 3,
      diagnosticStatus: "В процессе диагностики",
      city: "Шымкент",
      colorToken: profiles[0].colorToken
    }
  ]);
});

test("buildFamilyBackfillPlan uses a stable family name and composite child upsert keys", () => {
  const plan = buildFamilyBackfillPlan(
    {
      id: "user-1",
      fullName: "  Айгерим   С.  "
    },
    {
      profiles: [
        {
          id: "child-1",
          childName: "Алишер",
          childAge: 3,
          diagnosticStatus: "Только подозреваем",
          userCity: "Алматы"
        }
      ]
    }
  );

  assert.equal(plan.familyDisplayName, "Айгерим С.: семья");
  assert.equal(plan.profiles.length, 1);

  const statement = buildChildUpsertStatement("family-1", plan.profiles[0]);
  assert.match(statement.sql.replace(/\s+/g, " "), /on conflict \(family_id, local_child_id\) do update/i);
  assert.deepEqual(statement.values.slice(0, 3), ["family-1", "child-1", "Алишер"]);
});

test("buildFamilyDisplayName falls back to a default label", () => {
  assert.equal(buildFamilyDisplayName(""), "Родитель: семья");
  assert.equal(buildFamilyDisplayName("  "), "Родитель: семья");
});

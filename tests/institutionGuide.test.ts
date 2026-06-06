import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInstitutionChecklist,
  getDefaultInstitutionGuideSeed,
  groupInstitutionDocumentsByStage,
  matchInstitutionDocuments,
  normalizeInstitutionGuideRows,
  type InstitutionGuideDocumentRow,
  type InstitutionGuideRow
} from "../src/lib/institutionGuide";

test("institution seed includes disability-route agencies with district-scale metadata", () => {
  const seed = getDefaultInstitutionGuideSeed();

  assert.equal(seed.institutions.length >= 5, true);
  assert.equal(seed.documents.length >= 10, true);
  assert.equal(seed.institutions.some(item => item.kind === "mse"), true);
  assert.equal(seed.institutions.some(item => item.kind === "pmpk"), true);
  assert.equal(seed.institutions.some(item => item.kind === "social_protection"), true);
  assert.equal(seed.institutions.every(item => item.regionCode && item.city), true);
});

test("institution seed uses concrete Almaty contacts instead of placeholder guidance", () => {
  const seed = getDefaultInstitutionGuideSeed();
  const almatyItems = seed.institutions.filter(item => item.city === "Алматы");

  assert.equal(almatyItems.length >= 6, true);
  assert.equal(almatyItems.some(item => item.kind === "pmpk" && /Тулебаева|Торайгырова/i.test(item.address || "")), true);
  assert.equal(almatyItems.some(item => item.kind === "mse" && /Сейфуллина/i.test(item.address || "")), true);
  assert.equal(almatyItems.some(item => item.kind === "social_protection" && /Достык/i.test(item.address || "")), true);
  assert.equal(almatyItems.some(item => item.kind === "education_department" && /Республики/i.test(item.address || "")), true);
  assert.equal(almatyItems.every(item => item.sourceUrl?.startsWith("https://")), true);
  assert.equal(almatyItems.every(item => item.phone && !/уточнить/i.test(item.phone)), true);
  assert.equal(almatyItems.every(item => item.address && !/уточняется|зависит|месту проживания/i.test(item.address)), true);
});

test("institution seed keeps verification metadata and source labels visible", () => {
  const seed = getDefaultInstitutionGuideSeed();
  const pmpk = seed.institutions.find(item => item.kind === "pmpk" && item.city === "Алматы");
  assert.ok(pmpk);

  assert.equal(pmpk.metadata.verificationStatus, "manual_public_source");
  assert.equal(pmpk.metadata.recommendationStatus, "not_a_recommendation");
  assert.match(pmpk.sourceLabel, /требует|публич/i);
});

test("document matcher returns place-specific documents before generic route documents", () => {
  const seed = getDefaultInstitutionGuideSeed();
  const mse = seed.institutions.find(item => item.kind === "mse");
  assert.ok(mse);

  const docs = matchInstitutionDocuments(seed.documents, {
    institutionId: mse.id,
    institutionKind: mse.kind,
    diagnosticStatus: "Диагноз подтвержден"
  });

  assert.equal(docs.length > 0, true);
  assert.equal(docs[0].institutionId, mse.id);
  assert.equal(docs.some(doc => /МСЭ|медико-социаль/i.test(doc.title)), true);
  assert.equal(docs.some(doc => doc.appliesToDiagnosticStatuses.includes("Диагноз подтвержден")), true);
});

test("checklist merges institution documents with progress and source warning", () => {
  const seed = getDefaultInstitutionGuideSeed();
  const pmpk = seed.institutions.find(item => item.kind === "pmpk");
  assert.ok(pmpk);

  const checklist = buildInstitutionChecklist({
    institution: pmpk,
    documents: seed.documents,
    diagnosticStatus: "В процессе диагностики",
    checkedDocumentIds: ["birth_certificate", "parent_identity"]
  });

  assert.equal(checklist.institution.id, pmpk.id);
  assert.equal(checklist.documents.length >= 4, true);
  assert.equal(checklist.progress.checkedCount, 2);
  assert.equal(checklist.progress.percent > 0, true);
  assert.match(checklist.disclaimer, /уточните/i);
  assert.equal(checklist.documents.some(doc => doc.checked), true);
});

test("documents can be grouped by disability route stage", () => {
  const seed = getDefaultInstitutionGuideSeed();
  const grouped = groupInstitutionDocumentsByStage(seed.documents);

  assert.equal(grouped.some(group => group.stage === "medical_preparation"), true);
  assert.equal(grouped.some(group => group.stage === "mse_review"), true);
  assert.equal(grouped.some(group => group.stage === "benefits_services"), true);
});

test("normalizer accepts Supabase/Postgres rows and keeps json arrays safe", () => {
  const institutionRows: InstitutionGuideRow[] = [
    {
      id: "inst-1",
      name: "Районная МСЭ",
      kind: "mse",
      region_code: "kz-ala",
      city: "Алматы",
      district: "Бостандыкский",
      address: "ул. Примерная, 1",
      phone: "+7 727 000 00 00",
      website: "https://example.kz",
      source_url: "https://gov.kz",
      source_label: "gov.kz",
      verified_at: "2026-06-04T00:00:00.000Z",
      service_area_population: 1000000,
      tags: ["МСЭ", "инвалидность"],
      metadata: { queue: "by appointment" }
    }
  ];
  const documentRows: InstitutionGuideDocumentRow[] = [
    {
      id: "doc-1",
      institution_id: "inst-1",
      institution_kind: "mse",
      stage: "mse_review",
      title: "Направление на МСЭ",
      description: "Оформляет медицинская организация",
      required: true,
      source: "Сбор документов",
      sort_order: 10,
      applies_to_diagnostic_statuses: ["Диагноз подтвержден"],
      metadata: null
    }
  ];

  const normalized = normalizeInstitutionGuideRows(institutionRows, documentRows);

  assert.deepEqual(normalized.institutions[0].tags, ["МСЭ", "инвалидность"]);
  assert.equal(normalized.institutions[0].serviceAreaPopulation, 1000000);
  assert.deepEqual(normalized.documents[0].appliesToDiagnosticStatuses, ["Диагноз подтвержден"]);
});

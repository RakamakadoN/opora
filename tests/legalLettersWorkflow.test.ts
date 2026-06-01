import assert from "node:assert/strict";
import test from "node:test";

test("legal letters workflow includes drafting, response analysis, objection, and manual submission", async () => {
  process.env.NODE_ENV = "test";
  const { getKazakhstanLegalLettersWorkflow } = await import("../server");

  const guide = getKazakhstanLegalLettersWorkflow({
    childName: "Алия",
    userCity: "Алматы"
  });

  assert.match(guide, /Этап 1: Составить обращение/);
  assert.match(guide, /Этап 2: Проверить ответ/);
  assert.match(guide, /Этап 3: Подготовить опровержение/);
  assert.match(guide, /e-Otinish|eGov|канцеляр/);
  assert.match(guide, /не отправляю автоматически/);
});

test("legal letters workflow covers alimony hidden rights", async () => {
  process.env.NODE_ENV = "test";
  const { getKazakhstanLegalLettersWorkflow } = await import("../server");

  const guide = getKazakhstanLegalLettersWorkflow({}, "отказали в дополнительных алиментах и выплатах");

  assert.match(guide, /Алименты\+\+/);
  assert.match(guide, /дополнительные расходы на содержание ребенка/);
  assert.match(guide, /содержание родителя/);
  assert.match(guide, /стать[ьяи ]+144/);
  assert.match(guide, /стать[ьяи ]+147|148/);
});

test("legal letters workflow covers preschool refusal checks", async () => {
  process.env.NODE_ENV = "test";
  const { getKazakhstanLegalLettersWorkflow } = await import("../server");

  const guide = getKazakhstanLegalLettersWorkflow({}, "отказали в месте в детском саду очередь льгота");

  assert.match(guide, /Дошкольный фильтр/);
  assert.match(guide, /очеред/);
  assert.match(guide, /льгот/);
  assert.match(guide, /управление образования/);
  assert.match(guide, /письменный отказ/);
});

test("legal letters workflow covers escalation to child rights bodies", async () => {
  process.env.NODE_ENV = "test";
  const { getKazakhstanLegalLettersWorkflow } = await import("../server");

  const guide = getKazakhstanLegalLettersWorkflow({}, "отписка от управления образования омбудсмен");

  assert.match(guide, /Навигатор по 20 органам/);
  assert.match(guide, /20 региональных уполномоченных по правам ребенка/);
  assert.match(guide, /детскому омбудсмену/);
  assert.match(guide, /следующая инстанция/);
});

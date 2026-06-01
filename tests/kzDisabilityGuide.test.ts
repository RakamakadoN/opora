import assert from "node:assert/strict";
import test from "node:test";

test("Kazakhstan disability guide includes medical, agency, ombudsman, alimony, and support routes", async () => {
  process.env.NODE_ENV = "test";
  const { getKazakhstanDisabilityRightsGuide } = await import("../server");
  const guide = getKazakhstanDisabilityRightsGuide({ childName: "Алия", userCity: "Алматы" });

  assert.match(guide, /Шаг 1: Медицинское заключение/);
  assert.match(guide, /Куда идти и каких врачей пройти/);
  assert.match(guide, /Шаг 2: Обращение в госорганы/);
  assert.match(guide, /Список ключевых ведомств/);
  assert.match(guide, /Шаг 3: Проверка дополнительных льгот/);
  assert.match(guide, /Алименты по уходу за собой и надбавки на ребенка/);
  assert.match(guide, /Шаг 4: Поиск специализированной помощи/);
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
  assert.match(guide, /https:\/\/autismbirge\.kz\//);
  assert.match(guide, /https:\/\/aleumet\.egov\.kz\//);
});

# Legal Letters Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first "Письма и юридический контроль" workflow inside the existing AI assistant.

**Architecture:** Keep the workflow lightweight: add server-side prompt and fallback helpers, then expose three legal quick actions in `AIAssistantTab`. The app will prepare copy-ready letters and analysis, but will not submit anything automatically.

**Tech Stack:** Express, TypeScript, React, Node built-in test runner with `tsx`, lucide-react icons.

---

## File Structure

- Create `tests/legalLettersWorkflow.test.ts`: focused tests for the fallback legal workflow helper.
- Modify `server.ts`: export a fallback helper, route legal-letter queries to it, and strengthen `/api/chat` system instructions.
- Modify `src/components/AIAssistantTab.tsx`: add the compact legal workflow card and three prompt presets.

---

### Task 1: Server Fallback Helper

**Files:**
- Create: `tests/legalLettersWorkflow.test.ts`
- Modify: `server.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/legalLettersWorkflow.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/legalLettersWorkflow.test.ts`

Expected: FAIL because `getKazakhstanLegalLettersWorkflow` is not exported.

- [ ] **Step 3: Add the exported helper**

In `server.ts`, insert this helper after `getKazakhstanDisabilityRightsGuide`:

```ts
export function getKazakhstanLegalLettersWorkflow(profile: any = {}, userMsg = ""): string {
  const childName = profile?.childName || "ребенка";
  const city = profile?.userCity || "вашем городе";
  const query = String(userMsg || "").toLowerCase();
  const wantsPreschool = query.includes("сад") || query.includes("дошколь") || query.includes("очеред") || query.includes("мест");
  const wantsAlimony = query.includes("алим") || query.includes("выплат") || query.includes("содержан") || query.includes("расход");
  const wantsEscalation = query.includes("отпис") || query.includes("омбудсмен") || query.includes("жалоб") || query.includes("отказ");

  const primaryScenario = wantsAlimony
    ? "Алименты++"
    : wantsPreschool
      ? "Дошкольный фильтр"
      : wantsEscalation
        ? "Навигатор по 20 органам"
        : "Навигатор по 20 органам";

  return `Я помогу подготовить юридически аккуратный текст для ${childName} в ${city}. Важно: я готовлю черновик и проверочный список, но не отправляю автоматически заявление в e-Otinish, eGov, суд или канцелярию.

**Основной сценарий: ${primaryScenario}.**

**Этап 1: Составить обращение.** Опишите факты: кто обращается, возраст ребенка, город, что уже сделали, какой орган ответил или куда хотите обратиться, какие документы есть. Я подготовлю официальное письмо со структурой: адресат, тема, обстоятельства, правовое основание, просьба, приложения и способ подачи через e-Otinish/eGov/канцелярию.

**Этап 2: Проверить ответ.** Вставьте полный текст ответа госоргана. Я проверю, удовлетворена ли просьба родителя, есть ли письменный отказ, не подменил ли орган вопрос общей отпиской, и сравню аргументы с маршрутами по Кодексу РК «О браке (супружестве) и семье», защите прав ребенка, социальной поддержке и дошкольному образованию. Если точную норму нужно сверить в актуальной редакции, я прямо отмечу это.

**Этап 3: Подготовить опровержение.** Если ответ противоречивый, я составлю письмо-претензию: что проигнорировано, какие права ребенка или родителя затронуты, какую статью или процедуру нужно пересмотреть, и какая следующая инстанция подходит.

**Алименты++:** проверяем не только обычные алименты, но и дополнительные расходы на содержание ребенка по статье 144 Кодекса РК «О браке (супружестве) и семье», а также право нуждающегося родителя, который ухаживает за общим ребенком с инвалидностью, требовать содержание родителя по статьям 147 и 148.

**Дошкольный фильтр:** при отказе в детском саду проверяем очередь, льготный статус, письменный отказ, маршрут через детский сад или комиссию, управление образования, ПМПК/КППК при особых образовательных потребностях и возможность эскалации.

**Навигатор по 20 органам:** если пришла отписка, следующая инстанция может быть управление образования, соцзащита, органы опеки, акимат, суд, частный судебный исполнитель, 20 региональных уполномоченных по правам ребенка, детский омбудсмен или прокуратура по ситуации.

Пришлите ситуацию или вставьте ответ органа, и я соберу документ в формате, который можно скопировать и подать вручную.`;
}
```

- [ ] **Step 4: Wire fallback routing**

In `getFallbackChatResponse`, before the disability branch, add:

```ts
  if (
    query.includes('письм') ||
    query.includes('обращен') ||
    query.includes('жалоб') ||
    query.includes('претенз') ||
    query.includes('опроверж') ||
    query.includes('ответ гос') ||
    query.includes('отпис') ||
    query.includes('отказ') ||
    query.includes('детск') ||
    query.includes('сад')
  ) {
    return getKazakhstanLegalLettersWorkflow(profile, userMsg);
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx --test tests/legalLettersWorkflow.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server.ts tests/legalLettersWorkflow.test.ts
git commit -m "feat: add legal letters fallback workflow"
```

---

### Task 2: Model Instruction

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Extend `/api/chat` system instruction**

Inside the `systemInstruction` string in `server.ts`, after the Kazakhstan social navigator block, add:

```text

Письма и юридический контроль РК:
- Если пользователь просит составить письмо, жалобу, обращение, претензию или анализ ответа госоргана, работай в одном из трех режимов: "составить обращение", "проверить ответ", "подготовить опровержение".
- Для обращения сначала определи категорию: "Алименты++", "Дошкольный фильтр", "Навигатор по 20 органам", инвалидность/соцподдержка, образование/ПМПК или защита прав ребенка. Затем выбери адресата: управление образования, соцзащита, МСЭ-маршрут, ПМПК/КППК, орган опеки, суд, частный судебный исполнитель, региональный уполномоченный по правам ребенка, детский омбудсмен или прокуратура по ситуации.
- Готовь письмо в копируемом официальном формате: адресат, тема, факты, правовое основание, просьба, приложения, способ подачи. Указывай, что письмо подготовлено для ручной подачи через e-Otinish/eGov/канцелярию/суд, а не отправлено автоматически.
- При анализе ответа проверь: удовлетворена ли просьба, есть ли мотивированный письменный отказ, не проигнорированы ли интересы ребенка, не пропущены ли скрытые права. Для алиментов проверь дополнительные расходы на ребенка по статье 144 и содержание родителя по статьям 147-148 Кодекса РК «О браке (супружестве) и семье». Для детского сада проверь очередь, льготы, управление образования и письменный отказ.
- Не выдумывай точные нормы. Если в текущей базе нет точной статьи или процедуры, напиши: "это нужно сверить в актуальной официальной редакции перед подачей".
```

- [ ] **Step 2: Run existing legal tests**

Run: `node --import tsx --test tests/kzDisabilityGuide.test.ts tests/legalLettersWorkflow.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: instruct assistant on legal letters control"
```

---

### Task 3: AI Assistant UI Actions

**Files:**
- Modify: `src/components/AIAssistantTab.tsx`

- [ ] **Step 1: Add icons and action data**

Change the import line to include legal workflow icons:

```ts
import { Send, Heart, Sparkles, ClipboardList, FileText, MapPinned, ShieldCheck, Scale, SearchCheck, FilePenLine } from 'lucide-react';
```

After `helperActions`, add:

```ts
const legalActions = [
  {
    label: 'Составить обращение',
    hint: 'адресат и текст письма',
    icon: FilePenLine,
    prompt: 'Помоги составить официальное обращение в госорган РК. Ситуация: [коротко опишите, что произошло]. Город: [город]. Категория: алименты / инвалидность / детский сад / другое. Документы на руках: [перечислите]. Что хочу получить: [результат]. Определи адресата и подготовь письмо для ручной подачи через e-Otinish/eGov/канцелярию.'
  },
  {
    label: 'Проверить ответ',
    hint: 'найти противоречия',
    icon: SearchCheck,
    prompt: 'Проанализируй ответ госоргана РК на предмет противоречий и проигнорированных прав. Моя просьба была: [вставьте кратко]. Ответ органа: [вставьте полный текст ответа]. Проверь, удовлетворена ли просьба, есть ли отписка, какие права ребенка или родителя могли быть проигнорированы.'
  },
  {
    label: 'Подготовить опровержение',
    hint: 'жалоба или эскалация',
    icon: Scale,
    prompt: 'Подготовь письмо-претензию/опровержение на ответ госоргана РК. Первичное обращение: [вставьте]. Полученный ответ: [вставьте]. Что, по моему мнению, проигнорировали: [перечислите]. Укажи следующую инстанцию и составь текст для ручной подачи.'
  }
];
```

- [ ] **Step 2: Render the legal workflow card**

In the JSX after the quick-start helper actions block and before `<AnimatePresence>`, add:

```tsx
        <div className="opora-ai-intro rounded-2xl border border-opora-sage/20 bg-white/75 px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-opora-navy text-white">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">
                Письма и юридический контроль
              </p>
              <p className="text-xs font-bold leading-snug text-opora-navy">
                Черновики для e-Otinish, eGov и письменных обращений
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            {legalActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setInputValue(action.prompt)}
                  className="flex min-h-[58px] items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-left shadow-sm transition-all active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-opora-sage/10 text-opora-sage">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold leading-tight text-opora-navy">{action.label}</span>
                    <span className="block text-[11px] font-medium leading-snug text-opora-text/70">{action.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
```

- [ ] **Step 3: Run TypeScript check**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/AIAssistantTab.tsx
git commit -m "feat: add legal workflow actions to assistant"
```

---

### Task 4: Final Verification

**Files:**
- Verify: `server.ts`
- Verify: `src/components/AIAssistantTab.tsx`
- Verify: `tests/legalLettersWorkflow.test.ts`

- [ ] **Step 1: Run all targeted tests**

Run: `node --import tsx --test tests/kzDisabilityGuide.test.ts tests/legalLettersWorkflow.test.ts`

Expected: PASS.

- [ ] **Step 2: Run project lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Start the dev server**

Run: `env PORT=5555 npm run dev`

Expected: server starts on `http://localhost:5555`.

- [ ] **Step 4: Browser smoke test**

Open `http://localhost:5555` in the in-app browser. If authentication blocks the assistant screen, report that code and TypeScript verification passed and that manual UI verification requires a logged-in test user.

- [ ] **Step 5: Commit any verification-only fixes**

If verification found no fixes, do not create an empty commit. If fixes were required:

```bash
git add server.ts src/components/AIAssistantTab.tsx tests/legalLettersWorkflow.test.ts
git commit -m "fix: verify legal letters workflow"
```


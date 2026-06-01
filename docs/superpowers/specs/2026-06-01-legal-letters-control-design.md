# Legal Letters And Kazakhstan Rights Control Design

## Goal

Add a first version of the "Письма и юридический контроль" workflow to Opora so a parent can:

- draft an official appeal to a relevant Kazakhstan authority;
- paste a government response and receive a structured contradiction check;
- generate a follow-up objection or escalation letter when risks are found.

The feature prepares text for manual submission through e-Otinish, eGov, email, court, or an office registry. It does not send letters automatically.

## Product Scope

The first version lives inside the existing `AIAssistantTab` instead of adding a new bottom-nav tab. The assistant gets a visible legal workflow block with three actions:

- `Составить обращение`;
- `Проверить ответ`;
- `Подготовить опровержение`.

Each action inserts a structured prompt into the chat. The parent can edit the prompt before sending. This keeps the experience lightweight and matches the existing chat UI.

## Legal Scenarios

The server instruction and fallback logic cover three named scenarios:

- `Алименты++`: checks ordinary alimony, additional expenses for a child, and possible maintenance for the parent caring for a child with disability.
- `Дошкольный фильтр`: checks preschool queue, benefits, education authority routing, and written refusal handling.
- `Навигатор по 20 органам`: routes a weak or evasive response to the next authority, including regional child rights commissioners and the child ombudsman.

The assistant must use cautious legal language. If the local knowledge base does not contain an exact current rule, it must say that the article or procedure should be checked in the current official version before submission.

## Recipient Routing

The first version uses a local routing map rather than live integrations:

- education and preschool: department or administration of education, kindergarten commission, PMPK/KPPK when relevant;
- disability and social support: social protection authority, MSE route, eGov or public service center;
- alimony and additional expenses: court, private judicial executor, guardianship authority when child interests are affected;
- rights violations or formal replies: regional child rights commissioner, child ombudsman, prosecutor's office where appropriate.

The assistant should name the most likely primary recipient and, when needed, a next escalation recipient.

## Server Behavior

`/api/chat` receives an additional system-instruction block called "Письма и юридический контроль РК". It tells the model to:

- classify the user's request as drafting, response analysis, or objection drafting;
- identify the likely category and recipient;
- include a clean official letter body with subject, facts, request, attachments, and submission note;
- analyze negative responses against Kazakhstan family, child-rights, social-support, and education routes already represented in the app knowledge base;
- explicitly flag hidden or often-missed rights, especially additional child expenses and maintenance for the caregiving parent;
- avoid claiming the app submitted anything automatically.

The local fallback response should return a useful legal-workflow template when the user asks about letters, complaints, refusals, official responses, kindergarten refusal, alimony, disability payments, or ombudsman escalation.

## UI Behavior

`AIAssistantTab` adds a compact legal workflow card below the existing quick-start actions. The card uses the existing visual style and icon library. It does not introduce a new page or heavy form.

Button behavior:

- `Составить обращение` pre-fills a prompt asking for situation, city, category, documents, and desired outcome.
- `Проверить ответ` pre-fills a prompt asking the parent to paste the government response.
- `Подготовить опровержение` pre-fills a prompt asking for the original request, received response, and what was ignored.

The generated answer should be copy-ready and include a short "куда подать" note.

## Data And Privacy

No new persistent storage is required in the first version. The feature uses the existing chat request flow and profile context. Parents should be encouraged to remove unnecessary personal identifiers before pasting official documents.

## Error Handling

If model providers fail, the fallback should still explain the three-step workflow and provide a neutral template. It should not invent a detailed legal verdict without the pasted response.

## Testing

Add focused tests for the server fallback helper:

- letter workflow mentions three stages;
- alimony scenario mentions additional child expenses and caregiving-parent maintenance;
- preschool refusal scenario mentions queue, benefits, education authority, and written refusal;
- escalation scenario mentions regional child rights commissioners, child ombudsman, and manual submission.

Run `npm run lint` after implementation.

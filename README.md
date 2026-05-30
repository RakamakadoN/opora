# Опора

Навигатор для родителей детей с особенностями развития. Приложение помогает спокойно собрать наблюдения, подготовить материалы для специалиста, вести маршрут помощи и работать с врачом через отдельный кабинет.

Важно: приложение не ставит диагноз, не заменяет врача и не назначает лечение автоматически.

## Локальный запуск

Требования:

- Node.js 22
- npm 10+

```bash
npm install
cp .env.example .env
npm run dev
```

По умолчанию сервер запускается на `http://localhost:3000`. Для порта 5555:

```bash
PORT=5555 npm run dev
```

## Production

```bash
npm ci
npm run lint
npm run build
NODE_ENV=production PORT=3000 npm run start
```

Healthcheck:

```text
/api/health
```

## Railway

Проект готов к деплою на Railway через `railway.json`.

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Переменные окружения описаны в `.env.example`.

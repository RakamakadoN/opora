# Deployment

## Railway

1. Push the project to GitHub.
2. In Railway, create a new project from the GitHub repository.
3. Railway should detect Node through `package.json` and `.nvmrc`.
4. Keep these commands:
   - Build command: `npm run build`
   - Start command: `npm run start`
5. Add environment variables:
   - `NODE_ENV=production`
   - `GEMINI_API_KEY` or `OPENROUTER_API_KEY`
   - `APP_URL` after Railway gives the public domain
6. Add a Railway PostgreSQL database to the same project.
7. Link the app service to the database so Railway injects:
   - `DATABASE_URL`
   - `PGSSLMODE=require`
8. Optional alternative if using Supabase/PostgREST instead of Railway Postgres:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

When `DATABASE_URL` is present, the server applies `db/railway-postgres.sql` on startup and stores doctor care requests plus access audit logs in Postgres. Without database env vars, the server uses a local JSON fallback for demos; that fallback is not durable on Railway restarts.

Manual migration command if needed:

```bash
npm run db:migrate
```

## Supabase Database

Supabase project created for Opora:

- Project: `opora`
- Project ref: `okngykfqgayhngkaufol`
- Region: `eu-central-1`
- API URL: `https://okngykfqgayhngkaufol.supabase.co`
- Database host: `db.okngykfqgayhngkaufol.supabase.co`

Use this format for Railway `DATABASE_URL`:

```text
postgresql://postgres:<SUPABASE_DB_PASSWORD>@db.okngykfqgayhngkaufol.supabase.co:5432/postgres?sslmode=require
```

Get `<SUPABASE_DB_PASSWORD>` from Supabase Project Settings → Database. Do not commit it to GitHub.

Applied migrations:

- `initial_opora_schema`
- `enable_rls_for_opora_tables`

Healthcheck:

```text
/api/health
```

## Local Production Check

```bash
npm ci
npm run lint
npm run build
NODE_ENV=production PORT=5555 npm run start
```

Open `http://localhost:5555/api/health`.
Open `http://localhost:5555/api/db/status`.

## Release Checklist

- `npm run lint`
- `npm run build`
- `NODE_ENV=production PORT=5555 npm run start`
- `curl http://localhost:5555/api/health`
- `curl http://localhost:5555/api/db/status`
- Open the app and verify the main parent route plus doctor cabinet.
- Set production env vars in Railway before public release.

## Notes

The current app still stores part of the family profile in browser `localStorage`. Doctor access requests and access audit logs can use Railway Postgres through `DATABASE_URL`. True multi-device accounts need the next backend step: auth plus Postgres-backed child profiles, journals, progress, and reports.

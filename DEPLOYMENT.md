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
6. For production persistence, connect Supabase/Postgres:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - optional later: `DATABASE_URL`

Without Supabase env vars, the server uses a local JSON fallback for doctor access requests. That is useful for demos, but it is not durable on Railway restarts.

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

## Release Checklist

- `npm run lint`
- `npm run build`
- `NODE_ENV=production PORT=5555 npm run start`
- `curl http://localhost:5555/api/health`
- Open the app and verify the main parent route plus doctor cabinet.
- Set production env vars in Railway before public release.

## Notes

The current app still stores part of the family profile in browser `localStorage`. Doctor access requests can already use Supabase/PostgREST when configured. True multi-device accounts need the next backend step: Supabase Auth plus Postgres-backed child profiles, journals, progress, and reports.

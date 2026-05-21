# AI Class Survey (`class.situmorang.com`)

Animated SvelteKit survey for AI course students. Captures interest, goals, aptitude signals (Python depth, libraries, behavioral track record), and contact info (name + email + WhatsApp). Admin dashboard with sortable aptitude score and Excel export.

Stack: SvelteKit (Svelte 5, adapter-node) · better-sqlite3 · exceljs.

## Local development

```bash
cp .env.example .env       # set ADMIN_PASSWORD
npm install
npm run dev
```

- Student-facing: <http://localhost:5173/>
- Admin: <http://localhost:5173/admin>

## Environment variables

| var              | required  | example                        | notes                                                            |
| ---------------- | --------- | ------------------------------ | ---------------------------------------------------------------- |
| `ADMIN_PASSWORD` | ✅        | `something-long-and-random`    | Constant-time compared. Set to a real password before deploying. |
| `DB_PATH`        | ✅        | `/data/survey.db`              | SQLite file path. Parent dir created automatically.              |
| `ORIGIN`         | ✅ (prod) | `https://class.situmorang.com` | SvelteKit form actions require this when behind a proxy.         |
| `PORT`           |           | `3000`                         | Defaults to 3000.                                                |
| `HOST`           |           | `0.0.0.0`                      | Container default.                                               |

## Deploying to Coolify

1. **Push to GitHub** (already done via `gh repo create`).
2. **In Coolify → New Resource → Application**:
   - Source: this GitHub repo, `main` branch
   - Build pack: **Dockerfile** (Coolify auto-detects the one at the repo root)
   - Port: `3000`
3. **Environment variables** (Coolify UI):
   ```
   ADMIN_PASSWORD=<set-a-strong-one>
   DB_PATH=/data/survey.db
   ORIGIN=https://class.situmorang.com
   ```
4. **Persistent storage** — add a volume mount:
   - Source: a Coolify-managed volume (e.g. `class-survey-data`)
   - Destination in container: `/data`
   This is what keeps student responses across redeploys.
5. **Domain**: set `class.situmorang.com` as the FQDN. Coolify provisions TLS via Let's Encrypt; Traefik handles the proxy.
6. Deploy.

### Verifying after deploy

- `https://class.situmorang.com/` should load the intro card.
- `https://class.situmorang.com/admin` → login with `ADMIN_PASSWORD`.
- Submit one test response → confirm it appears in admin and `Export .xlsx` works.

### Backups

The whole DB is a single SQLite file at `/data/survey.db`. Snapshot the Coolify volume periodically, or back up inside the container:

```bash
sqlite3 /data/survey.db ".backup '/data/survey-$(date +%F).db'"
```

## Repo layout

```
src/
  lib/
    survey.ts            # questions, option weights, scoreResponse()
    validate.ts          # contact form validation (shared client+server)
    server/
      db.ts              # better-sqlite3 setup + idempotent migrations
      auth.ts            # admin password + cookie session
  routes/
    +page.svelte         # animated student survey
    api/submit/+server.ts
    admin/
      +page.svelte       # dashboard
      +page.server.ts    # load + login/logout/delete actions
      export.xlsx/+server.ts
Dockerfile
```

## Editing the questions

All survey content lives in [`src/lib/survey.ts`](src/lib/survey.ts). Per-option `weight` fields feed into `scoreResponse()` which produces the 0–100 aptitude index shown in admin. `singleBest: true` on a question turns it into radio behavior and uses only the highest-weight pick in scoring.

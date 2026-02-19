# Local Setup

## Mode A — Full production-like (Postgres + Docker)
1. `npm install`
2. `npm run dev:postgres` (or `npm run dev` for auto-detect)

## Mode B — Standalone fallback (SQLite, no Docker)
- Cross-platform shortcut: `npm run dev:sqlite`

### Manual env syntax examples
#### PowerShell
```powershell
$env:DB_MODE="sqlite"
$env:SQLITE_PATH="data/dev.sqlite"
npm run dev
```

#### CMD
```cmd
set DB_MODE=sqlite
set SQLITE_PATH=data/dev.sqlite
npm run dev
```

#### Bash
```bash
DB_MODE=sqlite SQLITE_PATH=data/dev.sqlite npm run dev
```

## Migrate / Seed
- `npm run db:migrate`
- `npm run db:seed`

## Tests
- `npm run test`
- `npm run test:e2e` (auto Postgres/docker or SQLite fallback)
- `npm run test:e2e:sqlite` (force sqlite)
- `npm run smoke`

## Ports
- API: `4000` (e2e: `3000`)
- Customer: `5173`
- Store portal: `5174`
- Mall portal: `5175`
- Platform admin: `5176`

## Beginner flow (Windows ZIP users)
1. Unzip repo.
2. Open terminal in repo.
3. Run `npm install`.
4. Run `npm run dev`.
5. Run `npm run test`.

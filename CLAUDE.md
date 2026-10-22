# ROSE Ecosystem app

A relational currency network for the ROSE community. The product spec is the
PRD, a Google Doc kept outside this repo. When a request conflicts with what you
see in the code, ask before changing direction.

Stack: Next.js (T3) with tRPC, Prisma (client generated into `generated/prisma`),
Turso/libSQL databases, and Vercel hosting. The `~/` import prefix points to `src/`.

## Environments

| | Branch | URL | Database |
|---|---|---|---|
| Production | `main` | https://rose-ecosystem-app.vercel.app | Turso `database-rose-ecosytem` (spelled that way) |
| Dev | `dev` | https://rose-ecosystem-app-git-dev-rose-ecosystem.vercel.app | Turso `rose-ecosystem-dev` |
| Local | any | localhost | local SQLite |

Production must stay ready for demos at all times.

## House rules (do not break these)

1. **Work on `dev`.** Never commit to or push `main` directly; changes reach
   `main` only when the user decides to release.
2. **Only push `main` and `dev`.** Any other branch would get a Vercel preview
   wired to the production database.
3. **Never touch the production database.** Don't run scripts with
   `DB_TARGET=production` unless the user asks for that exact command.
4. **Back up before any schema or data change.** Take a backup of the target
   database first: `DB_TARGET=dev npx tsx scripts/backup.ts`.
5. **Never print, paste or commit secrets.** `.env*.local` files hold database
   tokens. Don't `cat` them, and don't echo their values.
6. **Ask before anything destructive or hard to undo:** restores, dropping
   tables or columns, force-pushes, deleting files, and changing Vercel settings.

## Database scripts

All of these choose their database with `DB_TARGET`: unset means local, or
`dev` or `production`. The shared helper is `scripts/db-target.ts`; it refuses
to run if `.env.dev.local` points at the production database.

- Back up: `DB_TARGET=dev npx tsx scripts/backup.ts` (writes to `backups/`)
- Restore (full replace, wipes the data first): `DB_TARGET=dev npx tsx scripts/restore.ts backups/<file>.json`
- Apply a SQL file (`DB_TARGET` required): `DB_TARGET=dev node scripts/apply-sql.mjs <file>.sql`
- Seed: `SEED_TARGET=dev npx prisma db seed`

**Schema changes:**
1. Edit `prisma/schema.prisma`.
2. Generate the SQL with `npx prisma migrate diff`.
3. Save the SQL under `scripts/migrations/`.
4. Back up the dev database.
5. Apply the SQL to dev with `apply-sql.mjs`.

Production gets the same SQL later, only when the user asks.

Known quirk: production still has an unused `name` column on `Member`. The dev
database doesn't have it.

## Working with the user

- The user (Nimesh) knows Python better than TypeScript. Explain TS/React
  changes in plain terms, one step at a time, and say which file and where.
- Keep changes small and reviewable, and commit in logical steps with clear messages.
- Run the type check and build before saying something works.
- The UI uses the ROSE design tokens in Tailwind: `rose-bg`, `rose-text`, and
  the accent orange `#F74F00`. Keep new screens consistent with the existing ones.

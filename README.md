# ROSE Ecosystem — Phase 1 Prototype

A working prototype of the ROSE Ecosystem's core loop: members, wallets, transactions, rewards, relationship strength, and roles — built as a simple full-stack app, hosted for real, ready to demo on any device.

**Live app:** see your Vercel project dashboard for the current URL (Project → Settings → Domains).

## What this is (and isn't)

This is **Phase 1** — deliberately narrow. It does *not* include:
- Currency exchange or minting (assumed to arrive from elsewhere)
- The multi-project funding lifecycle (Propose → Approve → Fund → Assign → Execute → Close)
- Blockchain infrastructure (this runs on a conventional hosted database; migrating to blockchain is intentional future work, not started)
- Email-based password reset (built and then paused — see "Known gaps" below)

It **does** include: a working frontend app, real accounts with roles (Sponsor / Curator / Maker, multi-role capable), a real transaction ledger, a reward mechanism, manual relationship-strength scoring, and simple password login — all backed by a real, publicly hosted database.

## Tech stack

- **Framework:** Next.js (App Router) + tRPC, scaffolded with `create-t3-app`
- **Database ORM:** Prisma
- **Database:** SQLite locally (a plain file), **Turso** (hosted, distributed SQLite/libSQL) in production
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (auto-deploys from this repo's `main` branch)
- **Auth:** simple name + password login, session via an httpOnly cookie — no third-party auth provider

## Local development

```
npm install
npx prisma generate
npx prisma db push      # creates your local SQLite file from schema.prisma
npx prisma db seed      # loads 10 real team members with starting data
npm run dev
```

Open `http://localhost:3000`. Log in with any seeded name (e.g. `Nimesh`) and the shared default password:

```
rose2026
```

**⚠️ This shared password is a known, deliberate simplification for pilot testing — not real security.** Everyone currently has the same password. Revisit before any wider or longer-lived use.

## Data model

See `prisma/schema.prisma` for the full picture. Core entities:

- **Member** — a person; holds `roles` (Sponsor / Curator / Maker, can hold more than one), a `passwordHash`, and one `Wallet`
- **Wallet** — a balance per currency (currently just `ROSE`); this app doesn't mint or exchange currency, only holds and moves it
- **Transaction** — a Sponsor-style fund/pay action between two members
- **Reward** — a one-directional gift, no exchange expected
- **Evaluation** — a Curator's logged judgment on a piece of work
- **RelationshipStrength** — a manual 0–1 score between two members, per-pair

## Production setup (Vercel + Turso)

The live app runs on **Vercel**, connected to this GitHub repo — every push to `main` auto-deploys. The database is **Turso**, connected via Vercel's Storage integration, which automatically provides two environment variables to the deployed app:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

`src/server/db.ts` checks for these at startup: if present (i.e., running on Vercel), it connects to Turso via the `@prisma/adapter-libsql` driver adapter; otherwise (local dev) it falls back to the plain local SQLite file. `prisma/seed.ts` follows the same pattern, gated behind a `SEED_TARGET=production` flag (see below) so a plain local `npx prisma db seed` can never accidentally touch production.

### Re-seeding production

```
vercel env pull .env.production.local --environment=production
SEED_TARGET=production npx prisma db seed
rm .env.production.local    # clean up afterward — contains real credentials
```

This runs directly against the live Turso database over the network. **It does not require a git push or redeploy** — seeding is a data operation, completely separate from deploying code. The moment it finishes, the live app reflects the new data on its very next request.

### Applying schema changes to production

Prisma's CLI (`db push`, `migrate dev`) cannot connect to Turso directly — it requires a local SQLite connection. The workflow instead:

```
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > turso-init.sql
vercel env pull .env.production.local --environment=production
node scripts/init-turso.mjs      # applies turso-init.sql directly to Turso
```

Note: `--from-empty` is only correct for an empty database. For schema *changes* to an existing production database (adding a column, a new table, etc.), the diff needs to be generated `--from` your current schema state rather than from empty — this hasn't been needed yet, but will be the first time the schema changes after this initial setup.

## Known gaps / deliberate simplifications

- **Shared password, no reset flow.** Everyone uses `rose2026`. Password-reset via email (Resend) was scaffolded and then paused — revisit once ready.
- **No backups.** Turso's free tier doesn't include automatic backups. Fine for pilot data; worth addressing before this holds anything irreplaceable.
- **Default Vercel domain.** Currently `*.vercel.app` — a custom domain is a cosmetic upgrade, not yet done.
- **`npm audit` shows some vulnerabilities.** Routine for a fresh project; not chased down yet, worth a look before wider production use.

## Gotchas hit during setup (so they don't get rediscovered)

- **`@prisma/adapter-libsql` export casing:** the actual export is `PrismaLibSql`, not `PrismaLibSQL` as some docs show.
- **Pass a config object, not a pre-built client**, to `PrismaLibSql` — i.e. `new PrismaLibSql({ url, authToken })`, not `new PrismaLibSql(createClient({...}))`. The latter fails with a confusing "URL undefined" error.
- **Seeding order matters** — `Member.deleteMany()` fails with a foreign key error once related Transactions/Rewards/etc. exist. Dependent tables must be cleared first (see `prisma/seed.ts`).
- **`vercel env pull` defaults to the Development environment** regardless of the filename you choose — always pass `--environment=production` explicitly when you want production values.
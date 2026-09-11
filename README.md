# ROSE Ecosystem — Phase 1 Prototype

A working prototype of the ROSE Ecosystem's core loop: members, wallets, transactions, rewards, relationship strength, and roles — built as a simple full-stack app, hosted for real, ready to demo on any device.

**Live app:** see your Vercel project dashboard for the current URL (Project → Settings → Domains).

## What this is (and isn't)

This is **Phase 1** — deliberately narrow. It does *not* include:
- Currency exchange or minting (assumed to arrive from elsewhere)
- The multi-project funding lifecycle (Propose → Approve → Fund → Assign → Execute → Close)
- Blockchain infrastructure (this runs on a conventional hosted database; migrating to blockchain is intentional future work, not started)
- Email-based password reset (built and then paused — see "Known gaps" below)
- 2FA (email/phone fields exist on the profile specifically to make this easier to add later, but no verification flow exists yet)

It **does** include: a working frontend app, real accounts with roles (Sponsor / Curator / Maker, multi-role capable), a real transaction ledger with balance protection (can't go negative), a reward mechanism, manual relationship-strength scoring, a self-service profile (name, email, phone, roles, username, password), and login — all backed by a real, publicly hosted database.

## Tech stack

- **Framework:** Next.js (App Router) + tRPC, scaffolded with `create-t3-app`
- **Database ORM:** Prisma
- **Database:** SQLite locally (a plain file), **Turso** (hosted, distributed SQLite/libSQL) in production, via the `@prisma/adapter-libsql` driver adapter
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (auto-deploys from this repo's `main` branch)
- **Auth:** username + password login, session via an httpOnly cookie — no third-party auth provider

## Local development

```
npm install
npx prisma generate
npx prisma db push      # creates your local SQLite file from schema.prisma
npx prisma db seed      # loads 10 real team members with starting data
npm run dev
```

Open `http://localhost:3000`. Log in with any seeded person's **username** (not their display name — see "Identity model" below) and the shared default password:

```
rose2026
```

**⚠️ This shared password is a known, deliberate simplification for pilot testing — not real security.** Everyone currently has the same password. Revisit before any wider or longer-lived use.

## Identity model

A member's identity is split into distinct concepts, each with its own purpose:

- **`firstName` / `lastName`** — what's actually displayed everywhere in the app. Computed into a single display string by one function, `displayName()`, in `src/server/api/routers/rose.ts` — change that one function (e.g. to first-name + last-initial, or a separate "screen name" field later) and every screen picks up the change automatically.
- **`username`** — used only for login. Editable by the member (Security section of their profile), checked for uniqueness the same way email and phone are. **Provisional**: likely to be replaced or de-emphasized once a real auth system (2FA, etc.) is built — don't invest further in it without revisiting this.
- **`email` / `phoneNumber`** — optional contact fields, both unique, both intended groundwork for future 2FA (not yet built).

New members (via Onboarding) start with `lastName` and `username` both defaulted to their `firstName` — a deliberate placeholder each person corrects in their own profile, same convention used when migrating existing data.

## Data model

See `prisma/schema.prisma` for the full picture. Core entities:

- **Member** — a person; holds `roles` (Sponsor / Curator / Maker, can hold more than one), identity fields (above), and one `Wallet`
- **Wallet** — a balance per currency (currently just `ROSE`); this app doesn't mint or exchange currency, only holds and moves it. Balances cannot go negative — `sendTransaction` and `sendReward` both check the sender's balance first and reject with a clear error if insufficient.
- **Transaction** — a Sponsor-style fund/pay action between two members
- **Reward** — a one-directional gift, no exchange expected
- **Evaluation** — a Curator's logged judgment on a piece of work
- **RelationshipStrength** — a manual 0–1 score between two members, per-pair
- **PasswordResetToken** — schema exists, unused (see "Known gaps")

## Error handling pattern

Anywhere the app writes a unique field (username, email, phone), errors are caught and translated into a friendly message via `getUniqueConstraintField()` in `rose.ts`. This function checks for a duplicate-value error **two different ways**, because the two database connections used locally vs. in production surface the same underlying error differently:
- Local (plain SQLite connector): a typed Prisma error, code `P2002`, with `meta.target` naming the field.
- Production (Turso via `@prisma/adapter-libsql`): a raw, untyped error whose message contains `UNIQUE constraint failed: Member.<field>`.

If you add a new unique field anywhere, route its write through this same helper rather than assuming the local behavior will match production.

## Production setup (Vercel + Turso)

The live app runs on **Vercel**, connected to this GitHub repo — every push to `main` auto-deploys. The database is **Turso**, connected via Vercel's Storage integration, which automatically provides two environment variables to the deployed app:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

`src/server/db.ts` checks for these at startup: if present (i.e., running on Vercel), it connects to Turso via the `@prisma/adapter-libsql` driver adapter — passing a plain `{ url, authToken }` config object directly (see Gotchas below for why this matters); otherwise (local dev) it falls back to the plain local SQLite file. `prisma/seed.ts` follows the same pattern, gated behind a `SEED_TARGET=production` flag so a plain local `npx prisma db seed` can never accidentally touch production.

### Re-seeding production

```
npx vercel env pull .env.production.local --environment=production
SEED_TARGET=production npx prisma db seed
rm .env.production.local    # clean up afterward — contains real credentials
```

This runs directly against the live Turso database over the network. **It does not require a git push or redeploy** — seeding is a data operation, completely separate from deploying code. The moment it finishes, the live app reflects the new data on its very next request.

### Backup and restore

```
npx tsx scripts/backup.ts                          # local
DB_TARGET=production npx tsx scripts/backup.ts     # production (needs .env.production.local pulled first)
```
Writes a timestamped JSON snapshot of every table to `backups/` (gitignored — contains real names, emails, and password hashes; never commit these).

```
npx tsx scripts/restore.ts backups/<file>.json                          # local
DB_TARGET=production npx tsx scripts/restore.ts backups/<file>.json     # production
```
**Full replace, not a merge** — clears existing data first, then reloads from the file, preserving original IDs so relationships stay intact. Handles both old-shape backups (from before the firstName/lastName/username migration, just `name`) and new-shape ones.

**Always take a fresh backup before any schema change or risky operation.** Restoring an old backup brings back *everything* from that snapshot, including passwords — if you've since changed a password, restoring will revert it too (this is correct behavior, just worth remembering).

### Applying schema changes to production

Prisma's CLI (`db push`, `migrate dev`) cannot connect to Turso directly — it requires a local SQLite connection. The workflow instead:

1. Write the migration as plain SQL by hand, saved under `scripts/migrations/` (numbered sequentially — `migration-002.sql`, `migration-003.sql`, etc.)
2. `npx vercel env pull .env.production.local --environment=production`
3. `node scripts/apply-sql.mjs scripts/migrations/migration-XXX.sql`

For a brand new database only, `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > file.sql` can generate the SQL for you — this is **not** valid for a schema change to an already-populated database, since it tries to recreate every table from scratch. Hand-write the diff instead (see `scripts/migrations/migration-003.sql` for a real example: adding columns with safe defaults, then a unique index, done separately from any backfill).

**On dropping old columns**: when a field is renamed or removed from `schema.prisma` (like `name` → `firstName`/`lastName`), the safe production practice used so far is to **leave the old column in place in the actual database**, unused — Prisma simply ignores columns it doesn't know about. Actually dropping a column is a destructive operation against live data with no practical benefit at this scale; it's a purely cosmetic cleanup that can be done anytime later, with no urgency. Locally, where data is disposable, `npx prisma db push` drops it immediately when asked — that's fine and expected to differ from production.

## Known gaps / deliberate simplifications

- **Shared password, no reset flow.** Everyone uses `rose2026`. Password-reset via email (Resend) was scaffolded (see `email`/`PasswordResetToken` in the schema) and then paused — revisit once ready.
- **Username is provisional.** See "Identity model" above.
- **No backups automation.** Backups are manual (`scripts/backup.ts`), not scheduled. Fine for pilot data; worth automating before this holds anything irreplaceable.
- **Default Vercel domain.** Currently `*.vercel.app` — a custom domain is a cosmetic upgrade, not yet done.
- **`npm audit` shows some vulnerabilities.** Routine for a fresh project; not chased down yet, worth a look before wider production use.

## Gotchas hit during setup (so they don't get rediscovered)

- **`@prisma/adapter-libsql` export casing:** the actual export is `PrismaLibSql`, not `PrismaLibSQL` as some docs show.
- **Pass a config object, not a pre-built client**, to `PrismaLibSql` — i.e. `new PrismaLibSql({ url, authToken })`, not `new PrismaLibSql(createClient({...}))`. The latter fails with a confusing "URL undefined" error. Because of this, `@libsql/client` is **not** a direct dependency of this project — only `@prisma/adapter-libsql` uses it internally.
- **Seeding order matters** — `Member.deleteMany()` fails with a foreign key error once related Transactions/Rewards/etc. exist. Dependent tables must be cleared first (see `prisma/seed.ts` and `scripts/restore.ts`).
- **`vercel env pull` defaults to the Development environment** regardless of the filename you choose — always pass `--environment=production` explicitly when you want production values.
- **Duplicate-value errors look different locally vs. in production** — see "Error handling pattern" above. Any new unique field needs the same two-way check, not just a `P2002` check.
- **Adding a required field to an already-populated table** (e.g. `username`) can't have a fixed shared default at the schema level if the field is also unique — every existing row would get the same value, violating uniqueness immediately. Add it as nullable first, backfill real distinct values via a script, then tighten to required/unique afterward.
- **Every file that ever constructs or reads a raw Member record needs updating together** when the identity fields change — it's not just the obvious app code. `prisma/seed.ts` and `scripts/restore.ts` both got missed in the first pass during the firstName/lastName/username migration and broke the production build separately, one at a time. Grep for the old field name across the whole repo before considering a schema rename complete.
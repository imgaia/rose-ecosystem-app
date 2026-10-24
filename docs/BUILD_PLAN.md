# ROSE Ecosystem: build plan for the v0.8 refactor

This is the step-by-step plan for moving the app to the PRD v0.8 model (nodes, interactions within relationships, capabilities, one ledger). The PRD Google Doc is the source of truth; tabs 2 to 6 specify what to build.

PRD: https://docs.google.com/document/d/1HRgAe84dX2GJ9xPskwVoQphbz6HEFSkePaI8klyygy4/edit
(tab 2 Concepts `?tab=t.ienj5fw6cvu`, tab 3 Use cases `?tab=t.ocjeb6px1hd5`, tab 6 Rules `?tab=t.swj3czdid7d2`)

## How to use this plan

- Work through the steps in order, one at a time, on the `dev` branch.
- Each step has a prompt. Paste it into a **new** Claude Code chat in Cursor. Claude reads `CLAUDE.md` (the house rules) automatically.
- Each step ends with **Done when**. Check those yourself before moving on. Claude should stop at the end of each step and wait for you.
- Commit at the end of each step. Push `dev` when the step is checked, so the dev site updates.
- Production is not touched until step 9, which only happens when you decide to release.

Files that come with this plan:
- `docs/schema-v08.prisma`: the reviewed data model (PRD tab 5).
- `src/server/rules/rules.yaml`: the rules file and capability map (PRD tab 6).

## Ground rules for every step (Claude: read these)

- Amounts are **whole numbers of minor units** (cents). Never use `Float` for money. Format for display with one shared helper.
- Every movement of value goes through **one ledger function** that writes the transaction row and updates both balances in one database transaction. Nothing else changes a balance.
- Every action asks **one rules check** first: `can(person, actingNode, action)`. It uses the capability map from `rules.yaml` and the person's roles in the acting node, and returns `allowed` or the rules that block it.
- Keep changes small. Explain TypeScript changes in plain terms; Nimesh knows Python better than TypeScript.
- Stop at the end of the step and summarise what changed and how to check it.

---

## Step 1. New schema, locally only

**Status: done** · `081fa49`

```
Read docs/BUILD_PLAN.md (ground rules and step 1) and docs/schema-v08.prisma.
Step 1: replace prisma/schema.prisma with the v0.8 model in docs/schema-v08.prisma.
Keep the datasource and generator blocks from the current schema.prisma exactly as they are.
Then generate the full SQL for an empty database with
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
and save it as scripts/migrations/v08-schema.sql.
Create a fresh local SQLite database from it and run npx prisma generate.
Do not touch the dev or production databases. The app will not compile against the new
schema yet; that is expected. Stop and tell me what you did.
```

**Done when:** `prisma validate` passes, `scripts/migrations/v08-schema.sql` exists, and a fresh local database has the new tables.

## Step 2. Reference data and the rules file

**Status: done** · `bb7d470`, then `cb31e7f` (backup.ts made schema-independent)

```
Read docs/BUILD_PLAN.md (ground rules and step 2) and src/server/rules/rules.yaml.
Step 2:
1. Add a loader for src/server/rules/rules.yaml that validates it with zod when the app starts
   and refuses to start if it is invalid. Export the rules, the capability map and the version.
2. Write prisma/seed-reference.ts that creates (idempotently): the roles (native: MEMBER, OWNER,
   TREASURER; optional: CURATOR, COLLABORATOR, APPROVER, PROJECT_OWNER) with display labels,
   the capabilities and the role-capability rows from rules.yaml, and two currencies:
   CHF (fiat, 2 decimals) and RCC (community, 2 decimals, issuer set later in step 3).
3. Add src/server/rates.json with a static CHF to RCC rate of 1.
Run it against the local database only. Stop and show me the seeded rows.
```

**Done when:** the app refuses to start with a broken `rules.yaml`, and the local database has roles, capabilities, the capability map and the two currencies.

## Step 3. Migration script for today's data

**Status: done** · `f7f5cc6`

```
Read docs/BUILD_PLAN.md (ground rules and step 3) and the mapping table in PRD tab 5.3
(summarised below).
Step 3: write scripts/migrate-v08.ts. It reads a backup JSON made by scripts/backup.ts from the
OLD schema and writes the new tables. Mapping:
- Each Member becomes an INDIVIDUAL Node (keep id, names, username, password hash, email, phone)
  holding its own MEMBER, OWNER and TREASURER roles (scope = holder = itself).
- A member who had the CURATOR role also gets the optional CURATOR role on themselves.
  SPONSOR and MAKER are dropped.
- Create one COLLECTION node "ROSE Org". Every member becomes its MEMBER.
  Its OWNER and TREASURER holders come from a config list at the top of the script; ask me
  who they are before running it.
- RCC is issued by ROSE Org. Each member gets an RCC account; the old wallet balance becomes one
  DEPOSIT-like transaction with comment "Opening balance from Phase 1" (no reserve). Also create
  a CHF account per member, marked primary fiat, balance 0.
- Each old Transaction becomes a PAYMENT transaction inside a COMPLETED PAYMENT interaction in the
  relationship between the two members (create the ACTIVE relationship if missing).
- Each old Reward becomes a GIFT transaction inside a COMPLETED GIFT interaction.
- Final balances must equal the old wallet balances AND the sum of each account's ledger rows.
  So the opening balance entry for each member = old wallet balance minus the net of that
  member's migrated history (received minus sent). Write it first, dated before the history.
- Each Evaluation becomes an Activity entry. RelationshipStrength is dropped; create a TrustScore
  of 0.75 for each relationship. PasswordResetTokens are kept.
At the end the script prints a check: for every member, old wallet balance vs new RCC balance,
and counts of old vs new transactions. Run it against a local copy of the dev backup only.
Stop and show me the check output.
```

**Done when:** every member's new RCC balance equals their old wallet balance, the counts match, and you have told Claude who the ROSE Org Owners and Treasurers are.

## Step 4. Core logic, with tests

**Status: done** · `33e5ad5`

```
Read docs/BUILD_PLAN.md (ground rules and step 4) and PRD tabs 2, 3 and 6.
Step 4: build the server-side logic, no screens yet. Put it in src/server/core/.
1. rules.ts: can(personId, actingNodeId, action) using role assignments and the capability map.
2. ledger.ts: postTransaction(...) inside one database transaction; enforces the negative-balance
   limit (R-PAY-02); updates both balances; never edits or deletes rows. Plus recomputeBalance(account).
3. proposals.ts: create a proposal with its required approver rows; decide (approve/decline);
   apply when every approval is in; any decline closes it.
4. interactions.ts: send a payment or gift; request a payment; propose work; accept, decline,
   counter-propose; amend; withdraw; pause/resume; complete/cancel. Creates the relationship as
   PENDING on the first proposal and makes it ACTIVE on the first approval.
5. trust.ts: the stub (start 0.75, close 10% of the gap per completed payment, step down on
   cancellation or failed scheduled payment). Nothing else may import from trust.ts except the
   one place that calls it after a payment, so it stays easy to remove.
Add vitest tests for ledger.ts, rules.ts and the interaction flows (including a collection where
any member accepts money in and only a Treasurer can pay out). Stop and show me the test results.
```

**Done when:** all tests pass, including balances always equalling the sum of the ledger.

## Step 5. API (tRPC routers)

**Status: done** · `c6c907d`, then `4491134` (exchange buys from the issuer; collection invitations add a Member), `7d63aae` (signed session cookie), `33ce381` (Prisma client regenerated), `8ca5536` (placeholder home screen)

```
Read docs/BUILD_PLAN.md (ground rules and step 5).
Step 5: replace the old tRPC routers with new ones on top of src/server/core/: nodes (me, switch
acting node, node page), relationships (list, detail), interactions (all actions from step 4),
proposals (inbox, review, decide), wallet (accounts, transactions, exchange, add funds, mint),
invitations. Every procedure takes the acting node and calls the rules check first, returning the
blocking rule names so the screen can show "Needs Treasurer". Remove routers that served the old
tables. Stop and list the procedures.
```

**Done when:** the app compiles and each procedure refuses actions the person's roles don't allow.

## Step 6. Screens, in slices

**Status: done** · `d9511ac` (role labels for "Needs …" captions), slice 1 `b394e12`, slice 2 `c2ee099`, slice 3 `deb6933`, slice 4 `c4db9b4`, slice 5 `57f4a65`, slice 6 `2c94d41`, slice 7 `3ee2b74`. Checked with the type check, lint, tests and build; trying each slice on the dev site waits for step 8, when the dev database moves to the new model.

Build the screens from the v0.8 wireframes and the ROSE Ecosystem design system, one slice per chat. After each slice, push `dev` and try it on the dev site.

```
Read docs/BUILD_PLAN.md (ground rules and step 6). The wireframes are in the ROSE App Wireframes
canvas; the screen list is PRD tab 4.
Step 6, slice [N]: build [SLICE]. Use the existing design tokens (rose-bg, rose-text, accent).
Actions a person's roles don't allow stay visible but disabled, labelled with the role they need.
```

Slices, in this order:
1. The shell: header with the node name and switcher, three tabs (Home, Relationships, Wallet), the + button.
2. Home: proposals inbox and recent activity; review a proposal.
3. Relationships: list (one card per node, totals each way), relationship detail, interaction detail.
4. Send a payment or gift; request a payment; propose work (and counter-propose / amend).
5. Wallet: balances and transactions; add funds (record a deposit); exchange; mint.
6. Node page: identity, roles and capabilities, rules, members (collections).
7. Invite someone and join from an invitation (replaces Onboard).

**Done when:** each slice works on the dev site, acting as yourself and as the ROSE Org.

## Step 6b. Identity, roles and members

**Status: done** · `06a1266`

Built after step 6, before step 7, so nothing the old app could do is lost and collections can be governed from the app. Server side in `src/server/core/identity.ts` and `governance.ts`, routers `identity` and `members`, screens under `src/app/_components/node/`.

- **Edit identity** (UC-ID-02 to UC-ID-04): names (or a collection's name), about, email, phone, photo URL; username (unique, ignoring case) and password (needs the current one, at least 8 characters). Needs EDIT_IDENTITY: a person for themselves, a collection's Owners for it. Username and password only while acting as yourself.
- **Role changes in a collection** (UC-COL-06, UC-GOV-02): an Owner proposes adding or ending a role holder. It applies once the affected member and every Owner approve (R-GOV-08); the proposing Owner's approval is given by proposing. Every native role keeps a holder (R-GOV-03), checked when proposed and again when applied.
- **Add a member** (UC-COL-04): an Owner picks a node from their own relationships (R-COL-02) and proposes the Member role; the node and the Owners accept.
- **Leave a collection** (UC-COL-05): at once, giving up every role there, unless a native role would lose its last holder.
- **Remove a member** (UC-COL-10): any member proposes it with a reason; the remaining members approve by the collection's R-COL-04 share (all by default, half rounded up, or Owners only). Any decline closes it.
- All of these go through the existing proposals and inbox. The proposal engine (`proposals.ts`) gained two options for this: approvals given by proposing, and a handler-set approval threshold. The uniqueness check (R-MEM-01) moved to `identity.ts` and covers every node.
- Not yet: optional roles on an individual (part of UC-GOV-02), showing photos in avatars, and removing the old `/api/change-password` route, which nothing uses any more.

**Done when:** the tests pass (they do: 124) and, after step 8, each of these works on the dev site.

## Step 7. Scheduled payments

```
Step 7: add a daily job (a Vercel cron calling a protected API route) that runs due scheduled
payments through ledger.ts, writes the automatic comment, notifies both nodes, and cancels the
schedule when a payment fails (R-PAY-05). Add a test.
```

## Step 8. Move the dev database

First, before moving anything:
1. Update `scripts/restore.ts` to read backup format 2 (what `scripts/backup.ts` writes since `cb31e7f`) and test it locally: back up the local database, restore it, and compare.
2. Rename `.env.production.local` to `.env.prod-secrets`, so Next.js never loads it, and update `scripts/db-target.ts` and `scripts/apply-sql.mjs` to read the new name.
3. Add `SESSION_SECRET` in Vercel for Preview, branch `dev` only.

Only after steps 1 to 7 work locally.

```
Step 8: move the DEV database to the new model.
1. DB_TARGET=dev npx tsx scripts/backup.ts  (keep the file).
2. Show me the SQL that drops the old tables on dev, then apply it and scripts/migrations/v08-schema.sql
   with scripts/apply-sql.mjs (DB_TARGET=dev). Ask me before each.
3. Run the migration script against the dev backup, writing to dev. Show me the check output.
Never use DB_TARGET=production in this step.
```

**Done when:** the dev site runs on the new model with everyone's balances intact.

## Step 9. Release to production (later, your decision)

Same as step 8 with `DB_TARGET=production`, at a quiet moment, after a fresh production backup and merging `dev` into `main`. Do this together, not from a single prompt.

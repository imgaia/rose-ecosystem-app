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
- **Role changes in a collection** (UC-COL-06, UC-GOV-02): an Owner proposes adding or ending a role holder. It applies once those R-GOV-08 names approve: in rules.yaml, the affected member and any one Owner (deciding for the collection; the proposing Owner's approval is given by proposing). Every native role keeps a holder (R-GOV-03), checked when proposed and again when applied.
- **Add a member** (UC-COL-04): an Owner picks a node from their own relationships (R-COL-02) and proposes the Member role; the node and the Owners accept.
- **Leave a collection** (UC-COL-05): at once, giving up every role there, unless a native role would lose its last holder.
- **Remove a member** (UC-COL-10): any member proposes it with a reason; the remaining members approve by the collection's R-COL-04 share (all by default, half rounded up, or an Owner alone). Declines count as R-GOV-06 says: by default a decline closes it only once the share can no longer be reached (where every approval is needed, that is the first decline).
- All of these go through the existing proposals and inbox. Who approves, the share needed and how declines count are not hard-coded: `proposals.ts` reads them from rules.yaml (R-GOV-08 `approvers`, R-COL-04 share and `approvers`, R-GOV-06 `declines`), with the collection's own rule values first, and keeps what it read with each proposal. The uniqueness check (R-MEM-01) moved to `identity.ts` and covers every node.
- Not yet: optional roles on an individual (part of UC-GOV-02), showing photos in avatars, and removing the old `/api/change-password` route, which nothing uses any more.

**Done when:** the tests pass (they do: 124) and, after step 8, each of these works on the dev site.

## Step 7. Scheduled payments

**Status: done** · checked with the tests (139), type check, lint and build; the manual script ran on the local database.

- The job is `runDuePayments` in `src/server/core/schedules.ts`. Each due date is claimed (nextDueAt moved on, or the interaction completed after its last payment) in the same database transaction as its payment, so a due date is never paid twice, however often the job runs. It pays through `payScheduled` and ends schedules through `endSchedule` in `interactions.ts`, so the trust score is still reached only from there.
- A failed payment (e.g. R-PAY-02) cancels the schedule, tells both nodes in their activity and steps the trust score down (R-PAY-05).
- From rules.yaml (R-PAY-04): the automatic comment ("Scheduled payment 3 of 12: Rent", or "Scheduled payment 3: Rent" with no number of payments agreed) and what to do with due dates the job missed (`pay_each`, or `skip`).
- Scheduled payments are recorded with `actedByPersonId = "system:schedule"`; that is also how "3 of 12" is counted.
- The cron: `GET /api/cron/due-payments`, daily at 05:00 UTC (`vercel.json`). It refuses any request without `Authorization: Bearer <CRON_SECRET>`, and every request while CRON_SECRET is unset. Vercel cron only runs on production, so production's payments start only once step 9 is released and CRON_SECRET is set there.
- By hand: `npx tsx scripts/run-due-payments.ts` (local) or `DB_TARGET=dev npx tsx scripts/run-due-payments.ts`; it refuses `DB_TARGET=production`.

```
Step 7: add a daily job (a Vercel cron calling a protected API route) that runs due scheduled
payments through ledger.ts, writes the automatic comment, notifies both nodes, and cancels the
schedule when a payment fails (R-PAY-05). Add a test.
```

## Step 8. Move the dev database

**Status: dev database moved on 25 Oct 2026; click-through on the dev site to do** · prep `31aa322`, `7ad4f43`, drop SQL `d996842`

- From backup `backup-dev-2026-10-25T12-46-03-813Z.json` (kept in `backups/`; `scripts/restore.ts` puts the old schema back from it). Dropped the eight old tables (`scripts/migrations/v08-drop-old-tables.sql`), applied `v08-schema.sql`, ran `prisma/seed-reference.ts` and `scripts/migrate-v08.ts`: check passed, all 10 balances equal the old wallets.
- `run-due-payments.ts` ran once on dev: 0 paid, 0 errors (no interaction has a due date yet).
- `prisma/seed.ts` (old tables) removed; `npx prisma db seed` now runs `prisma/seed-reference.ts`.

First, before moving anything:
1. Update `scripts/restore.ts` to read backup format 2 (what `scripts/backup.ts` writes since `cb31e7f`) and test it locally: back up the local database, restore it, and compare.
2. Rename `.env.production.local` to `.env.prod-secrets`, so Next.js never loads it, and update `scripts/db-target.ts` and `scripts/apply-sql.mjs` to read the new name.
3. Add `SESSION_SECRET` and `CRON_SECRET` in Vercel for Preview, branch `dev` only (each at least 32 characters: `openssl rand -base64 48`).

Only after steps 1 to 7 work locally.

```
Step 8: move the DEV database to the new model.
1. DB_TARGET=dev npx tsx scripts/backup.ts  (keep the file).
2. Show me the SQL that drops the old tables on dev, then apply it and scripts/migrations/v08-schema.sql
   with scripts/apply-sql.mjs (DB_TARGET=dev). Ask me before each.
3. Run the migration script against the dev backup, writing to dev. Show me the check output.
Never use DB_TARGET=production in this step.
```

**Done when:** the dev site runs on the new model with everyone's balances intact, and the scheduled payments have run once on dev by hand (`DB_TARGET=dev npx tsx scripts/run-due-payments.ts`; Vercel cron doesn't run there) with no errors.

## Step 9. Release to production (later, your decision)

Same as step 8 with `DB_TARGET=production`, at a quiet moment, after a fresh production backup and merging `dev` into `main`. Do this together, not from a single prompt.

## Step 10. Node currencies

Source of truth: PRD tab 2, section 2.8 "Node currencies" (including "Exchange rates"); use cases UC-FIN-01, 03, 07, 08, 09 and UC-GOV-08 (tab 3); screens S10, S11, S15, S27 (tab 4); the Exchange rate entity (tab 5); rules R-FIN-01, 04, 05 and R-FIN-10 to R-FIN-15 (tab 6). Wireframes: the four "Node currencies" boards in the Wallet row of the ROSE App Wireframes canvas (Currencies, Create a currency, Currency detail: RCC, Convert), plus the updated "Wallet, acting as Nimesh".

What it adds, in one paragraph: every node has a country, a primary fiat that defaults from it, and one home currency (its primary fiat, a collection's currency it inherits, or one of its own). A node can create, edit, retire or delete its own currencies (each with a reserve in its reserve fiat). Any currency converts into any other through the two issuers' reserves at their prices; each issuer sets a conversion policy per currency: `reserve` (default; only as far as the reserves cover) or `open` (straight swaps at the price are also allowed beyond the reserve, if both currencies are open).

Three slices, one chat each. Stop at the end of each.

### 10a. Data, rules and core logic (no screens, local database only)

**Status: done** · checked with the tests (160), type check, lint and build; applied to the local database only.

- One change from the plan below, agreed when it came up: per-currency rule values live in a new table `CurrencyRuleValue` (currencyId, ruleId, value) instead of a currency column on NodeRuleValue. SQLite can't change NodeRuleValue's primary key without rebuilding the table, so this way `v10-currencies.sql` only creates tables and adds columns. Nothing is dropped or copied.
- R-FIN-11's approvers are `one_of: TREASURER` and `one_of: OWNER`, a new kind of entry read by `proposals.ts`: each holder of the role is asked as themselves, and one approval among them is enough. Proposing counts for every entry the proposer meets, as in 6b, so a person who is both Treasurer and Owner of a collection applies a change at once.
- Local database: backed up (`backup-local-2026-10-30T11-51-35-205Z.json`), SQL applied, then `scripts/backfill-v10.ts`: 11 nodes set to CH, RCC home currency for the 10 migrated members and ROSE Org, RCC price 1 CHF from the v0.8 migration, CHF/EUR 1.0844 from Frankfurter; all 20 balances equal their ledger.
- `src/server/rates.json` is gone; every rate goes through `src/server/core/rates.ts`. The Exchange screen and `wallet.exchange` now run on `convert`; the screen gets its proper Convert form in 10b.

Schema (`prisma/schema.prisma`, plus `scripts/migrations/v10-currencies.sql` generated for an existing v0.8 database, ALTERs only, no drops):
- Node: `country` (ISO 3166 code, e.g. "CH"), `homeCurrencyId` (nullable, to Currency).
- Currency: `description`, `status` (ACTIVE | RETIRED), `reserveCurrencyId` (the reserve fiat, nullable for fiat), `country` (fiat only). Keep the existing `code` column; the screens call it "symbol".
- NodeRuleValue: allow a value per currency (for R-FIN-01 reserve ratio and R-FIN-10 conversion policy). Watch out: SQLite treats NULLs in a unique key as distinct, so use a non-null sentinel or a separate id plus a unique index that works.
- ProposalKind: add CURRENCY_CHANGE (create, edit, retire, delete).
- New ExchangeRate model: `fromCurrencyId`, `toCurrencyId`, `rate` (exact decimal as text, like Transaction.rate), `validFrom`, `validTo` (null = current), `source` (FEED | RESERVE_RATIO | MANUAL), `setBy`, `createdAt`. Index on (fromCurrencyId, toCurrencyId, validFrom). Rows are never updated except to set `validTo` when the next rate arrives, and never deleted.

Rules (`rules.yaml`, bump the version):
- R-FIN-01 becomes per currency (`currency_level: true`); it also sets the price: one unit costs the reserve ratio in the reserve fiat.
- Update R-FIN-04 and R-FIN-05 wording as in PRD tab 6.
- New: R-FIN-10 conversion policy (values `reserve` | `open`, default `reserve`, per currency); R-FIN-11 currency changes need a Treasurer and an Owner (approvers in the file, same mechanism as R-GOV-07 and 6b); R-FIN-12 retire, not delete, once held; decimals fixed once units exist; R-FIN-13 primary fiat defaults from the country; R-FIN-14 no fiat-to-fiat conversion, and conversion through reserves needs the same reserve fiat; R-FIN-15 rates are never changed or deleted, a new rate closes the previous one, every transaction records the rate it used. R-FIN-05 now points at the rates table.
- The loader learns `currency_level`.

Reference data and backfill (in the seed and in a backfill script for existing databases):
- Fiat list: CHF (CH) and EUR (EU countries).
- Exchange rates: move what `src/server/rates.json` holds into the ExchangeRate table, then delete the file. Fetch today's CHF/EUR rate from the feed once when seeding (fall back to a clearly labelled MANUAL placeholder if offline). Write a price row (source RESERVE_RATIO) for RCC: 1.0 CHF, valid from the v0.8 migration date.
- Every existing node: country CH. RCC: reserve fiat CHF. Home currency: RCC for the migrated members and ROSE Org; primary fiat for anyone else.

Core (`src/server/core/currencies.ts`, reusing ledger.ts and proposals.ts):
- `src/server/core/rates.ts` becomes the single way to read rates: `getRate(from, to, at = now)` looks up the row valid at that moment (either direction, inverting when needed) and works out other pairs through the reserve fiats. Nothing else reads the ExchangeRate table, so a different source can replace the feed later.
- `setRate(from, to, rate, validFrom, source, setBy)`: closes the current row and adds the new one in one database transaction.
- Creating a currency, or changing its reserve ratio, writes its price row automatically.
- Daily rate feed (`src/server/core/rateFeed.ts`): fetch the latest rates for every fiat on the fiat list from Frankfurter (`https://api.frankfurter.dev`, free, no key, central-bank data based on the ECB), and write a FEED row only when a rate has changed. Run it from the existing daily cron route from step 7 (one cron, two jobs; still protected by CRON_SECRET), plus a manual script `scripts/fetch-rates.ts` (local by default, accepts DB_TARGET=dev, refuses production for now). If the feed fails, keep the last rate and log it; never invent one. The fetch goes through a small adapter so the source can be swapped.
- `scripts/set-rate.ts`: manual override for a fiat-to-fiat rate (source MANUAL), for when the feed is down. Same DB_TARGET rules.
- create / edit / retire / delete a currency through a CURRENCY_CHANGE proposal; for an individual it applies at once. Delete only if no account has ever held it. Retired: no minting or buying into it; balances stay usable and convertible.
- `setHomeCurrency`, `setPrimaryFiat` (Treasurer capability SET_UP_CURRENCY). Leaving a collection whose currency is the home currency resets it to the primary fiat.
- `convert(fromAccount, toCurrency, amount)`: replaces today's exchange. Through reserves: units out of the person's account, fiat from issuer A's reserve to issuer B's reserve, units of B minted to the person, all in one database transaction with one groupId (kind EXCHANGE). Buying with fiat skips the first leg; converting into fiat skips the last. If a reserve can't cover it all, do a straight swap only when both currencies are open; otherwise refuse with the rule names. Money stays in whole minor units; round down what the person receives and record the rate used.
- Mint reads the per-currency reserve ratio.

Tests: the feed adapter is mocked (no network in tests): a changed rate writes a new FEED row, an unchanged one writes nothing, a failed fetch keeps the last rate; a new rate closes the previous one and history lookups return the rate valid at a past date; changing a reserve ratio writes a new price row; rate between two node currencies; convert through reserves (balances and reserves move, ledger sums hold); refused when a reserve is short and a currency is `reserve`; straight swap when both are `open`; fiat-to-fiat refused; different reserve fiats refused through reserves; retired currency can't be bought or minted; delete refused once held; collection currency creation needs Treasurer and Owner, individual applies at once; leaving a collection resets home currency.

**Done when:** tests, type check, lint and build pass; the local database has the new columns and backfill; every balance still equals the sum of its ledger.

### 10b. Screens

From the wireframes: Wallet (total in the home currency; buttons Convert, Add funds, Mint, Currencies), S15 Currencies (home currency, primary fiat, issued by you, you hold, Create a currency), Create / Edit currency form (price preview from the reserve ratio, policy switch, "Needs a Treasurer and an Owner" for collections), S27 Currency detail (anyone: name, symbol, issuer, price and its history, policy, status; Treasurers of the issuer: reserve, units in circulation, share backed), S11 Convert (rate, what you receive, the refusal message naming the rule), and country on Edit identity. Actions a person's roles don't allow stay visible but disabled, labelled with the role they need.

**Done when:** each screen works locally as an individual and as ROSE Org; nothing errors in the browser console.

### 10c. Move dev

Back up dev; show the SQL, then apply `v10-currencies.sql` and the backfill to dev (DB_TARGET=dev), asking before each; check every balance is unchanged and equals its ledger; push dev and click through. Never DB_TARGET=production.

**Done when:** the dev site shows currencies, the home currency and conversion, with everyone's balances unchanged.

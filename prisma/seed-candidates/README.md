# Seed candidates

Snapshots of the dev database, scrubbed so they are safe to commit, kept as
possible starting data for a fresh database. Each is a format 2 backup (as
written by `scripts/backup.ts`), so it carries its own schema.

Scrubbed in every candidate:

- emails and phones: replaced by unique placeholders (`member-01@example.org`,
  `invitee-01@example.org`, `+00 000 000 0001`); a username that was an email
  address becomes `member-NN`
- password hashes: all replaced by the hash of one test password (below)
- invitation tokens: replaced by `scrubbed-<id>`, so no invitation link works
- password-reset tokens: removed

Everything else is unchanged: names, balances, the ledger, currencies, rates,
roles and relationships.

The full, unscrubbed copy of each stays outside git, in
`backups/seed-candidates/<date>-dev-full.json`.

## Making one

One command takes a fresh dev backup (read-only on dev), keeps the full copy
and writes today's scrubbed candidate. It never overwrites an existing one.

```
npx tsx scripts/scrub-seed-candidate.ts
```

To scrub an existing backup instead, pass it:
`npx tsx scripts/scrub-seed-candidate.ts backups/<file>.json`. Then add a row
for the new candidate to the table below.

## Loading one

Into the local database, or a throwaway SQLite file. The script refuses dev
and production. It is a full replace: the target's tables are dropped first.

```
npx tsx scripts/load-seed-candidate.ts prisma/seed-candidates/2026-11-04-dev.json
npx tsx scripts/load-seed-candidate.ts prisma/seed-candidates/2026-11-04-dev.json --db /tmp/try.sqlite
```

Log in with any person's username and the test password `seed-candidate-2026`.

## Candidates

| Date | File | From | Rows |
|---|---|---|---|
| 2026-11-04 | [2026-11-04-dev.json](2026-11-04-dev.json) | dev | 12 nodes, 34 accounts, 57 transactions, 24 interactions, 13 relationships, 51 role assignments, 8 currencies, 7 rates |

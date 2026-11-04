// scripts/scrub-seed-candidate.ts
// Makes a seed candidate (see prisma/seed-candidates/README.md) in one go:
//   1. takes a fresh dev backup with backup.ts (read-only on dev),
//   2. keeps the full copy as backups/seed-candidates/<date>-dev-full.json (git-ignored),
//   3. writes a scrubbed copy, safe to commit, as prisma/seed-candidates/<date>-dev.json.
//
// Scrubbed: emails and phones (unique placeholders), usernames that are email
// addresses, every password hash (one test password's hash), invitation tokens
// and password-reset tokens. Everything else is copied unchanged.
//
// Usage:
//   npx tsx scripts/scrub-seed-candidate.ts                   (fresh dev backup)
//   npx tsx scripts/scrub-seed-candidate.ts backups/<file>.json   (an existing backup instead)

import { execFileSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import bcrypt from "bcryptjs";

const TEST_PASSWORD = "seed-candidate-2026";

type Row = Record<string, unknown>;
interface Backup {
  format: number;
  tables: Record<string, Row[]>;
  [key: string]: unknown;
}

// Today's local date, e.g. 2026-11-04.
const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fullFile = `backups/seed-candidates/${date}-dev-full.json`;
const scrubbedFile = `prisma/seed-candidates/${date}-dev.json`;

for (const file of [fullFile, scrubbedFile]) {
  if (existsSync(file)) {
    console.error(`${file} already exists. Move it away first; this script never overwrites a candidate.`);
    process.exit(1);
  }
}

// 1. The source: an existing backup, or a fresh one of dev.
let source = process.argv[2];
if (!source) {
  const out = execFileSync("npx", ["tsx", "scripts/backup.ts"], {
    env: { ...process.env, DB_TARGET: "dev" },
    encoding: "utf-8",
  });
  process.stdout.write(out);
  source = /Backup written to (\S+)/.exec(out)?.[1];
  if (!source) throw new Error("Couldn't find the backup file name in backup.ts's output.");
}

// 2. The full copy.
mkdirSync("backups/seed-candidates", { recursive: true });
copyFileSync(source, fullFile);

// 3. The scrubbed copy.
const backup = JSON.parse(readFileSync(source, "utf-8")) as Backup;
if (backup.format !== 2 || !backup.tables?.Node) throw new Error(`${source} is not a format 2 backup.`);

const hash = bcrypt.hashSync(TEST_PASSWORD, 10);
const pad = (n: number, width = 2) => String(n).padStart(width, "0");
const isEmail = (v: unknown) => typeof v === "string" && v.includes("@");
const counts = { emails: 0, phones: 0, usernames: 0, passwords: 0, invitationTokens: 0, resetTokens: 0 };

let m = 0;
for (const node of backup.tables.Node) {
  if (!node.email && !node.phone && !node.passwordHash && node.kind !== "INDIVIDUAL") continue;
  m++;
  if (node.email) { node.email = `member-${pad(m)}@example.org`; counts.emails++; }
  if (node.phone) { node.phone = `+00 000 000 ${pad(m, 4)}`; counts.phones++; }
  if (isEmail(node.username)) { node.username = `member-${pad(m)}`; counts.usernames++; }
  if (node.passwordHash) { node.passwordHash = hash; counts.passwords++; }
}

let i = 0;
for (const invitation of backup.tables.Invitation ?? []) {
  i++;
  if (invitation.email) { invitation.email = `invitee-${pad(i)}@example.org`; counts.emails++; }
  if (invitation.phone) { invitation.phone = `+00 000 001 ${pad(i, 4)}`; counts.phones++; }
  // Required and unique, so it can't be null: a value no real token hashes to.
  invitation.tokenHash = `scrubbed-${String(invitation.id)}`;
  counts.invitationTokens++;
}

counts.resetTokens = backup.tables.PasswordResetToken?.length ?? 0;
if (backup.tables.PasswordResetToken) backup.tables.PasswordResetToken = [];

backup.seedCandidate = {
  date,
  source: "dev",
  scrubbed: "emails, phones, email-like usernames, password hashes, invitation and reset tokens",
};

// Check: none of the originals survive anywhere in the scrubbed file.
const original = JSON.parse(readFileSync(source, "utf-8")) as Backup;
const out = JSON.stringify(backup, null, 2) + "\n";
const secrets = [...(original.tables.Node ?? []), ...(original.tables.Invitation ?? []), ...(original.tables.PasswordResetToken ?? [])]
  .flatMap((r) => [r.email, r.phone, r.passwordHash, r.tokenHash, r.token, isEmail(r.username) ? r.username : null])
  .filter((v): v is string => typeof v === "string" && v !== "");
if (secrets.some((s) => out.includes(JSON.stringify(s)))) throw new Error("STOP: an original email, phone, hash or token survived the scrub.");

mkdirSync("prisma/seed-candidates", { recursive: true });
writeFileSync(scrubbedFile, out);

console.log(`Full copy (git-ignored): ${fullFile}`);
console.log(`Scrubbed copy:           ${scrubbedFile}`);
console.log(`  replaced ${counts.emails} emails, ${counts.phones} phones, ${counts.usernames} usernames, ${counts.passwords} password hashes, ${counts.invitationTokens} invitation tokens; removed ${counts.resetTokens} reset tokens`);
console.log("Next: add a row for it to prisma/seed-candidates/README.md.");

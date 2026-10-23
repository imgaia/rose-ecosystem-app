// scripts/migrate-v08.ts
// Moves Phase 1 data (Member / Wallet / Transaction / Reward ...) into the
// v0.8 model (Node / Account / Interaction / one ledger). It reads a backup
// JSON made by scripts/backup.ts from the OLD schema and writes the new
// tables. See PRD tab 5.3 and docs/BUILD_PLAN.md step 3.
//
// The target database must already have the v0.8 schema and the reference
// seed (roles, capabilities, CHF and RCC), and no nodes yet. Everything is
// written in one database transaction: it all goes in or nothing does.
//
// Usage:
//   npx tsx scripts/migrate-v08.ts backups/backup-dev-....json          (local)
//   DB_TARGET=dev npx tsx scripts/migrate-v08.ts backups/backup-dev-....json

import { readFileSync } from "fs";
import { getDbTarget, createPrismaFor } from "./db-target";
import { rulesVersion } from "../src/server/rules/index";

// ROSE Org's Owners and Treasurers, by old username (confirmed by Nimesh).
const ROSE_ORG_OWNERS = ["Nimesh", "Annie", "Theo"];
const ROSE_ORG_TREASURERS = ["Nimesh", "Theo"];
// The root of the invitation tree: every other member is recorded as invited by them.
const ROOT_MEMBER = "Theo";

const ROSE_ORG_NAME = "ROSE Org";
const OPENING_COMMENT = "Opening balance from Phase 1";

// ───────────────────────── Old rows, as backup.ts writes them ─────────────────────────

interface OldMember {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  passwordHash: string | null;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string;
}
interface OldMove {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  note: string | null;
  createdAt: string;
}
interface OldBackup {
  format: number;
  tables: {
    Member: OldMember[];
    MemberRole: { id: string; memberId: string; role: "SPONSOR" | "CURATOR" | "MAKER" }[];
    Wallet: { id: string; memberId: string; currency: string; balance: number }[];
    Transaction: OldMove[];
    Reward: OldMove[];
    Evaluation: { id: string; curatorId: string; subject: string; note: string | null; createdAt: string }[];
    RelationshipStrength: unknown[];
    PasswordResetToken: { id: string; token: string; memberId: string; expiresAt: string; used: boolean | number; createdAt: string }[];
  };
}

// Old amounts were Float whole units; the new ledger uses whole cents.
function toCents(amount: number): number {
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 1e-6) throw new Error(`Amount ${amount} is not a whole number of cents.`);
  return cents;
}

const fmt = (cents: number) => (cents / 100).toFixed(2);

// ───────────────────────── Main ─────────────────────────

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("Usage: npx tsx scripts/migrate-v08.ts <path-to-old-backup.json>");
  process.exit(1);
}

const target = getDbTarget();
console.log(`Migrating ${backupFile} into the ${target.toUpperCase()} database.`);
const prisma = createPrismaFor(target);

async function main(file: string) {
  const backup = JSON.parse(readFileSync(file, "utf-8")) as OldBackup;
  if (backup.format !== 2 || !backup.tables?.Member || !backup.tables?.Wallet) {
    throw new Error("This is not a format 2 backup of the OLD schema (needs Member and Wallet tables).");
  }
  const old = backup.tables;

  // ── Pre-flight checks on the target ──
  if ((await prisma.node.count()) > 0) throw new Error("The target already has nodes. Migrate into an empty v0.8 database only.");
  const roleKeys = (await prisma.role.findMany()).map((r) => r.key);
  for (const key of ["MEMBER", "OWNER", "TREASURER", "CURATOR"]) {
    if (!roleKeys.includes(key)) throw new Error(`Role ${key} missing. Run prisma/seed-reference.ts first.`);
  }
  const rcc = await prisma.currency.findFirst({ where: { code: "RCC", kind: "COMMUNITY" } });
  const chf = await prisma.currency.findFirst({ where: { code: "CHF", kind: "FIAT" } });
  if (!rcc || !chf) throw new Error("RCC or CHF currency missing. Run prisma/seed-reference.ts first.");

  // ── Pre-flight checks on the backup ──
  const byUsername = new Map(old.Member.map((m) => [m.username, m]));
  const memberIds = new Set(old.Member.map((m) => m.id));
  const orgOwnerIds = ROSE_ORG_OWNERS.map((u) => byUsername.get(u)?.id ?? fail(`Owner "${u}" is not a username in the backup.`));
  const orgTreasurerIds = ROSE_ORG_TREASURERS.map((u) => byUsername.get(u)?.id ?? fail(`Treasurer "${u}" is not a username in the backup.`));
  const rootId = byUsername.get(ROOT_MEMBER)?.id ?? fail(`Root member "${ROOT_MEMBER}" is not a username in the backup.`);
  for (const x of [...old.Transaction, ...old.Reward]) {
    if (!memberIds.has(x.senderId) || !memberIds.has(x.recipientId)) fail(`Row ${x.id} refers to an unknown member.`);
    if (x.senderId === x.recipientId) fail(`Row ${x.id} pays a member to themselves.`);
    if (x.currency !== "ROSE") fail(`Row ${x.id} is in ${x.currency}; only ROSE is expected.`);
  }
  const oldBalance = new Map(old.Member.map((m) => [m.id, 0]));
  for (const w of old.Wallet) oldBalance.set(w.memberId, toCents(w.balance));

  // Each member's net migrated history (received minus sent), and earliest date in it.
  const net = new Map(old.Member.map((m) => [m.id, 0]));
  const firstSeen = new Map(old.Member.map((m) => [m.id, new Date(m.createdAt)]));
  for (const x of [...old.Transaction, ...old.Reward]) {
    const cents = toCents(x.amount);
    net.set(x.recipientId, net.get(x.recipientId)! + cents);
    net.set(x.senderId, net.get(x.senderId)! - cents);
    for (const id of [x.senderId, x.recipientId]) {
      const at = new Date(x.createdAt);
      if (at < firstSeen.get(id)!) firstSeen.set(id, at);
    }
  }

  await prisma.$transaction(
    async (tx) => {
      // ── Nodes: one INDIVIDUAL per member, with its own native roles ──
      for (const m of old.Member) {
        const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
        const createdAt = new Date(m.createdAt);
        await tx.node.create({
          data: {
            id: m.id,
            kind: "INDIVIDUAL",
            name,
            firstName: m.firstName,
            lastName: m.lastName,
            username: m.username,
            passwordHash: m.passwordHash,
            email: m.email,
            phone: m.phoneNumber,
            createdAt,
          },
        });
        const own = ["MEMBER", "OWNER", "TREASURER"];
        if (old.MemberRole.some((r) => r.memberId === m.id && r.role === "CURATOR")) own.push("CURATOR");
        for (const roleKey of own) {
          await tx.roleAssignment.create({ data: { scopeNodeId: m.id, holderNodeId: m.id, roleKey, createdAt } });
        }
      }

      // ── Invitations: everyone except the root was invited by the root ──
      // Joining creates no relationship (R-MEM-03), so none is added here.
      for (const m of old.Member) {
        if (m.id === rootId) continue;
        const createdAt = new Date(m.createdAt);
        await tx.invitation.create({
          data: {
            inviterNodeId: rootId,
            name: [m.firstName, m.lastName].filter(Boolean).join(" "),
            tokenHash: `migrated-${m.id}`,
            status: "ACCEPTED",
            expiresAt: createdAt,
            acceptedNodeId: m.id,
            createdAt,
          },
        });
      }

      // ── ROSE Org: everyone is a Member; Owners and Treasurers from the config ──
      const org = await tx.node.create({ data: { kind: "COLLECTION", name: ROSE_ORG_NAME } });
      const orgRoles = [
        ...old.Member.map((m) => ({ holderNodeId: m.id, roleKey: "MEMBER" })),
        ...orgOwnerIds.map((id) => ({ holderNodeId: id, roleKey: "OWNER" })),
        ...orgTreasurerIds.map((id) => ({ holderNodeId: id, roleKey: "TREASURER" })),
      ];
      for (const r of orgRoles) await tx.roleAssignment.create({ data: { scopeNodeId: org.id, ...r } });
      await tx.currency.update({ where: { id: rcc.id }, data: { issuerNodeId: org.id } });

      // ── Accounts: RCC (balance filled in at the end) and primary-fiat CHF ──
      const rccAccount = new Map<string, string>();
      for (const m of old.Member) {
        const a = await tx.account.create({ data: { nodeId: m.id, currencyId: rcc.id, createdAt: new Date(m.createdAt) } });
        rccAccount.set(m.id, a.id);
        await tx.account.create({ data: { nodeId: m.id, currencyId: chf.id, isPrimaryFiat: true, createdAt: new Date(m.createdAt) } });
      }

      // ── Opening balances, dated before each member's history ──
      // Amounts stay positive: a negative opening (the member had spent into
      // debt) flows out of the account instead of into it.
      for (const m of old.Member) {
        const opening = oldBalance.get(m.id)! - net.get(m.id)!;
        const account = rccAccount.get(m.id)!;
        await tx.transaction.create({
          data: {
            kind: "OPENING_BALANCE",
            toAccountId: opening >= 0 ? account : null,
            fromAccountId: opening >= 0 ? null : account,
            amount: Math.abs(opening),
            comment: OPENING_COMMENT,
            actedByPersonId: m.id,
            createdAt: new Date(firstSeen.get(m.id)!.getTime() - 1000),
          },
        });
      }

      // ── History: each old Transaction / Reward → a completed interaction ──
      const relationshipFor = new Map<string, string>();
      async function relationship(a: string, b: string, at: Date) {
        const [nodeAId, nodeBId] = a < b ? [a, b] : [b, a];
        const key = `${nodeAId}|${nodeBId}`;
        let id = relationshipFor.get(key);
        if (!id) {
          // History is processed oldest first, so this is when the pair first interacted.
          const r = await tx.relationship.create({
            data: { nodeAId, nodeBId, status: "ACTIVE", createdAt: at, formedAt: at },
          });
          await tx.trustScore.create({ data: { relationshipId: r.id, value: 0.75 } });
          id = r.id;
          relationshipFor.set(key, id);
        }
        return id;
      }

      const history = [
        ...old.Transaction.map((x) => ({ ...x, kind: "PAYMENT" as const })),
        ...old.Reward.map((x) => ({ ...x, kind: "GIFT" as const })),
      ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      for (const x of history) {
        const at = new Date(x.createdAt);
        const amount = toCents(x.amount);
        const interaction = await tx.interaction.create({
          data: {
            relationshipId: await relationship(x.senderId, x.recipientId, at),
            kind: x.kind,
            payerNodeId: x.senderId,
            payeeNodeId: x.recipientId,
            proposerNodeId: x.senderId,
            status: "COMPLETED",
            createdAt: at,
            terms: {
              create: {
                version: 1,
                description: x.note,
                amount,
                currencyId: rcc.id,
                rulesVersion,
                approved: true,
                createdAt: at,
              },
            },
          },
        });
        // Keep the old row id so a ledger row can be traced back to Phase 1.
        await tx.transaction.create({
          data: {
            id: x.id,
            kind: x.kind,
            fromAccountId: rccAccount.get(x.senderId)!,
            toAccountId: rccAccount.get(x.recipientId)!,
            amount,
            comment: x.note ?? "",
            interactionId: interaction.id,
            actedByPersonId: x.senderId,
            createdAt: at,
          },
        });
      }

      // ── Evaluations → Activity on the curator ──
      for (const e of old.Evaluation) {
        await tx.activity.create({
          data: {
            nodeId: e.curatorId,
            type: "evaluation.recorded",
            refId: e.id,
            summary: e.note ? `Evaluated ${e.subject}: ${e.note}` : `Evaluated ${e.subject}`,
            createdAt: new Date(e.createdAt),
          },
        });
      }

      // ── Password reset tokens, now pointing at the node ──
      for (const t of old.PasswordResetToken ?? []) {
        await tx.passwordResetToken.create({
          data: {
            id: t.id,
            token: t.token,
            nodeId: t.memberId,
            expiresAt: new Date(t.expiresAt),
            used: Boolean(t.used),
            createdAt: new Date(t.createdAt),
          },
        });
      }

      // ── Balances = sum of each account's ledger rows ──
      for (const accountId of rccAccount.values()) {
        const inSum = await tx.transaction.aggregate({ where: { toAccountId: accountId }, _sum: { amount: true } });
        const outSum = await tx.transaction.aggregate({ where: { fromAccountId: accountId }, _sum: { amount: true } });
        const balance = (inSum._sum.amount ?? 0) - (outSum._sum.amount ?? 0);
        await tx.account.update({ where: { id: accountId }, data: { balance } });
      }
    },
    { timeout: 120_000 },
  );

  await printCheck(old, oldBalance, rootId);
}

// ───────────────────────── The check ─────────────────────────

async function printCheck(old: OldBackup["tables"], oldBalance: Map<string, number>, rootId: string) {
  let ok = true;
  console.log("\nBalances (RCC)");
  console.log(`  ${"member".padEnd(12)}${"old wallet".padStart(12)}${"new balance".padStart(13)}${"ledger sum".padStart(12)}`);
  for (const m of old.Member) {
    const account = await prisma.account.findFirstOrThrow({ where: { nodeId: m.id, currency: { code: "RCC" }, isReserve: false } });
    const rows = await prisma.transaction.findMany({
      where: { OR: [{ toAccountId: account.id }, { fromAccountId: account.id }] },
    });
    const ledger = rows.reduce((s, r) => s + (r.toAccountId === account.id ? r.amount : -r.amount), 0);
    const want = oldBalance.get(m.id)!;
    const match = want === account.balance && account.balance === ledger;
    if (!match) ok = false;
    console.log(
      `  ${m.username.padEnd(12)}${fmt(want).padStart(12)}${fmt(account.balance).padStart(13)}${fmt(ledger).padStart(12)}  ${match ? "ok" : "MISMATCH"}`,
    );
  }

  const count = (kind: "PAYMENT" | "GIFT") => prisma.transaction.count({ where: { kind } });
  const counts: [string, number, number][] = [
    ["Members → individual nodes", old.Member.length, await prisma.node.count({ where: { kind: "INDIVIDUAL" } })],
    ["Transactions → PAYMENT rows", old.Transaction.length, await count("PAYMENT")],
    ["Transactions → PAYMENT interactions", old.Transaction.length, await prisma.interaction.count({ where: { kind: "PAYMENT", status: "COMPLETED" } })],
    ["Rewards → GIFT rows", old.Reward.length, await count("GIFT")],
    ["Rewards → GIFT interactions", old.Reward.length, await prisma.interaction.count({ where: { kind: "GIFT", status: "COMPLETED" } })],
    ["Opening balance rows (one per member)", old.Member.length, await prisma.transaction.count({ where: { kind: "OPENING_BALANCE" } })],
    ["Deposits / withdrawals (should be none)", 0, await prisma.transaction.count({ where: { kind: { in: ["DEPOSIT", "WITHDRAWAL"] } } })],
    ["Accepted invitations (all but the root)", old.Member.length - 1, await prisma.invitation.count({ where: { status: "ACCEPTED", inviterNodeId: rootId } })],
    ["Evaluations → Activity", old.Evaluation.length, await prisma.activity.count({ where: { type: "evaluation.recorded" } })],
    ["Password reset tokens", (old.PasswordResetToken ?? []).length, await prisma.passwordResetToken.count()],
  ];
  console.log("\nCounts                                     old    new");
  for (const [label, was, now] of counts) {
    if (was !== now) ok = false;
    console.log(`  ${label.padEnd(40)}${String(was).padStart(5)}${String(now).padStart(7)}  ${was === now ? "ok" : "MISMATCH"}`);
  }

  const relationships = await prisma.relationship.count();
  const trust = await prisma.trustScore.count();
  console.log(`\nRelationships created: ${relationships} (trust scores: ${trust}); old RelationshipStrength rows dropped: ${old.RelationshipStrength.length}`);
  const org = await prisma.node.findFirstOrThrow({ where: { kind: "COLLECTION", name: ROSE_ORG_NAME }, include: { rolesHeldHere: { include: { holder: true } } } });
  for (const role of ["MEMBER", "OWNER", "TREASURER"]) {
    const holders = org.rolesHeldHere.filter((r) => r.roleKey === role).map((r) => r.holder.username);
    console.log(`ROSE Org ${role.padEnd(9)} (${holders.length}): ${holders.join(", ")}`);
  }
  const curators = await prisma.roleAssignment.findMany({ where: { roleKey: "CURATOR" }, include: { holder: true } });
  console.log(`CURATOR on self: ${curators.map((c) => c.holder.username).join(", ")}`);

  console.log(ok ? "\nCHECK PASSED" : "\nCHECK FAILED");
  if (!ok) process.exitCode = 1;
}

function fail(message: string): never {
  throw new Error(message);
}

main(backupFile)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

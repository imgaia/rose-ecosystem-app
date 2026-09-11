// prisma/seed.ts
import { readFileSync } from "fs";
import { parse } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Only load production credentials when explicitly requested — this keeps
// a plain `npx prisma db seed` always safely targeting your local database
// by default, with no risk of accidentally reseeding production.
let tursoUrl: string | undefined;
let tursoAuthToken: string | undefined;

if (process.env.SEED_TARGET === "production") {
  const parsed = parse(readFileSync(".env.production.local", "utf-8"));
  tursoUrl = parsed.TURSO_DATABASE_URL;
  tursoAuthToken = parsed.TURSO_AUTH_TOKEN;
  console.log(
    "Seeding PRODUCTION (Turso). URL found:",
    tursoUrl ? tursoUrl.slice(0, 30) + "..." : "MISSING",
    "| Auth token found:",
    tursoAuthToken ? "yes" : "MISSING",
  );
} else {
  console.log("Seeding LOCAL database (no SEED_TARGET=production set).");
}

const prisma = tursoUrl
  ? new PrismaClient({
      adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoAuthToken }),
    })
  : new PrismaClient();

const PEOPLE: { firstName: string; roles: ("SPONSOR" | "CURATOR" | "MAKER")[]; balance: number }[] = [
  { firstName: "Nimesh",   roles: ["SPONSOR", "CURATOR"], balance: 340 },
  { firstName: "Theo",     roles: ["SPONSOR"],            balance: 220 },
  { firstName: "Richard",  roles: ["CURATOR"],            balance: 90 },
  { firstName: "Annie",    roles: ["CURATOR", "MAKER"],   balance: 60 },
  { firstName: "Reiner",   roles: ["MAKER"],              balance: 15 },
  { firstName: "James",    roles: ["SPONSOR"],            balance: 180 },
  { firstName: "Thibault", roles: ["CURATOR"],            balance: 75 },
  { firstName: "Adam",     roles: ["MAKER"],              balance: 0 },
  { firstName: "Pierre",   roles: ["SPONSOR"],            balance: 150 },
  { firstName: "Ryan",     roles: ["MAKER"],              balance: 30 },
];

// Everyone starts with the same shared default password for this pilot.
const passwordHash = bcrypt.hashSync("rose2026", 10);

async function main() {
  // Clear dependent records first — Member can't be deleted while
  // Transactions, Rewards, Evaluations, Relationships, or Wallets still
  // reference it (foreign key constraints correctly prevent that).
  await prisma.relationshipStrength.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.memberRole.deleteMany();
  await prisma.member.deleteMany();

  const byIndex: { id: string; firstName: string }[] = [];
  const members: Record<string, { id: string }> = {};

  for (const p of PEOPLE) {
    const member = await prisma.member.create({
      data: {
        firstName: p.firstName,
        // Same placeholder convention used in the production migration —
        // each person corrects both in their own profile later.
        lastName: p.firstName,
        username: p.firstName,
        passwordHash,
        roles: { create: p.roles.map((role) => ({ role })) },
        wallet: { create: { currency: "ROSE", balance: p.balance } },
      },
    });
    if (!members[p.firstName]) members[p.firstName] = member;
    byIndex.push({ id: member.id, firstName: p.firstName });
  }

  const nimesh = byIndex[0]!;
  const theo = members["Theo"]!;
  const annie = members["Annie"]!;
  const reiner = members["Reiner"]!;
  const ryan = members["Ryan"]!;

  await prisma.transaction.create({
    data: { senderId: nimesh.id, recipientId: reiner.id, amount: 50, note: "Nursery fencing materials" },
  });
  await prisma.transaction.create({
    data: { senderId: theo.id, recipientId: nimesh.id, amount: 100, note: "Funding round 2" },
  });
  await prisma.reward.create({
    data: { senderId: nimesh.id, recipientId: annie.id, amount: 20, note: "Great writeup on the pilot" },
  });
  await prisma.evaluation.create({
    data: { curatorId: nimesh.id, subject: "Reiner", note: "Fencing work confirmed complete" },
  });

  const strengths: [string, string, number][] = [
    [nimesh.id, reiner.id, 0.7],
    [nimesh.id, theo.id, 0.4],
    [nimesh.id, annie.id, 0.9],
    [nimesh.id, ryan.id, 0.3],
  ];
  for (const [memberAId, memberBId, strength] of strengths) {
    await prisma.relationshipStrength.create({ data: { memberAId, memberBId, strength } });
  }

  console.log(
    "Seeded members:",
    byIndex.map((m) => `${m.firstName} (${m.id.slice(0, 8)})`).join(", ")
  );
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
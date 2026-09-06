// prisma/seed.ts
import { readFileSync } from "fs";
import { parse } from "dotenv";
import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Only load production credentials when explicitly requested — this keeps
// a plain `npx prisma db seed` always safely targeting your local database
// by default. We read and parse the file directly ourselves (rather than
// relying on it being auto-injected into process.env) so there's no
// ambiguity about whether the values actually made it through.
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

const PEOPLE: { name: string; roles: ("SPONSOR" | "CURATOR" | "MAKER")[]; balance: number }[] = [
  { name: "Nimesh",   roles: ["SPONSOR", "CURATOR"], balance: 340 },
  { name: "Theo",     roles: ["SPONSOR"],            balance: 220 },
  { name: "Richard",  roles: ["CURATOR"],            balance: 90 },
  { name: "Annie",    roles: ["CURATOR", "MAKER"],   balance: 60 },
  { name: "Reiner",   roles: ["MAKER"],              balance: 15 },
  { name: "James",    roles: ["SPONSOR"],            balance: 180 },
  { name: "Thibault", roles: ["CURATOR"],            balance: 75 },
  { name: "Adam",     roles: ["MAKER"],              balance: 0 },
  { name: "Pierre",   roles: ["SPONSOR"],            balance: 150 },
  { name: "Ryan",     roles: ["MAKER"],              balance: 30 },
];

async function main() {
  await prisma.member.deleteMany();

  const byIndex: { id: string; name: string }[] = [];
  const members: Record<string, { id: string }> = {};

  for (const p of PEOPLE) {
    const member = await prisma.member.create({
      data: {
        name: p.name,
        roles: { create: p.roles.map((role) => ({ role })) },
        wallet: { create: { currency: "ROSE", balance: p.balance } },
      },
    });
    if (!members[p.name]) members[p.name] = member;
    byIndex.push({ id: member.id, name: p.name });
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
    byIndex.map((m) => `${m.name} (${m.id.slice(0, 8)})`).join(", ")
  );
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
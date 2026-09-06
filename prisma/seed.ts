// prisma/seed.ts
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync("rose2026", 10);

// Nimesh listed first in PEOPLE for predictable seed ordering.
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
  await prisma.transaction.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.relationshipStrength.deleteMany();
  await prisma.memberRole.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.member.deleteMany();

  const members: Record<string, { id: string }> = {};
  const byIndex: { id: string; name: string }[] = [];

  for (const p of PEOPLE) {
    const member = await prisma.member.create({
      data: {
        name: p.name,
        passwordHash,
        roles: { create: p.roles.map((role) => ({ role })) },
        wallet: { create: { currency: "ROSE", balance: p.balance } },
      },
    });
    // Key non-duplicate names directly; keep an index list too (handles the two James's).
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
// prisma/seed-reference.ts
// Reference data the app needs before anyone signs up: roles, capabilities,
// the capability map (which roles carry which capability) and the currencies.
// Safe to run again: it only adds what is missing and keeps the capability
// map in line with rules.yaml.
//
//   npx tsx prisma/seed-reference.ts                      -> local database
//   SEED_TARGET=dev npx tsx prisma/seed-reference.ts      -> dev database

import { getDbTarget, createPrismaFor } from "../scripts/db-target";
import { capabilityMap, roles, rulesVersion } from "../src/server/rules/index";

const target = getDbTarget("SEED_TARGET");
console.log(`Seeding reference data into the ${target.toUpperCase()} database (rules ${rulesVersion}).`);
const prisma = createPrismaFor(target);

// Display labels. Keys are fixed; labels can be renamed later in the database,
// so a re-run never overwrites them.
const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Member",
  OWNER: "Owner",
  TREASURER: "Treasurer",
  CURATOR: "Curator",
  COLLABORATOR: "Collaborator",
  APPROVER: "Approver",
  PROJECT_OWNER: "Project owner",
};

const CAPABILITIES: Record<string, { label: string; description: string }> = {
  INTERACT: { label: "Interact", description: "Request payments, propose work where the node is paid, accept money coming in" },
  INVITE: { label: "Invite", description: "Invite someone to join" },
  VIEW: { label: "View", description: "See the node's roles, rules and activity" },
  PROPOSE_REMOVAL: { label: "Propose removal", description: "Propose removing a member" },
  PAY: { label: "Pay", description: "Send payments and gifts, propose or accept work where the node pays, set up schedules" },
  ADD_FUNDS: { label: "Add funds", description: "Record a deposit into the node's accounts" },
  MINT: { label: "Mint", description: "Mint community currency against the reserve" },
  EXCHANGE: { label: "Exchange", description: "Exchange between currencies" },
  WITHDRAW: { label: "Withdraw", description: "Withdraw to primary fiat" },
  SET_UP_CURRENCY: { label: "Set up currency", description: "Create the node's own currency" },
  VIEW_BALANCES: { label: "View balances", description: "See the node's balances" },
  EDIT_IDENTITY: { label: "Edit identity", description: "Change the node's name, description and photo" },
  EDIT_GOVERNANCE: { label: "Edit governance", description: "Change optional roles, role holders and rule values" },
  ADD_MEMBERS: { label: "Add members", description: "Add members to a collection" },
  VERIFY_WORK: { label: "Verify work", description: "Confirm that work was done" },
};

// Currency.code is not unique by design, so we find these by code + kind.
const CURRENCIES = [
  { code: "CHF", name: "Swiss franc", kind: "FIAT", decimals: 2 },
  // Issuer (ROSE Org) is set by the migration in step 3.
  { code: "RCC", name: "Rose Currency Contribution", kind: "COMMUNITY", decimals: 2 },
] as const;

async function main() {
  // Roles
  for (const key of [...roles.native, ...roles.optional]) {
    const label = ROLE_LABELS[key];
    if (!label) throw new Error(`No display label for role ${key}. Add it to ROLE_LABELS.`);
    const native = roles.native.includes(key);
    await prisma.role.upsert({
      where: { key },
      create: { key, label, native },
      update: { native },
    });
  }

  // Capabilities
  for (const key of Object.keys(capabilityMap)) {
    const info = CAPABILITIES[key];
    if (!info) throw new Error(`No label/description for capability ${key}. Add it to CAPABILITIES.`);
    await prisma.capability.upsert({
      where: { key },
      create: { key, ...info },
      update: {},
    });
  }

  // Capability map: add missing rows, remove rows rules.yaml no longer has.
  const wanted = Object.entries(capabilityMap).flatMap(([capabilityKey, roleKeys]) =>
    roleKeys.map((roleKey) => ({ roleKey, capabilityKey })),
  );
  const existing = await prisma.roleCapability.findMany();
  const isWanted = (row: { roleKey: string; capabilityKey: string }) =>
    wanted.some((w) => w.roleKey === row.roleKey && w.capabilityKey === row.capabilityKey);
  const toAdd = wanted.filter((w) => !existing.some((e) => e.roleKey === w.roleKey && e.capabilityKey === w.capabilityKey));
  const toRemove = existing.filter((e) => !isWanted(e));

  for (const row of toAdd) await prisma.roleCapability.create({ data: row });
  for (const row of toRemove) {
    await prisma.roleCapability.delete({ where: { roleKey_capabilityKey: row } });
  }
  console.log(`Capability map: ${toAdd.length} added, ${toRemove.length} removed, ${wanted.length} total.`);

  // Currencies
  for (const c of CURRENCIES) {
    const found = await prisma.currency.findFirst({ where: { code: c.code, kind: c.kind } });
    if (found) continue;
    await prisma.currency.create({ data: { ...c } });
    console.log(`Created currency ${c.code}.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

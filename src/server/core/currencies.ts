// src/server/core/currencies.ts
// Node currencies (PRD 2.8).
//
// - A node's own currencies (UC-FIN-07 to 09): create, edit, retire or delete
//   one through a CURRENCY_CHANGE proposal. Who approves is read from
//   rules.yaml (R-FIN-11: a Treasurer and an Owner); for an individual both
//   are the person, so it applies at once. A currency someone has held can
//   only be retired, and its decimals are fixed once units exist (R-FIN-12).
//   Its reserve ratio and conversion policy are kept per currency
//   (R-FIN-01, R-FIN-10), and every new ratio writes its price row.
// - Home currency and primary fiat (R-FIN-04, R-FIN-07, R-FIN-13).
// - Converting (UC-FIN-03): any currency into any other, through the two
//   issuers' reserves at their prices; beyond the reserve only as a straight
//   swap, when both currencies are open (R-FIN-10). Never fiat into fiat, and
//   through reserves only between currencies backed by the same fiat (R-FIN-14).
//
// Value moves only through postTransaction (ledger.ts); rates only through
// rates.ts. The quote functions do the arithmetic without moving anything,
// so a screen can show "you will receive ..." before the person confirms.

import { randomUUID } from "crypto";
import { formatAmount } from "~/lib/money";
import { getRule } from "~/server/rules";
import type { Currency, Proposal, ProposalKind } from "../../../generated/prisma";
import { actorName, recordActivity } from "./activity";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { postTransaction } from "./ledger";
import { createProposal, decide, readPayload, withdraw, type ProposalHandler } from "./proposals";
import { applyRate, deleteRatesOfUnheldCurrency, getRate, parseDecimal, rateOf, setRate, type Rate } from "./rates";
import { assertCan } from "./rules";

// ───────────────────────── Per-currency rule values ─────────────────────────

/** A currency_level rule's value for this currency (CurrencyRuleValue), or the default in rules.yaml. */
async function currencyRule(db: Db, currencyId: string, ruleId: string): Promise<string> {
  const own = await db.currencyRuleValue.findUnique({ where: { currencyId_ruleId: { currencyId, ruleId } } });
  return String(own?.value ?? getRule(ruleId)?.default ?? "");
}

/** R-FIN-01: the currency's reserve ratio, which is also its price in its reserve fiat. */
export async function reserveRatio(db: Db, currencyId: string): Promise<string> {
  return (await currencyRule(db, currencyId, "R-FIN-01")) || "1";
}

export type ConversionPolicy = "reserve" | "open";

/** R-FIN-10: how far conversion may go. Fiat has no policy: no one issues it. */
export async function conversionPolicy(db: Db, currencyId: string): Promise<ConversionPolicy> {
  return (await currencyRule(db, currencyId, "R-FIN-10")) === "open" ? "open" : "reserve";
}

/**
 * A node currency's price now: one unit in its reserve fiat (R-FIN-01, read
 * from the rates table). Null for fiat, or a currency with no price yet.
 */
export async function priceOf(db: Db, currencyId: string) {
  const currency = await db.currency.findUniqueOrThrow({ where: { id: currencyId }, include: { reserveCurrency: true } });
  if (currency.kind === "FIAT" || !currency.reserveCurrency) return null;
  const rate = await getRate(db, currency.id, currency.reserveCurrency.id).catch(() => null);
  return rate ? { rate: rate.text, fiat: currency.reserveCurrency } : null;
}

/** 1 / ratio, the rate minting uses: one unit costs the ratio in the reserve fiat (R-FIN-01). */
export function mintRate(ratio: string): Rate {
  const r = parseDecimal(ratio);
  return rateOf(r.den, r.num);
}

function checkRatio(text: string) {
  try {
    parseDecimal(text);
  } catch {
    throw new RuleError("The reserve ratio must be a number above 0, like 1 or 0.5", ["R-FIN-01"]);
  }
}

function checkPolicy(value: string) {
  const allowed = getRule("R-FIN-10")?.values ?? ["reserve", "open"];
  if (!allowed.includes(value)) throw new RuleError(`The conversion policy must be one of: ${allowed.join(", ")}`, ["R-FIN-10"]);
}

// ───────────────────────── Primary fiat and home currency ─────────────────────────

/** R-FIN-13: the fiat on the fiat list whose countries include this one, if any. */
export async function fiatForCountry(db: Db, country: string | null | undefined) {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  const fiats = await db.currency.findMany({ where: { kind: "FIAT" }, orderBy: { createdAt: "asc" } });
  return fiats.find((f) => (f.country ?? "").split(",").map((c) => c.trim()).includes(code)) ?? null;
}

/**
 * The node's primary fiat currency (R-FIN-07): the currency of the account
 * marked primary, or, if it has none yet, its country's (R-FIN-13).
 */
export async function primaryFiatOf(db: Db, nodeId: string): Promise<Currency> {
  const account = await db.account.findFirst({ where: { nodeId, isPrimaryFiat: true }, include: { currency: true } });
  if (account) return account.currency;
  const node = await db.node.findUniqueOrThrow({ where: { id: nodeId }, select: { name: true, country: true } });
  const fiat = await fiatForCountry(db, node.country);
  if (!fiat) throw new RuleError(`${node.name} has no primary fiat: set its country first`, ["R-FIN-07", "R-FIN-13"]);
  return fiat;
}

/** The node's primary fiat account, opened if it has none yet (R-FIN-07). */
export async function primaryFiatAccount(tx: Tx, nodeId: string) {
  const existing = await tx.account.findFirst({ where: { nodeId, isPrimaryFiat: true } });
  if (existing) return existing;
  const fiat = await primaryFiatOf(tx, nodeId);
  return tx.account.upsert({
    where: { nodeId_currencyId_isReserve_backsCurrencyId: { nodeId, currencyId: fiat.id, isReserve: false, backsCurrencyId: "" } },
    create: { nodeId, currencyId: fiat.id, isPrimaryFiat: true },
    update: { isPrimaryFiat: true },
  });
}

/** R-FIN-04: the home currency; a node that hasn't picked one uses its primary fiat. */
export async function homeCurrencyOf(db: Db, nodeId: string): Promise<Currency> {
  const node = await db.node.findUniqueOrThrow({ where: { id: nodeId }, include: { homeCurrency: true } });
  return node.homeCurrency ?? primaryFiatOf(db, nodeId);
}

/**
 * R-FIN-04: pick the home currency: the primary fiat, a currency of a
 * collection the node is a Member of, or one of its own.
 */
export async function setHomeCurrency(db: Db, actor: Actor, input: { currencyId: string }) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "SET_UP_CURRENCY");
    const currency = await tx.currency.findUniqueOrThrow({ where: { id: input.currencyId } });
    if (currency.status === "RETIRED") throw new RuleError(`${label(currency)} is retired`, ["R-FIN-12"]);
    if (!(await canBeHomeCurrency(tx, actor.actingNodeId, currency))) {
      throw new RuleError("The home currency is the primary fiat, a currency of a collection this node belongs to, or one of its own", [
        "R-FIN-04",
      ]);
    }
    return writeHomeCurrency(tx, actor.actingNodeId, currency, await actorName(tx, actor.personId, actor.actingNodeId));
  });
}

/** R-FIN-04: could this node pick the currency as its home currency? (Not if it is retired.) */
export async function canBeHomeCurrency(db: Db, nodeId: string, currency: Currency) {
  if (currency.status === "RETIRED") return false;
  if (currency.kind === "FIAT") return (await primaryFiatOf(db, nodeId).catch(() => null))?.id === currency.id;
  if (currency.issuerNodeId === nodeId) return true;
  if (!currency.issuerNodeId) return false;
  const member = await db.roleAssignment.findFirst({
    where: { scopeNodeId: currency.issuerNodeId, holderNodeId: nodeId, roleKey: "MEMBER", endedAt: null },
  });
  return !!member;
}

/** Make it the home currency and log it; `by` is who did it, for the activity line. */
async function writeHomeCurrency(tx: Tx, nodeId: string, currency: Currency, by: string) {
  const node = await tx.node.update({ where: { id: nodeId }, data: { homeCurrencyId: currency.id } });
  await recordActivity(tx, {
    type: "currency.home_set",
    refId: currency.id,
    nodeIds: [node.id],
    summary: `${by} made ${label(currency)} the home currency`,
  });
  return node;
}

/**
 * R-FIN-07, R-FIN-13: mark another fiat from the fiat list as primary. A node
 * whose home currency was the old primary fiat moves to the new one.
 */
export async function setPrimaryFiat(db: Db, actor: Actor, input: { currencyId: string }) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "SET_UP_CURRENCY");
    const fiat = await tx.currency.findUniqueOrThrow({ where: { id: input.currencyId } });
    if (fiat.kind !== "FIAT") throw new RuleError("The primary fiat must be a fiat currency from the fiat list", ["R-FIN-13"]);
    const node = await tx.node.findUniqueOrThrow({ where: { id: actor.actingNodeId } });
    const old = await primaryFiatOf(tx, node.id).catch(() => null);

    await tx.account.updateMany({ where: { nodeId: node.id, isPrimaryFiat: true }, data: { isPrimaryFiat: false } });
    const account = await tx.account.upsert({
      where: { nodeId_currencyId_isReserve_backsCurrencyId: { nodeId: node.id, currencyId: fiat.id, isReserve: false, backsCurrencyId: "" } },
      create: { nodeId: node.id, currencyId: fiat.id, isPrimaryFiat: true },
      update: { isPrimaryFiat: true },
    });
    if (!node.homeCurrencyId || node.homeCurrencyId === old?.id) {
      await tx.node.update({ where: { id: node.id }, data: { homeCurrencyId: fiat.id } });
    }
    await recordActivity(tx, {
      type: "currency.primary_fiat_set",
      refId: fiat.id,
      nodeIds: [node.id],
      summary: `${await actorName(tx, actor.personId, actor.actingNodeId)} made ${label(fiat)} the primary fiat`,
    });
    return account;
  });
}

/**
 * R-FIN-04: a node that leaves (or is removed from) a collection whose
 * currency is its home currency falls back to its primary fiat.
 * governance.ts calls this in the same database transaction as the leaving.
 */
export async function resetHomeCurrencyOnLeaving(tx: Tx, nodeId: string, collectionId: string) {
  const node = await tx.node.findUniqueOrThrow({ where: { id: nodeId }, include: { homeCurrency: true } });
  if (node.homeCurrency?.issuerNodeId !== collectionId) return;
  const fiat = await primaryFiatOf(tx, nodeId).catch(() => null);
  await tx.node.update({ where: { id: nodeId }, data: { homeCurrencyId: fiat?.id ?? null } });
}

// ───────────────────────── Creating and changing a currency ─────────────────────────

export interface CurrencyFields {
  name: string;
  code: string; // the symbol on screens
  description: string | null;
  decimals: number;
  reserveRatio: string; // R-FIN-01
  policy: ConversionPolicy; // R-FIN-10
}

/** What a CURRENCY_CHANGE proposal stores: a new currency's full fields, or the change to one. */
export type CurrencyChangePayload =
  | { action: "CREATE"; fields: CurrencyFields; makeHome?: boolean } // makeHome: the issuer's home currency once created
  | { action: "EDIT"; currencyId: string; fields: Partial<CurrencyFields> }
  | { action: "RETIRE"; currencyId: string }
  | { action: "DELETE"; currencyId: string };

/** What a caller passes: a new currency needs only a name and a symbol, the rest has defaults. */
export type CurrencyChangeInput =
  | { action: "CREATE"; fields: Pick<CurrencyFields, "name" | "code"> & Partial<CurrencyFields>; makeHome?: boolean }
  | Exclude<CurrencyChangePayload, { action: "CREATE" }>;

/**
 * UC-FIN-07 to 09: the acting node proposes creating, editing, retiring or
 * deleting one of its currencies. It applies once R-FIN-11's approvers agree
 * (at once for an individual).
 */
export async function proposeCurrencyChange(db: Db, actor: Actor, input: CurrencyChangeInput & { comment?: string }) {
  const payload = normalise(input);
  return inTransaction(db, async (tx) => {
    const issuerId = actor.actingNodeId;
    await assertCan(tx, actor.personId, issuerId, "SET_UP_CURRENCY");
    await checkChange(tx, issuerId, payload);
    if (payload.action !== "CREATE") {
      const open = await tx.proposal.findMany({ where: { kind: "CURRENCY_CHANGE", subjectNodeId: issuerId, status: "OPEN" } });
      const sameCurrency = (p: Proposal) => {
        const other = readPayload<CurrencyChangePayload>(p);
        return other.action !== "CREATE" && other.currencyId === payload.currencyId;
      };
      if (open.some(sameCurrency)) throw new RuleError("A change to this currency is already waiting for approval");
    }
    const proposal = await createProposal(
      tx,
      {
        kind: "CURRENCY_CHANGE",
        proposerNodeId: issuerId,
        proposedByPersonId: actor.personId,
        subjectNodeId: issuerId,
        payload,
        comment: textOrNull(input.comment) ?? undefined,
        approvalRule: { approversRuleId: "R-FIN-11", scopeNodeId: issuerId, affectedNodeId: issuerId },
        preApprovedNodeIds: [issuerId, actor.personId],
      },
      currencyChangeHandler,
    );
    if (proposal.status === "OPEN") await log(tx, proposal, "proposed", actor.personId);
    return proposal;
  });
}

/** Trimmed fields, with defaults for a new currency (rules.yaml for ratio and policy). */
function normalise(input: CurrencyChangeInput): CurrencyChangePayload {
  const clean = <T extends Partial<CurrencyFields>>(f: T): T => ({
    ...f,
    ...(f.name !== undefined ? { name: f.name.trim() } : {}),
    ...(f.code !== undefined ? { code: f.code.trim() } : {}),
    ...(f.description !== undefined ? { description: textOrNull(f.description) } : {}),
    ...(f.reserveRatio !== undefined ? { reserveRatio: String(f.reserveRatio).trim() } : {}),
  });
  if (input.action === "EDIT") return { ...input, fields: clean(input.fields) };
  if (input.action !== "CREATE") return input;
  const f = clean(input.fields);
  return {
    action: "CREATE",
    ...(input.makeHome ? { makeHome: true } : {}),
    fields: {
      name: f.name,
      code: f.code,
      description: f.description ?? null,
      decimals: f.decimals ?? 2,
      reserveRatio: f.reserveRatio ?? String(getRule("R-FIN-01")?.default ?? "1"),
      policy: f.policy ?? (String(getRule("R-FIN-10")?.default ?? "reserve") as ConversionPolicy),
    },
  };
}

/** Checked when proposed and again when it applies, since things may have changed in between. */
async function checkChange(tx: Tx, issuerId: string, payload: CurrencyChangePayload) {
  const issuer = await tx.node.findUniqueOrThrow({ where: { id: issuerId }, select: { name: true, status: true } });
  if (issuer.status !== "ACTIVE") throw new RuleError(`${issuer.name} is not active`);
  const fields: Partial<CurrencyFields> = payload.action === "CREATE" || payload.action === "EDIT" ? payload.fields : {};

  if (fields.name !== undefined && !fields.name) throw new RuleError("Give the currency a name", ["R-FIN-06"]);
  if (fields.code !== undefined && !/^\S{1,8}$/.test(fields.code)) throw new RuleError("The symbol is 1 to 8 characters, no spaces");
  if (fields.decimals !== undefined && !(Number.isInteger(fields.decimals) && fields.decimals >= 0 && fields.decimals <= 6)) {
    throw new RuleError("Decimal places must be a whole number from 0 to 6");
  }
  if (fields.reserveRatio !== undefined) checkRatio(fields.reserveRatio);
  if (fields.policy !== undefined) checkPolicy(fields.policy);

  if (payload.action === "CREATE") {
    await primaryFiatOf(tx, issuerId); // becomes its reserve fiat; refuses if the node has none
    return;
  }
  const currency = await tx.currency.findUnique({ where: { id: payload.currencyId } });
  if (currency?.issuerNodeId !== issuerId) throw new RuleError("This node does not issue that currency", ["R-FIN-11"]);
  if (payload.action === "EDIT" && fields.decimals !== undefined && fields.decimals !== currency.decimals && (await everHeld(tx, currency.id))) {
    throw new RuleError("The decimal places can't change once units exist", ["R-FIN-12"]);
  }
  if (payload.action === "RETIRE" && currency.status === "RETIRED") throw new RuleError(`${label(currency)} is already retired`);
  if (payload.action === "DELETE") {
    if (await everHeld(tx, currency.id)) throw new RuleError(`${label(currency)} has been held, so it can only be retired`, ["R-FIN-12"]);
    if (await tx.interactionTerms.findFirst({ where: { currencyId: currency.id } })) {
      throw new RuleError(`${label(currency)} is used in an interaction's terms, so it can only be retired`, ["R-FIN-12"]);
    }
  }
}

/** R-FIN-12: has any account in this currency ever had a ledger row? */
export async function everHeld(db: Db, currencyId: string) {
  const row = await db.transaction.findFirst({ where: { OR: [{ from: { currencyId } }, { to: { currencyId } }] }, select: { id: true } });
  return !!row;
}

/** Store the reserve ratio and write the price row it sets (R-FIN-01, R-FIN-05): one unit costs the ratio in the reserve fiat. */
async function writePrice(tx: Tx, currency: Currency, ratio: string, personId: string) {
  await tx.currencyRuleValue.upsert({
    where: { currencyId_ruleId: { currencyId: currency.id, ruleId: "R-FIN-01" } },
    create: { currencyId: currency.id, ruleId: "R-FIN-01", value: ratio },
    update: { value: ratio },
  });
  await setRate(tx, {
    fromCurrencyId: currency.id,
    toCurrencyId: currency.reserveCurrencyId!,
    rate: ratio,
    validFrom: new Date(),
    source: "RESERVE_RATIO",
    setBy: personId,
  });
}

async function writePolicy(tx: Tx, currencyId: string, policy: ConversionPolicy) {
  await tx.currencyRuleValue.upsert({
    where: { currencyId_ruleId: { currencyId, ruleId: "R-FIN-10" } },
    create: { currencyId, ruleId: "R-FIN-10", value: policy },
    update: { value: policy },
  });
}

const sameDecimal = (a: string, b: string) => {
  const [x, y] = [parseDecimal(a), parseDecimal(b)];
  return x.num * y.den === y.num * x.den;
};

const currencyChangeHandler: ProposalHandler = {
  async capabilityFor(_tx, proposal, nodeId) {
    // The approvers' own rows come from R-FIN-11 (see proposals.ts); this is for the issuer proposing.
    return nodeId === proposal.proposerNodeId ? "SET_UP_CURRENCY" : "VIEW";
  },
  async apply(tx, proposal, personId) {
    const p = readPayload<CurrencyChangePayload>(proposal);
    const issuerId = proposal.subjectNodeId!;
    await checkChange(tx, issuerId, p);

    if (p.action === "CREATE") {
      const fiat = await primaryFiatOf(tx, issuerId);
      const { reserveRatio: ratio, policy, ...fields } = p.fields;
      const currency = await tx.currency.create({ data: { ...fields, kind: "COMMUNITY", issuerNodeId: issuerId, reserveCurrencyId: fiat.id } });
      await writePrice(tx, currency, ratio, personId);
      await writePolicy(tx, currency.id, policy);
      await log(tx, proposal, "applied", personId, currency);
      // Chosen when it was proposed; applies now, with the currency.
      if (p.makeHome) await writeHomeCurrency(tx, issuerId, currency, (await tx.node.findUniqueOrThrow({ where: { id: issuerId } })).name);
      return;
    }

    const currency = await tx.currency.findUniqueOrThrow({ where: { id: p.currencyId } });
    if (p.action === "EDIT") {
      const { reserveRatio: ratio, policy, ...fields } = p.fields;
      const updated = await tx.currency.update({ where: { id: currency.id }, data: fields });
      if (ratio !== undefined && !sameDecimal(ratio, await reserveRatio(tx, currency.id))) await writePrice(tx, updated, ratio, personId);
      if (policy !== undefined) await writePolicy(tx, currency.id, policy);
    } else if (p.action === "RETIRE") {
      await tx.currency.update({ where: { id: currency.id }, data: { status: "RETIRED" } });
    } else {
      // DELETE, only for a currency nobody ever held (checked above). Nodes
      // that had it as home currency fall back to their primary fiat.
      for (const node of await tx.node.findMany({ where: { homeCurrencyId: currency.id }, select: { id: true } })) {
        const fiat = await primaryFiatOf(tx, node.id).catch(() => null);
        await tx.node.update({ where: { id: node.id }, data: { homeCurrencyId: fiat?.id ?? null } });
      }
      await tx.account.deleteMany({ where: { OR: [{ currencyId: currency.id }, { backsCurrencyId: currency.id }] } }); // all empty: it was never held
      await tx.currencyRuleValue.deleteMany({ where: { currencyId: currency.id } });
      await deleteRatesOfUnheldCurrency(tx, currency.id);
      await tx.currency.delete({ where: { id: currency.id } });
    }
    await log(tx, proposal, "applied", personId, currency);
  },
  async onClosed(tx, proposal, status, personId) {
    await log(tx, proposal, status === "DECLINED" ? "declined" : "withdrawn", personId);
  },
};

/** The handler for CURRENCY_CHANGE proposals. index.ts uses this for the inbox. */
export const currencyHandlers: Partial<Record<ProposalKind, ProposalHandler>> = {
  CURRENCY_CHANGE: currencyChangeHandler,
};

/** Approve or decline a currency change for the acting node (a Treasurer or an Owner, as themselves). */
export async function decideCurrencyChange(db: Db, actor: Actor, input: { proposalId: string; approve: boolean; comment?: string }) {
  return inTransaction(db, async (tx) => {
    const decided = await decide(
      tx,
      { proposalId: input.proposalId, approverNodeId: actor.actingNodeId, personId: actor.personId, approve: input.approve, comment: input.comment },
      currencyChangeHandler,
    );
    if (decided.status === "OPEN") await log(tx, decided, input.approve ? "approved" : "declined", actor.personId);
    return decided;
  });
}

/** The issuer takes back its proposal. */
export async function withdrawCurrencyChange(db: Db, actor: Actor, proposalId: string) {
  return inTransaction(db, async (tx) => {
    const proposal = await tx.proposal.findUniqueOrThrow({ where: { id: proposalId } });
    if (proposal.proposerNodeId !== actor.actingNodeId) throw new RuleError("Only the node that proposed it can withdraw a proposal");
    return withdraw(tx, { proposalId, personId: actor.personId }, currencyChangeHandler);
  });
}

type CurrencyEvent = "proposed" | "approved" | "applied" | "declined" | "withdrawn";

/** One activity row for the issuer and everyone asked to approve. */
async function log(tx: Tx, proposal: Proposal, event: CurrencyEvent, personId: string, currency?: Currency) {
  const p = readPayload<CurrencyChangePayload>(proposal);
  const issuer = await tx.node.findUniqueOrThrow({ where: { id: proposal.subjectNodeId! }, select: { name: true } });
  const known = currency ?? (p.action === "CREATE" ? null : await tx.currency.findUnique({ where: { id: p.currencyId } }));
  const name = p.action === "CREATE" ? `${p.fields.name} (${p.fields.code})` : known ? label(known) : "a currency";
  const verb = { CREATE: ["creating", "created"], EDIT: ["changing", "changed"], RETIRE: ["retiring", "retired"], DELETE: ["deleting", "deleted"] }[p.action];
  const what = `${verb[0]} ${name}`;
  const person = (await tx.node.findUniqueOrThrow({ where: { id: personId }, select: { name: true } })).name;
  const summaries: Record<CurrencyEvent, string> = {
    proposed: `${person} proposed ${what} for ${issuer.name}`,
    approved: `${person} approved ${what} for ${issuer.name}`,
    applied: `${issuer.name} ${verb[1]} ${name}`,
    declined: `${person} declined ${what} for ${issuer.name}`,
    withdrawn: `${person} withdrew the proposal ${what} for ${issuer.name}`,
  };
  const approvers = await tx.proposalApprover.findMany({ where: { proposalId: proposal.id }, select: { approverNodeId: true } });
  await recordActivity(tx, {
    type: `currency.${event}`,
    refId: currency?.id ?? proposal.id,
    nodeIds: [proposal.subjectNodeId!, ...approvers.map((a) => a.approverNodeId)],
    summary: summaries[event],
  });
}

// ───────────────────────── Converting ─────────────────────────

export interface ConvertInput {
  fromAccountId: string;
  toCurrencyId: string;
  amount: number; // minor units of the from-account's currency
}

/**
 * UC-FIN-03: what converting would give, and how (through the reserves, or as
 * a straight swap). Moves nothing. Throws a RuleError naming the rules when
 * it isn't allowed.
 */
export async function quoteConvert(db: Db, actor: Actor, input: ConvertInput) {
  const from = await ownAccount(db, actor.actingNodeId, input.fromAccountId);
  const a = from.currency;
  const b = await db.currency.findUniqueOrThrow({ where: { id: input.toCurrencyId } });
  if (a.id === b.id) throw new RuleError("Pick a different currency to convert into");
  if (a.kind === "FIAT" && b.kind === "FIAT") throw new RuleError("Fiat is never converted into another fiat", ["R-FIN-14"]);
  if (b.status === "RETIRED") throw new RuleError(`${label(b)} is retired: no new units`, ["R-FIN-12"]);
  if (from.balance < input.amount) throw new RuleError(`Not enough ${label(a)} to convert`);
  for (const c of [a, b]) {
    if (c.kind === "COMMUNITY" && (!c.issuerNodeId || !c.reserveCurrencyId)) {
      throw new RuleError(`${label(c)} has no issuer or reserve to convert through`, ["R-FIN-02"]);
    }
  }
  if (a.kind === "FIAT" && b.issuerNodeId === actor.actingNodeId) {
    throw new RuleError("This node issues that currency: use Mint instead", ["R-FIN-02"]);
  }
  if (b.issuerNodeId) {
    const issuer = await db.node.findUniqueOrThrow({ where: { id: b.issuerNodeId }, select: { name: true, status: true } });
    if (issuer.status !== "ACTIVE") throw new RuleError(`${issuer.name} is not active`);
  }

  const rate = await getRate(db, a.id, b.id);
  const fiatA = a.kind === "FIAT" ? a.id : a.reserveCurrencyId!;
  const fiatB = b.kind === "FIAT" ? b.id : b.reserveCurrencyId!;
  const base = { from, currency: b, amount: input.amount, rate: rate.text };

  // Through the reserves: needs one fiat behind both (R-FIN-14), and enough in A's own reserve (R-FIN-10).
  let blocked: RuleError;
  if (fiatA !== fiatB) {
    blocked = new RuleError(`${label(a)} and ${label(b)} are backed by different fiats, so they can't convert through their reserves`, [
      "R-FIN-14",
    ]);
  } else {
    const fiat = await db.currency.findUniqueOrThrow({ where: { id: fiatA } });
    const priceA = a.kind === "FIAT" ? null : await getRate(db, a.id, fiat.id);
    const value = priceA ? applyRate(input.amount, a.decimals, fiat.decimals, priceA) : input.amount;
    const intoB = b.kind === "FIAT" ? null : await getRate(db, fiat.id, b.id);
    const receive = intoB ? applyRate(value, fiat.decimals, b.decimals, intoB) : value;
    if (value <= 0 || receive <= 0) throw new RuleError("That amount is too small to convert");

    const reserveA = a.kind === "FIAT" ? null : await reserveBalance(db, a);
    if (reserveA === null || reserveA >= value) {
      return {
        ...base,
        mode: "RESERVES" as const,
        receive,
        fiat,
        value, // the fiat that moves between the reserves
        priceA: priceA?.text ?? null,
        intoB: intoB?.text ?? null,
        summary: `${money(input.amount, a)} → ${money(receive, b)}`,
      };
    }
    blocked = new RuleError(`${label(a)}'s reserve holds ${money(reserveA, fiat)}, not enough to cover ${money(value, fiat)}`, ["R-FIN-10"]);
  }

  // Beyond the reserve: a straight swap at the price, only if both currencies are open (R-FIN-10).
  const bothOpen =
    a.kind === "COMMUNITY" &&
    b.kind === "COMMUNITY" &&
    (await conversionPolicy(db, a.id)) === "open" &&
    (await conversionPolicy(db, b.id)) === "open";
  if (!bothOpen) {
    throw new RuleError(`${blocked.message}; a straight swap beyond the reserve needs both currencies open`, [
      ...new Set([...blocked.ruleIds, "R-FIN-10"]),
    ]);
  }
  const receive = applyRate(input.amount, a.decimals, b.decimals, rate);
  if (receive <= 0) throw new RuleError("That amount is too small to convert");
  return { ...base, mode: "SWAP" as const, receive, summary: `${money(input.amount, a)} → ${money(receive, b)} (straight swap)` };
}

/**
 * UC-FIN-03: convert. All legs in one database transaction, sharing one
 * groupId, kind EXCHANGE. Through the reserves:
 *   1. the units leave the person's account (skipped when paying with fiat),
 *   2. their value in fiat moves from A's issuer's reserve to B's issuer's
 *      reserve (from the person's fiat account when paying with fiat; to it
 *      when converting into fiat),
 *   3. units of B are minted to the person (skipped when converting into fiat).
 * A straight swap is legs 1 and 3 with no fiat moving.
 */
export async function convert(db: Db, actor: Actor, input: ConvertInput & { comment?: string }) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "EXCHANGE");
    const quote = await quoteConvert(tx, actor, input);
    const a = quote.from.currency;
    const b = quote.currency;
    const who = (await tx.node.findUniqueOrThrow({ where: { id: actor.actingNodeId }, select: { name: true } })).name;
    const base = {
      kind: "EXCHANGE" as const,
      comment: textOrNull(input.comment) ?? `Convert ${quote.summary}`,
      groupId: randomUUID(),
      actedByPersonId: actor.personId,
    };
    const unitsOfB = async () => (await unitsAccount(tx, actor.actingNodeId, b.id)).id;
    const rows = [];

    if (quote.mode === "SWAP") {
      rows.push(
        await postTransaction(tx, {
          ...base,
          fromAccountId: quote.from.id,
          amount: quote.amount,
          rate: quote.rate,
          summary: `${who} swapped ${money(quote.amount, a)} for ${money(quote.receive, b)}`,
        }),
        await postTransaction(tx, {
          ...base,
          toAccountId: await unitsOfB(),
          amount: quote.receive,
          rate: quote.rate,
          summary: `${money(quote.receive, b)} minted for ${who} in a straight swap`,
        }),
      );
      return { groupId: base.groupId, mode: quote.mode, receive: quote.receive, rows };
    }

    const fiat = quote.fiat;
    let fiatFrom = quote.from.id; // paying with fiat: straight from the person's account
    if (a.kind === "COMMUNITY") {
      rows.push(
        await postTransaction(tx, {
          ...base,
          fromAccountId: quote.from.id,
          amount: quote.amount,
          rate: quote.priceA!,
          summary: `${who} cashed ${money(quote.amount, a)} out of ${label(a)}'s reserve`,
        }),
      );
      fiatFrom = (await reserveAccount(tx, a)).id;
    }
    const intoFiat = b.kind === "FIAT";
    rows.push(
      await postTransaction(tx, {
        ...base,
        fromAccountId: fiatFrom,
        toAccountId: intoFiat ? await unitsOfB() : (await reserveAccount(tx, b)).id,
        amount: quote.value,
        summary: intoFiat
          ? `${money(quote.value, fiat)} paid out of ${label(a)}'s reserve to ${who}`
          : `${money(quote.value, fiat)} into ${label(b)}'s reserve for ${who}`,
      }),
    );
    if (!intoFiat) {
      rows.push(
        await postTransaction(tx, {
          ...base,
          toAccountId: await unitsOfB(),
          amount: quote.receive,
          rate: quote.intoB!,
          summary: `${money(quote.receive, b)} minted for ${who}`,
        }),
      );
    }
    return { groupId: base.groupId, mode: quote.mode, receive: quote.receive, rows };
  });
}

// ───────────────────────── Helpers ─────────────────────────

type Backed = Pick<Currency, "id" | "issuerNodeId" | "reserveCurrencyId">;

/** Where a currency's own reserve is: held by its issuer, in its reserve fiat, marked with the currency it backs. */
function reserveKey(currency: Backed) {
  if (!currency.issuerNodeId || !currency.reserveCurrencyId) throw new RuleError("This currency has no issuer or reserve fiat", ["R-FIN-02"]);
  return { nodeId: currency.issuerNodeId, currencyId: currency.reserveCurrencyId, isReserve: true, backsCurrencyId: currency.id };
}

/** How much the currency's reserve holds (0 if nothing has gone in yet). */
async function reserveBalance(db: Db, currency: Backed) {
  const reserve = await db.account.findUnique({ where: { nodeId_currencyId_isReserve_backsCurrencyId: reserveKey(currency) } });
  return reserve?.balance ?? 0;
}

/** The currency's own locked reserve, opened when fiat first goes in (R-FIN-02). */
export function reserveAccount(tx: Tx, currency: Backed) {
  const key = reserveKey(currency);
  return tx.account.upsert({ where: { nodeId_currencyId_isReserve_backsCurrencyId: key }, create: key, update: {} });
}

/**
 * What backs a node currency: its reserve, the units in circulation (every
 * balance in it, the issuer's own included), their value at the price, and
 * the share of that value the reserve covers (null when no units exist).
 * The share is for showing, not for moving money.
 */
export async function currencyBacking(db: Db, currencyId: string) {
  const currency = await db.currency.findUniqueOrThrow({ where: { id: currencyId }, include: { reserveCurrency: true } });
  if (currency.kind !== "COMMUNITY" || !currency.reserveCurrency) throw new RuleError(`${label(currency)} has no reserve`, ["R-FIN-02"]);
  const fiat = currency.reserveCurrency;
  const reserve = await reserveBalance(db, currency);
  const units = (await db.account.aggregate({ where: { currencyId, isReserve: false }, _sum: { balance: true } }))._sum.balance ?? 0;
  const value = units > 0 ? applyRate(units, currency.decimals, fiat.decimals, await getRate(db, currency.id, fiat.id)) : 0;
  return { currency, fiat, reserve, units, value, shareBacked: value > 0 ? reserve / value : null };
}

/** The node's spending account in this currency, opened the first time it receives some. */
export function unitsAccount(tx: Tx, nodeId: string, currencyId: string) {
  return tx.account.upsert({
    where: { nodeId_currencyId_isReserve_backsCurrencyId: { nodeId, currencyId, isReserve: false, backsCurrencyId: "" } },
    create: { nodeId, currencyId },
    update: {},
  });
}

/** One of the acting node's own spending accounts (never its locked reserve). */
export async function ownAccount(db: Db, nodeId: string, accountId: string) {
  const account = await db.account.findUnique({ where: { id: accountId }, include: { currency: true } });
  if (account?.nodeId !== nodeId) throw new RuleError("That account does not belong to this node");
  if (account.isReserve) throw new RuleError("Reserve accounts are locked", ["R-FIN-02"]);
  return account;
}

export const label = (c: { name: string; code: string | null }) => c.code ?? c.name;
const money = (amount: number, c: { decimals: number; code: string | null }) => formatAmount(amount, c.decimals, c.code);

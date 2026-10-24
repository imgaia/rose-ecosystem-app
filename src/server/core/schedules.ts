// src/server/core/schedules.ts
// The scheduled-payments job (UC-PAY-01, rules R-PAY-04 and R-PAY-05).
// Called once a day by the cron route (src/app/api/cron/due-payments) and by
// hand with scripts/run-due-payments.ts.
//
// Every ACTIVE interaction whose nextDueAt has passed is paid, one due date at
// a time, each in its own database transaction that:
//   1. claims the due date: moves nextDueAt on to the next date, or completes
//      the interaction after its last payment, but only if nextDueAt still
//      holds that date;
//   2. pays it through the ledger, with the automatic comment from rules.yaml.
// If the payment fails (a RuleError, such as the negative-balance limit),
// that transaction is undone and a second one cancels the schedule instead,
// notifies both sides and steps the trust score down (R-PAY-05).
//
// Because the claim and the payment go in together, a due date is paid at
// most once, however often (or however many at once) the job runs: a second
// run finds nextDueAt already moved on.
//
// A payment's number ("3 of 12") counts the interaction's earlier scheduled
// payments: the ledger rows made by SCHEDULE_ACTOR.

import { getRule } from "~/server/rules";
import type { Frequency, Interaction, InteractionStatus, InteractionTerms } from "../../../generated/prisma";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError } from "./errors";
import { endSchedule, payScheduled, SCHEDULE_ACTOR } from "./interactions";

export interface DuePaymentsResult {
  paid: { interactionId: string; dueAt: Date; comment: string }[];
  completed: string[]; // interactions whose schedule ended in this run
  failed: { interactionId: string; dueAt: Date; reason: string }[]; // cancelled (R-PAY-05)
  errors: { interactionId: string; message: string }[]; // unexpected; left as they were, tried again next run
}

/** Pay everything due at `now`. Safe to run any number of times. */
export async function runDuePayments(db: Db, now = new Date()): Promise<DuePaymentsResult> {
  const settings = scheduleSettings();
  const result: DuePaymentsResult = { paid: [], completed: [], failed: [], errors: [] };
  const due = await db.interaction.findMany({
    where: { status: "ACTIVE", nextDueAt: { lte: now } },
    select: { id: true },
    orderBy: { nextDueAt: "asc" },
  });

  for (const { id } of due) {
    try {
      // With missed: pay_each, an interaction several dates behind pays each one in turn.
      for (;;) {
        const step = await payNextDue(db, id, now, settings);
        if (step.outcome === "nothing due") break;
        if (step.outcome === "paid") result.paid.push({ interactionId: id, dueAt: step.dueAt, comment: step.comment });
        if (step.outcome === "failed") result.failed.push({ interactionId: id, dueAt: step.dueAt, reason: step.reason });
        if (step.ended) {
          if (step.outcome !== "failed") result.completed.push(id);
          break;
        }
      }
    } catch (err) {
      result.errors.push({ interactionId: id, message: (err as Error).message });
    }
  }
  return result;
}

type Step =
  | { outcome: "nothing due" }
  | { outcome: "paid"; dueAt: Date; comment: string; ended: boolean }
  | { outcome: "completed"; ended: true } // the schedule ran out before this date (its terms were changed)
  | { outcome: "failed"; dueAt: Date; reason: string; ended: true };

/** The interaction's oldest due date: pay it, or cancel the schedule if the payment fails. */
async function payNextDue(db: Db, interactionId: string, now: Date, settings: ScheduleSettings): Promise<Step> {
  try {
    return await inTransaction(db, async (tx): Promise<Step> => {
      const plan = await planNext(tx, interactionId, now, settings);
      if (!plan) return { outcome: "nothing due" };
      const { interaction, terms, dueAt } = plan;

      if (plan.alreadyEnded) {
        if (!(await claim(tx, interaction, dueAt, { status: "COMPLETED", nextDueAt: null }))) return { outcome: "nothing due" };
        await endSchedule(tx, interaction, { outcome: "completed" });
        return { outcome: "completed", ended: true };
      }

      const moveOn = plan.isLast ? { status: "COMPLETED" as const, nextDueAt: null } : { nextDueAt: plan.nextDueAt };
      if (!(await claim(tx, interaction, dueAt, moveOn))) return { outcome: "nothing due" };
      await payScheduled(tx, interaction, { amount: terms.amount, currencyId: terms.currencyId, comment: plan.comment });
      if (plan.isLast) await endSchedule(tx, interaction, { outcome: "completed" });
      return { outcome: "paid", dueAt, comment: plan.comment, ended: plan.isLast };
    });
  } catch (err) {
    if (!(err instanceof RuleError)) throw err;
    // The payment was refused and everything above undone. R-PAY-05: cancel the schedule.
    return inTransaction(db, async (tx): Promise<Step> => {
      const plan = await planNext(tx, interactionId, now, settings);
      if (!plan) return { outcome: "nothing due" };
      if (!(await claim(tx, plan.interaction, plan.dueAt, { status: "CANCELLED", nextDueAt: null }))) {
        return { outcome: "nothing due" };
      }
      const reason = lowerFirst(err.message);
      await endSchedule(tx, plan.interaction, { outcome: "failed", payment: plan.comment, reason });
      return { outcome: "failed", dueAt: plan.dueAt, reason, ended: true };
    });
  }
}

/** What paying the oldest due date would mean, or null when nothing is due. */
async function planNext(tx: Tx, interactionId: string, now: Date, settings: ScheduleSettings) {
  const interaction = await tx.interaction.findUniqueOrThrow({ where: { id: interactionId } });
  const dueAt = interaction.nextDueAt;
  if (interaction.status !== "ACTIVE" || !dueAt || dueAt > now) return null;

  const terms = await tx.interactionTerms.findFirstOrThrow({
    where: { interactionId, approved: true },
    orderBy: { version: "desc" },
  });
  const made = await tx.transaction.count({ where: { interactionId, actedByPersonId: SCHEDULE_ACTOR } });
  const total = terms.frequency === "ONCE" ? 1 : terms.maxPayments;
  const alreadyEnded = (total != null && made >= total) || (!!terms.endDate && dueAt > terms.endDate);

  let nextDueAt = nextDate(dueAt, terms);
  if (settings.missed === "skip") while (nextDueAt && nextDueAt <= now) nextDueAt = nextDate(nextDueAt, terms);
  const isLast =
    !nextDueAt || (total != null && made + 1 >= total) || (!!terms.endDate && nextDueAt > terms.endDate);

  const n = made + 1;
  const comment = (total != null ? settings.comment : settings.commentOpenEnded)
    .replaceAll("{n}", String(n))
    .replaceAll("{total}", String(total))
    .replaceAll("{description}", terms.description ?? "");
  return { interaction, terms, dueAt, nextDueAt, isLast, alreadyEnded, comment };
}

/**
 * Move the schedule on, only if this due date is still the one waiting.
 * False means another run got there first: pay nothing.
 */
async function claim(
  tx: Tx,
  interaction: Interaction,
  dueAt: Date,
  data: { status?: InteractionStatus; nextDueAt: Date | null },
) {
  const { count } = await tx.interaction.updateMany({
    where: { id: interaction.id, status: "ACTIVE", nextDueAt: dueAt },
    data,
  });
  return count === 1;
}

/**
 * The first date on the schedule after `after`. Monthly dates keep the start
 * date's day of the month, falling back to the month's last day (the 31st
 * becomes the 30th, or the 28th in February) and returning to it after.
 */
export function nextDate(after: Date, terms: Pick<InteractionTerms, "frequency" | "startDate">): Date | null {
  if (terms.frequency === "ONCE") return null;
  const anchor = terms.startDate && terms.startDate <= after ? terms.startDate : after;
  for (let k = 1; ; k++) {
    const date = stepFrom(anchor, terms.frequency, k);
    if (date > after) return date;
  }
}

function stepFrom(anchor: Date, frequency: Exclude<Frequency, "ONCE">, k: number): Date {
  const date = new Date(anchor);
  if (frequency === "WEEKLY") {
    date.setUTCDate(date.getUTCDate() + 7 * k);
    return date;
  }
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + k);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(anchor.getUTCDate(), lastDay));
  return date;
}

// ───────────────────────── Settings from rules.yaml ─────────────────────────

interface ScheduleSettings {
  comment: string;
  commentOpenEnded: string;
  missed: "pay_each" | "skip";
}

/** R-PAY-04's automatic comments and its rule for missed due dates. */
function scheduleSettings(): ScheduleSettings {
  const rule = getRule("R-PAY-04");
  if (!rule?.comment || !rule.comment_open_ended || !rule.missed) {
    throw new Error("R-PAY-04 in rules.yaml needs comment, comment_open_ended and missed");
  }
  return { comment: rule.comment, commentOpenEnded: rule.comment_open_ended, missed: rule.missed };
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

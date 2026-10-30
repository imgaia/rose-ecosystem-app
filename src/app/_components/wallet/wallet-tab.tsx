"use client";

// src/app/_components/wallet/wallet-tab.tsx
// The Wallet tab (PRD S10, UC-FIN-02, UC-PAY-02): the acting node's
// accounts with a total in its home currency (R-FIN-04), the money actions
// (convert, add funds, mint) and its currencies, and its recent transactions.
//
// Seeing balances needs VIEW_BALANCES (Treasurer). A member without it
// still sees the actions, disabled, labelled with the role they need.

import { formatAmount } from "~/lib/money";
import { api, type RouterOutputs } from "~/trpc/react";
import { formatDate, money } from "../describe";
import { needsText, roleList, useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Card, Empty, ErrorText, GatedButton, Loading, Row, SectionLabel } from "../ui";

type Transaction = RouterOutputs["wallet"]["transactions"][number];

export function WalletTab() {
  const { acting, permissionFor } = useActingNode();
  const { open } = useNav();
  const actingNodeId = acting.node.id;
  const seeBalances = permissionFor("VIEW_BALANCES");

  // The total comes in the home currency (the server picks it).
  const accounts = api.wallet.accounts.useQuery({ actingNodeId }, { enabled: !!seeBalances?.allowed });
  const transactions = api.wallet.transactions.useQuery({ actingNodeId, limit: 30 }, { enabled: !!seeBalances?.allowed });

  const isCollection = acting.node.kind === "COLLECTION";

  return (
    <>
      {seeBalances && !seeBalances.allowed && (
        <Card>
          <SectionLabel>Balances</SectionLabel>
          <p className="text-rose-muted">Balances and transactions of {acting.node.name}: {needsText(seeBalances)}.</p>
        </Card>
      )}

      <ErrorText error={accounts.error} />
      {accounts.isLoading && seeBalances?.allowed && <Loading />}
      {accounts.data && (
        <Card className="gap-1">
          {accounts.data.total?.currency && (
            <>
              <SectionLabel>Total, in {accounts.data.total.currency.code} (home currency)</SectionLabel>
              <p className="mb-1 text-3xl font-bold text-rose-blush">{money(accounts.data.total.amount, accounts.data.total.currency)}</p>
              {accounts.data.total.missingRates.length > 0 && (
                <p className="text-xs text-rose-muted">Not counted (no rate): {accounts.data.total.missingRates.join(", ")}</p>
              )}
            </>
          )}
          {accounts.data.accounts.map((a) => (
            <Row
              key={a.id}
              label={`${a.currency.code ?? a.currency.name}${a.isPrimaryFiat ? " · primary fiat" : ""}${
                a.isReserve ? ` · reserve${a.backs ? ` for ${a.backs.code ?? a.backs.name}` : ""}, locked` : ""
              }`}
            >
              {formatAmount(a.balance, a.currency.decimals)}
            </Row>
          ))}
          {accounts.data.accounts.length === 0 && <p className="text-rose-muted">No accounts yet.</p>}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <GatedButton className="min-h-14" permission={permissionFor("EXCHANGE")} onClick={() => open({ name: "convert" })}>
          Convert
        </GatedButton>
        <GatedButton className="min-h-14" permission={permissionFor("ADD_FUNDS")} onClick={() => open({ name: "add-funds" })}>
          Add funds
        </GatedButton>
        <GatedButton className="min-h-14" permission={permissionFor("MINT")} onClick={() => open({ name: "mint" })}>
          Mint
        </GatedButton>
        <GatedButton className="min-h-14" permission={permissionFor("VIEW")} onClick={() => open({ name: "currencies" })}>
          Currencies
        </GatedButton>
      </div>
      {isCollection && <p className="text-xs text-rose-muted">In {acting.node.name} you are {roleList(acting) || "not a role holder"}.</p>}

      {seeBalances?.allowed && (
        <>
          <SectionLabel className="mt-1">Recent transactions</SectionLabel>
          <ErrorText error={transactions.error} />
          {transactions.data?.length === 0 && <Empty>No transactions yet.</Empty>}
          {transactions.data && transactions.data.length > 0 && (
            <Card className="gap-0 py-1">
              {transactions.data.map((t, i) => (
                <div key={t.id} className={`flex items-center justify-between gap-3 py-2 ${i > 0 ? "border-t border-rose-border" : ""}`}>
                  <span className="flex min-w-0 flex-col">
                    <span>{t.comment}</span>
                    <span className="text-xs text-rose-muted">
                      {t.otherNode ? `${t.direction === "out" ? "To" : "From"} ${t.otherNode.name} · ` : ""}
                      {formatDate(t.effectiveDate ?? t.createdAt)}
                    </span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">{signedAmount(t)}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </>
  );
}

/** "−50.00 RCC", "+20.00 RCC", or "100.00 CHF → 100.00 RCC" for a move between own accounts. */
function signedAmount(t: Transaction) {
  const toAmount = t.toAmount ?? t.amount;
  if (t.direction === "own") return `${money(t.amount, t.from?.currency)} → ${money(toAmount, t.to?.currency)}`;
  if (t.direction === "out") return `−${money(t.amount, t.from?.currency)}`;
  // Coming in: in the receiving account's currency (a deposit or mint has no from-account).
  return `+${money(toAmount, t.to?.currency ?? t.from?.currency)}`;
}

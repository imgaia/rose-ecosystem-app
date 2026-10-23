"use client";

// src/app/_components/rose-app.tsx
// The node shell every signed-in screen sits in (PRD 4.1): the header with
// the acting node and its menu, the three tabs, and the + button. A screen
// opened from a tab (a proposal, a relationship, a form) replaces the tabs
// until you go back.

import { useEffect, useState } from "react";

import { api } from "~/trpc/react";
import { HomeTab } from "./home/home-tab";
import { RelationshipsTab } from "./relationships/relationships-tab";
import { ScreenView } from "./screens";
import { ActingNodeProvider, useActingNode } from "./shell/acting-node";
import { Header } from "./shell/header";
import { NavProvider, useNav } from "./shell/navigation";
import { TabBar, type Tab } from "./shell/tab-bar";

export function RoseApp() {
  const me = api.nodes.me.useQuery();

  if (!me.data) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center px-4 text-sm text-rose-muted">
        {me.error ? <p className="text-red-400">{me.error.message}</p> : "Loading…"}
      </div>
    );
  }

  return (
    <ActingNodeProvider me={me.data}>
      <NavProvider>
        <Shell />
      </NavProvider>
    </ActingNodeProvider>
  );
}

function Shell() {
  const { stack, notice } = useNav();
  const [tab, setTab] = useState<Tab>("home");
  // At most one of the two menus is open at a time.
  const [open, setOpen] = useState<"node" | "quick" | null>(null);

  // Escape closes an open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Any screen opened from a menu closes the menu.
  const [depth, setDepth] = useState(stack.length);
  if (depth !== stack.length) {
    setDepth(stack.length);
    setOpen(null);
  }

  const top = stack[stack.length - 1];

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-30 cursor-default bg-black/60"
        />
      )}

      {top ? (
        <ScreenView key={stack.length} screen={top} />
      ) : (
        <>
          <Header menuOpen={open === "node"} onToggleMenu={() => setOpen(open === "node" ? null : "node")} onCloseMenu={() => setOpen(null)} />
          <main className="flex flex-1 flex-col gap-3 p-4 pb-28">
            <TabContent tab={tab} />
          </main>
          <TabBar
            tab={tab}
            onTab={(t) => {
              setTab(t);
              setOpen(null);
            }}
            quickOpen={open === "quick"}
            onToggleQuick={() => setOpen(open === "quick" ? null : "quick")}
          />
        </>
      )}

      {notice && (
        <p
          role="status"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-xl border border-rose-border bg-rose-surface px-4 py-3 text-center text-sm shadow-lg"
        >
          {notice}
        </p>
      )}
    </div>
  );
}

function TabContent({ tab }: { tab: Tab }) {
  const { acting } = useActingNode();
  if (tab === "home") return <HomeTab />;
  if (tab === "relationships") return <RelationshipsTab />;

  // A placeholder until the Wallet slice is built.
  const content = { title: "Wallet", body: `${acting.node.name}'s balances and transactions.` };
  return (
    <>
      <h1 className="text-lg font-semibold">{content.title}</h1>
      <section className="rounded-2xl border border-rose-border bg-rose-surface p-4">
        <p>{content.body}</p>
        <p className="mt-1 text-xs text-rose-muted">This screen is coming in a later step.</p>
      </section>
    </>
  );
}

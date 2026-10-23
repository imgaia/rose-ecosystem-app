"use client";

// src/app/_components/rose-app.tsx
// The node shell every signed-in screen sits in (PRD 4.1, BUILD_PLAN step 6
// slice 1): the header with the acting node and its menu, the three tabs,
// and the + button. The tabs' contents arrive in later slices.

import { useEffect, useState } from "react";

import { api } from "~/trpc/react";
import { ActingNodeProvider, useActingNode } from "./shell/acting-node";
import { Header } from "./shell/header";
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
      <Shell />
    </ActingNodeProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>("home");
  // At most one of the two menus is open at a time.
  const [open, setOpen] = useState<"node" | "quick" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Escape closes an open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The "coming soon" note fades after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function notYet(what: string) {
    setOpen(null);
    setNotice(`${what} is coming in a later step.`);
  }

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

      <Header
        menuOpen={open === "node"}
        onToggleMenu={() => setOpen(open === "node" ? null : "node")}
        onCloseMenu={() => setOpen(null)}
        onNotYet={notYet}
      />

      <main className="flex flex-1 flex-col gap-4 p-4 pb-28">
        <TabContent tab={tab} />
      </main>

      {notice && (
        <p
          role="status"
          className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-md rounded-xl border border-rose-border bg-rose-surface px-4 py-3 text-center text-sm shadow-lg"
        >
          {notice}
        </p>
      )}

      <TabBar
        tab={tab}
        onTab={(t) => {
          setTab(t);
          setOpen(null);
        }}
        quickOpen={open === "quick"}
        onToggleQuick={() => setOpen(open === "quick" ? null : "quick")}
        onNotYet={notYet}
      />
    </div>
  );
}

/** Placeholders until each tab's own slice is built. */
function TabContent({ tab }: { tab: Tab }) {
  const { acting } = useActingNode();
  const content = {
    home: { title: "Home", body: `Proposals waiting on ${acting.node.name}, then recent activity.` },
    relationships: { title: "Relationships", body: `Every node ${acting.node.name} has a relationship with.` },
    wallet: { title: "Wallet", body: `${acting.node.name}'s balances and transactions.` },
  }[tab];

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

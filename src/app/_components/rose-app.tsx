"use client";

// src/app/_components/rose-app.tsx
// The node shell every signed-in screen sits in (PRD 4.1): the header with
// the acting node and its menu, the three tabs, and the + button. A screen
// opened from a tab (a proposal, a relationship, a form) replaces the tab's
// content until you go back; the bottom bar stays, and a tab goes straight
// back to that tab's top screen.

import { useEffect, useState } from "react";

import { api } from "~/trpc/react";
import { HomeTab } from "./home/home-tab";
import { RelationshipsTab } from "./relationships/relationships-tab";
import { ScreenView } from "./screens";
import { ActingNodeProvider } from "./shell/acting-node";
import { Header } from "./shell/header";
import { NavProvider, tabFor, useNav } from "./shell/navigation";
import { TabBar, useKeyboardOpen, type Tab } from "./shell/tab-bar";
import { WalletTab } from "./wallet/wallet-tab";

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
  const { stack, notice, reset, confirmLeave } = useNav();
  // The tab underneath; an opened screen may highlight its own (Convert: Wallet).
  const [baseTab, setBaseTab] = useState<Tab>("home");
  const tab = tabFor(stack, baseTab);
  const keyboard = useKeyboardOpen();
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
    // --nav-space: the bottom bar's height (TabBar: 52px buttons, 4px + 16px padding, 1px border),
    // which screens keep free at their foot and a form's main button sits on.
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col" style={{ "--nav-space": keyboard ? "0px" : "73px" } as React.CSSProperties}>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(null)}
          // Over an opened screen's header too when the quick actions are open.
          className={`fixed inset-0 cursor-default bg-black/60 ${open === "quick" ? "z-[45]" : "z-30"}`}
        />
      )}

      {top ? (
        <ScreenView key={stack.length} screen={top} />
      ) : (
        <>
          <Header menuOpen={open === "node"} onToggleMenu={() => setOpen(open === "node" ? null : "node")} onCloseMenu={() => setOpen(null)} />
          <main className="flex flex-1 flex-col gap-3 p-4 pb-[calc(var(--nav-space)+3rem)]">
            <TabContent tab={tab} />
          </main>
        </>
      )}

      {!keyboard && (
        <TabBar
          tab={tab}
          onTab={(t) =>
            confirmLeave(() => {
              reset();
              setBaseTab(t);
              setOpen(null);
            })
          }
          quickOpen={open === "quick"}
          onToggleQuick={() => (open === "quick" ? setOpen(null) : confirmLeave(() => setOpen("quick")))}
        />
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
  if (tab === "home") return <HomeTab />;
  if (tab === "relationships") return <RelationshipsTab />;
  return <WalletTab />;
}

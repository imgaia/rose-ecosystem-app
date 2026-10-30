"use client";

// src/app/_components/shell/navigation.tsx
// Moving between screens inside the shell. The tabs are the bottom layer;
// opening a proposal, a relationship or a form puts a screen on top, like a
// stack of cards. Back takes the top one off.
//
// Each screen opened also adds a browser history entry, so the phone's or
// browser's back button does the same as the on-screen back arrow.
//
// A form with changes not yet sent asks before it is left (Back, a tab, +,
// or the browser's back button): "Leave without sending?" with Stay / Leave.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import type { Tab } from "./tab-bar";

/** Every screen that can be opened on top of the tabs, with what it needs to load. */
export type Screen =
  | { name: "proposal"; proposalId: string }
  | { name: "relationship"; relationshipId: string }
  | { name: "interaction"; interactionId: string }
  | { name: "send"; toNodeId?: string }
  | { name: "request"; fromNodeId?: string; interactionId?: string }
  | { name: "propose-work"; otherNodeId?: string }
  | { name: "counter"; proposalId: string }
  | { name: "amend"; interactionId: string }
  | { name: "add-funds" }
  | { name: "convert"; fromAccountId?: string; toCurrencyId?: string }
  | { name: "currencies" }
  | { name: "currency"; currencyId: string }
  | { name: "currency-form"; currencyId?: string }
  | { name: "mint" }
  | { name: "node"; nodeId: string }
  | { name: "search" }
  | { name: "invite" }
  | { name: "edit-identity" }
  | { name: "role-change"; holderNodeId?: string }
  | { name: "add-member" }
  | { name: "remove-member"; memberNodeId?: string };

/** The tab a screen belongs to, so the bottom bar highlights it. Others keep the tab they were opened from. */
const SCREEN_TAB: Partial<Record<Screen["name"], Tab>> = {
  proposal: "home",
  counter: "home",
  relationship: "relationships",
  interaction: "relationships",
  "add-funds": "wallet",
  convert: "wallet",
  currencies: "wallet",
  currency: "wallet",
  "currency-form": "wallet",
  mint: "wallet",
};

/** The tab to highlight: that of the topmost screen that has one, else the tab underneath. */
export function tabFor(stack: Screen[], base: Tab): Tab {
  for (let i = stack.length - 1; i >= 0; i--) {
    const tab = SCREEN_TAB[stack[i]!.name];
    if (tab) return tab;
  }
  return base;
}

interface NavValue {
  stack: Screen[];
  open: (screen: Screen) => void;
  /** Go back `screens` screens (1 by default), without asking: for after a successful send. */
  back: (screens?: number) => void;
  /** Close every open screen, back to the tabs. */
  reset: () => void;
  /** A short note for something a later step builds. */
  notYet: (what: string) => void;
  /** A short note that fades, e.g. "Sent. Theo accepts it from their inbox." */
  notify: (text: string) => void;
  notice: string | null;
  /** Mark the open form as changed (or not); see SubScreen's `form`. */
  setChanged: (changed: boolean) => void;
  /** Run `leave` now, or once the person confirms leaving a form with changes. */
  confirmLeave: (leave: () => void) => void;
}

const NavContext = createContext<NavValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Screen[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  // Refs, not state: the browser's back handler below needs today's values.
  const changed = useRef(false);
  const allowPop = useRef(false); // set by back() and reset(): leaving was already confirmed or isn't a question
  const depth = useRef(0);
  depth.current = stack.length;
  const [asking, setAsking] = useState<(() => void) | null>(null);
  // Stable, so a screen's effect can depend on them.
  const setChanged = useCallback((value: boolean) => {
    changed.current = value;
  }, []);
  const confirmLeave = useCallback((leave: () => void) => {
    if (changed.current) setAsking(() => leave);
    else leave();
  }, []);

  // The browser's back button: each history entry remembers how deep the stack was.
  // Leaving a changed form that way asks first: the entry is put back until "Leave".
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const to = (e.state as { roseDepth?: number } | null)?.roseDepth ?? 0;
      if (changed.current && !allowPop.current && to < depth.current) {
        const steps = depth.current - to;
        window.history.go(steps);
        setAsking(() => () => {
          allowPop.current = true;
          window.history.go(-steps);
        });
        return;
      }
      allowPop.current = false;
      setStack((s) => s.slice(0, to));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A newly opened screen starts at the top of the page. Braces, not a bare
  // `() => window.scrollTo(0, 0)`: newer browsers return a Promise from
  // scrollTo, and React would try to call it as the effect's cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stack.length]);

  // The note fades after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const value: NavValue = {
    stack,
    notice,
    open(screen) {
      const next = [...stack, screen];
      setStack(next);
      window.history.pushState({ roseDepth: next.length }, "");
    },
    back(screens = 1) {
      allowPop.current = true;
      window.history.go(-screens);
    },
    reset() {
      if (stack.length === 0) return;
      allowPop.current = true;
      window.history.go(-stack.length);
    },
    notYet(what) {
      setNotice(`${what} is coming in a later step.`);
    },
    notify: setNotice,
    setChanged,
    confirmLeave,
  };

  return (
    <NavContext.Provider value={value}>
      {children}
      {asking && (
        <LeaveDialog
          onStay={() => setAsking(null)}
          onLeave={() => {
            setAsking(null);
            asking();
          }}
        />
      )}
    </NavContext.Provider>
  );
}

function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  // Escape is Stay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onStay();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-text"
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-rose-border bg-rose-surface p-4 shadow-lg"
      >
        <p id="leave-title" className="text-base font-semibold">
          Leave without sending?
        </p>
        <p id="leave-text" className="text-sm text-rose-muted">
          Your changes will be lost.
        </p>
        <div className="flex gap-2">
          {/* Plain buttons: ui.tsx imports this file, so it can't import ui.tsx back. Same look as its Button. */}
          <button
            type="button"
            autoFocus
            onClick={onStay}
            className="min-h-11 flex-1 rounded-xl border-[1.5px] border-rose-accent bg-rose-accent px-4 text-sm font-semibold text-white hover:brightness-110"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="min-h-11 flex-1 rounded-xl border-[1.5px] border-rose-muted px-4 text-sm font-semibold text-rose-text hover:bg-white/5"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export function useNav() {
  const value = useContext(NavContext);
  if (!value) throw new Error("useNav must be used inside <NavProvider>");
  return value;
}

"use client";

// src/app/_components/shell/navigation.tsx
// Moving between screens inside the shell. The tabs are the bottom layer;
// opening a proposal, a relationship or a form puts a screen on top, like a
// stack of cards. Back takes the top one off.
//
// Each screen opened also adds a browser history entry, so the phone's or
// browser's back button does the same as the on-screen back arrow.

import { createContext, useContext, useEffect, useState } from "react";

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
  | { name: "exchange" }
  | { name: "mint" }
  | { name: "node"; nodeId: string }
  | { name: "search" }
  | { name: "invite" }
  | { name: "edit-identity" }
  | { name: "role-change"; holderNodeId?: string }
  | { name: "add-member" }
  | { name: "remove-member"; memberNodeId?: string };

interface NavValue {
  stack: Screen[];
  open: (screen: Screen) => void;
  back: () => void;
  /** Close every open screen, back to the tabs. */
  reset: () => void;
  /** A short note for something a later step builds. */
  notYet: (what: string) => void;
  /** A short note that fades, e.g. "Sent. Theo accepts it from their inbox." */
  notify: (text: string) => void;
  notice: string | null;
}

const NavContext = createContext<NavValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Screen[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // The browser's back button: each history entry remembers how deep the stack was.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const depth = (e.state as { roseDepth?: number } | null)?.roseDepth ?? 0;
      setStack((s) => s.slice(0, depth));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A newly opened screen starts at the top of the page.
  useEffect(() => window.scrollTo(0, 0), [stack.length]);

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
    back() {
      window.history.back();
    },
    reset() {
      if (stack.length > 0) window.history.go(-stack.length);
    },
    notYet(what) {
      setNotice(`${what} is coming in a later step.`);
    },
    notify: setNotice,
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const value = useContext(NavContext);
  if (!value) throw new Error("useNav must be used inside <NavProvider>");
  return value;
}

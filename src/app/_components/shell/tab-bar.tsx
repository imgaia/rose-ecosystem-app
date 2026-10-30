"use client";

// src/app/_components/shell/tab-bar.tsx
// The bottom bar of every screen (PRD 4.1): the three tabs, Home,
// Relationships and Wallet, and the + button that opens the quick actions (S26).
// It shows on opened screens too, with their tab highlighted; on a phone it
// hides while the on-screen keyboard is open (useKeyboardOpen).
//
// Each quick action names the capability it needs. If the person's roles in
// the acting node don't carry it, the action stays visible but disabled, with
// "Needs Treasurer" (from the same rules check the server enforces).

import { useEffect, useState } from "react";

import { needsText, useActingNode } from "./acting-node";
import {
  CloseIcon,
  ExchangeIcon,
  HomeIcon,
  InviteIcon,
  PlusIcon,
  RelationshipsIcon,
  RequestIcon,
  SendIcon,
  WalletIcon,
  WorkIcon,
} from "./icons";
import { useNav, type Screen } from "./navigation";

export type Tab = "home" | "relationships" | "wallet";

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "relationships", label: "Relationships", Icon: RelationshipsIcon },
  { id: "wallet", label: "Wallet", Icon: WalletIcon },
];

const QUICK_ACTIONS: { label: string; hint: string; capability: string; Icon: typeof SendIcon; screen?: Screen }[] = [
  { label: "Send a payment or gift", hint: "To anyone in your network", capability: "PAY", Icon: SendIcon, screen: { name: "send" } },
  { label: "Request a payment", hint: "Ask someone to pay you", capability: "INTERACT", Icon: RequestIcon, screen: { name: "request" } },
  { label: "Propose work", hint: "Agree work and terms with someone", capability: "INTERACT", Icon: WorkIcon, screen: { name: "propose-work" } },
  { label: "Convert currencies", hint: "Any currency into another, at their prices", capability: "EXCHANGE", Icon: ExchangeIcon, screen: { name: "convert" } },
  // For a collection, inviting adds a member, so it needs ADD_MEMBERS (see QuickActions).
  { label: "Invite someone", hint: "Bring a new member into ROSE", capability: "INVITE", Icon: InviteIcon, screen: { name: "invite" } },
];

interface TabBarProps {
  tab: Tab;
  onTab: (tab: Tab) => void;
  quickOpen: boolean;
  onToggleQuick: () => void;
}

export function TabBar({ tab, onTab, quickOpen, onToggleQuick }: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg items-center gap-1 border-t border-rose-border bg-rose-surface pt-1 pr-3 pb-4 pl-2"
    >
      {quickOpen && <QuickActions />}

      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          aria-current={tab === id ? "page" : undefined}
          className={`flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] leading-[14px] font-medium ${
            tab === id ? "font-semibold text-rose-accent" : "text-rose-muted hover:text-rose-text"
          }`}
        >
          <Icon />
          {label}
        </button>
      ))}

      <button
        type="button"
        onClick={onToggleQuick}
        aria-label={quickOpen ? "Close quick actions" : "Quick actions"}
        aria-expanded={quickOpen}
        className="ml-1 flex size-13 flex-none items-center justify-center rounded-full bg-rose-accent text-white shadow-lg hover:brightness-110"
      >
        {quickOpen ? <CloseIcon size={26} strokeWidth={2} /> : <PlusIcon size={26} strokeWidth={2} />}
      </button>
    </nav>
  );
}

function QuickActions() {
  const { acting, permissionFor } = useActingNode();
  const { open, notYet } = useNav();
  const isCollection = acting.node.kind === "COLLECTION";

  return (
    <section
      aria-label="Quick actions"
      className="absolute inset-x-3 bottom-full mb-3 flex flex-col rounded-2xl border border-rose-border bg-rose-surface px-4 pt-3 pb-1 shadow-lg"
    >
      <p className="px-1 pt-1 pb-2 text-xs font-semibold tracking-wide text-rose-muted uppercase">Quick actions</p>
      {QUICK_ACTIONS.map(({ label, hint, capability, Icon, screen }) => {
        const permission = permissionFor(capability === "INVITE" && isCollection ? "ADD_MEMBERS" : capability);
        // Disabled until the rules check has answered, then only if it refused.
        const allowed = permission?.allowed ?? false;
        return (
          <button
            key={label}
            type="button"
            disabled={!allowed}
            onClick={() => (screen ? open(screen) : notYet(label))}
            className="flex min-h-14 items-center gap-3 border-t border-rose-border px-1 py-1.5 text-left enabled:hover:bg-white/5 disabled:cursor-not-allowed"
          >
            <span
              className={`flex size-10 flex-none items-center justify-center rounded-full ${
                allowed ? "bg-rose-bg text-rose-text" : "border border-dashed border-rose-muted text-rose-muted"
              }`}
            >
              <Icon />
            </span>
            <span className="flex flex-col">
              <span className={`text-[15px] font-semibold ${allowed ? "" : "text-rose-muted"}`}>{label}</span>
              <span className="text-xs text-rose-muted">{allowed ? hint : needsText(permission) || "Checking…"}</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

/** Fields that bring up the on-screen keyboard (not checkboxes, buttons or the date picker). */
function typesText(el: Element | null) {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable) return true;
  if (!(el instanceof HTMLInputElement)) return false;
  return !["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "date", "datetime-local", "month", "time", "week", "hidden", "image"].includes(el.type);
}

/**
 * On a phone, is the on-screen keyboard open? It is while a text field has
 * focus on a touch screen, until the field loses focus or the keyboard is put
 * away (the visible area grows back to its full height).
 */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const touch = window.matchMedia("(pointer: coarse)");
    const viewport = window.visualViewport;
    let tallest = viewport?.height ?? 0;
    // On focusout the focus hasn't moved yet: look once it has.
    const update = () => setTimeout(() => setOpen(touch.matches && typesText(document.activeElement)), 0);
    const onResize = () => {
      if (!viewport) return;
      if (viewport.height >= tallest - 80) {
        tallest = Math.max(tallest, viewport.height);
        setOpen(false); // full height again: the keyboard was put away
      } else update();
    };
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    viewport?.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      viewport?.removeEventListener("resize", onResize);
    };
  }, []);
  return open;
}

"use client";

// src/app/_components/shell/header.tsx
// The top bar of every screen (PRD 4.1, S02): the name of the node being acted
// for, which opens the node menu, and the network search button.
// The node menu shows who you are acting as, opens the node page, and switches
// to another node you can act for (UC-NET-03).

import { roleList, useActingNode, type ActingEntry } from "./acting-node";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, SearchIcon } from "./icons";

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  /** For screens that later slices build: shows a short "coming" note. */
  onNotYet: (what: string) => void;
}

export function Header({ menuOpen, onToggleMenu, onCloseMenu, onNotYet }: HeaderProps) {
  const { acting } = useActingNode();

  return (
    <header className="sticky top-0 z-40 border-b border-rose-border bg-rose-surface">
      <div className="flex items-center justify-between gap-2 p-2">
        <button
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-label={`Acting as ${acting.node.name}. Open node page or switch`}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-base font-semibold hover:bg-white/5"
        >
          <Avatar entry={acting} size="sm" />
          <span className="truncate">{acting.node.name}</span>
          {menuOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
        </button>
        <button
          type="button"
          aria-label="Search the network"
          onClick={() => onNotYet("Network search")}
          className="flex size-11 flex-none items-center justify-center rounded-xl text-rose-muted hover:bg-white/5 hover:text-rose-text"
        >
          <SearchIcon />
        </button>
      </div>

      {menuOpen && <NodeMenu onClose={onCloseMenu} onNotYet={onNotYet} />}
    </header>
  );
}

function NodeMenu({ onClose, onNotYet }: { onClose: () => void; onNotYet: (what: string) => void }) {
  const { person, actingAs, acting, switchTo } = useActingNode();
  const others = actingAs.filter((a) => a.node.id !== acting.node.id);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <section
      aria-label="Node menu"
      className="absolute inset-x-0 top-full flex flex-col gap-3 rounded-b-2xl border-b border-rose-border bg-rose-surface p-4 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <Avatar entry={acting} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{acting.node.name}</h2>
          <p className="text-xs text-rose-muted">{describe(acting, person.id)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNotYet("The node page")}
        className="min-h-11 rounded-xl border border-rose-muted px-4 text-sm font-semibold hover:bg-white/5"
      >
        Open node page: identity, roles, rules
      </button>

      {others.length > 0 && (
        <div className="flex flex-col">
          <p className="mt-1 pb-1 text-xs font-semibold tracking-wide text-rose-muted uppercase">Switch to</p>
          {others.map((entry) => (
            <button
              key={entry.node.id}
              type="button"
              onClick={() => {
                switchTo(entry.node.id);
                onClose();
              }}
              className="flex min-h-14 items-center gap-3 border-t border-rose-border px-1 py-1.5 text-left hover:bg-white/5"
            >
              <Avatar entry={entry} size="lg" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-semibold">{entry.node.name}</span>
                <span className="text-xs text-rose-muted">{describe(entry, person.id)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onNotYet("Creating a collection")}
          className="flex min-h-13 items-center gap-3 border-t border-rose-border px-1 text-sm font-semibold hover:bg-white/5"
        >
          <PlusIcon />
          Create a collection
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex min-h-11 items-center border-t border-rose-border px-1 text-sm text-rose-muted hover:text-rose-text"
        >
          Sign out
        </button>
      </div>
    </section>
  );
}

/** "You · Member, Owner, Treasurer" or "Collection · you are Member, Curator" */
function describe(entry: ActingEntry, personId: string) {
  if (entry.node.id === personId) return `You · ${roleList(entry)}`;
  const kind = entry.node.kind === "COLLECTION" ? "Collection" : "Node";
  return `${kind} · you are ${roleList(entry)}`;
}

/** A person is a circle, a collection a rounded square, both with the node's initial. */
export function Avatar({ entry, size }: { entry: ActingEntry; size: "sm" | "lg" }) {
  const shape = entry.node.kind === "COLLECTION" ? (size === "sm" ? "rounded-lg" : "rounded-[10px]") : "rounded-full";
  const dimensions = size === "sm" ? "size-8 text-sm" : "size-11 text-base";
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center bg-rose-accent font-semibold text-white ${shape} ${dimensions}`}
    >
      {entry.node.name.charAt(0).toUpperCase()}
    </span>
  );
}

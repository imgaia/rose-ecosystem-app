"use client";

// src/app/_components/shell/acting-node.tsx
// Which node the screens are acting for (the person, or a collection chosen
// in the header switcher), and what the person may do there.
//
// Nothing about this is stored on the server: the chosen node id lives here
// and every API call sends it as `actingNodeId`. The browser remembers the
// last choice so a reload keeps it.
//
// Any screen inside <ActingNodeProvider> can call useActingNode().

import { createContext, useContext, useEffect, useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type Me = RouterOutputs["nodes"]["me"];
export type ActingEntry = Me["actingAs"][number];
export type Permission = RouterOutputs["nodes"]["permissions"][number];

const STORAGE_KEY = "rose.actingNodeId";

interface ActingNodeValue {
  person: Me["person"];
  /** Every node the person can act for: themselves first, then collections. */
  actingAs: ActingEntry[];
  /** The node being acted for now, with the person's roles in it. */
  acting: ActingEntry;
  switchTo: (nodeId: string) => void;
  /** The rules check result for one capability (PAY, INVITE ...); undefined while loading. */
  permissionFor: (capability: string) => Permission | undefined;
}

const ActingNodeContext = createContext<ActingNodeValue | null>(null);

export function ActingNodeProvider({ me, children }: { me: Me; children: React.ReactNode }) {
  const [actingNodeId, setActingNodeId] = useState(me.person.id);

  // After the first render, restore the last choice if the person can still act there.
  useEffect(() => {
    const saved = readSaved();
    if (saved && me.actingAs.some((a) => a.node.id === saved)) setActingNodeId(saved);
  }, [me.actingAs]);

  // If the chosen node is no longer in the list (a role ended), fall back to the person.
  const acting = me.actingAs.find((a) => a.node.id === actingNodeId) ?? me.actingAs[0]!;

  const permissions = api.nodes.permissions.useQuery({ actingNodeId: acting.node.id });

  function switchTo(nodeId: string) {
    setActingNodeId(nodeId);
    try {
      localStorage.setItem(STORAGE_KEY, nodeId);
    } catch {
      // Private windows can refuse storage; the choice then lasts until reload.
    }
  }

  const value: ActingNodeValue = {
    person: me.person,
    actingAs: me.actingAs,
    acting,
    switchTo,
    permissionFor: (capability) => permissions.data?.find((p) => p.capability === capability),
  };

  return <ActingNodeContext.Provider value={value}>{children}</ActingNodeContext.Provider>;
}

export function useActingNode() {
  const value = useContext(ActingNodeContext);
  if (!value) throw new Error("useActingNode must be used inside <ActingNodeProvider>");
  return value;
}

/** The caption under a disabled action: "Needs Treasurer". Empty while the check is loading. */
export function needsText(permission: Permission | undefined) {
  if (!permission || permission.allowed) return "";
  return `Needs ${permission.needsLabels.join(" or ")}`;
}

/** "Member, Owner, Treasurer" */
export function roleList(entry: ActingEntry) {
  return entry.roles.map((r) => r.label).join(", ");
}

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

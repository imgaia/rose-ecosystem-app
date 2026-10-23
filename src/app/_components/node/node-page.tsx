"use client";

// src/app/_components/node/node-page.tsx
// A node's page (PRD S17 to S21). Everyone sees its identity and, for another
// node, the relationship with it and ways to interact. Its own members also
// see inside: roles and what they can do (UC-GOV-01), rule values
// (UC-GOV-03) and, for a collection, its members.
//
// Also the network search (S16, UC-NET-04), which opens these pages.

import { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";
import { formatDate, titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { Avatar } from "../shell/header";
import { useNav } from "../shell/navigation";
import { Button, Card, Chip, Empty, ErrorText, GatedButton, Input, Loading, Row, SectionLabel, SubScreen, Toggle } from "../ui";

type Page = RouterOutputs["nodes"]["page"];
type Inside = NonNullable<Page["inside"]>;
type Section = "identity" | "roles" | "rules" | "members";

export function NodePage({ nodeId }: { nodeId: string }) {
  const { acting } = useActingNode();
  const page = api.nodes.page.useQuery({ actingNodeId: acting.node.id, nodeId });

  return (
    <SubScreen title="Node page">
      <ErrorText error={page.error} />
      {page.isLoading && <Loading />}
      {page.data && <Body page={page.data} />}
    </SubScreen>
  );
}

function Body({ page }: { page: Page }) {
  const { acting, permissionFor } = useActingNode();
  const { open } = useNav();
  const [section, setSection] = useState<Section>("identity");
  const { node, relationship, inside } = page;
  const isActing = node.id === acting.node.id;
  const memberCount = inside?.members.length ?? 0;

  const sections: { value: Section; label: string }[] = [
    { value: "identity", label: "Identity" },
    { value: "roles", label: "Roles" },
    { value: "rules", label: "Rules" },
    ...(node.kind === "COLLECTION" ? [{ value: "members" as const, label: "Members" }] : []),
  ];

  return (
    <>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar node={node} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{node.name}</h1>
            <p className="text-rose-muted">
              {node.kind === "COLLECTION" ? `Collection${inside ? ` · ${memberCount} ${memberCount === 1 ? "member" : "members"}` : ""}` : "Person"}
              {node.status !== "ACTIVE" && ` · ${titleCase(node.status)}`}
            </p>
          </div>
        </div>
        {node.description && <p>{node.description}</p>}
      </Card>

      {!isActing && (
        <div className="flex flex-col gap-2">
          {relationship ? (
            <Button variant="primary" onClick={() => open({ name: "relationship", relationshipId: relationship.id })}>
              Open your relationship
              {relationship.formedAt ? ` · since ${formatDate(relationship.formedAt)}` : ` · ${titleCase(relationship.status)}`}
            </Button>
          ) : (
            <p className="text-sm text-rose-muted">{acting.node.name} has no relationship with {node.name} yet.</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <GatedButton className="px-2 text-xs" permission={permissionFor("PAY")} onClick={() => open({ name: "send", toNodeId: node.id })}>
              Pay
            </GatedButton>
            <GatedButton className="px-2 text-xs" permission={permissionFor("INTERACT")} onClick={() => open({ name: "request", fromNodeId: node.id })}>
              Request
            </GatedButton>
            <GatedButton className="px-2 text-xs" permission={permissionFor("INTERACT")} onClick={() => open({ name: "propose-work", otherNodeId: node.id })}>
              Propose work
            </GatedButton>
          </div>
        </div>
      )}

      {inside ? (
        <>
          <Toggle label="Section" value={section} onChange={setSection} options={sections} />
          {section === "identity" && <Identity page={page} isActing={isActing} />}
          {section === "roles" && <Roles inside={inside} isActing={isActing} />}
          {section === "rules" && <Rules inside={inside} />}
          {section === "members" && <Members inside={inside} isActing={isActing} />}
        </>
      ) : (
        <Card className="gap-0">
          <Row label="On ROSE since">{formatDate(node.createdAt)}</Row>
        </Card>
      )}
    </>
  );
}

function Identity({ page, isActing }: { page: Page; isActing: boolean }) {
  const { permissionFor, notYetFor } = useNodeActions();
  const { node } = page;
  return (
    <>
      <Card className="gap-0">
        <SectionLabel className="mb-1">Identity</SectionLabel>
        <Row label="Name">{node.name}</Row>
        {node.firstName && <Row label="First name">{node.firstName}</Row>}
        {node.lastName && <Row label="Last name">{node.lastName}</Row>}
        <Row label="Kind">{node.kind === "COLLECTION" ? "Collection" : "Person"}</Row>
        <Row label="Status">{titleCase(node.status)}</Row>
        <Row label="On ROSE since">{formatDate(node.createdAt)}</Row>
      </Card>
      {isActing && (
        <GatedButton permission={permissionFor("EDIT_IDENTITY")} onClick={notYetFor("Editing the identity")}>
          Edit identity
        </GatedButton>
      )}
    </>
  );
}

function Roles({ inside, isActing }: { inside: Inside; isActing: boolean }) {
  const { permissionFor, notYetFor } = useNodeActions();
  const me = useMe();
  const groups = [
    { title: "Native roles", roles: inside.roles.filter((r) => r.native) },
    { title: "Optional roles", roles: inside.roles.filter((r) => !r.native) },
  ];
  const mine = inside.roles.filter((r) => r.holders.some((h) => h.id === me));

  return (
    <>
      {groups.map((g) => (
        <Card key={g.title} className="gap-0">
          <SectionLabel className="mb-1">{g.title}</SectionLabel>
          {g.roles.map((role) => (
            <div key={role.key} className="flex flex-col gap-0.5 border-t border-rose-border py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{role.label}</span>
                <span className="text-right text-xs text-rose-muted">
                  {role.key === "MEMBER" && role.holders.length > 3
                    ? `${role.holders.length} members`
                    : role.holders.map((h) => h.name).join(", ") || "None"}
                </span>
              </div>
              <span className="text-xs text-rose-muted">
                {role.capabilities.length > 0 ? role.capabilities.map(titleCase).join(", ") : "No capabilities yet"}
              </span>
            </div>
          ))}
        </Card>
      ))}
      <p className="text-xs text-rose-muted">
        Capabilities come from the system&apos;s capability map.
        {mine.length > 0 && ` You hold ${mine.map((r) => r.label).join(" and ")} here.`}
      </p>
      {isActing && (
        <GatedButton permission={permissionFor("EDIT_GOVERNANCE")} onClick={notYetFor("Proposing a role change")}>
          Propose a role change
        </GatedButton>
      )}
    </>
  );
}

function Rules({ inside }: { inside: Inside }) {
  // Parameters and approval rules carry values worth showing; the rest are fixed statements.
  const withValues = inside.rules.filter((r) => r.value !== null);
  const fixed = inside.rules.filter((r) => r.value === null);
  return (
    <>
      <Card className="gap-0">
        <SectionLabel className="mb-1">Values</SectionLabel>
        {withValues.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 border-t border-rose-border py-2">
            <span className="flex flex-col">
              <span>{r.name}</span>
              <span className="text-xs text-rose-muted">{r.id}</span>
            </span>
            <span className="flex flex-col items-end text-right">
              <span className="font-semibold">{r.value}</span>
              <span className="text-xs text-rose-muted">{r.isOwnValue ? "this node's value" : "default"}</span>
            </span>
          </div>
        ))}
      </Card>
      <Card className="gap-0">
        <SectionLabel className="mb-1">Always</SectionLabel>
        {fixed.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 border-t border-rose-border py-2">
            <span>{r.name}</span>
            <span className="text-xs whitespace-nowrap text-rose-muted">{r.id}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

function Members({ inside, isActing }: { inside: Inside; isActing: boolean }) {
  const { permissionFor, notYetFor } = useNodeActions();
  const { open } = useNav();
  const me = useMe();
  // Each member's roles here, from the role list.
  const rolesOf = (id: string) => inside.roles.filter((r) => r.holders.some((h) => h.id === id)).map((r) => r.label);

  return (
    <>
      {inside.members.length === 0 ? (
        <Empty>No members yet.</Empty>
      ) : (
        <Card className="gap-0 py-1">
          {inside.members.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => open({ name: "node", nodeId: m.id })}
              className={`flex min-h-12 items-center justify-between gap-3 py-2 text-left hover:bg-white/5 ${i > 0 ? "border-t border-rose-border" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar node={m} size="sm" />
                <span className="truncate">
                  {m.name}
                  {m.id === me && " (you)"}
                </span>
              </span>
              <span className="flex flex-wrap justify-end gap-1">
                {rolesOf(m.id).map((label) => (
                  <Chip key={label}>{label}</Chip>
                ))}
              </span>
            </button>
          ))}
        </Card>
      )}
      {isActing && (
        <div className="flex flex-col gap-2">
          <GatedButton variant="primary" permission={permissionFor("ADD_MEMBERS")} onClick={notYetFor("Inviting a member")}>
            Invite a member
          </GatedButton>
          <GatedButton permission={permissionFor("EDIT_GOVERNANCE")} onClick={notYetFor("Proposing a role change")}>
            Propose a role change
          </GatedButton>
        </div>
      )}
    </>
  );
}

/** The signed-in person's own node id. */
function useMe() {
  return useActingNode().person.id;
}

function useNodeActions() {
  const { permissionFor } = useActingNode();
  const { notYet } = useNav();
  return { permissionFor, notYetFor: (what: string) => () => notYet(what) };
}

export function NetworkSearch() {
  const { acting } = useActingNode();
  const { open } = useNav();
  const [query, setQuery] = useState("");
  const results = api.nodes.directory.useQuery({ actingNodeId: acting.node.id, query, limit: 50 });

  return (
    <SubScreen title="Find a node">
      <Input type="search" autoFocus placeholder="Search people and collections" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ErrorText error={results.error} />
      {results.data?.length === 0 && <Empty>No one found.</Empty>}
      {results.data && results.data.length > 0 && (
        <Card className="gap-0 py-1">
          {results.data.map((node, i) => (
            <button
              key={node.id}
              type="button"
              onClick={() => open({ name: "node", nodeId: node.id })}
              className={`flex min-h-12 items-center gap-3 py-2 text-left hover:bg-white/5 ${i > 0 ? "border-t border-rose-border" : ""}`}
            >
              <Avatar node={node} size="sm" />
              <span className="flex flex-col">
                <span className="font-semibold">{node.name}</span>
                <span className="text-xs text-rose-muted">{node.kind === "COLLECTION" ? "Collection" : "Person"}</span>
              </span>
            </button>
          ))}
        </Card>
      )}
    </SubScreen>
  );
}

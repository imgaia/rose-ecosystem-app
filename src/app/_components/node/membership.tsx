"use client";

// src/app/_components/node/membership.tsx
// Changing a collection's roles and members, acting for the collection:
// - ProposeRoleChange: an Owner proposes giving or ending a role (UC-COL-06);
// - AddMember: an Owner proposes one of their relationships as a member (UC-COL-04);
// - ProposeRemoval: any member proposes removing another, with a reason (UC-COL-10);
// - LeaveButton: give up your membership and every role there (UC-COL-05).
// The proposals go to the people who must approve them, in their inbox.

import { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";
import { titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { Avatar } from "../shell/header";
import { useNav } from "../shell/navigation";
import { Button, Card, Empty, ErrorText, Field, GatedButton, Input, Loading, MainAction, Select, SubScreen } from "../ui";

type Inside = NonNullable<RouterOutputs["nodes"]["page"]["inside"]>;

/** The acting collection's page, for its members and roles. */
function useCollection() {
  const { acting } = useActingNode();
  return api.nodes.page.useQuery({ actingNodeId: acting.node.id, nodeId: acting.node.id });
}

/** After proposing: refresh, say who must approve, go back. */
function useProposed(text: string) {
  const { back, notify } = useNav();
  const utils = api.useUtils();
  return async () => {
    await utils.invalidate();
    notify(text);
    back();
  };
}

export function ProposeRoleChange({ holderNodeId }: { holderNodeId?: string }) {
  const { acting, permissionFor } = useActingNode();
  const page = useCollection();
  const inside = page.data?.inside;

  const [holder, setHolder] = useState<string | null>(holderNodeId ?? null);
  const [roleKey, setRoleKey] = useState("");
  const [comment, setComment] = useState("");
  const propose = api.members.proposeRoleChange.useMutation({
    onSuccess: useProposed("Proposed. It applies once it is approved."),
  });

  const members = inside?.members ?? [];
  const holderId = holder ?? members[0]?.id ?? "";
  // Every role except Member: joining and leaving have their own screens.
  const roles = (inside?.roles ?? []).filter((r) => r.key !== "MEMBER");
  const role = roles.find((r) => r.key === roleKey) ?? roles[0];
  const holds = !!role?.holders.some((h) => h.id === holderId);
  const holderName = members.find((m) => m.id === holderId)?.name ?? "";

  return (
    <SubScreen form title="Propose a role change">
      <ErrorText error={page.error} />
      {page.isLoading && <Loading />}
      {inside && (
        <>
          <Field label="Member">
            <Select value={holderId} onChange={(e) => setHolder(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Role">
            <Select value={role?.key ?? ""} onChange={(e) => setRoleKey(e.target.value)}>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                  {r.native ? "" : " (optional)"}
                </option>
              ))}
            </Select>
          </Field>
          {role && (
            <Card className="gap-1">
              <p className="font-semibold">
                {holds ? `End ${holderName}'s role as ${role.label}` : `Make ${holderName} ${role.label}`}
              </p>
              <p className="text-xs text-rose-muted">
                {role.capabilities.length > 0 ? `${role.label}: ${role.capabilities.map(titleCase).join(", ")}.` : `${role.label} has no capabilities yet.`}{" "}
                Holders now: {role.holders.map((h) => h.name).join(", ") || "none"}.
              </p>
            </Card>
          )}
          <Field label="Comment (optional)">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <p className="text-xs text-rose-muted">
            It goes to whoever must approve under {acting.node.name}&apos;s rules (R-GOV-08). Every native role keeps at least one holder.
          </p>
          <ErrorText error={propose.error} />
          <MainAction>
            <GatedButton
              variant="primary"
              permission={permissionFor("EDIT_GOVERNANCE")}
              disabled={propose.isPending || !role || !holderId}
              onClick={() =>
                role &&
                propose.mutate({
                  actingNodeId: acting.node.id,
                  holderNodeId: holderId,
                  roleKey: role.key,
                  change: holds ? "REMOVE" : "ADD",
                  comment: comment.trim() || undefined,
                })
              }
            >
              {holds ? "Propose ending this role" : "Propose this role"}
            </GatedButton>
          </MainAction>
        </>
      )}
    </SubScreen>
  );
}

export function AddMember() {
  const { acting, permissionFor } = useActingNode();
  const { open } = useNav();
  const permission = permissionFor("ADD_MEMBERS");
  const candidates = api.members.candidates.useQuery({ actingNodeId: acting.node.id }, { enabled: !!permission?.allowed });
  const [chosen, setChosen] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const propose = api.members.proposeAddMember.useMutation({ onSuccess: useProposed("Proposed. They join once it is approved.") });

  return (
    <SubScreen form title="Add a member">
      <p className="text-rose-muted">Choose from your own relationships. They join {acting.node.name} once they accept.</p>
      {permission && !permission.allowed && <GatedButton permission={permission}>Add a member</GatedButton>}
      <ErrorText error={candidates.error} />
      {candidates.isLoading && permission?.allowed && <Loading />}
      {candidates.data?.length === 0 && <Empty>Everyone you have a relationship with is already a member.</Empty>}
      {candidates.data && candidates.data.length > 0 && (
        <Card className="gap-0 py-1">
          {candidates.data.map((node, i) => (
            <button
              key={node.id}
              type="button"
              aria-pressed={chosen === node.id}
              onClick={() => setChosen(node.id)}
              className={`flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 text-left ${i > 0 ? "border-t border-rose-border" : ""} ${
                chosen === node.id ? "bg-rose-accent/15" : "hover:bg-white/5"
              }`}
            >
              <Avatar node={node} size="sm" />
              <span className="flex-1">{node.name}</span>
              {chosen === node.id && <span className="text-xs font-semibold text-rose-accent">Chosen</span>}
            </button>
          ))}
        </Card>
      )}
      <Field label="Message (optional)">
        <Input value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <ErrorText error={propose.error} />
      <MainAction>
        <GatedButton
          variant="primary"
          permission={permission}
          disabled={!chosen || propose.isPending}
          onClick={() => chosen && propose.mutate({ actingNodeId: acting.node.id, nodeId: chosen, comment: comment.trim() || undefined })}
        >
          Propose as member
        </GatedButton>
      </MainAction>
      <Button onClick={() => open({ name: "invite" })}>Invite someone new to ROSE instead</Button>
    </SubScreen>
  );
}

export function ProposeRemoval({ memberNodeId }: { memberNodeId?: string }) {
  const { acting, person, permissionFor } = useActingNode();
  const page = useCollection();
  const inside = page.data?.inside;
  const others = (inside?.members ?? []).filter((m) => m.id !== person.id);
  const [member, setMember] = useState<string | null>(memberNodeId ?? null);
  const [reason, setReason] = useState("");
  const propose = api.members.proposeRemoval.useMutation({ onSuccess: useProposed("Proposed. The members decide in their inbox.") });
  const memberId = member ?? others[0]?.id ?? "";

  return (
    <SubScreen form title="Propose removing a member">
      <ErrorText error={page.error} />
      {page.isLoading && <Loading />}
      {inside && (
        <>
          {others.length === 0 ? (
            <Empty>There is no one else to remove.</Empty>
          ) : (
            <Field label="Member">
              <Select value={memberId} onChange={(e) => setMember(e.target.value)}>
                {others.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Reason (required)">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <p className="text-xs text-rose-muted">{approvalText(inside)} They lose the Member role and every other role here.</p>
          <ErrorText error={propose.error} />
          <MainAction>
            <GatedButton
              variant="primary"
              permission={permissionFor("PROPOSE_REMOVAL")}
              disabled={!memberId || !reason.trim() || propose.isPending}
              onClick={() => propose.mutate({ actingNodeId: acting.node.id, memberNodeId: memberId, reason: reason.trim() })}
            >
              Propose removal
            </GatedButton>
          </MainAction>
        </>
      )}
    </SubScreen>
  );
}

/** R-COL-04 in words, from the collection's rule value. */
function approvalText(inside: Inside) {
  const share = inside.rules.find((r) => r.id === "R-COL-04")?.value ?? "1.0";
  if (share === "owner_only") return "The Owners decide.";
  const n = Number(share);
  return n < 1 ? `${Math.round(n * 100)}% of the remaining members must approve.` : "Every remaining member must approve.";
}

/** UC-COL-05: leave the acting collection. Back to acting as yourself afterwards. */
export function LeaveButton() {
  const { acting, permissionFor, switchTo, person } = useActingNode();
  const { reset, notify } = useNav();
  const utils = api.useUtils();
  const leave = api.members.leave.useMutation({
    onSuccess: async () => {
      switchTo(person.id);
      reset();
      await utils.invalidate();
      notify(`You left ${acting.node.name}.`);
    },
  });

  return (
    <>
      <ErrorText error={leave.error} />
      <GatedButton
        permission={permissionFor("VIEW")}
        disabled={leave.isPending}
        onClick={() =>
          window.confirm(`Leave ${acting.node.name}? You give up every role you hold there. Interactions with it carry on.`) &&
          leave.mutate({ actingNodeId: acting.node.id })
        }
      >
        Leave {acting.node.name}
      </GatedButton>
    </>
  );
}

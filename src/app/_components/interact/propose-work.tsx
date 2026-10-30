"use client";

// src/app/_components/interact/propose-work.tsx
// Work proposals (PRD S07):
// - ProposeWork: propose new work to a node, saying which side pays (UC-INT-03);
// - CounterPropose: answer a work proposal with changed terms (UC-INT-04);
// - AmendTerms: propose new terms for agreed work (UC-INT-05, UC-INT-10).
// All three wait for the other side's approval; until then nothing changes.

import { useState } from "react";

import { api } from "~/trpc/react";
import { useActingNode, type Permission } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { ErrorText, Field, GatedButton, Input, Loading, MainAction, SubScreen, Toggle } from "../ui";
import { NodePicker, TermsFields, draftFromTerms, emptyTerms, termsFromDraft, useCurrencies, type TermsDraft, type TermsInput } from "./fields";

export function ProposeWork({ otherNodeId }: { otherNodeId?: string }) {
  const { acting, permissionFor } = useActingNode();
  const { back, notify } = useNav();
  const actingNodeId = acting.node.id;

  const [other, setOther] = useState<string | null>(otherNodeId ?? null);
  const [actingNodePays, setActingNodePays] = useState(true);
  const [draft, setDraft] = useState<TermsDraft>(emptyTerms);
  const [curator, setCurator] = useState<string | null>(null);
  const [addCurator, setAddCurator] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { list } = useCurrencies(draft.currencyId, (currencyId) => setDraft((d) => ({ ...d, currencyId })));

  const utils = api.useUtils();
  const propose = api.interactions.proposeWork.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      notify("Proposal sent. The work starts once they approve.");
      back();
    },
  });

  function submit() {
    setFormError(null);
    if (!other) return setFormError("Choose who the work is with");
    const read = termsFromDraft(draft, list);
    if ("error" in read) return setFormError(read.error);
    propose.mutate({ actingNodeId, otherNodeId: other, actingNodePays, terms: read.terms, curatorNodeIds: curator ? [curator] : undefined });
  }

  const you = acting.node.kind === "INDIVIDUAL" ? "You" : acting.node.name;

  return (
    <SubScreen form title="Propose work">
      <NodePicker label="With" nodeId={other} onChange={setOther} />
      <Field label="Your side">
        <Toggle
          label="Your side"
          value={actingNodePays ? "PAY" : "WORK"}
          onChange={(v) => setActingNodePays(v === "PAY")}
          options={[
            { value: "PAY", label: `${you} pay${you === "You" ? "" : "s"}` },
            { value: "WORK", label: `${you} do${you === "You" ? "" : "es"} the work` },
          ]}
        />
      </Field>
      <TermsFields draft={draft} onChange={setDraft} />
      {addCurator ? (
        <NodePicker label="Curator (optional)" nodeId={curator} onChange={setCurator} />
      ) : (
        <button type="button" onClick={() => setAddCurator(true)} className="min-h-11 self-start text-sm font-semibold text-rose-accent">
          + Add a curator (optional)
        </button>
      )}
      <p className="text-xs text-rose-muted">The other side must approve before the work starts.</p>
      <ErrorText error={formError ? { message: formError } : propose.error} />
      <MainAction>
        <GatedButton
          variant="primary"
          // Proposing work where the acting node pays needs PAY; being paid needs INTERACT.
          permission={permissionFor(actingNodePays ? "PAY" : "INTERACT")}
          disabled={propose.isPending}
          onClick={submit}
        >
          Send proposal
        </GatedButton>
      </MainAction>
    </SubScreen>
  );
}

export function CounterPropose({ proposalId }: { proposalId: string }) {
  const { acting } = useActingNode();
  const actingNodeId = acting.node.id;
  const review = api.proposals.review.useQuery({ actingNodeId, proposalId });
  // The answered proposal is closed by this, so go back past it to where it was opened from.
  const counter = api.interactions.counterPropose.useMutation({ onSuccess: useSentAndBack(2) });
  const base = review.data?.proposedTerms;

  return (
    <SubScreen form title="Counter-propose">
      <ErrorText error={review.error} />
      {review.isLoading && <Loading />}
      {base && review.data && (
        <TermsEditor
          initial={draftFromTerms(base)}
          intro={`Change what ${review.data.proposer.name} proposed. Your version then waits for their approval.`}
          submitLabel="Send counter-proposal"
          permission={review.data.permission}
          pending={counter.isPending}
          error={counter.error}
          onSubmit={(terms, comment) => counter.mutate({ actingNodeId, proposalId, changes: terms, comment })}
        />
      )}
    </SubScreen>
  );
}

export function AmendTerms({ interactionId }: { interactionId: string }) {
  const { acting } = useActingNode();
  const actingNodeId = acting.node.id;
  const detail = api.interactions.detail.useQuery({ actingNodeId, interactionId });
  const amend = api.interactions.amend.useMutation({ onSuccess: useSentAndBack(1) });
  const current = detail.data?.currentTerms;

  return (
    <SubScreen form title="Amend terms">
      <ErrorText error={detail.error} />
      {detail.isLoading && <Loading />}
      {current && detail.data && (
        <TermsEditor
          initial={draftFromTerms(current)}
          intro="The current terms stay in force until the other side approves the new ones."
          submitLabel="Propose new terms"
          permission={detail.data.permission}
          pending={amend.isPending}
          error={amend.error}
          onSubmit={(terms, comment) => amend.mutate({ actingNodeId, interactionId, changes: terms, comment })}
        />
      )}
    </SubScreen>
  );
}

/** After sending new terms: refresh everything, say so, and go back `screens` screens. */
function useSentAndBack(screens: number) {
  const { notify, back } = useNav();
  const utils = api.useUtils();
  return async () => {
    await utils.invalidate();
    notify("Sent. It waits for the other side's approval.");
    back(screens);
  };
}

/** The terms form with a comment, shared by counter-propose and amend. Filled once from `initial`. */
function TermsEditor({
  initial,
  intro,
  submitLabel,
  permission,
  pending,
  error,
  onSubmit,
}: {
  initial: TermsDraft;
  intro: string;
  submitLabel: string;
  permission: Permission | null | undefined;
  pending: boolean;
  error: { message: string } | null;
  onSubmit: (terms: TermsInput, comment?: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { list } = useCurrencies(draft.currencyId, (currencyId) => setDraft((d) => ({ ...d, currencyId })));

  function submit() {
    setFormError(null);
    const read = termsFromDraft(draft, list);
    if ("error" in read) return setFormError(read.error);
    onSubmit(read.terms, comment.trim() || undefined);
  }

  return (
    <>
      <p className="text-rose-muted">{intro}</p>
      <TermsFields draft={draft} onChange={setDraft} />
      <Field label="Comment (optional)">
        <Input placeholder="Why the change" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <ErrorText error={formError ? { message: formError } : error} />
      <MainAction>
        <GatedButton variant="primary" permission={permission} disabled={pending} onClick={submit}>
          {submitLabel}
        </GatedButton>
      </MainAction>
    </>
  );
}

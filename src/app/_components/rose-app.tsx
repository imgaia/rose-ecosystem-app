"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";

import { api, type RouterOutputs } from "~/trpc/react";


const CurrentMemberIdContext = createContext<string>("");

function useCurrentMemberId() {
  return useContext(CurrentMemberIdContext);
}

function useCurrentMember() {
  const memberId = useCurrentMemberId();
  const { data: members } = api.rose.listMembers.useQuery();
  return members?.find((m) => m.id === memberId);
}

type Tab = "wallet" | "fund" | "evaluate" | "reward" | "relate" | "onboard";

const TABS: { id: Tab; label: string }[] = [
  { id: "wallet", label: "Wallet" },
  { id: "fund", label: "Fund" },
  { id: "evaluate", label: "Evaluate" },
  { id: "reward", label: "Reward" },
  { id: "relate", label: "Relate" },
  { id: "onboard", label: "Onboard" },
];

const headerCardClassName =
  "rounded-2xl bg-gradient-to-br from-rose-accent to-rose-accent-dark p-6 shadow-lg";
const cardClassName =
  "rounded-xl border border-rose-border bg-rose-surface p-4";
const accentCardClassName =
  "rounded-xl border border-rose-border border-t-2 border-t-rose-accent bg-rose-surface p-4";
const sectionHeadingClassName =
  "mb-3 text-sm font-semibold uppercase tracking-wide text-rose-blush";
const labelClassName =
  "text-sm font-semibold uppercase tracking-wide text-rose-muted";
const btnPrimaryClassName =
  "rounded-xl bg-rose-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimarySmClassName =
  "rounded-xl bg-rose-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

const ROLES = ["SPONSOR", "CURATOR", "MAKER"] as const;
type Role = (typeof ROLES)[number];

type PendingWorkItem = {
  id: string;
  subject: string;
  description: string;
  memberName: string;
};

const PENDING_WORK_ITEMS: PendingWorkItem[] = [
  {
    id: "fence",
    subject: "Reiner",
    description: "Nursery fencing installation — verify completion",
    memberName: "Reiner",
  },
  {
    id: "writeup",
    subject: "Annie",
    description: "Pilot program writeup — review draft",
    memberName: "Annie",
  },
  {
    id: "compost",
    subject: "Ryan",
    description: "Compost system maintenance log",
    memberName: "Ryan",
  },
];

function ScreenLoading({ message = "Loading members…" }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-rose-muted">
      {message}
    </div>
  );
}

function ScreenError({ message }: { message: string }) {
  return <div className="p-4 text-sm text-red-400">{message}</div>;
}

function NoMemberEmpty() {
  return (
    <div className="p-8 text-center text-sm text-rose-muted">
      No members yet. Use Onboard to add the first one.
    </div>
  );
}

function ConfirmationBanner({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg">
            ✓
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-100">{title}</p>
            <p className="mt-1 text-xl font-bold">{detail}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatRoles(roles: { role: string }[]) {
  return roles.map((r) => r.role.charAt(0) + r.role.slice(1).toLowerCase()).join(", ");
}

async function invalidateCurrentWallet(
  utils: ReturnType<typeof api.useUtils>,
  memberId: string,
) {
  await utils.rose.getWallet.invalidate({ memberId });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function WalletScreen() {
  const memberId = useCurrentMemberId();
  const currentMember = useCurrentMember();

  const { isLoading: membersLoading, error: membersError } =
    api.rose.listMembers.useQuery();

  const { data: wallet, isLoading: walletLoading, error: walletError } =
    api.rose.getWallet.useQuery(
      { memberId },
      { enabled: !!memberId },
    );

  if (membersLoading && !currentMember) {
    return <ScreenLoading />;
  }

  if (membersError) {
    return (
      <ScreenError message={`Failed to load members: ${membersError.message}`} />
    );
  }

  if (!currentMember) {
    return <ScreenError message="Could not load your member profile." />;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className={headerCardClassName}>
        <p className="text-sm font-medium text-white/80">Your balance</p>
        {walletLoading ? (
          <p className="mt-2 text-3xl font-bold text-rose-blush">…</p>
        ) : walletError ? (
          <p className="mt-2 text-sm text-white/80">{walletError.message}</p>
        ) : (
          <p className="mt-1 text-4xl font-bold tracking-tight text-rose-blush">
            {wallet?.balance.toLocaleString()}{" "}
            <span className="text-xl font-semibold text-rose-blush/70">
              {wallet?.currency ?? "ROSE"}
            </span>
          </p>
        )}
      </section>

      <section>
        <h2 className={sectionHeadingClassName}>Activity</h2>

        {walletLoading ? (
          <p className="text-sm text-rose-muted">Loading activity…</p>
        ) : !wallet?.activity.length ? (
          <p className="rounded-xl border border-dashed border-rose-border bg-rose-surface p-6 text-center text-sm text-rose-muted">
            No activity yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {wallet.activity.map((item, index) => (
              <li
                key={`${item.type}-${item.createdAt.toISOString()}-${index}`}
                className={cardClassName}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <ActivityLabel item={item} />
                    {item.note && (
                      <p className="mt-1 truncate text-sm text-rose-muted">
                        {item.note}
                      </p>
                    )}
                  </div>
                  {item.amount !== null && (
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        item.direction === "in"
                          ? "text-emerald-400"
                          : item.type === "reward"
                            ? "text-amber-400"
                            : "text-rose-text"
                      }`}
                    >
                      {item.direction === "in" ? "+" : "−"}
                      {item.amount}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-rose-muted">
                  {formatDate(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActivityLabel({
  item,
}: {
  item: RouterOutputs["rose"]["getWallet"]["activity"][number];
}) {
  if (item.type === "evaluation") {
    return (
      <p className="text-sm font-medium text-rose-text">
        Evaluated{" "}
        <span className="text-sky-400">{item.withName}</span>
      </p>
    );
  }

  const verb = item.type === "transaction" ? "Sent" : "Rewarded";
  const prep = item.direction === "out" ? "to" : "from";

  return (
    <p className="text-sm font-medium text-rose-text">
      {item.direction === "in"
        ? `Received from ${item.withName}`
        : `${verb} ${prep} ${item.withName}`}
    </p>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-rose-border bg-rose-bg px-4 py-3 text-sm text-rose-text shadow-sm outline-none focus:border-rose-accent focus:ring-2 focus:ring-rose-accent/20";

function FundScreen() {
  const utils = api.useUtils();
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState<{
    recipientName: string;
    amount: number;
  } | null>(null);

  const { data: members, isLoading, error } = api.rose.listMembers.useQuery();
  const currentMember = useCurrentMember();
  const recipients = members?.filter((m) => m.id !== currentMember?.id) ?? [];

  const sendTransaction = api.rose.sendTransaction.useMutation({
    onSuccess: async (_data, variables) => {
      const recipient = members?.find((m) => m.id === variables.recipientId);
      if (currentMember) {
        await utils.rose.getWallet.invalidate({ memberId: currentMember.id });
      }
      setConfirmation({
        recipientName: recipient?.name ?? "member",
        amount: variables.amount,
      });
      setRecipientId("");
      setAmount("");
      setNote("");
    },
  });

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  const parsedAmount = parseFloat(amount);
  const canSend =
    !!currentMember &&
    !!recipientId &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !sendTransaction.isPending;

  if (isLoading) return <ScreenLoading />;
  if (error) {
    return <ScreenError message={`Failed to load members: ${error.message}`} />;
  }
  if (!currentMember) return <NoMemberEmpty />;

  if (confirmation) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg">
              ✓
            </span>
            <div>
              <p className="text-sm font-medium text-emerald-100">Sent successfully</p>
              <p className="mt-1 text-xl font-bold">
                {confirmation.amount} ROSE to {confirmation.recipientName}
              </p>
            </div>
          </div>
        </section>
        <p className="text-center text-sm text-rose-muted">
          Your wallet balance will update when you switch back.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className={headerCardClassName}>
        <p className="text-sm font-medium text-white/80">Fund a member</p>
        <p className="mt-1 text-lg font-semibold text-rose-text">
          Send ROSE from your wallet as a Sponsor
        </p>
      </section>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend) return;
          sendTransaction.mutate({
            senderId: currentMember.id,
            recipientId,
            amount: parsedAmount,
            note: note.trim() || undefined,
          });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Recipient</span>
          <select
            className={fieldClassName}
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          >
            <option value="">Select a member…</option>
            {recipients.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Amount</span>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0"
            className={fieldClassName}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Note</span>
          <input
            type="text"
            placeholder="What's this for?"
            className={fieldClassName}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {sendTransaction.error && (
          <p className="text-sm text-red-400">{sendTransaction.error.message}</p>
        )}

        <button
          type="submit"
          disabled={!canSend}
          className={`mt-2 ${btnPrimaryClassName}`}
        >
          {sendTransaction.isPending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function EvaluateScreen() {
  const utils = api.useUtils();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rewardAmounts, setRewardAmounts] = useState<Record<string, string>>({});
  const [doneItems, setDoneItems] = useState<
    { item: PendingWorkItem; note?: string; reward?: number }[]
  >([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: members, isLoading, error: membersError } =
    api.rose.listMembers.useQuery();
  const currentMember = useCurrentMember();

  const createEvaluation = api.rose.createEvaluation.useMutation();
  const sendReward = api.rose.sendReward.useMutation();

  const memberByName = new Map(members?.map((m) => [m.name, m]) ?? []);
  const pendingItems = PENDING_WORK_ITEMS.filter(
    (item) => !doneItems.some((d) => d.item.id === item.id),
  );

  async function handleConfirm(item: PendingWorkItem) {
    if (!currentMember) return;
    const associated = memberByName.get(item.memberName);
    if (!associated) {
      setError(`Member "${item.memberName}" not found.`);
      return;
    }

    setConfirmingId(item.id);
    setError(null);

    const noteText = notes[item.id]?.trim();
    const parsedReward = parseFloat(rewardAmounts[item.id] ?? "");

    try {
      await createEvaluation.mutateAsync({
        curatorId: currentMember.id,
        subject: item.subject,
        note: noteText || undefined,
      });

      let reward: number | undefined;
      if (!Number.isNaN(parsedReward) && parsedReward > 0) {
        await sendReward.mutateAsync({
          senderId: currentMember.id,
          recipientId: associated.id,
          amount: parsedReward,
          note: noteText || `Evaluation: ${item.subject}`,
        });
        reward = parsedReward;
      }

      await invalidateCurrentWallet(utils, currentMember.id);
      setDoneItems((prev) => [...prev, { item, note: noteText, reward }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setConfirmingId(null);
    }
  }

  if (isLoading) return <ScreenLoading />;
  if (membersError) {
    return <ScreenError message={`Failed to load members: ${membersError.message}`} />;
  }
  if (!currentMember) return <NoMemberEmpty />;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className={headerCardClassName}>
        <p className="text-sm font-medium text-white/80">Evaluate work</p>
        <p className="mt-1 text-lg font-semibold text-rose-text">
          Confirm completed work as a{" "}
          <span className="text-sky-400">Curator</span>
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClassName}>Pending</h2>
        {pendingItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-rose-border bg-rose-surface p-6 text-center text-sm text-rose-muted">
            All items evaluated.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingItems.map((item) => (
              <li key={item.id} className={accentCardClassName}>
                <p className="font-medium text-rose-text">{item.subject}</p>
                <p className="mt-1 text-sm text-rose-muted">{item.description}</p>
                <p className="mt-1 text-xs text-rose-muted">
                  Maker: {item.memberName}
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-rose-muted">
                      Note
                    </span>
                    <input
                      type="text"
                      placeholder="Evaluation notes…"
                      className={fieldClassName}
                      value={notes[item.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-rose-muted">
                      Reward amount (optional)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="0"
                      className={fieldClassName}
                      value={rewardAmounts[item.id] ?? ""}
                      onChange={(e) =>
                        setRewardAmounts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <button
                    type="button"
                    disabled={confirmingId === item.id}
                    onClick={() => void handleConfirm(item)}
                    className={btnPrimarySmClassName}
                  >
                    {confirmingId === item.id
                      ? "Logging…"
                      : "Confirm & log evaluation"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {doneItems.length > 0 && (
        <section>
          <h2 className={sectionHeadingClassName}>Done</h2>
          <ul className="flex flex-col gap-2">
            {doneItems.map(({ item, note, reward }) => (
              <li
                key={item.id}
                className="rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-4"
              >
                <p className="text-sm font-medium text-emerald-400">
                  ✓ {item.subject}
                </p>
                {note && (
                  <p className="mt-1 text-sm text-emerald-300/80">{note}</p>
                )}
                {reward !== undefined && (
                  <p className="mt-1 text-xs text-amber-400/90">
                    Rewarded {reward} ROSE to {item.memberName}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RewardScreen() {
  const utils = api.useUtils();
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    recipientName: string;
    amount: number;
  } | null>(null);

  const { data: members, isLoading, error } = api.rose.listMembers.useQuery();
  const currentMember = useCurrentMember();
  const recipients = members?.filter((m) => m.id !== currentMember?.id) ?? [];

  const sendReward = api.rose.sendReward.useMutation({
    onSuccess: async (_data, variables) => {
      const recipient = members?.find((m) => m.id === variables.recipientId);
      if (currentMember) {
        await invalidateCurrentWallet(utils, currentMember.id);
      }
      setConfirmation({
        recipientName: recipient?.name ?? "member",
        amount: variables.amount,
      });
      setRecipientId("");
      setAmount("");
      setNote("");
      setRepeatMonthly(false);
    },
  });

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  const parsedAmount = parseFloat(amount);
  const canSend =
    !!currentMember &&
    !!recipientId &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !sendReward.isPending;

  if (isLoading) return <ScreenLoading />;
  if (error) {
    return <ScreenError message={`Failed to load members: ${error.message}`} />;
  }
  if (!currentMember) return <NoMemberEmpty />;

  if (confirmation) {
    return (
      <ConfirmationBanner
        title="Reward sent"
        detail={`${confirmation.amount} ROSE to ${confirmation.recipientName}`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className={headerCardClassName}>
        <p className="text-sm font-medium text-white/80">Send a reward</p>
        <p className="mt-1 text-lg font-semibold text-rose-text">
          Recognize a member — no exchange expected
        </p>
      </section>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend) return;
          sendReward.mutate({
            senderId: currentMember.id,
            recipientId,
            amount: parsedAmount,
            note: note.trim() || undefined,
          });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Recipient</span>
          <select
            className={fieldClassName}
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          >
            <option value="">Select a member…</option>
            {recipients.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Amount</span>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0"
            className={fieldClassName}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Why</span>
          <input
            type="text"
            placeholder="What are you recognizing?"
            className={fieldClassName}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label className={`flex items-center gap-3 ${cardClassName}`}>
          <input
            type="checkbox"
            checked={repeatMonthly}
            onChange={(e) => setRepeatMonthly(e.target.checked)}
            className="h-4 w-4 rounded border-rose-border bg-rose-bg text-rose-accent focus:ring-rose-accent/20"
          />
          <span className="text-sm text-rose-text">Repeat this monthly</span>
        </label>

        {sendReward.error && (
          <p className="text-sm text-red-400">{sendReward.error.message}</p>
        )}

        <button
          type="submit"
          disabled={!canSend}
          className={`mt-2 ${btnPrimaryClassName}`}
        >
          {sendReward.isPending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function RelateScreen() {
  const utils = api.useUtils();
  const [localStrength, setLocalStrength] = useState<Record<string, number>>({});

  const { data: members, isLoading, error } = api.rose.listMembers.useQuery();
  const currentMember = useCurrentMember();

  const memberId = useCurrentMemberId();
  const { data: relationships, isLoading: relationshipsLoading } =
    api.rose.getRelationships.useQuery(
      { memberId },
      { enabled: !!memberId },
    );

  const setStrength = api.rose.setRelationshipStrength.useMutation({
    onSuccess: async () => {
      if (currentMember) {
        await utils.rose.getRelationships.invalidate({
          memberId: currentMember.id,
        });
      }
    },
  });

  const strengthByMember = new Map(
    relationships?.map((r) => [r.otherId, r.strength]) ?? [],
  );
  const otherMembers = members?.filter((m) => m.id !== currentMember?.id) ?? [];

  function getStrength(memberId: string) {
    if (memberId in localStrength) return localStrength[memberId]!;
    return strengthByMember.get(memberId) ?? 0.5;
  }

  if (isLoading || relationshipsLoading) return <ScreenLoading />;
  if (error) {
    return <ScreenError message={`Failed to load members: ${error.message}`} />;
  }
  if (!currentMember) return <NoMemberEmpty />;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className={headerCardClassName}>
        <p className="text-sm font-medium text-white/80">Relationships</p>
        <p className="mt-1 text-lg font-semibold text-rose-blush">
          How strongly you&apos;re connected to each member
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {otherMembers.map((member) => {
          const strength = getStrength(member.id);
          return (
            <li key={member.id} className={cardClassName}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-rose-text">{member.name}</p>
                  <p className="mt-0.5 text-xs text-rose-muted">
                    {formatRoles(member.roles)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-rose-accent">
                  {strength.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={strength}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setLocalStrength((prev) => ({ ...prev, [member.id]: value }));
                  setStrength.mutate({
                    memberAId: currentMember.id,
                    memberBId: member.id,
                    strength: value,
                  });
                }}
                className="mt-4 w-full accent-rose-accent"
              />
            </li>
          );
        })}
      </ul>

      {setStrength.error && (
        <p className="text-sm text-red-400">{setStrength.error.message}</p>
      )}
    </div>
  );
}

function OnboardScreen() {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [addedThisSession, setAddedThisSession] = useState<
    { name: string; roles: Role[] }[]
  >([]);

  const { data: members, isLoading, error } = api.rose.listMembers.useQuery();

  const addMember = api.rose.addMember.useMutation({
    onSuccess: async (member, variables) => {
      await utils.rose.listMembers.invalidate();
      setAddedThisSession((prev) => [
        { name: variables.name, roles: variables.roles },
        ...prev,
      ]);
      setName("");
      setSelectedRoles([]);
    },
  });

  function toggleRole(role: Role) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  const canAdd =
    name.trim().length > 0 && selectedRoles.length > 0 && !addMember.isPending;

  if (isLoading) return <ScreenLoading />;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className={headerCardClassName}>
        <p className="text-sm font-medium text-white/80">Onboard</p>
        <p className="mt-1 text-lg font-semibold text-rose-text">
          Add a new member to ROSE
        </p>
      </section>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          addMember.mutate({ name: name.trim(), roles: selectedRoles });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Name</span>
          <input
            type="text"
            placeholder="Member name"
            className={fieldClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={labelClassName}>Roles</span>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => {
              const active = selectedRoles.includes(role);
              const label = role.charAt(0) + role.slice(1).toLowerCase();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-rose-accent text-white shadow-sm"
                      : "border border-rose-border bg-rose-surface text-rose-muted hover:border-rose-accent/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {(error ?? addMember.error) && (
          <p className="text-sm text-red-400">
            {error?.message ?? addMember.error?.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!canAdd}
          className={`mt-2 ${btnPrimaryClassName}`}
        >
          {addMember.isPending ? "Adding…" : "Add member"}
        </button>
      </form>

      {addedThisSession.length > 0 && (
        <section>
          <h2 className={sectionHeadingClassName}>Added this session</h2>
          <ul className="flex flex-col gap-2">
            {addedThisSession.map((entry, index) => (
              <li key={`${entry.name}-${index}`} className={cardClassName}>
                <p className="font-medium text-rose-text">{entry.name}</p>
                <p className="mt-0.5 text-sm text-rose-muted">
                  {entry.roles
                    .map((r) => r.charAt(0) + r.slice(1).toLowerCase())
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {members && members.length > 0 && (
        <section>
          <h2 className={sectionHeadingClassName}>
            All members ({members.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.id} className={`${cardClassName} py-3`}>
                <p className="text-sm font-medium text-rose-text">{member.name}</p>
                <p className="text-xs text-rose-muted">{formatRoles(member.roles)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function RoseApp({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("wallet");

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <CurrentMemberIdContext.Provider value={memberId}>
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-rose-bg">
      <header className="shrink-0 border-b border-rose-border bg-rose-surface px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Image
            src="/rose-logo_orange.svg"
            alt="ROSE"
            width={90}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-rose-muted">{memberName}</span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-rose-border px-2.5 py-1 text-xs font-medium text-rose-muted transition-colors hover:border-rose-accent/50 hover:text-rose-text"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "wallet" && <WalletScreen />}
        {activeTab === "fund" && <FundScreen />}
        {activeTab === "evaluate" && <EvaluateScreen />}
        {activeTab === "reward" && <RewardScreen />}
        {activeTab === "relate" && <RelateScreen />}
        {activeTab === "onboard" && <OnboardScreen />}
      </main>

      <nav className="shrink-0 border-t border-rose-border bg-rose-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="flex">
          {TABS.map((tab) => (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-rose-accent"
                    : "text-rose-muted hover:text-rose-text"
                }`}
              >
                <TabIcon tab={tab.id} active={activeTab === tab.id} />
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
    </CurrentMemberIdContext.Provider>
  );
}

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const className = `h-5 w-5 ${active ? "stroke-rose-accent" : "stroke-rose-muted"}`;

  switch (tab) {
    case "wallet":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
        </svg>
      );
    case "fund":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "evaluate":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
        </svg>
      );
    case "reward":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      );
    case "relate":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      );
    case "onboard":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      );
  }
}

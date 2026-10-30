"use client";

// src/app/_components/node/edit-identity.tsx
// Edit the acting node's identity (UC-ID-02 to UC-ID-04): name, description,
// email, phone, photo and country (the primary fiat defaults from it,
// R-FIN-13); for a person also their username and password
// (the current password is needed to change it). Needs EDIT_IDENTITY:
// a person always has it for themselves, a collection's Owners for it.

import { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Button, Card, ErrorText, Field, GatedButton, Input, Loading, MainAction, SectionLabel, Select, SubScreen, TextArea } from "../ui";

type Identity = RouterOutputs["identity"]["get"];

export function EditIdentity() {
  const { acting, permissionFor } = useActingNode();
  const permission = permissionFor("EDIT_IDENTITY");
  const identity = api.identity.get.useQuery({ actingNodeId: acting.node.id }, { enabled: !!permission?.allowed });

  return (
    <SubScreen form title="Edit identity">
      {permission && !permission.allowed && <GatedButton permission={permission}>Edit identity</GatedButton>}
      <ErrorText error={identity.error} />
      {identity.isLoading && permission?.allowed && <Loading />}
      {identity.data && (
        <>
          <Details identity={identity.data} />
          {/* Username and password: only a person acting as themselves gets here. */}
          {identity.data.kind === "INDIVIDUAL" && (
            <>
              <Username current={identity.data.username ?? ""} />
              <Password />
            </>
          )}
        </>
      )}
    </SubScreen>
  );
}

function Details({ identity }: { identity: Identity }) {
  const { acting, permissionFor } = useActingNode();
  const { notify, setChanged } = useNav();
  const isPerson = identity.kind === "INDIVIDUAL";
  const [form, setForm] = useState({
    firstName: identity.firstName ?? "",
    lastName: identity.lastName ?? "",
    name: identity.name,
    description: identity.description ?? "",
    email: identity.email ?? "",
    phone: identity.phone ?? "",
    photoUrl: identity.photoUrl ?? "",
    country: identity.country ?? "",
  });
  const countries = useCountries(identity.country);
  const set = (changes: Partial<typeof form>) => setForm({ ...form, ...changes });

  const utils = api.useUtils();
  const update = api.identity.update.useMutation({
    onSuccess: async () => {
      setChanged(false); // stays open after saving: nothing left to lose
      await utils.invalidate();
      notify("Saved.");
    },
  });

  function save() {
    const common = { description: form.description, email: form.email, phone: form.phone, photoUrl: form.photoUrl, country: form.country };
    update.mutate({
      actingNodeId: acting.node.id,
      ...common,
      ...(isPerson ? { firstName: form.firstName, lastName: form.lastName } : { name: form.name }),
    });
  }

  return (
    <Card className="gap-3">
      <SectionLabel>Details</SectionLabel>
      {isPerson ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="First name">
            <Input autoComplete="given-name" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
          </Field>
          <Field label="Last name">
            <Input autoComplete="family-name" value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
          </Field>
        </div>
      ) : (
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
      )}
      <Field label="About">
        <TextArea rows={2} placeholder={isPerson ? "A line about you" : "What this collection is for"} value={form.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <Field label="Email">
        <Input type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
      </Field>
      <Field label="Phone">
        <Input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
      </Field>
      <Field label="Photo" hint="A web address of a picture, starting with https://">
        <Input type="url" placeholder="https://" value={form.photoUrl} onChange={(e) => set({ photoUrl: e.target.value })} />
      </Field>
      <Field label="Country" hint="A new primary fiat defaults from it. To change the primary fiat itself, go to Wallet, Currencies.">
        <Select value={form.country} onChange={(e) => set({ country: e.target.value })}>
          <option value="">Not set</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
              {c.fiat ? ` · ${c.fiat}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <ErrorText error={update.error} />
      <MainAction onCard>
        <GatedButton variant="primary" permission={permissionFor("EDIT_IDENTITY")} disabled={update.isPending} onClick={save}>
          Save details
        </GatedButton>
      </MainAction>
    </Card>
  );
}

/**
 * The countries the fiat list covers (R-FIN-13), named in the browser's
 * language, each with the fiat it defaults to; plus the node's own if not listed.
 */
function useCountries(current: string | null) {
  const { acting } = useActingNode();
  const fiats = api.currencies.fiatList.useQuery({ actingNodeId: acting.node.id });
  const names = (() => {
    try {
      return new Intl.DisplayNames(undefined, { type: "region" });
    } catch {
      return null;
    }
  })();
  const list = (fiats.data ?? []).flatMap((f) => (f.country ?? "").split(",").map((code) => ({ code: code.trim(), fiat: f.code })));
  if (current && !list.some((c) => c.code === current)) list.push({ code: current, fiat: null });
  return list
    .filter((c) => c.code)
    .map((c) => ({ ...c, name: names?.of(c.code) ?? c.code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function Username({ current }: { current: string }) {
  const { acting } = useActingNode();
  const { notify, setChanged } = useNav();
  const [username, setUsername] = useState(current);
  const utils = api.useUtils();
  const change = api.identity.changeUsername.useMutation({
    onSuccess: async () => {
      setChanged(false);
      await utils.identity.invalidate();
      notify("Username changed. Use it next time you sign in.");
    },
  });

  return (
    <Card className="gap-3">
      <SectionLabel>Username</SectionLabel>
      <Field label="Username" hint="What you sign in with. No one else can have it.">
        <Input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <ErrorText error={change.error} />
      <Button
        disabled={change.isPending || !username.trim() || username.trim() === current}
        onClick={() => change.mutate({ actingNodeId: acting.node.id, username })}
      >
        Change username
      </Button>
    </Card>
  );
}

function Password() {
  const { acting } = useActingNode();
  const { notify, setChanged } = useNav();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const change = api.identity.changePassword.useMutation({
    onSuccess: () => {
      setChanged(false);
      setCurrentPassword("");
      setNewPassword("");
      setRepeat("");
      notify("Password changed.");
    },
  });

  function submit() {
    setFormError(null);
    if (newPassword !== repeat) return setFormError("The two new passwords are not the same");
    change.mutate({ actingNodeId: acting.node.id, currentPassword, newPassword });
  }

  return (
    <Card className="gap-3">
      <SectionLabel>Password</SectionLabel>
      <Field label="Current password">
        <Input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </Field>
      <Field label="New password" hint="At least 8 characters">
        <Input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </Field>
      <Field label="New password again">
        <Input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </Field>
      <ErrorText error={formError ? { message: formError } : change.error} />
      <Button disabled={change.isPending || !currentPassword || newPassword.length < 8} onClick={submit}>
        Change password
      </Button>
    </Card>
  );
}

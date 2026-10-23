"use client";

// src/app/_components/invite/invite.tsx
// Invite someone (PRD S22, UC-INV-01, UC-INV-03). Acting as yourself it
// needs INVITE; acting for a collection it needs ADD_MEMBERS, and the person
// joins as the collection's Member. The app doesn't send email yet: it shows
// a personal link to pass on. Below, the invitations sent, to resend or revoke.

import { useState } from "react";

import { api } from "~/trpc/react";
import { formatDate, titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { Button, Card, Chip, ErrorText, Field, GatedButton, Input, SectionLabel, SubScreen, TextArea } from "../ui";

export function Invite() {
  const { acting, permissionFor } = useActingNode();
  const actingNodeId = acting.node.id;
  const isCollection = acting.node.kind === "COLLECTION";
  const permission = permissionFor(isCollection ? "ADD_MEMBERS" : "INVITE");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  // The link is shown once, right after it is made (the server keeps only a hash).
  const [link, setLink] = useState<{ name: string; url: string; expiresAt: Date } | null>(null);

  const utils = api.useUtils();
  const list = api.invitations.list.useQuery({ actingNodeId }, { enabled: !!permission?.allowed });
  const showLink = (forName: string) => (r: { joinPath: string; expiresAt: Date }) => {
    setLink({ name: forName, url: window.location.origin + r.joinPath, expiresAt: r.expiresAt });
    void utils.invitations.list.invalidate();
  };
  const create = api.invitations.create.useMutation();
  const resend = api.invitations.resend.useMutation();
  const revoke = api.invitations.revoke.useMutation({ onSuccess: () => utils.invitations.list.invalidate() });

  function submit() {
    setFormError(null);
    if (!name.trim()) return setFormError("Enter the name of the person you invite");
    if (!email.trim() && !phone.trim()) return setFormError("Enter an email or a phone number");
    create.mutate(
      {
        actingNodeId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
      },
      {
        onSuccess: (r) => {
          showLink(name.trim())(r);
          setName("");
          setEmail("");
          setPhone("");
          setMessage("");
        },
      },
    );
  }

  return (
    <SubScreen title="Invite someone">
      {link && <LinkCard link={link} />}

      <p className="text-rose-muted">
        {isCollection ? `They join ROSE as a Member of ${acting.node.name}.` : "They join ROSE with their own node."} Joining creates no relationship with you.
      </p>
      <Field label="Name">
        <Input placeholder="Who you are inviting" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="Message (optional)">
        <TextArea placeholder="Shown on their join screen" value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>
      <ErrorText error={formError ? { message: formError } : create.error} />
      <GatedButton variant="primary" permission={permission} disabled={create.isPending} onClick={submit}>
        Create invitation link
      </GatedButton>

      {list.data && list.data.length > 0 && (
        <>
          <SectionLabel className="mt-3">Invitations sent</SectionLabel>
          <ErrorText error={resend.error ?? revoke.error} />
          <Card className="gap-0 py-1">
            {list.data.map((inv, i) => {
              const open = inv.status === "PENDING" || inv.status === "EXPIRED";
              return (
                <div key={inv.id} className={`flex flex-col gap-2 py-2 ${i > 0 ? "border-t border-rose-border" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold">{inv.name}</span>
                      <span className="text-xs text-rose-muted">
                        {inv.email ?? inv.phone} · {inv.status === "PENDING" ? `expires ${formatDate(inv.expiresAt)}` : `sent ${formatDate(inv.createdAt)}`}
                      </span>
                    </span>
                    <Chip solid={inv.status === "ACCEPTED"}>{titleCase(inv.status)}</Chip>
                  </div>
                  {open && (
                    <div className="flex gap-2">
                      <Button
                        className="min-h-9 flex-1 text-xs"
                        disabled={resend.isPending}
                        onClick={() => resend.mutate({ actingNodeId, invitationId: inv.id }, { onSuccess: showLink(inv.name) })}
                      >
                        New link
                      </Button>
                      {inv.status === "PENDING" && (
                        <Button
                          className="min-h-9 flex-1 text-xs"
                          disabled={revoke.isPending}
                          onClick={() => window.confirm(`Revoke the invitation for ${inv.name}? The link stops working.`) && revoke.mutate({ actingNodeId, invitationId: inv.id })}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </>
      )}
    </SubScreen>
  );
}

function LinkCard({ link }: { link: { name: string; url: string; expiresAt: Date } }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the link is on screen to copy by hand.
    }
  }
  return (
    <Card className="border-rose-accent">
      <SectionLabel>Link for {link.name}</SectionLabel>
      <p className="text-sm break-all">{link.url}</p>
      <p className="text-xs text-rose-muted">
        Send it to them yourself. It works once, until {formatDate(link.expiresAt)}, and is shown only now.
      </p>
      <Button variant="primary" onClick={() => void copy()}>
        {copied ? "Copied" : "Copy link"}
      </Button>
    </Card>
  );
}

"use client";

// src/app/_components/ui.tsx
// Small building blocks every screen shares, so they all look alike:
// cards, labelled rows, chips, buttons (including the disabled
// "Needs Treasurer" kind), form fields and the screen header with a back arrow.

import { useEffect } from "react";

import { needsText, useActingNode, type Permission } from "./shell/acting-node";
import { useNav } from "./shell/navigation";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-2 rounded-2xl border border-rose-border bg-rose-surface px-4 py-3 ${className}`}>
      {children}
    </section>
  );
}

/** Small uppercase heading inside or above a card: "TERMS · VERSION 2". */
export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-semibold tracking-wide text-rose-muted uppercase ${className}`}>{children}</p>;
}

/** A label on the left, a value on the right, with a hairline above. */
export function Row({ label, children, strong }: { label: React.ReactNode; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-rose-border py-2">
      <span className="text-rose-muted">{label}</span>
      <span className={`text-right ${strong ? "font-semibold" : ""}`}>{children}</span>
    </div>
  );
}

export function Chip({ children, solid }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${
        solid ? "border-rose-accent bg-rose-accent text-white" : "border-rose-border text-rose-muted"
      }`}
    >
      {children}
    </span>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  const look =
    variant === "primary"
      ? "border-rose-accent bg-rose-accent text-white enabled:hover:brightness-110"
      : "border-rose-muted text-rose-text enabled:hover:bg-white/5";
  return (
    <button
      type="button"
      {...props}
      className={`min-h-11 rounded-xl border-[1.5px] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
    />
  );
}

/**
 * A button for a role-gated action. If the rules check refused it, it stays
 * visible but disabled, with "Needs Treasurer" under the label. While the
 * check is still loading (`permission` undefined) it is disabled too.
 */
export function GatedButton({
  permission,
  variant = "secondary",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps & { permission: Permission | null | undefined }) {
  const refused = !permission?.allowed;
  if (!refused) {
    return (
      <Button variant={variant} className={className} disabled={disabled} {...props}>
        {children}
      </Button>
    );
  }
  return (
    <button
      type="button"
      disabled
      className={`flex min-h-14 cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] border-dashed border-rose-muted px-3 text-sm font-semibold text-rose-muted ${className}`}
    >
      {children}
      {permission && <span className="text-[11px] leading-[14px] font-medium">{needsText(permission)}</span>}
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-rose-border bg-rose-bg px-4 py-3 text-sm text-rose-text outline-none focus:border-rose-accent focus:ring-2 focus:ring-rose-accent/20";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold tracking-wide text-rose-muted uppercase">{label}</span>
      {children}
      {hint && <span className="text-xs text-rose-muted">{hint}</span>}
    </label>
  );
}

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={fieldClass} />;
export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea rows={3} {...props} className={fieldClass} />
);
export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={fieldClass} />;

/** Two or more choices side by side, one pressed: Payment | Gift. */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-xl bg-rose-bg p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 flex-1 rounded-[9px] text-sm ${
            value === o.value ? "bg-rose-surface font-semibold text-rose-text" : "text-rose-muted hover:text-rose-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorText({ error }: { error: { message: string } | null | undefined }) {
  if (!error) return null;
  return <p className="text-sm text-red-400">{error.message}</p>;
}

/**
 * Why the rules refused something: the message, then each rule that blocked
 * it ("R-FIN-10 · Conversion policy ..."), from the API error's blockedBy.
 */
export function Refusal({
  error,
}: {
  error: { message: string; data?: { blockedBy?: { ruleId: string; rule: string }[] | null } | null } | null | undefined;
}) {
  if (!error) return null;
  const rules = error.data?.blockedBy ?? [];
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-red-400/40 px-3 py-2 text-sm" role="alert">
      <p className="text-red-400">{error.message}</p>
      {rules.map((r) => (
        <p key={r.ruleId} className="text-xs text-rose-muted">
          <span className="font-semibold">{r.ruleId}</span> · {r.rule}
        </p>
      ))}
    </div>
  );
}

export function Loading() {
  return <p className="text-sm text-rose-muted">Loading…</p>;
}

/** Shown when a list has nothing in it. */
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-rose-border px-4 py-6 text-center text-sm text-rose-muted">{children}</p>;
}

/**
 * A form's main button (Send, Save, Convert…), kept in view just above the
 * bottom bar while the form scrolls under it; at the end of the form it sits
 * in its place.
 */
export function MainAction({ children, onCard = false }: { children: React.ReactNode; onCard?: boolean }) {
  const band = onCard ? "bg-rose-surface shadow-[0_-8px_8px_var(--color-rose-surface)]" : "bg-rose-bg shadow-[0_-8px_8px_var(--color-rose-bg)]";
  return <div className={`sticky bottom-[var(--nav-space)] z-10 mt-2 flex flex-col pt-1 pb-3 ${band}`}>{children}</div>;
}

/**
 * The frame of every screen opened on top of the tabs: a back arrow, the
 * title, and which node you are acting as. The tab bar stays underneath.
 *
 * `form`: the screen is a form. Once the person types or picks anything in
 * it (or presses a toggle), leaving by Back, a tab or + asks first. A form
 * that stays open after a successful send calls setChanged(false).
 */
export function SubScreen({ title, form = false, children }: { title: string; form?: boolean; children: React.ReactNode }) {
  const { back, confirmLeave, setChanged } = useNav();
  const { acting } = useActingNode();
  // Nothing changed yet when it opens; and nothing to ask about once it is gone.
  useEffect(() => {
    setChanged(false);
    return () => setChanged(false);
  }, [setChanged]);
  const changedBy = form
    ? {
        onInput: () => setChanged(true),
        onClickCapture: (e: React.MouseEvent) => {
          if ((e.target as HTMLElement).closest("[aria-pressed], [data-changes]")) setChanged(true);
        },
      }
    : {};
  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-rose-border bg-rose-surface p-2">
        <button
          type="button"
          aria-label="Back"
          onClick={() => confirmLeave(() => back())}
          className="flex size-11 flex-none items-center justify-center rounded-xl text-rose-muted hover:bg-white/5 hover:text-rose-text"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base leading-[22px] font-semibold">{title}</span>
          <span className="text-xs text-rose-muted">Acting as {acting.node.name}</span>
        </div>
        <span className="w-11 flex-none" />
      </header>
      <main className="flex flex-1 flex-col gap-3 p-4 pb-[calc(var(--nav-space)+1.5rem)]" {...changedBy}>
        {children}
      </main>
    </>
  );
}

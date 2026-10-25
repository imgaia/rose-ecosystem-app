"use client";

// src/app/_components/date-field.tsx
// The one date box every screen uses. It shows the date as "25 Oct 2026"
// (our own wording, not the browser's mm/dd or dd/mm) with a calendar icon,
// and opens the device's own date picker when tapped anywhere: the wheel or
// calendar phones know best. Optional dates get a × to clear them.
//
// How: the browser's date input lies invisibly over the whole box. Phones open
// their picker when it is tapped; on a computer, a click calls showPicker()
// (the text part of a bare date input wouldn't open it). The value stays the
// browser's "2026-10-25", or "" for none.

import { useRef } from "react";

import { formatDay } from "./describe";

export function DateField({
  value,
  onChange,
  clearable = false,
  min,
  placeholder = "Choose a date",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Optional date: shows × to empty it. */
  clearable?: boolean;
  /** Earliest day the picker offers, "2026-10-25" (e.g. End from Start). */
  min?: string;
  placeholder?: string;
  /** Shown under the box in red, e.g. "End can't be before Start". */
  error?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);

  function openPicker() {
    try {
      input.current?.showPicker();
    } catch {
      // Older browsers, or the picker is already open: tapping still works.
    }
  }

  return (
    <span className="flex flex-col gap-1">
      <span
        className={`relative flex min-h-12 items-center rounded-xl border bg-rose-bg focus-within:border-rose-accent focus-within:ring-2 focus-within:ring-rose-accent/20 ${
          error ? "border-red-400" : "border-rose-border"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none ml-3 flex-none text-rose-text"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        <span className={`pointer-events-none flex-1 truncate px-2 text-sm ${value ? "text-rose-text" : "text-rose-muted"}`}>
          {value ? formatDay(value) : placeholder}
        </span>
        <input
          ref={input}
          type="date"
          value={value}
          min={min}
          required={!clearable}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          // Invisible but there: it takes the taps. 16px text stops iPhones zooming in on focus.
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none text-base opacity-0 [color-scheme:dark]"
        />
        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(e) => {
              e.preventDefault();
              onChange("");
            }}
            className="relative z-10 flex h-11 w-10 flex-none items-center justify-center rounded-xl text-rose-muted hover:text-rose-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </span>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </span>
  );
}

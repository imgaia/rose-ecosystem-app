// src/server/core/errors.ts
// The one error type core logic throws when the rules stop an action.
// It carries the rule ids, so a screen can say which rule blocked it
// ("Needs Treasurer", "R-PAY-02: negative-balance limit").

export class RuleError extends Error {
  constructor(
    message: string,
    /** e.g. ["R-GOV-05"]; empty for plain input mistakes */
    public readonly ruleIds: string[] = [],
    /** for permission failures: the roles that would allow it, e.g. ["TREASURER"] */
    public readonly needsRoles: string[] = [],
  ) {
    super(message);
    this.name = "RuleError";
  }
}

/** Trimmed text, or null when it is missing or only spaces (blank form fields are stored as null). */
export function textOrNull(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return trimmed;
}

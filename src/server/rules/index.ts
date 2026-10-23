// src/server/rules/index.ts
// Loads rules.yaml once, checks it with zod, and exports it.
// If the file is invalid this module throws on import, and next.config.ts
// imports it, so `next dev`, `next build` and `next start` refuse to run.
//
// Kept free of `~/` imports and "server-only" so next.config.ts and the
// prisma seed scripts can import it too.

import { readFileSync } from "fs";
import path from "path";
import { parse } from "yaml";
import { z } from "zod";

// Read relative to the project root (Next.js and our scripts both run from there).
export const RULES_FILE = path.join(process.cwd(), "src/server/rules/rules.yaml");

const Key = z.string().regex(/^[A-Z][A-Z_]*$/, "must be UPPER_SNAKE_CASE");
const RuleId = z.string().regex(/^R-[A-Z]+-\d{2}$/, "must look like R-PAY-02");

const RuleSchema = z
  .object({
    id: RuleId,
    name: z.string().min(1),
    type: z.enum([
      "approval",
      "precondition",
      "parameter",
      "validation",
      "process",
      "configuration",
      "default",
      "permission",
      "tbd",
    ]),
    applies_to: z.array(z.string().min(1)).optional(),
    approvers: z.union([z.literal("both_sides"), z.array(Key).min(1)]).optional(),
    default: z.union([z.string(), z.number()]).optional(),
    node_level: z.boolean().optional(),
    changed_by: z.union([z.literal("proposal"), z.array(Key).min(1)]).optional(),
  })
  // .strict() rejects unknown fields, so a typo like `defualt:` is caught.
  .strict();

const RulesFileSchema = z
  .object({
    version: z.string().min(1),
    capabilityMap: z.record(Key, z.array(Key).min(1)),
    roles: z
      .object({
        native: z.array(Key).min(1),
        optional: z.array(Key),
      })
      .strict(),
    rules: z.array(RuleSchema).min(1),
  })
  .strict()
  // Checks that need more than one part of the file at once.
  .superRefine((file, ctx) => {
    const allRoles = [...file.roles.native, ...file.roles.optional];
    const known = new Set(allRoles);

    if (known.size !== allRoles.length) {
      ctx.addIssue({ code: "custom", path: ["roles"], message: "a role is listed twice" });
    }

    const checkRoles = (roles: string[], where: (string | number)[]) => {
      for (const role of roles) {
        if (!known.has(role)) {
          ctx.addIssue({ code: "custom", path: where, message: `unknown role ${role}` });
        }
      }
    };

    for (const [capability, roles] of Object.entries(file.capabilityMap)) {
      checkRoles(roles, ["capabilityMap", capability]);
    }

    const seenIds = new Set<string>();
    file.rules.forEach((rule, i) => {
      if (seenIds.has(rule.id)) {
        ctx.addIssue({ code: "custom", path: ["rules", i, "id"], message: `duplicate rule id ${rule.id}` });
      }
      seenIds.add(rule.id);

      if (Array.isArray(rule.approvers)) checkRoles(rule.approvers, ["rules", i, "approvers"]);
      if (Array.isArray(rule.changed_by)) checkRoles(rule.changed_by, ["rules", i, "changed_by"]);

      if (rule.type === "parameter" && rule.default === undefined) {
        ctx.addIssue({ code: "custom", path: ["rules", i, "default"], message: `${rule.id} is a parameter and needs a default` });
      }
    });
  });

export type Rule = z.infer<typeof RuleSchema>;
export type RulesFile = z.infer<typeof RulesFileSchema>;

function loadRules(): RulesFile {
  let raw: unknown;
  try {
    raw = parse(readFileSync(RULES_FILE, "utf-8"));
  } catch (err) {
    throw new Error(`Could not read ${RULES_FILE}: ${(err as Error).message}`);
  }

  const result = RulesFileSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(top level)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`rules.yaml is invalid, refusing to start:\n${problems}`);
  }
  return result.data;
}

const file = loadRules();

export const rulesVersion = file.version;
export const rules = file.rules;
export const roles = file.roles;
/** capability key -> role keys that carry it, e.g. { PAY: ["TREASURER"] } */
export const capabilityMap = file.capabilityMap;

export function getRule(id: string): Rule | undefined {
  return rules.find((rule) => rule.id === id);
}

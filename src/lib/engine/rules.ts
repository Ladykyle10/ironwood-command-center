import type { Condition, Operator, Organization, RuleSet, Signal, MatchStatus } from "@/lib/types";
import { FIELD_MAP, STATE_NAME } from "./fields";

/**
 * Applicability engine.
 *
 * Evaluates declarative rule sets against an organization's profile and
 * produces (a) a boolean verdict and (b) human-readable reasons that back
 * the "Why am I seeing this?" panel.
 */

export const OPERATORS_BY_TYPE: Record<string, { value: Operator; label: string }[]> = {
  number: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "does not equal" },
    { value: "gt", label: "is greater than" },
    { value: "gte", label: "is at least" },
    { value: "lt", label: "is less than" },
    { value: "lte", label: "is at most" },
  ],
  boolean: [
    { value: "is_true", label: "is true" },
    { value: "is_false", label: "is false" },
  ],
  string: [
    { value: "eq", label: "is" },
    { value: "neq", label: "is not" },
    { value: "in", label: "is one of" },
  ],
  list: [
    { value: "includes", label: "includes" },
    { value: "not_includes", label: "does not include" },
  ],
};

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v.length ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

export function evaluateCondition(cond: Condition, org: Organization): boolean {
  const def = FIELD_MAP[cond.field];
  if (!def) return false;
  const actual = def.resolve(org);
  const expected = cond.value;

  switch (cond.operator) {
    case "eq":
      return String(actual).toLowerCase() === String(expected ?? "").toLowerCase();
    case "neq":
      return String(actual).toLowerCase() !== String(expected ?? "").toLowerCase();
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "is_true":
      return actual === true;
    case "is_false":
      return actual === false;
    case "includes": {
      const list = asArray(actual).map((s) => s.toLowerCase());
      return asArray(expected).some((v) => list.includes(v.toLowerCase()));
    }
    case "not_includes": {
      const list = asArray(actual).map((s) => s.toLowerCase());
      return !asArray(expected).some((v) => list.includes(v.toLowerCase()));
    }
    case "in":
      return asArray(expected).map((s) => s.toLowerCase()).includes(String(actual).toLowerCase());
    default:
      return false;
  }
}

export function evaluateRuleSet(rules: RuleSet | undefined, org: Organization): boolean {
  if (!rules || rules.conditions.length === 0) return false;
  const results = rules.conditions.map((c) => evaluateCondition(c, org));
  return rules.match === "ANY" ? results.some(Boolean) : results.every(Boolean);
}

/** Human-readable explanation of a single condition as it relates to this org. */
export function describeCondition(cond: Condition, org: Organization): string {
  const def = FIELD_MAP[cond.field];
  if (!def) return "unknown condition";
  // For list-includes, be specific about which value matched.
  if (cond.operator === "includes") {
    const actual = asArray(def.resolve(org)).map((s) => s.toLowerCase());
    const matched = asArray(cond.value).filter((v) => actual.includes(v.toLowerCase()));
    if (matched.length) {
      const pretty = matched.map((m) => STATE_NAME[m] ?? m);
      if (cond.field === "org.states") return `operates in ${pretty.join(", ")}`;
      if (cond.field === "hr.statesWithEmployees") return `has employees in ${pretty.join(", ")}`;
      return `${def.label.toLowerCase()} includes ${pretty.join(", ")}`;
    }
  }
  if (cond.operator === "gte" || cond.operator === "gt") {
    if (cond.field === "org.employeeCount" || cond.field === "hr.employeeCount")
      return `has ${def.resolve(org)} employees (${cond.operator === "gte" ? "at least" : "more than"} ${cond.value})`;
    if (cond.field === "dot.cdlDrivers") return `employs ${def.resolve(org)} CDL drivers`;
  }
  return def.describe(org);
}

/** Generic rule description for the rule builder / signal editor preview. */
export function conditionToSentence(cond: Condition): string {
  const def = FIELD_MAP[cond.field];
  const label = def?.label ?? cond.field;
  const ops = OPERATORS_BY_TYPE[def?.type ?? "string"] ?? [];
  const opLabel = ops.find((o) => o.value === cond.operator)?.label ?? cond.operator;
  const val = Array.isArray(cond.value) ? cond.value.join(", ") : cond.value;
  if (cond.operator === "is_true" || cond.operator === "is_false") return `${label} ${opLabel}`;
  return `${label} ${opLabel} ${val ?? ""}`.trim();
}

export interface Verdict {
  status: MatchStatus;
  reasons: string[];
}

/** Evaluate a Signal against an organization. */
export function evaluateSignalForOrg(signal: Signal, org: Organization): Verdict {
  if (evaluateRuleSet(signal.applies, org)) {
    const reasons = signal.applies.conditions
      .filter((c) => signal.applies.match === "ALL" || evaluateCondition(c, org))
      .map((c) => describeCondition(c, org));
    return { status: "APPLIES", reasons: uniq(reasons) };
  }
  if (signal.watch && evaluateRuleSet(signal.watch, org)) {
    const reasons = signal.watch.conditions
      .filter((c) => signal.watch!.match === "ALL" || evaluateCondition(c, org))
      .map((c) => describeCondition(c, org));
    return { status: "WATCH", reasons: uniq(reasons) };
  }
  return { status: "NO_ACTION", reasons: ["Your profile does not match the conditions for this update."] };
}

const uniq = (xs: string[]) => Array.from(new Set(xs));

export function emptyRuleSet(): RuleSet {
  return { match: "ALL", conditions: [] };
}

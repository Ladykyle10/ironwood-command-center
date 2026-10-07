import type {
  Action,
  Deadline,
  Document,
  Domain,
  DomainReadiness,
  Organization,
  ReadinessLine,
  Requirement,
  Signal,
  SignalMatch,
} from "@/lib/types";
import { PRIMARY_DOMAINS } from "@/lib/types";
import { evaluateRuleSet } from "./rules";
import { differenceInCalendarDays, isBefore, parseISO, startOfDay } from "date-fns";

/**
 * Program Readiness calculator.
 *
 * Readiness is an internal completion indicator derived from configured
 * requirements and open work — not a legal risk measurement. Every point is
 * attributable to a line item so the client can see exactly how the score
 * was calculated.
 *
 *   score = 100
 *         − unmet requirements (weight × 5 each, capped)
 *         − overdue actions, open critical / high actions
 *         − applicable Signals with no action yet
 *         − deadlines inside 30 days, documents past review date
 *   clamped to 0–100.
 */

export const DEDUCTION = {
  UNMET_PER_WEIGHT: 5,
  UNMET_CAP: 60,
  OVERDUE_ACTION: { each: 5, cap: 20 },
  CRITICAL_ACTION: { each: 4, cap: 12 },
  HIGH_ACTION: { each: 2, cap: 8 },
  UNADDRESSED_SIGNAL: { each: 3, cap: 9 },
  NEAR_DEADLINE: { each: 1, cap: 5, windowDays: 30 },
  LAPSED_DOCUMENT: { each: 3, cap: 9 },
};

const OPEN_STATUSES = new Set(["NEW", "IN_PROGRESS", "WAITING_ON_CLIENT", "WAITING_ON_IRONWOOD"]);

export interface ReadinessInput {
  org: Organization;
  requirements: Requirement[];
  actions: Action[];
  deadlines: Deadline[];
  documents: Document[];
  /** Published Signals + this org's matches, for the unaddressed-Signal deduction. */
  signals?: Signal[];
  matches?: SignalMatch[];
  now?: Date;
}

export function computeDomainReadiness(input: ReadinessInput, domain: Domain): DomainReadiness {
  const now = startOfDay(input.now ?? new Date());
  const lines: ReadinessLine[] = [];

  // Requirements
  const applicable = input.requirements.filter(
    (r) => r.domain === domain && evaluateRuleSet(r.appliesWhen, input.org),
  );
  let unmetDeduction = 0;
  let met = 0;
  for (const r of applicable) {
    const ok = evaluateRuleSet(r.satisfiedWhen, input.org);
    if (ok) met += 1;
    const points = ok ? 0 : -(r.weight * DEDUCTION.UNMET_PER_WEIGHT);
    if (!ok) unmetDeduction += r.weight * DEDUCTION.UNMET_PER_WEIGHT;
    lines.push({
      label: r.title,
      detail: ok ? "Met" : r.recommendation,
      points,
      kind: ok ? "requirement_met" : "requirement_unmet",
    });
  }
  unmetDeduction = Math.min(unmetDeduction, DEDUCTION.UNMET_CAP);
  const base = 100 - unmetDeduction;

  // Penalties from open work
  let penalties = 0;
  const domainActions = input.actions.filter((a) => a.orgId === input.org.id && a.domain === domain && OPEN_STATUSES.has(a.status));

  const overdue = domainActions.filter((a) => a.dueDate && isBefore(parseISO(a.dueDate), now));
  if (overdue.length) {
    const p = Math.min(overdue.length * DEDUCTION.OVERDUE_ACTION.each, DEDUCTION.OVERDUE_ACTION.cap);
    penalties += p;
    lines.push({ label: `${overdue.length} overdue action${overdue.length > 1 ? "s" : ""}`, detail: overdue.map((a) => a.title).join(" · "), points: -p, kind: "penalty" });
  }
  const critical = domainActions.filter((a) => a.priority === "CRITICAL" && !overdue.includes(a));
  if (critical.length) {
    const p = Math.min(critical.length * DEDUCTION.CRITICAL_ACTION.each, DEDUCTION.CRITICAL_ACTION.cap);
    penalties += p;
    lines.push({ label: `${critical.length} open critical action${critical.length > 1 ? "s" : ""}`, detail: critical.map((a) => a.title).join(" · "), points: -p, kind: "penalty" });
  }
  const high = domainActions.filter((a) => a.priority === "HIGH" && !overdue.includes(a));
  if (high.length) {
    const p = Math.min(high.length * DEDUCTION.HIGH_ACTION.each, DEDUCTION.HIGH_ACTION.cap);
    penalties += p;
    lines.push({ label: `${high.length} open high-priority action${high.length > 1 ? "s" : ""}`, detail: high.map((a) => a.title).join(" · "), points: -p, kind: "penalty" });
  }

  const unaddressed = (input.matches ?? []).filter((m) => {
    if (m.orgId !== input.org.id || m.status !== "APPLIES") return false;
    const sig = (input.signals ?? []).find((x) => x.id === m.signalId && x.status === "PUBLISHED" && x.domain === domain);
    if (!sig) return false;
    return !input.actions.some((a) => a.orgId === input.org.id && a.signalId === sig.id && a.status !== "NOT_APPLICABLE");
  });
  if (unaddressed.length) {
    const p = Math.min(unaddressed.length * DEDUCTION.UNADDRESSED_SIGNAL.each, DEDUCTION.UNADDRESSED_SIGNAL.cap);
    penalties += p;
    lines.push({
      label: `${unaddressed.length} applicable Signal${unaddressed.length > 1 ? "s" : ""} without an action`,
      detail: unaddressed.map((m) => (input.signals ?? []).find((x) => x.id === m.signalId)?.title ?? "").join(" · "),
      points: -p,
      kind: "penalty",
    });
  }

  const near = input.deadlines.filter((d) => {
    if (d.orgId !== input.org.id || d.domain !== domain || d.status !== "UPCOMING") return false;
    const diff = differenceInCalendarDays(parseISO(d.date), now);
    return diff >= 0 && diff <= DEDUCTION.NEAR_DEADLINE.windowDays;
  });
  if (near.length) {
    const p = Math.min(near.length * DEDUCTION.NEAR_DEADLINE.each, DEDUCTION.NEAR_DEADLINE.cap);
    penalties += p;
    lines.push({ label: `${near.length} deadline${near.length > 1 ? "s" : ""} within 30 days`, detail: near.map((d) => d.title).join(" · "), points: -p, kind: "penalty" });
  }

  const lapsed = input.documents.filter((d) => {
    if (d.orgId !== input.org.id || d.domain !== domain) return false;
    const date = d.expirationDate ?? d.reviewDate;
    return !!date && isBefore(parseISO(date), now);
  });
  if (lapsed.length) {
    const p = Math.min(lapsed.length * DEDUCTION.LAPSED_DOCUMENT.each, DEDUCTION.LAPSED_DOCUMENT.cap);
    penalties += p;
    lines.push({ label: `${lapsed.length} document${lapsed.length > 1 ? "s" : ""} past review date`, detail: lapsed.map((d) => d.title).join(" · "), points: -p, kind: "penalty" });
  }

  const score = Math.max(0, Math.min(100, base - penalties));

  return {
    domain,
    score,
    base,
    requirementsApplicable: applicable.length,
    requirementsMet: met,
    penalties,
    lines,
    serviceActive: input.org.services[domain] === "ACTIVE",
  };
}

export function computeReadiness(input: ReadinessInput): Record<Domain, DomainReadiness> {
  const out = {} as Record<Domain, DomainReadiness>;
  for (const d of PRIMARY_DOMAINS) out[d] = computeDomainReadiness(input, d);
  return out;
}

/** A domain is "monitored" when it has applicable requirements or an active service. */
export function isMonitored(r: DomainReadiness): boolean {
  return r.requirementsApplicable > 0 || r.serviceActive;
}

export function overallReadiness(r: Record<Domain, DomainReadiness>): number {
  const monitored = PRIMARY_DOMAINS.map((d) => r[d]).filter(isMonitored);
  if (!monitored.length) return 100;
  return Math.round(monitored.reduce((s, x) => s + x.score, 0) / monitored.length);
}

export function readinessTone(score: number): "good" | "fair" | "low" {
  if (score >= 85) return "good";
  if (score >= 70) return "fair";
  return "low";
}

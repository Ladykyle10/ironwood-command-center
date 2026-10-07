import type {
  Action,
  Deadline,
  Document,
  Gap,
  ManualGap,
  Organization,
  Requirement,
  Signal,
  SignalMatch,
} from "@/lib/types";
import { DOMAIN_SHORT } from "@/lib/types";
import { evaluateRuleSet } from "./rules";
import { differenceInCalendarDays, isBefore, parseISO, startOfDay } from "date-fns";

/**
 * Gap analysis: derives "Gaps & Opportunities" from the profile, configured
 * requirements, open signals, deadlines and documents. Surfaces unmet needs
 * in non-active service areas consultatively (serviceActive=false).
 */
export interface GapInput {
  org: Organization;
  requirements: Requirement[];
  signals: Signal[];
  matches: SignalMatch[];
  actions: Action[];
  deadlines: Deadline[];
  documents: Document[];
  manualGaps: ManualGap[];
  now?: Date;
}

const OPEN = new Set(["NEW", "IN_PROGRESS", "WAITING_ON_CLIENT", "WAITING_ON_IRONWOOD"]);

export function computeGaps(input: GapInput): Gap[] {
  const now = startOfDay(input.now ?? new Date());
  const { org } = input;
  const gaps: Gap[] = [];
  const active = (d: Gap["domain"]) => org.services[d] === "ACTIVE";

  // 1. Unmet requirements (missing programs / incomplete documentation)
  for (const r of input.requirements) {
    if (!evaluateRuleSet(r.appliesWhen, org)) continue;
    if (evaluateRuleSet(r.satisfiedWhen, org)) continue;
    const exposureDriven = r.appliesWhen.conditions.some((c) => c.field === "safety.exposures");
    gaps.push({
      id: `gap-req-${r.id}`,
      orgId: org.id,
      domain: r.domain,
      title: r.gapTitle ?? (exposureDriven ? `${r.title} gap` : `${r.title} not in place`),
      detail: exposureDriven
        ? `Your company profile indicates ${describeExposure(r)}. No current ${r.title.toLowerCase()} is recorded.`
        : `${r.description} This requirement applies based on your profile but is not currently satisfied.`,
      recommendation: r.recommendation,
      severity: r.weight >= 3 ? "HIGH" : "MEDIUM",
      source: exposureDriven ? "EXPOSURE" : "REQUIREMENT",
      serviceActive: active(r.domain),
      href: "/app/readiness",
    });
  }

  // 2. Applicable signals with no linked action (regulatory exposure)
  for (const m of input.matches) {
    if (m.orgId !== org.id || m.status !== "APPLIES") continue;
    const signal = input.signals.find((s) => s.id === m.signalId && s.status === "PUBLISHED");
    if (!signal) continue;
    const hasAction = input.actions.some((a) => a.orgId === org.id && a.signalId === signal.id && a.status !== "NOT_APPLICABLE");
    if (hasAction) continue;
    gaps.push({
      id: `gap-signal-${signal.id}`,
      orgId: org.id,
      domain: signal.domain,
      title: `Unaddressed regulatory development: ${signal.title}`,
      detail: `${signal.summary} This applies to your organization and no action has been created yet.`,
      recommendation: signal.recommendedAction,
      severity: signal.urgency === "HIGH" ? "HIGH" : signal.urgency === "MEDIUM" ? "MEDIUM" : "LOW",
      source: "SIGNAL",
      serviceActive: active(signal.domain),
      href: `/app/signal/${signal.id}`,
    });
  }

  // 3. Overdue training deadlines
  for (const d of input.deadlines) {
    if (d.orgId !== org.id || d.status !== "UPCOMING") continue;
    const diff = differenceInCalendarDays(parseISO(d.date), now);
    if (d.type === "TRAINING" && diff < 0) {
      gaps.push({
        id: `gap-training-${d.id}`,
        orgId: org.id,
        domain: d.domain,
        title: `Training overdue: ${d.title}`,
        detail: d.description ?? `This training passed its due date ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago.`,
        recommendation: "Schedule the session and record completion.",
        severity: "HIGH",
        source: "TRAINING",
        serviceActive: active(d.domain),
        href: "/app/deadlines",
      });
    } else if (diff >= 0 && diff <= 14 && (d.type === "REGULATORY" || d.type === "AUDIT" || d.type === "INSURANCE" || d.type === "PORTAL")) {
      gaps.push({
        id: `gap-deadline-${d.id}`,
        orgId: org.id,
        domain: d.domain,
        title: `Approaching: ${d.title}`,
        detail: d.description ?? `Due in ${diff} day${diff === 1 ? "" : "s"}.`,
        recommendation: "Confirm the owner and completion plan.",
        severity: diff <= 7 ? "HIGH" : "MEDIUM",
        source: "DEADLINE",
        serviceActive: active(d.domain),
        href: "/app/deadlines",
      });
    }
  }

  // 4. Lapsed documents
  for (const doc of input.documents) {
    if (doc.orgId !== org.id || !doc.domain) continue;
    const date = doc.expirationDate ?? doc.reviewDate;
    if (!date || !isBefore(parseISO(date), now)) continue;
    gaps.push({
      id: `gap-doc-${doc.id}`,
      orgId: org.id,
      domain: doc.domain,
      title: `Document past review: ${doc.title}`,
      detail: `${doc.title} (v${doc.version}) passed its ${doc.expirationDate ? "expiration" : "review"} date.`,
      recommendation: "Review and republish the current version.",
      severity: "MEDIUM",
      source: "DOCUMENT",
      serviceActive: active(doc.domain),
      href: "/app/library",
    });
  }

  // 5. Manual gaps recorded by consultants
  for (const g of input.manualGaps) {
    if (g.orgId !== org.id || g.resolvedAt) continue;
    gaps.push({
      id: g.id,
      orgId: org.id,
      domain: g.domain,
      title: g.title,
      detail: g.detail,
      recommendation: g.recommendation,
      severity: g.severity,
      source: "MANUAL",
      serviceActive: active(g.domain),
    });
  }

  // Service gap summary: issues in non-active domains are flagged in the UI,
  // not duplicated here.
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return gaps.sort((a, b) => order[a.severity] - order[b.severity] || DOMAIN_SHORT[a.domain].localeCompare(DOMAIN_SHORT[b.domain]));
}

function describeExposure(r: Requirement): string {
  const c = r.appliesWhen.conditions.find((x) => x.field === "safety.exposures");
  const v = Array.isArray(c?.value) ? c?.value.join(" / ") : String(c?.value ?? "");
  return v ? `${v.toLowerCase()} exposure` : "an exposure";
}

import clsx from "clsx";
import type {
  ActionStatus,
  Domain,
  MatchStatus,
  Priority,
  QuestionStatus,
  ServiceStatus,
  Urgency,
  WorkStatus,
} from "@/lib/types";
import { DOMAIN_SHORT } from "@/lib/types";

export type Tone = "ember" | "amber" | "sage" | "steel" | "neutral" | "navy" | "paper";

const TONE: Record<Tone, string> = {
  ember: "bg-ember-50 text-ember-700 ring-ember-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  sage: "bg-sage-50 text-sage-700 ring-sage-200",
  steel: "bg-steel-50 text-steel-700 ring-steel-200",
  neutral: "bg-paper-200 text-ink-600 ring-ink-200",
  navy: "bg-navy-900 text-paper-100 ring-navy-700",
  paper: "bg-white text-ink-700 ring-ink-200",
};

const DOT: Record<Tone, string> = {
  ember: "bg-ember-500",
  amber: "bg-amber-500",
  sage: "bg-sage-500",
  steel: "bg-steel-500",
  neutral: "bg-ink-400",
  navy: "bg-paper-100",
  paper: "bg-ink-400",
};

export function Pill({
  tone = "neutral",
  children,
  dot,
  size = "md",
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px] tracking-wide" : "px-2.5 py-1 text-[12px] tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}

/* ---------- Semantic pills ---------- */

export const MATCH_META: Record<MatchStatus, { label: string; tone: Tone }> = {
  APPLIES: { label: "Applies to you", tone: "ember" },
  WATCH: { label: "Watch", tone: "amber" },
  NO_ACTION: { label: "No action required", tone: "sage" },
  HANDLING: { label: "Ironwood handling", tone: "steel" },
};

export function MatchPill({ status, size }: { status: MatchStatus; size?: "sm" | "md" }) {
  const m = MATCH_META[status];
  return <Pill tone={m.tone} dot size={size}>{m.label}</Pill>;
}

export const ACTION_META: Record<ActionStatus, { label: string; tone: Tone }> = {
  NEW: { label: "New", tone: "ember" },
  IN_PROGRESS: { label: "In progress", tone: "navy" },
  WAITING_ON_CLIENT: { label: "Waiting on you", tone: "amber" },
  WAITING_ON_IRONWOOD: { label: "Waiting on Ironwood", tone: "steel" },
  COMPLETE: { label: "Complete", tone: "sage" },
  NOT_APPLICABLE: { label: "Not applicable", tone: "neutral" },
};

export function ActionStatusPill({ status, audience = "CLIENT", size }: { status: ActionStatus; audience?: "CLIENT" | "IRONWOOD"; size?: "sm" | "md" }) {
  const m = ACTION_META[status];
  const label = audience === "IRONWOOD" && status === "WAITING_ON_CLIENT" ? "Waiting on client" : m.label;
  return <Pill tone={m.tone} size={size}>{label}</Pill>;
}

export const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  CRITICAL: { label: "Critical", tone: "ember" },
  HIGH: { label: "High", tone: "amber" },
  MEDIUM: { label: "Medium", tone: "neutral" },
  LOW: { label: "Low", tone: "paper" },
};

export function PriorityPill({ priority, size = "sm" }: { priority: Priority; size?: "sm" | "md" }) {
  const m = PRIORITY_META[priority];
  return <Pill tone={m.tone} size={size}>{m.label}</Pill>;
}

export const URGENCY_META: Record<Urgency, { label: string; tone: Tone }> = {
  HIGH: { label: "High urgency", tone: "ember" },
  MEDIUM: { label: "Medium urgency", tone: "amber" },
  LOW: { label: "Low urgency", tone: "neutral" },
  INFO: { label: "Informational", tone: "paper" },
};

export function UrgencyPill({ urgency, size = "sm" }: { urgency: Urgency; size?: "sm" | "md" }) {
  const m = URGENCY_META[urgency];
  return <Pill tone={m.tone} size={size}>{m.label}</Pill>;
}

export const QUESTION_META: Record<QuestionStatus, { label: string; tone: Tone }> = {
  NEW: { label: "New", tone: "ember" },
  REVIEWING: { label: "Reviewing", tone: "navy" },
  RESPONDED: { label: "Responded", tone: "sage" },
  FOLLOW_UP_REQUIRED: { label: "Follow-up required", tone: "amber" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export function QuestionStatusPill({ status, size }: { status: QuestionStatus; size?: "sm" | "md" }) {
  const m = QUESTION_META[status];
  return <Pill tone={m.tone} size={size}>{m.label}</Pill>;
}

export const WORK_META: Record<WorkStatus, { label: string; tone: Tone }> = {
  SCHEDULED: { label: "Scheduled", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "steel" },
  REVIEW: { label: "In review", tone: "amber" },
  COMPLETE: { label: "Complete", tone: "sage" },
};

export const SERVICE_META: Record<ServiceStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "sage" },
  NOT_ACTIVE: { label: "Not active", tone: "neutral" },
  PROPOSED: { label: "Proposed", tone: "amber" },
};

export function ServicePill({ status, size = "sm" }: { status: ServiceStatus; size?: "sm" | "md" }) {
  const m = SERVICE_META[status];
  return <Pill tone={m.tone} dot size={size}>{m.label}</Pill>;
}

const DOMAIN_TONE: Record<Domain, string> = {
  HR: "text-navy-700 bg-navy-100",
  DOT: "text-steel-700 bg-steel-100",
  SAFETY: "text-ember-700 bg-ember-100",
  CONTRACTOR: "text-amber-700 bg-amber-100",
  RECRUITING: "text-ink-600 bg-paper-200",
  LEADERSHIP: "text-ink-600 bg-paper-200",
  OPERATIONS: "text-ink-600 bg-paper-200",
};

export function DomainTag({ domain, className }: { domain: Domain; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]", DOMAIN_TONE[domain], className)}>
      {DOMAIN_SHORT[domain]}
    </span>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md border border-dashed border-amber-500/60 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700", className)}>
      Demo data — verify before client use
    </span>
  );
}

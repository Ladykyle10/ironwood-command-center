"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, FileText, HelpCircle, Radio, Activity as ActivityIcon, CalendarClock, Briefcase, Gauge, Building2 } from "lucide-react";
import type { Action, ActivityEvent, Deadline, Gap, Signal, SignalMatch, WorkItem, Consultant, Organization } from "@/lib/types";
import { DOMAIN_LABEL, DOMAIN_SHORT } from "@/lib/types";
import { ActionStatusPill, DomainTag, MatchPill, PriorityPill, Pill, WORK_META } from "@/components/ui/Pill";
import { Avatar, Progress } from "@/components/ui/Primitives";
import { dueLabel, fmtDate, relativeDay, daysUntil } from "@/lib/format";

/* ---------------- Action ---------------- */

export function ActionRow({ action, href, audience = "CLIENT", orgName }: { action: Action; href?: string; audience?: "CLIENT" | "IRONWOOD"; orgName?: string }) {
  const due = dueLabel(action.dueDate);
  const link = href ?? `/app/actions/${action.id}`;
  return (
    <Link href={link} className="group flex gap-4 px-5 py-4 hover:bg-paper-50 transition">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <DomainTag domain={action.domain} />
          {orgName && <span className="text-[12px] text-ink-500">{orgName}</span>}
          <span className={clsx("text-[12.5px] font-medium", due.tone === "overdue" ? "text-ember-600" : due.tone === "soon" ? "text-amber-600" : "text-ink-500")}>{due.text}</span>
          <span className="sm:hidden inline-flex gap-1.5"><ActionStatusPill status={action.status} audience={audience} size="sm" /><PriorityPill priority={action.priority} /></span>
        </div>
        <div className="text-[15.5px] font-semibold text-ink-900 leading-snug group-hover:text-navy-700">{action.title}</div>
        <div className="mt-1 text-[13.5px] text-ink-500 line-clamp-2">{action.description}</div>
        {action.recommendedAction && audience === "CLIENT" && (
          <div className="mt-1.5 text-[13px] text-ink-700"><span className="font-semibold text-ink-800">Recommended:</span> {action.recommendedAction}</div>
        )}
      </div>
      <div className="hidden sm:flex shrink-0 flex-col items-end gap-1.5">
        <ActionStatusPill status={action.status} audience={audience} size="sm" />
        <PriorityPill priority={action.priority} />
      </div>
    </Link>
  );
}

/* ---------------- Signal ---------------- */

export function SignalRow({ signal, match, href }: { signal: Signal; match?: SignalMatch; href?: string }) {
  return (
    <Link href={href ?? `/app/signal/${signal.id}`} className="group flex gap-4 px-5 py-4 hover:bg-paper-50 transition">
      <div className="mt-0.5 hidden sm:grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
        <Radio className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <DomainTag domain={signal.domain} />
          <span className="text-[12.5px] text-ink-500">{signal.jurisdiction} · {signal.regulatoryBody} · {fmtDate(signal.publishedDate)}</span>
        </div>
        <div className="text-[15.5px] font-semibold text-ink-900 leading-snug group-hover:text-navy-700">{signal.title}</div>
        <div className="mt-1 text-[13.5px] text-ink-500 line-clamp-2">{signal.summary}</div>
      </div>
      <div className="shrink-0 self-start">{match && <MatchPill status={match.status} size="sm" />}</div>
    </Link>
  );
}

/* ---------------- Deadline ---------------- */

const TYPE_LABEL: Record<Deadline["type"], string> = {
  REGULATORY: "Regulatory",
  DOCUMENT: "Documentation",
  TRAINING: "Training",
  CERTIFICATION: "Certification",
  MEDICAL_CARD: "Medical card",
  CDL: "CDL",
  VEHICLE: "Vehicle",
  INSURANCE: "Insurance",
  PORTAL: "Portal",
  POLICY: "Policy",
  AUDIT: "Audit",
  REVIEW: "Review",
};

export function DeadlineRow({ deadline, onComplete, canEdit, actionHref }: { deadline: Deadline; onComplete?: () => void; canEdit?: boolean; actionHref?: string }) {
  const days = daysUntil(deadline.date)!;
  const overdue = days < 0;
  const done = deadline.status === "COMPLETE";
  return (
    <div className={clsx("flex items-center gap-4 px-5 py-3.5", done && "opacity-60")}>
      <div className={clsx("w-14 shrink-0 text-center rounded-lg py-1.5", overdue && !done ? "bg-ember-50 text-ember-700" : days <= 7 && !done ? "bg-amber-50 text-amber-700" : "bg-paper-200 text-ink-700")}>
        <div className="text-[10px] font-bold uppercase tracking-wide">{fmtDate(deadline.date, "MMM")}</div>
        <div className="font-display text-[22px] leading-none tabular">{fmtDate(deadline.date, "d")}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <DomainTag domain={deadline.domain} />
          <span className="text-[12px] text-ink-500">{TYPE_LABEL[deadline.type]}{deadline.recurrence !== "NONE" ? ` · ${deadline.recurrence.toLowerCase()}` : ""}</span>
        </div>
        <div className={clsx("text-[15px] font-semibold text-ink-900 leading-snug", done && "line-through")}>{deadline.title}</div>
        <div className="text-[12.5px] mt-0.5">
          {done ? <span className="text-sage-600 font-medium">Complete</span> : overdue ? <span className="text-ember-600 font-medium">{Math.abs(days)} day{Math.abs(days) === 1 ? "" : "s"} overdue</span> : days === 0 ? <span className="text-amber-600 font-medium">Today</span> : <span className="text-ink-500">In {days} day{days === 1 ? "" : "s"}</span>}
          {deadline.description && <span className="text-ink-500"> · {deadline.description}</span>}
        </div>
      </div>
      {actionHref && !done && (
        <Link href={actionHref} className="hidden sm:inline-flex btn btn-secondary btn-sm">Open action</Link>
      )}
      {canEdit && !done && onComplete && (
        <button onClick={onComplete} className="btn btn-ghost btn-sm text-ink-500 hover:text-sage-600" title="Mark complete">
          <Circle className="h-4.5 w-4.5" />
        </button>
      )}
      {done && <CheckCircle2 className="h-5 w-5 text-sage-500 shrink-0" />}
    </div>
  );
}

/* ---------------- Ironwood handling ---------------- */

export function WorkCard({ item, consultant, compact }: { item: WorkItem; consultant?: Consultant; compact?: boolean }) {
  const meta = WORK_META[item.status];
  return (
    <div className={clsx("rounded-xl border border-steel-200 bg-steel-50/60 p-4", compact && "p-3.5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <DomainTag domain={item.domain} />
            <Pill tone={meta.tone} size="sm">{item.statusLabel}</Pill>
          </div>
          <div className="text-[15px] font-semibold text-ink-900 leading-snug">{item.title}</div>
          {!compact && <div className="mt-1 text-[13px] text-ink-600">{item.summary}</div>}
        </div>
        {consultant && <Avatar name={consultant.name} size="sm" tone="ember" />}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={item.progress} tone={item.status === "COMPLETE" ? "sage" : "steel"} className="flex-1" />
        <span className="tabular text-[12px] font-semibold text-steel-700 w-9 text-right">{item.progress}%</span>
      </div>
      <div className="mt-2 text-[12.5px] text-ink-500">
        {consultant ? `${DOMAIN_SHORT[item.domain]} Consultant: ${consultant.name.split(" ")[0]}` : "Ironwood"}
        {item.targetDate && item.status !== "COMPLETE" && <> · Target {fmtDate(item.targetDate)}</>}
        {item.completedAt && <> · Completed {fmtDate(item.completedAt)}</>}
      </div>
    </div>
  );
}

/* ---------------- Gap ---------------- */

export function GapCard({ gap, org, onRequestHelp }: { gap: Gap; org: Organization; onRequestHelp?: (gap: Gap) => void }) {
  const sevTone = gap.severity === "HIGH" ? "ember" : gap.severity === "MEDIUM" ? "amber" : "neutral";
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <DomainTag domain={gap.domain} />
        <Pill tone={sevTone} size="sm">{gap.severity === "HIGH" ? "Action recommended" : gap.severity === "MEDIUM" ? "Needs review" : "Opportunity"}</Pill>
        {!gap.serviceActive && <Pill tone="paper" size="sm">Outside active services</Pill>}
      </div>
      <div className="text-[16px] font-semibold text-ink-900 leading-snug">{gap.title}</div>
      <p className="mt-1.5 text-[14px] text-ink-600 leading-relaxed">{gap.detail}</p>
      <div className="mt-3 rounded-lg bg-paper-100 px-3.5 py-2.5 text-[13.5px] text-ink-800">
        <span className="font-semibold">Recommended:</span> {gap.recommendation}
      </div>
      {!gap.serviceActive ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-2.5">
          <div className="text-[13px] text-steel-700">
            This falls under <span className="font-semibold">{DOMAIN_LABEL[gap.domain]}</span>, which is not currently included in your active Ironwood services. Ironwood support is available for this area.
          </div>
          {onRequestHelp && <button onClick={() => onRequestHelp(gap)} className="btn btn-primary btn-sm">Request help</button>}
        </div>
      ) : (
        gap.href && (
          <div className="mt-3">
            <Link href={gap.href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy-700 hover:text-ember-600">
              {gap.source === "SIGNAL" ? "Open Signal" : gap.source === "DEADLINE" || gap.source === "TRAINING" ? "Open deadlines" : gap.source === "DOCUMENT" ? "Open library" : "See readiness detail"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )
      )}
      <span className="hidden">{org.id}</span>
    </div>
  );
}

/* ---------------- Activity ---------------- */

const EVENT_ICON: Record<ActivityEvent["type"], React.ComponentType<{ className?: string }>> = {
  SIGNAL: Radio,
  ACTION: CheckCircle2,
  WORK: Briefcase,
  DOCUMENT: FileText,
  DEADLINE: CalendarClock,
  QUESTION: HelpCircle,
  READINESS: Gauge,
  PROFILE: Building2,
};

export function ActivityList({ events, limit, orgNames }: { events: ActivityEvent[]; limit?: number; orgNames?: Record<string, string> }) {
  const list = limit ? events.slice(0, limit) : events;
  let lastDay = "";
  return (
    <div>
      {list.map((e) => {
        const day = relativeDay(e.at);
        const showDay = day !== lastDay;
        lastDay = day;
        const Icon = EVENT_ICON[e.type] ?? ActivityIcon;
        const inner = (
          <div className="flex gap-3">
            <div className={clsx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", e.actor === "IRONWOOD" ? "bg-ember-50 text-ember-600" : e.actor === "CLIENT" ? "bg-navy-100 text-navy-700" : "bg-paper-200 text-ink-500")}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] text-ink-900 leading-snug">{e.title}</div>
              {e.detail && <div className="text-[13px] text-ink-500 mt-0.5">{e.detail}</div>}
              <div className="text-[12px] text-ink-400 mt-0.5">
                {e.actorName ?? (e.actor === "SYSTEM" ? "Command Center" : e.actor === "IRONWOOD" ? "Ironwood" : "Your team")}
                {orgNames && <> · {orgNames[e.orgId]}</>}
              </div>
            </div>
          </div>
        );
        return (
          <div key={e.id}>
            {showDay && <div className="eyebrow pt-4 pb-2 first:pt-0">{day}</div>}
            {e.href ? <Link href={e.href} className="block rounded-lg px-2 py-2 -mx-2 hover:bg-paper-100 transition">{inner}</Link> : <div className="px-2 py-2 -mx-2">{inner}</div>}
          </div>
        );
      })}
    </div>
  );
}

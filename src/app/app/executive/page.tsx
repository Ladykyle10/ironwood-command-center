"use client";

import Link from "next/link";
import clsx from "clsx";
import { Printer } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { Card, SectionTitle } from "@/components/ui/Primitives";
import { ReadinessRing } from "@/components/ui/ReadinessRing";
import { ReadinessTrend } from "@/components/client/ReadinessTrend";
import { DomainTag, MatchPill, PriorityPill, Pill } from "@/components/ui/Pill";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, DOMAIN_LABEL } from "@/lib/types";
import { isMonitored, readinessTone } from "@/lib/engine/readiness";
import { fmtDate, fmtDateLong, dueLabel } from "@/lib/format";

export default function ExecutivePage() {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const signals = useStore((s) => s.signals);
  if (!data) return null;

  const highActions = data.openActions.filter((a) => a.priority === "CRITICAL" || a.priority === "HIGH").sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"));
  const upcoming = [...data.overdueDeadlines, ...data.next7, ...data.next30];
  const applies = data.applies.map((m) => ({ m, s: signals.find((x) => x.id === m.signalId)! })).filter((x) => x.s);
  const handling = data.handling.map((m) => ({ m, s: signals.find((x) => x.id === m.signalId)! })).filter((x) => x.s);
  const majorGaps = data.gaps.filter((g) => g.severity === "HIGH");
  const since = Date.now() - 30 * 86400000;
  const recent = data.activity.filter((e) => new Date(e.at).getTime() >= since);
  const completed30 = data.actions.filter((a) => a.completedAt && new Date(a.completedAt).getTime() >= since).length;
  const tone = readinessTone(data.overall);

  return (
    <div className="space-y-6 animate-fade-up print:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Executive View · {fmtDateLong(new Date().toISOString())}</div>
          <h1 className="text-[30px] sm:text-[38px] leading-[1.05] text-ink-900">{data.org.name}</h1>
          <p className="mt-2 text-[15px] text-ink-600">Compliance position at a glance — readiness, open priorities, regulatory changes and what Ironwood is handling.</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary print:hidden"><Printer className="h-4 w-4" /> Print / Save PDF</button>
      </div>

      {/* Headline band */}
      <div className="rounded-[var(--radius-card)] bg-navy-900 text-paper-100 p-6 sm:p-8 grid gap-6 lg:grid-cols-[auto_1fr] items-center">
        <div className="flex items-center gap-6">
          <div className="relative">
            <ReadinessRing value={data.overall} size={132} stroke={10} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-300">Overall program readiness</div>
            <div className={clsx("font-display text-[22px] leading-tight mt-1", { good: "text-sage-200", fair: "text-amber-200", low: "text-ember-300" }[tone])}>
              {tone === "good" ? "Strong position" : tone === "fair" ? "Solid, with open items" : "Needs focused attention"}
            </div>
            <div className="text-[13px] text-navy-200 mt-1 max-w-xs">Internal completion indicator across monitored areas — not a legal risk score.</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="High priority" value={highActions.length} tone={highActions.length ? "ember" : "sage"} />
          <Kpi label="Due in 30 days" value={upcoming.length} tone={data.overdueDeadlines.length ? "ember" : "amber"} hint={data.overdueDeadlines.length ? `${data.overdueDeadlines.length} past due` : undefined} />
          <Kpi label="Signals apply" value={applies.length} tone="amber" />
          <Kpi label="Ironwood handling" value={data.activeWork.length + handling.length} tone="steel" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <SectionTitle title="Readiness by domain" />
          <div className="grid grid-cols-2 gap-4">
            {PRIMARY_DOMAINS.map((d) => {
              const r = data.readiness[d];
              const mon = isMonitored(r);
              return (
                <Link key={d} href={`/app/readiness?domain=${d}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-paper-100 transition">
                  <ReadinessRing value={mon ? r.score : null} size={56} stroke={5} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink-900">{DOMAIN_SHORT[d]}</div>
                    <div className="text-[12px] text-ink-500">{mon ? `${r.requirementsMet}/${r.requirementsApplicable} requirements` : "Not monitored"}</div>
                    {!r.serviceActive && mon && <div className="text-[11px] text-amber-700">Not an active service</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <SectionTitle title="Six-month trend" />
          <ReadinessTrend history={data.history} current={data.readiness} height={200} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Open high-priority actions" count={highActions.length} />
          {highActions.length === 0 ? (
            <p className="text-[14px] text-ink-500">No critical or high-priority actions are open.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {highActions.slice(0, 6).map((a) => {
                const due = dueLabel(a.dueDate);
                return (
                  <li key={a.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <DomainTag domain={a.domain} />
                    <Link href={`/app/actions/${a.id}`} className="flex-1 min-w-[160px] text-[14px] font-medium text-ink-900 truncate hover:text-navy-700">{a.title}</Link>
                    <span className={clsx("text-[12px] shrink-0", due.tone === "overdue" ? "text-ember-600 font-semibold" : "text-ink-500")}>{due.text}</span>
                    <PriorityPill priority={a.priority} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle title="Upcoming deadlines" count={upcoming.length} description="Next 30 days" />
          {upcoming.length === 0 ? (
            <p className="text-[14px] text-ink-500">Nothing due in the next 30 days.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {upcoming.slice(0, 6).map((d) => (
                <li key={d.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="w-12 shrink-0 text-[12.5px] font-semibold tabular text-ink-700">{fmtDate(d.date)}</span>
                  <DomainTag domain={d.domain} />
                  <span className="flex-1 min-w-[160px] text-[14px] text-ink-900 truncate">{d.title}</span>
                  {data.overdueDeadlines.includes(d) && <Pill tone="ember" size="sm">Past due</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Regulatory changes that apply" count={applies.length} />
          {applies.length === 0 ? (
            <p className="text-[14px] text-ink-500">No current developments apply to your profile.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {applies.slice(0, 6).map(({ m, s }) => (
                <li key={m.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <DomainTag domain={s.domain} />
                  <Link href={`/app/signal/${s.id}`} className="flex-1 min-w-[160px] text-[14px] text-ink-900 truncate hover:text-navy-700">{s.title}</Link>
                  <MatchPill status={m.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle title="Ironwood activity" description="Last 30 days" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat label="Reviews & updates" value={recent.filter((e) => e.actor === "IRONWOOD").length} />
            <MiniStat label="Actions completed" value={completed30} />
            <MiniStat label="Work in progress" value={data.activeWork.length} />
          </div>
          <ul className="space-y-2">
            {data.activeWork.slice(0, 4).map((w) => {
              const c = data.consultants.find((x) => x.id === w.consultantId);
              return (
                <li key={w.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13.5px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-steel-500 shrink-0" />
                  <span className="flex-1 min-w-[160px] truncate text-ink-900">{w.title}</span>
                  <span className="text-ink-500 shrink-0">{c?.name.split(" ")[0]} · {w.statusLabel}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Major compliance gaps" count={majorGaps.length} action={<Link href="/app/gaps" className="text-[13px] font-semibold text-navy-700 hover:text-ember-600">All gaps</Link>} />
        {majorGaps.length === 0 ? (
          <p className="text-[14px] text-ink-500">No high-severity gaps identified.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {majorGaps.slice(0, 4).map((g) => (
              <div key={g.id} className="rounded-lg border border-ink-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <DomainTag domain={g.domain} />
                  {!g.serviceActive && <span className="text-[11.5px] text-amber-700 font-medium">Outside active services — {DOMAIN_LABEL[g.domain]} support available</span>}
                </div>
                <div className="text-[14.5px] font-semibold text-ink-900">{g.title}</div>
                <div className="text-[13px] text-ink-600 mt-1">{g.recommendation}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone, hint }: { label: string; value: number; tone: "ember" | "amber" | "sage" | "steel"; hint?: string }) {
  const color = { ember: "text-ember-300", amber: "text-amber-200", sage: "text-sage-200", steel: "text-steel-200" }[tone];
  return (
    <div className="rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-navy-300">{label}</div>
      <div className={clsx("font-display text-[30px] leading-none mt-1.5 tabular", color)}>{value}</div>
      {hint && <div className="text-[11.5px] text-ember-300 mt-1">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-paper-100 px-3 py-2.5">
      <div className="font-display text-[24px] leading-none tabular text-ink-900">{value}</div>
      <div className="text-[11.5px] text-ink-500 mt-1">{label}</div>
    </div>
  );
}

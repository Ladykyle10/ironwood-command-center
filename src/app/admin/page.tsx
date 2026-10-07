"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useClientSummaries } from "@/lib/admin-data";
import { Card, SectionTitle, SeeAll, Stat } from "@/components/ui/Primitives";
import { ClientTable } from "@/components/admin/ClientTable";
import { DomainTag, QuestionStatusPill, UrgencyPill } from "@/components/ui/Pill";
import { ActivityList } from "@/components/client/Rows";
import { PRIMARY_DOMAINS, DOMAIN_SHORT } from "@/lib/types";
import { greeting, timeAgo } from "@/lib/format";
import { ReadinessTrend } from "@/components/client/ReadinessTrend";
import { computeReadiness } from "@/lib/engine/readiness";
import { REQUIREMENTS } from "@/data/requirements";

export default function AdminDashboard() {
  const { user } = useSession();
  const rows = useClientSummaries();
  const questions = useStore((s) => s.questions);
  const signals = useStore((s) => s.signals);
  const activity = useStore((s) => s.activity);
  const organizations = useStore((s) => s.organizations);
  const history = useStore((s) => s.readinessHistory);

  const active = rows.filter((r) => r.org.status !== "INACTIVE");
  const withCritical = active.filter((r) => r.criticalActions > 0).length;
  const overdue = active.reduce((s, r) => s + r.overdueActions + r.overdueDeadlines, 0);
  const due7 = active.reduce((s, r) => s + r.deadlines7, 0);
  const openQ = questions.filter((q) => q.status === "NEW" || q.status === "REVIEWING" || q.status === "FOLLOW_UP_REQUIRED");
  const drafts = signals.filter((s) => s.status === "DRAFT");
  const adoption = PRIMARY_DOMAINS.map((d) => ({ d, n: active.filter((r) => r.org.services[d] === "ACTIVE").length }));
  const avg = active.length ? Math.round(active.reduce((s, r) => s + r.overall, 0) / active.length) : 0;

  // Portfolio trend: average of client snapshots per month, plus "now".
  const months = Array.from(new Set(history.map((h) => h.date))).sort();
  const monitoredOrgs = (d: (typeof PRIMARY_DOMAINS)[number]) => new Set(active.filter((r) => r.readiness[d].requirementsApplicable > 0 || r.readiness[d].serviceActive).map((r) => r.org.id));
  const portfolioHistory = months.map((date, i) => {
    const rowsAt = history.filter((h) => h.date === date);
    const avgOf = (d: (typeof PRIMARY_DOMAINS)[number]) => {
      const rel = rowsAt.filter((h) => monitoredOrgs(d).has(h.orgId));
      return rel.length ? Math.round(rel.reduce((s, h) => s + h.scores[d], 0) / rel.length) : 100;
    };
    return { id: `p-${i}`, orgId: "portfolio", date, scores: { HR: avgOf("HR"), DOT: avgOf("DOT"), SAFETY: avgOf("SAFETY"), CONTRACTOR: avgOf("CONTRACTOR"), RECRUITING: 0, LEADERSHIP: 0, OPERATIONS: 0 } };
  });
  const portfolioNow = (() => {
    const per = active.map((r) => r.readiness);
    const base = computeReadiness({ org: organizations[0], requirements: REQUIREMENTS, actions: [], deadlines: [], documents: [] });
    for (const d of PRIMARY_DOMAINS) {
      const vals = per.map((p) => p[d]).filter((x) => x.requirementsApplicable > 0 || x.serviceActive);
      base[d] = { ...base[d], score: vals.length ? Math.round(vals.reduce((s, x) => s + x.score, 0) / vals.length) : 100, serviceActive: true, requirementsApplicable: 1 };
    }
    return base;
  })();

  const orgNames = Object.fromEntries(organizations.map((o) => [o.id, o.name]));
  const recent = [...activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <div className="eyebrow mb-2">{greeting()}, {user.name.split(" ")[0]}</div>
        <h1 className="text-[30px] sm:text-[38px] leading-[1.05] text-ink-900">Where clients need Ironwood</h1>
        <p className="mt-3 text-[15px] text-ink-600 max-w-2xl">Portfolio view across {active.length} active clients. Average readiness {avg}%.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active clients" value={active.length} href="/admin/clients" />
        <Stat label="With critical actions" value={withCritical} tone={withCritical ? "ember" : "sage"} href="/admin/clients" />
        <Stat label="Overdue items" value={overdue} tone={overdue ? "ember" : "sage"} href="/admin/actions?status=overdue" />
        <Stat label="Due this week" value={due7} tone="amber" />
        <Stat label="Open questions" value={openQ.length} tone={openQ.length ? "ember" : "sage"} href="/admin/queue" />
        <Stat label="Signals in draft" value={drafts.length} tone="steel" href="/admin/signals" />
      </div>

      <section>
        <SectionTitle title="Clients" action={<SeeAll href="/admin/clients" label="All clients" />} />
        <ClientTable rows={active} />
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle title="Consultant queue" count={openQ.length} action={<SeeAll href="/admin/queue" />} />
          {openQ.length === 0 ? (
            <p className="text-[14px] text-ink-500">No open questions.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {openQ.slice(0, 5).map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/queue/${q.id}`} className="block py-2.5 -mx-2 px-2 rounded-lg hover:bg-paper-100 transition">
                    <div className="flex items-center gap-2 mb-1">
                      <DomainTag domain={q.domain} />
                      <span className="text-[12px] text-ink-500 truncate">{orgNames[q.orgId]}</span>
                      <span className="ml-auto text-[11.5px] text-ink-400">{timeAgo(q.submittedAt)}</span>
                    </div>
                    <div className="text-[14px] text-ink-900 line-clamp-2">{q.text}</div>
                    <div className="mt-1.5 flex gap-1.5"><QuestionStatusPill status={q.status} size="sm" /><UrgencyPill urgency={q.urgency} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle title="Service adoption" description="Active services across clients" />
          <ul className="space-y-3">
            {adoption.map(({ d, n }) => (
              <li key={d}>
                <div className="flex items-center justify-between text-[13.5px] mb-1">
                  <span className="font-medium text-ink-800">{DOMAIN_SHORT[d]}</span>
                  <span className="tabular text-ink-500">{n} of {active.length}</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-navy-700 rounded-full" style={{ width: `${active.length ? (n / active.length) * 100 : 0}%` }} /></div>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <div className="eyebrow mb-2">Portfolio readiness trend</div>
            <ReadinessTrend history={portfolioHistory} current={portfolioNow} height={160} />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Recent activity" description="Across all clients" />
          <ActivityList events={recent} orgNames={orgNames} />
        </Card>
      </div>
    </div>
  );
}

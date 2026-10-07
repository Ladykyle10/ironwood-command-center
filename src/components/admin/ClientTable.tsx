"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Search, Eye } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { ClientSummary } from "@/lib/admin-data";
import { Input, Select } from "@/components/ui/Form";
import { Card, EmptyState } from "@/components/ui/Primitives";
import { ReadinessRing } from "@/components/ui/ReadinessRing";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, type Domain } from "@/lib/types";
import { isMonitored } from "@/lib/engine/readiness";
import { timeAgo } from "@/lib/format";

type Sort = "name" | "readiness" | "attention";

export function ClientTable({ rows, pickMode }: { rows: ClientSummary[]; pickMode?: boolean }) {
  const consultants = useStore((s) => s.consultants);
  const setViewingOrg = useStore((s) => s.setViewingOrg);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [service, setService] = useState<Domain | "ALL">("ALL");
  const [consultant, setConsultant] = useState("ALL");
  const [flag, setFlag] = useState<"ALL" | "CRITICAL" | "OVERDUE" | "QUESTIONS">("ALL");
  const [sort, setSort] = useState<Sort>("attention");

  const filtered = useMemo(() => {
    const score = (r: ClientSummary) => r.overdueActions * 5 + r.criticalActions * 3 + r.openQuestions * 2 + r.overdueDeadlines * 2 + (100 - r.overall) / 10;
    return rows
      .filter((r) => !q || `${r.org.name} ${r.org.industry} ${r.org.statesOfOperation.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
      .filter((r) => service === "ALL" || r.org.services[service] === "ACTIVE")
      .filter((r) => consultant === "ALL" || r.org.assignedConsultantIds.includes(consultant))
      .filter((r) => flag === "ALL" || (flag === "CRITICAL" ? r.criticalActions > 0 : flag === "OVERDUE" ? r.overdueActions + r.overdueDeadlines > 0 : r.openQuestions > 0))
      .sort((a, b) => (sort === "name" ? a.org.name.localeCompare(b.org.name) : sort === "readiness" ? a.overall - b.overall : score(b) - score(a)));
  }, [rows, q, service, consultant, flag, sort]);

  const viewAs = (orgId: string) => {
    setViewingOrg(orgId);
    router.push("/app");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients, industries, states" className="pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={service} onChange={(e) => setService(e.target.value as Domain | "ALL")}>
            <option value="ALL">Any service</option>
            {PRIMARY_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_SHORT[d]} active</option>)}
          </Select>
          <Select value={consultant} onChange={(e) => setConsultant(e.target.value)}>
            <option value="ALL">Any consultant</option>
            {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={flag} onChange={(e) => setFlag(e.target.value as typeof flag)}>
            <option value="ALL">All clients</option>
            <option value="CRITICAL">With critical / high actions</option>
            <option value="OVERDUE">With overdue items</option>
            <option value="QUESTIONS">With open questions</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="attention">Needs attention first</option>
            <option value="readiness">Lowest readiness first</option>
            <option value="name">Name</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No clients match" body="Adjust the filters or add a new client." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.6fr_repeat(4,64px)_1fr_1fr_auto] gap-3 items-center px-5 py-2.5 border-b border-ink-100 bg-paper-50 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            <div>Client</div>
            {PRIMARY_DOMAINS.map((d) => <div key={d} className="text-center">{d === "CONTRACTOR" ? "Contr." : DOMAIN_SHORT[d]}</div>)}
            <div className="pl-2">Attention</div>
            <div>Consultants</div>
            <div />
          </div>
          <div className="divide-y divide-ink-100">
            {filtered.map((r) => (
              <div key={r.org.id} className="grid grid-cols-1 md:grid-cols-[1.6fr_repeat(4,64px)_1fr_1fr_auto] gap-3 items-center px-5 py-3.5 hover:bg-paper-50 transition">
                <div className="min-w-0">
                  <Link href={`/admin/clients/${r.org.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-navy-700">{r.org.name}</Link>
                  <div className="text-[12.5px] text-ink-500">{r.org.industry} · {r.org.employeeCount} employees · {r.org.statesOfOperation.join(", ")}</div>
                  <div className="text-[11.5px] text-ink-400 mt-0.5">{r.lastActivity ? `Last activity ${timeAgo(r.lastActivity)}` : "No activity yet"}</div>
                </div>
                <div className="flex gap-2 md:contents">
                  {PRIMARY_DOMAINS.map((d) => {
                    const x = r.readiness[d];
                    return (
                      <div key={d} className="flex flex-col items-center">
                        <ReadinessRing value={isMonitored(x) ? x.score : null} size={44} stroke={4} muted={!x.serviceActive} />
                        <span className="md:hidden text-[10px] text-ink-500">{DOMAIN_SHORT[d]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[12px] md:pl-2">
                  {r.overdueActions > 0 && <Badge tone="ember">{r.overdueActions} overdue</Badge>}
                  {r.criticalActions > 0 && <Badge tone="amber">{r.criticalActions} high-priority</Badge>}
                  {r.openQuestions > 0 && <Badge tone="navy">{r.openQuestions} question{r.openQuestions > 1 ? "s" : ""}</Badge>}
                  {r.deadlines7 > 0 && <Badge tone="neutral">{r.deadlines7} due this week</Badge>}
                  {r.overdueActions + r.criticalActions + r.openQuestions + r.deadlines7 === 0 && <span className="text-sage-600 font-medium">Clear</span>}
                </div>
                <div className="text-[13px] text-ink-600">{r.consultantNames.join(", ") || "Unassigned"}</div>
                <div className="flex gap-2">
                  <button onClick={() => viewAs(r.org.id)} className={clsx("btn btn-sm", pickMode ? "btn-primary" : "btn-secondary")}><Eye className="h-3.5 w-3.5" /> View as client</button>
                  {!pickMode && <Link href={`/admin/clients/${r.org.id}`} className="btn btn-ghost btn-sm">Manage</Link>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: "ember" | "amber" | "navy" | "neutral"; children: React.ReactNode }) {
  const cls = { ember: "bg-ember-50 text-ember-700", amber: "bg-amber-50 text-amber-700", navy: "bg-navy-100 text-navy-700", neutral: "bg-paper-200 text-ink-600" }[tone];
  return <span className={clsx("rounded-md px-1.5 py-0.5 font-semibold whitespace-nowrap", cls)}>{children}</span>;
}

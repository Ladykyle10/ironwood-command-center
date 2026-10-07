"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, Tabs, EmptyState } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Form";
import { DomainTag, QuestionStatusPill, UrgencyPill } from "@/components/ui/Pill";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { QuestionStatus } from "@/lib/types";

type Tab = "OPEN" | QuestionStatus | "ALL";

export default function QueuePage() {
  const questions = useStore((s) => s.questions);
  const organizations = useStore((s) => s.organizations);
  const consultants = useStore((s) => s.consultants);
  const [tab, setTab] = useState<Tab>("OPEN");
  const [consultant, setConsultant] = useState("ALL");
  const [org, setOrg] = useState("ALL");

  const rows = useMemo(() => {
    const open: QuestionStatus[] = ["NEW", "REVIEWING", "FOLLOW_UP_REQUIRED"];
    const urg = { HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3 };
    return questions
      .filter((q) => (tab === "ALL" ? true : tab === "OPEN" ? open.includes(q.status) : q.status === tab))
      .filter((q) => consultant === "ALL" || (consultant === "UNASSIGNED" ? !q.assignedConsultantId : q.assignedConsultantId === consultant))
      .filter((q) => org === "ALL" || q.orgId === org)
      .sort((a, b) => urg[a.urgency] - urg[b.urgency] || b.submittedAt.localeCompare(a.submittedAt));
  }, [questions, tab, consultant, org]);

  const n = (s: QuestionStatus) => questions.filter((q) => q.status === s).length;
  const orgName = (id: string) => organizations.find((o) => o.id === id)?.name ?? "—";

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Consultant Queue" title="Client questions" description="Every Ask Ironwood submission with its preliminary triage. High urgency sorts first. Internal notes stay internal; responses go to the client." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "OPEN", label: "Open", count: n("NEW") + n("REVIEWING") + n("FOLLOW_UP_REQUIRED") },
          { value: "NEW", label: "New", count: n("NEW") },
          { value: "REVIEWING", label: "Reviewing", count: n("REVIEWING") },
          { value: "FOLLOW_UP_REQUIRED", label: "Follow-up required", count: n("FOLLOW_UP_REQUIRED") },
          { value: "RESPONDED", label: "Responded", count: n("RESPONDED") },
          { value: "CLOSED", label: "Closed", count: n("CLOSED") },
          { value: "ALL", label: "All" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Select value={consultant} onChange={(e) => setConsultant(e.target.value)} className="!w-auto">
          <option value="ALL">Any consultant</option>
          <option value="UNASSIGNED">Unassigned</option>
          {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={org} onChange={(e) => setOrg(e.target.value)} className="!w-auto">
          <option value="ALL">Any client</option>
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Queue is clear" body="No questions match this view." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1.4fr_2.6fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 border-b border-ink-100 bg-paper-50 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            <div>Client</div><div>Question</div><div>Urgency</div><div>Assigned</div><div>Status</div>
          </div>
          <div className="divide-y divide-ink-100">
            {rows.map((q) => (
              <Link key={q.id} href={`/admin/queue/${q.id}`} className="grid grid-cols-1 lg:grid-cols-[1.4fr_2.6fr_1fr_1fr_1fr] gap-2 lg:gap-3 px-5 py-3.5 hover:bg-paper-50 transition items-center">
                <div>
                  <div className="text-[14px] font-semibold text-ink-900">{orgName(q.orgId)}</div>
                  <div className="text-[12px] text-ink-500">{q.submittedByName} · {timeAgo(q.submittedAt)}</div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><DomainTag domain={q.domain} /><span className="lg:hidden"><UrgencyPill urgency={q.urgency} /></span></div>
                  <div className="text-[14px] text-ink-800 line-clamp-2">{q.text}</div>
                </div>
                <div className="hidden lg:block"><UrgencyPill urgency={q.urgency} /></div>
                <div className="text-[13px] text-ink-600">{consultants.find((c) => c.id === q.assignedConsultantId)?.name ?? <span className="text-amber-700 font-medium">Unassigned</span>}</div>
                <div className="flex items-center gap-2"><QuestionStatusPill status={q.status} size="sm" /><span className="hidden xl:inline text-[11.5px] text-ink-400">{fmtDateTime(q.submittedAt)}</span></div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

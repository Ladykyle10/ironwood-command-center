"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, EmptyState, Progress, Tabs } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Form";
import { DomainTag, Pill, WORK_META } from "@/components/ui/Pill";
import { WorkForm } from "@/components/admin/WorkForm";
import { fmtDate } from "@/lib/format";
import type { WorkItem, WorkStatus } from "@/lib/types";

type Tab = "ACTIVE" | WorkStatus | "ALL";

export default function WorkPage() {
  const workItems = useStore((s) => s.workItems);
  const organizations = useStore((s) => s.organizations);
  const consultants = useStore((s) => s.consultants);
  const [tab, setTab] = useState<Tab>("ACTIVE");
  const [consultant, setConsultant] = useState("ALL");
  const [edit, setEdit] = useState<WorkItem | "new" | null>(null);
  const rows = workItems
    .filter((w) => (tab === "ALL" ? true : tab === "ACTIVE" ? w.status !== "COMPLETE" : w.status === tab))
    .filter((w) => consultant === "ALL" || w.consultantId === consultant)
    .sort((a, b) => (a.targetDate ?? "9").localeCompare(b.targetDate ?? "9"));
  const orgName = (id: string) => organizations.find((o) => o.id === id)?.name ?? "—";

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Ironwood Handling" title="Work in progress" description="Everything consultants are doing on behalf of clients. This is what clients see under “Ironwood is handling” — keep it current." actions={<button onClick={() => setEdit("new")} className="btn btn-primary"><Plus className="h-4 w-4" /> Log work</button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "ACTIVE", label: "Active", count: workItems.filter((w) => w.status !== "COMPLETE").length }, { value: "SCHEDULED", label: "Scheduled" }, { value: "IN_PROGRESS", label: "In progress" }, { value: "REVIEW", label: "In review" }, { value: "COMPLETE", label: "Complete" }, { value: "ALL", label: "All" }]} />
      <Select value={consultant} onChange={(e) => setConsultant(e.target.value)} className="!w-auto"><option value="ALL">Any consultant</option>{consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      {rows.length === 0 ? (
        <EmptyState title="No work logged" body="Log work so clients can see it." />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {rows.map((w) => {
            const c = consultants.find((x) => x.id === w.consultantId);
            const meta = WORK_META[w.status];
            return (
              <div key={w.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1"><DomainTag domain={w.domain} /><span className="text-[12.5px] text-ink-500">{orgName(w.orgId)}</span><Pill tone={meta.tone} size="sm">{w.statusLabel}</Pill></div>
                  <div className="text-[15px] font-semibold text-ink-900">{w.title}</div>
                  <div className="text-[12.5px] text-ink-500 mt-0.5">{c?.name}{w.targetDate ? ` · target ${fmtDate(w.targetDate)}` : ""}{w.completedAt ? ` · completed ${fmtDate(w.completedAt)}` : ""}</div>
                </div>
                <div className="flex items-center gap-3 sm:w-64">
                  <Progress value={w.progress} tone={w.status === "COMPLETE" ? "sage" : "steel"} className="flex-1" />
                  <span className="tabular text-[12px] font-semibold text-ink-600 w-9 text-right">{w.progress}%</span>
                  <button onClick={() => setEdit(w)} className="btn btn-ghost btn-sm">Update</button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {edit && <WorkForm open onClose={() => setEdit(null)} existing={edit === "new" ? undefined : edit} />}
    </div>
  );
}

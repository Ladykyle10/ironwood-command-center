"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, Tabs, EmptyState } from "@/components/ui/Primitives";
import { DemoTag, DomainTag, Pill, UrgencyPill } from "@/components/ui/Pill";
import { fmtDate } from "@/lib/format";
import type { SignalStatus } from "@/lib/types";

type Tab = SignalStatus | "ALL";

export default function SignalsAdminPage() {
  const signals = useStore((s) => s.signals);
  const matches = useStore((s) => s.matches);
  const [tab, setTab] = useState<Tab>("ALL");
  const rows = signals.filter((s) => tab === "ALL" || s.status === tab).sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));
  const n = (st: SignalStatus) => signals.filter((s) => s.status === st).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Signal Management"
        title="Regulatory Signals"
        description="Create a development, define who it applies to, and publish. The engine evaluates every client and surfaces the result in their portal with an explanation."
        actions={<Link href="/admin/signals/new" className="btn btn-primary"><Plus className="h-4 w-4" /> New Signal</Link>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "ALL", label: "All", count: signals.length }, { value: "PUBLISHED", label: "Published", count: n("PUBLISHED") }, { value: "DRAFT", label: "Drafts", count: n("DRAFT") }, { value: "ARCHIVED", label: "Archived", count: n("ARCHIVED") }]} />
      {rows.length === 0 ? (
        <EmptyState title="No Signals here" body="Create a Signal to get started." action={<Link href="/admin/signals/new" className="btn btn-primary">New Signal</Link>} />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {rows.map((s) => {
            const ms = matches.filter((m) => m.signalId === s.id);
            const applies = ms.filter((m) => m.status === "APPLIES").length;
            const watch = ms.filter((m) => m.status === "WATCH").length;
            const handling = ms.filter((m) => m.status === "HANDLING").length;
            return (
              <Link key={s.id} href={`/admin/signals/${s.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-paper-50 transition sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <DomainTag domain={s.domain} />
                    <span className="text-[12.5px] text-ink-500">{s.regulatoryBody} · {s.jurisdiction} · {fmtDate(s.publishedDate, "MMM d, yyyy")}</span>
                    {s.isDemo && <DemoTag />}
                  </div>
                  <div className="text-[15px] font-semibold text-ink-900">{s.title}</div>
                  <div className="text-[13px] text-ink-500 line-clamp-1">{s.summary}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {s.status === "PUBLISHED" ? (
                    <>
                      <Pill tone="ember" size="sm">{applies} applies</Pill>
                      <Pill tone="amber" size="sm">{watch} watch</Pill>
                      {handling > 0 && <Pill tone="steel" size="sm">{handling} handling</Pill>}
                    </>
                  ) : (
                    <Pill tone={s.status === "DRAFT" ? "amber" : "neutral"} dot size="sm">{s.status === "DRAFT" ? "Draft" : "Archived"}</Pill>
                  )}
                  <UrgencyPill urgency={s.urgency} />
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { EmptyState, Card, DL } from "@/components/ui/Primitives";
import { DomainTag, QuestionStatusPill, UrgencyPill } from "@/components/ui/Pill";
import { TriageCard } from "@/components/client/Triage";
import { QuestionThread } from "@/components/client/QuestionThread";
import { useStore } from "@/store/useStore";
import { fmtDateTime } from "@/lib/format";

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const { activeOrgId, canEdit } = useSession();
  const data = useOrgData(activeOrgId);
  const consultants = useStore((s) => s.consultants);
  if (!data) return null;
  const q = data.questions.find((x) => x.id === id);
  if (!q) return <EmptyState title="Question not found" action={<Link href="/app/ask" className="btn btn-secondary">Ask Ironwood</Link>} />;
  const consultant = consultants.find((c) => c.id === q.assignedConsultantId);

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/app/ask" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" /> Ask Ironwood</Link>
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <DomainTag domain={q.domain} />
          <QuestionStatusPill status={q.status} />
          <UrgencyPill urgency={q.urgency} />
        </div>
        <h1 className="text-[26px] sm:text-[30px] leading-[1.15] text-ink-900">{q.text}</h1>
        <div className="mt-2 text-[14px] text-ink-500">Asked by {q.submittedByName} · {fmtDateTime(q.submittedAt)}</div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <QuestionThread question={q} allowReply={canEdit} />
          <TriageCard triage={q.triage} />
        </div>
        <aside>
          <Card>
            <DL cols={1} items={[
              { label: "Assigned consultant", value: consultant ? `${consultant.name} · ${consultant.title}` : "Being routed" },
              { label: "Status", value: <QuestionStatusPill status={q.status} size="sm" /> },
              { label: "Responses", value: q.responses.filter((r) => r.from !== "CLIENT").length },
            ]} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

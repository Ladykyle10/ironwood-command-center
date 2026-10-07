"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, Chips, EmptyState, SectionTitle } from "@/components/ui/Primitives";
import { DeadlineRow } from "@/components/client/Rows";
import { DeadlineForm } from "@/components/client/DeadlineForm";
import { useToast } from "@/components/ui/Toast";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, type Domain, type Deadline } from "@/lib/types";

export default function DeadlinesPage() {
  const { activeOrgId, canEdit, user } = useSession();
  const data = useOrgData(activeOrgId);
  const completeDeadline = useStore((s) => s.completeDeadline);
  const { toast } = useToast();
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");
  const [formOpen, setFormOpen] = useState(false);
  if (!data) return null;

  const f = (xs: Deadline[]) => xs.filter((d) => domain === "ALL" || d.domain === domain);
  const overdue = f(data.overdueDeadlines);
  const next7 = f(data.next7);
  const next30 = f(data.next30);
  const next90 = f(data.next90);
  const later = f(data.upcomingDeadlines.filter((d) => !data.overdueDeadlines.includes(d) && !data.next7.includes(d) && !data.next30.includes(d) && !data.next90.includes(d)));
  const complete = f(data.deadlines.filter((d) => d.status === "COMPLETE")).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const empty = overdue.length + next7.length + next30.length + next90.length + later.length === 0;

  const group = (title: string, items: Deadline[], description?: string) =>
    items.length > 0 && (
      <section>
        <SectionTitle title={title} count={items.length} description={description} />
        <Card padded={false} className="divide-y divide-ink-100">
          {items.map((d) => (
            <DeadlineRow
              key={d.id}
              deadline={d}
              canEdit={canEdit}
              actionHref={d.relatedActionId ? `/app/actions/${d.relatedActionId}` : undefined}
              onComplete={() => {
                completeDeadline(d.id, user.name);
                toast("Marked complete", d.title);
              }}
            />
          ))}
        </Card>
      </section>
    );

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        eyebrow="Deadlines & Expirations"
        title="What's coming up"
        description="Regulatory dates, document and certification expirations, training, audits and recurring reviews — in one timeline."
        actions={canEdit ? <button onClick={() => setFormOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> Add deadline</button> : undefined}
      />
      <Chips options={PRIMARY_DOMAINS.map((d) => ({ value: d, label: DOMAIN_SHORT[d] }))} value={domain} onChange={setDomain} allLabel="All areas" />

      {empty ? (
        <EmptyState title="No upcoming deadlines" body="Nothing is scheduled in this area. Ironwood will add dates as they are identified." />
      ) : (
        <>
          {group("Past due", overdue, "These need a decision — complete them or update the date.")}
          {group("Next 7 days", next7)}
          {group("Next 30 days", next30)}
          {group("Next 90 days", next90)}
          {group("Later", later)}
        </>
      )}
      {complete.length > 0 && group("Recently completed", complete)}
      {formOpen && <DeadlineForm open={formOpen} onClose={() => setFormOpen(false)} orgId={data.org.id} />}
    </div>
  );
}

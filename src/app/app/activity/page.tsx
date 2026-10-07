"use client";

import { useState } from "react";
import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader, Card, Chips, EmptyState, SectionTitle } from "@/components/ui/Primitives";
import { ActivityList, WorkCard } from "@/components/client/Rows";
import type { ActivityType } from "@/lib/types";

const TYPES: { value: ActivityType; label: string }[] = [
  { value: "SIGNAL", label: "Signals" },
  { value: "ACTION", label: "Actions" },
  { value: "WORK", label: "Ironwood work" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "DEADLINE", label: "Deadlines" },
  { value: "QUESTION", label: "Questions" },
  { value: "READINESS", label: "Readiness" },
];

export default function ActivityPage() {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const [type, setType] = useState<ActivityType | "ALL">("ALL");
  if (!data) return null;
  const events = data.activity.filter((e) => type === "ALL" || e.type === type);

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader eyebrow="Activity" title="What Ironwood has been doing for you" description="A running record of reviews, completed work, documents and responses — so the ongoing value is visible." />

      {data.workItems.length > 0 && (
        <section>
          <SectionTitle title="Ironwood is handling" count={data.activeWork.length} description="Work our consultants are managing on your behalf" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...data.activeWork, ...data.workItems.filter((w) => w.status === "COMPLETE")].map((w) => (
              <WorkCard key={w.id} item={w} consultant={data.consultants.find((c) => c.id === w.consultantId)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Timeline" />
        <Chips options={TYPES} value={type} onChange={setType} />
        <Card className="mt-4">
          {events.length ? <ActivityList events={events} /> : <EmptyState compact title="No activity in this category" />}
        </Card>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader, Card, Tabs, Chips, EmptyState } from "@/components/ui/Primitives";
import { ActionRow } from "@/components/client/Rows";
import { ActionForm } from "@/components/client/ActionForm";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, type ActionStatus, type Domain } from "@/lib/types";
import { daysUntil } from "@/lib/format";

type Tab = "OPEN" | "WAITING_ON_CLIENT" | "WAITING_ON_IRONWOOD" | "COMPLETE" | "ALL";

export default function ActionsPage() {
  const { activeOrgId, canEdit } = useSession();
  const data = useOrgData(activeOrgId);
  const [tab, setTab] = useState<Tab>("OPEN");
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const open: ActionStatus[] = ["NEW", "IN_PROGRESS", "WAITING_ON_CLIENT", "WAITING_ON_IRONWOOD"];
    return data.actions
      .filter((a) => (tab === "ALL" ? true : tab === "OPEN" ? open.includes(a.status) : a.status === tab))
      .filter((a) => domain === "ALL" || a.domain === domain)
      .sort((a, b) => {
        if (a.status === "COMPLETE" && b.status !== "COMPLETE") return 1;
        if (b.status === "COMPLETE" && a.status !== "COMPLETE") return -1;
        return (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999);
      });
  }, [data, tab, domain]);

  if (!data) return null;
  const n = (s: ActionStatus) => data.actions.filter((a) => a.status === s).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Action Center"
        title="Everything that needs doing"
        description="Actions created by Ironwood and your team, with owners and due dates. Overdue items are listed first."
        actions={canEdit ? <button onClick={() => setFormOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> New action</button> : undefined}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "OPEN", label: "Open", count: data.openActions.length },
          { value: "WAITING_ON_CLIENT", label: "Waiting on you", count: n("WAITING_ON_CLIENT") },
          { value: "WAITING_ON_IRONWOOD", label: "Waiting on Ironwood", count: n("WAITING_ON_IRONWOOD") },
          { value: "COMPLETE", label: "Complete", count: n("COMPLETE") },
          { value: "ALL", label: "All" },
        ]}
      />
      <Chips options={PRIMARY_DOMAINS.map((d) => ({ value: d, label: DOMAIN_SHORT[d] }))} value={domain} onChange={setDomain} allLabel="All areas" />
      {rows.length === 0 ? (
        <EmptyState title="Nothing needs your attention" body="That's good news. Ironwood is monitoring your active compliance areas." />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {rows.map((a) => <ActionRow key={a.id} action={a} />)}
        </Card>
      )}
      {formOpen && <ActionForm open={formOpen} onClose={() => setFormOpen(false)} orgId={data.org.id} />}
    </div>
  );
}

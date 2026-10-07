"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, EmptyState, Tabs } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Form";
import { ActionRow } from "@/components/client/Rows";
import { ActionForm } from "@/components/client/ActionForm";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, type ActionStatus, type Domain } from "@/lib/types";
import { daysUntil } from "@/lib/format";
import { OPEN_ACTION } from "@/lib/hooks";

type Tab = "OPEN" | "OVERDUE" | "WAITING_ON_IRONWOOD" | "WAITING_ON_CLIENT" | "COMPLETE" | "ALL";

function ActionsInner() {
  const actions = useStore((s) => s.actions);
  const organizations = useStore((s) => s.organizations);
  const consultants = useStore((s) => s.consultants);
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get("status") === "overdue" ? "OVERDUE" : "OPEN");
  const [org, setOrg] = useState("ALL");
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");
  const [owner, setOwner] = useState("ALL");
  const [newOrg, setNewOrg] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      actions
        .filter((a) => (tab === "ALL" ? true : tab === "OPEN" ? OPEN_ACTION.has(a.status) : tab === "OVERDUE" ? OPEN_ACTION.has(a.status) && (daysUntil(a.dueDate) ?? 1) < 0 : a.status === (tab as ActionStatus)))
        .filter((a) => org === "ALL" || a.orgId === org)
        .filter((a) => domain === "ALL" || a.domain === domain)
        .filter((a) => owner === "ALL" || a.ironwoodOwnerId === owner)
        .sort((a, b) => (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999)),
    [actions, tab, org, domain, owner],
  );
  const orgName = Object.fromEntries(organizations.map((o) => [o.id, o.name]));
  const overdueCount = actions.filter((a) => OPEN_ACTION.has(a.status) && (daysUntil(a.dueDate) ?? 1) < 0).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Action Center" title="All client actions" description="Every action across the portfolio. Filter by client, service area or Ironwood owner." actions={<button onClick={() => setNewOrg(organizations[0]?.id ?? null)} className="btn btn-primary"><Plus className="h-4 w-4" /> New action</button>} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "OPEN", label: "Open", count: actions.filter((a) => OPEN_ACTION.has(a.status)).length },
          { value: "OVERDUE", label: "Overdue", count: overdueCount },
          { value: "WAITING_ON_IRONWOOD", label: "Waiting on Ironwood", count: actions.filter((a) => a.status === "WAITING_ON_IRONWOOD").length },
          { value: "WAITING_ON_CLIENT", label: "Waiting on client", count: actions.filter((a) => a.status === "WAITING_ON_CLIENT").length },
          { value: "COMPLETE", label: "Complete" },
          { value: "ALL", label: "All" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Select value={org} onChange={(e) => setOrg(e.target.value)} className="!w-auto"><option value="ALL">Any client</option>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>
        <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain | "ALL")} className="!w-auto"><option value="ALL">Any area</option>{PRIMARY_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_SHORT[d]}</option>)}</Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="!w-auto"><option value="ALL">Any Ironwood owner</option>{consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nothing here" body="No actions match this view." />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {rows.map((a) => <ActionRow key={a.id} action={a} href={`/admin/actions/${a.id}`} audience="IRONWOOD" orgName={orgName[a.orgId]} />)}
        </Card>
      )}
      {newOrg && (
        <NewActionPicker orgId={newOrg} onPick={setNewOrg} onClose={() => setNewOrg(null)} />
      )}
    </div>
  );
}

function NewActionPicker({ orgId, onPick, onClose }: { orgId: string; onPick: (id: string) => void; onClose: () => void }) {
  const organizations = useStore((s) => s.organizations);
  const [chosen, setChosen] = useState(false);
  if (!chosen) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} />
        <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-[var(--shadow-pop)] animate-fade-up">
          <div className="font-display text-[20px] text-ink-900 mb-3">Which client?</div>
          <Select value={orgId} onChange={(e) => onPick(e.target.value)}>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>
          <div className="mt-4 flex justify-end gap-2"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => setChosen(true)}>Continue</button></div>
        </div>
      </div>
    );
  }
  return <ActionForm open onClose={onClose} orgId={orgId} />;
}

export default function AdminActionsPage() {
  return (
    <Suspense fallback={null}>
      <ActionsInner />
    </Suspense>
  );
}

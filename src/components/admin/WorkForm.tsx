"use client";

import { useState } from "react";
import { addDays, format, formatISO } from "date-fns";
import { useStore, uid } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { ALL_DOMAINS, DOMAIN_LABEL, type Domain, type WorkItem, type WorkStatus } from "@/lib/types";

export function WorkForm({ open, onClose, orgId, existing }: { open: boolean; onClose: () => void; orgId?: string; existing?: WorkItem }) {
  const organizations = useStore((s) => s.organizations);
  const consultants = useStore((s) => s.consultants);
  const signals = useStore((s) => s.signals).filter((x) => x.status === "PUBLISHED");
  const saveWorkItem = useStore((s) => s.saveWorkItem);
  const { toast } = useToast();
  const [org, setOrg] = useState(existing?.orgId ?? orgId ?? organizations[0]?.id ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [domain, setDomain] = useState<Domain>(existing?.domain ?? "HR");
  const [consultantId, setConsultantId] = useState(existing?.consultantId ?? consultants[0]?.id ?? "");
  const [status, setStatus] = useState<WorkStatus>(existing?.status ?? "IN_PROGRESS");
  const [statusLabel, setStatusLabel] = useState(existing?.statusLabel ?? "In progress");
  const [progress, setProgress] = useState(existing?.progress ?? 10);
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [signalId, setSignalId] = useState(existing?.signalId ?? "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) return setError("Give the work item a title.");
    const item: WorkItem = {
      id: existing?.id ?? uid("w"),
      orgId: org,
      title: title.trim(),
      domain,
      consultantId,
      status,
      statusLabel: statusLabel.trim() || (status === "COMPLETE" ? "Complete" : "In progress"),
      progress: status === "COMPLETE" ? 100 : Math.max(0, Math.min(100, progress)),
      startedAt: existing?.startedAt ?? formatISO(new Date()),
      targetDate: targetDate || undefined,
      completedAt: status === "COMPLETE" ? existing?.completedAt ?? formatISO(new Date()) : undefined,
      summary: summary.trim(),
      signalId: signalId || undefined,
    };
    saveWorkItem(item);
    toast(existing ? "Work updated" : "Work item added", `${item.title} — visible to the client as "Ironwood is handling".`);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title={existing ? "Update Ironwood work" : "Log Ironwood work"} footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Save</button></>}>
      <div className="space-y-4">
        <p className="text-[13.5px] text-ink-600">Work items make consulting effort visible to the client. They appear under “Ironwood is handling” and in the activity feed.</p>
        {!orgId && !existing && (
          <Field label="Client"><Select value={org} onChange={(e) => setOrg(e.target.value)}>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        )}
        <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Employee handbook update" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service area"><Select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>{ALL_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}</Select></Field>
          <Field label="Consultant"><Select value={consultantId} onChange={(e) => setConsultantId(e.target.value)}>{consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status"><Select value={status} onChange={(e) => { const v = e.target.value as WorkStatus; setStatus(v); setStatusLabel(v === "SCHEDULED" ? "Scheduled" : v === "REVIEW" ? "In review" : v === "COMPLETE" ? "Complete" : statusLabel); }}><option value="SCHEDULED">Scheduled</option><option value="IN_PROGRESS">In progress</option><option value="REVIEW">In review</option><option value="COMPLETE">Complete</option></Select></Field>
          <Field label="Status label" hint="What the client sees, e.g. “Drafting”, “70% complete”."><Input value={statusLabel} onChange={(e) => setStatusLabel(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Progress — ${progress}%`}><input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-[#2e5a9e]" disabled={status === "COMPLETE"} /></Field>
          <Field label="Target date"><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
        </div>
        <Field label="Summary" hint="One or two sentences the client will understand."><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-[72px]" /></Field>
        <Field label="Related Signal"><Select value={signalId} onChange={(e) => setSignalId(e.target.value)}><option value="">None</option>{signals.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</Select></Field>
        {error && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{error}</div>}
      </div>
    </Drawer>
  );
}

export function GapForm({ open, onClose, orgId }: { open: boolean; onClose: () => void; orgId: string }) {
  const addManualGap = useStore((s) => s.addManualGap);
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<Domain>("HR");
  const [detail, setDetail] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [severity, setSeverity] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [error, setError] = useState("");
  const submit = () => {
    if (!title.trim() || !detail.trim()) return setError("Title and detail are required.");
    addManualGap({ id: uid("mg"), orgId, domain, title: title.trim(), detail: detail.trim(), recommendation: recommendation.trim() || "Review with your Ironwood consultant.", severity, createdAt: formatISO(new Date()) });
    toast("Gap recorded", severity === "HIGH" ? "The client was notified of a high-priority gap." : title);
    onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title="Record a gap" footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Save gap</button></>}>
      <div className="space-y-4">
        <p className="text-[13.5px] text-ink-600">Engine-derived gaps come from the profile automatically. Use this for observations from site visits, audits or customer requirements.</p>
        <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service area"><Select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>{ALL_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}</Select></Field>
          <Field label="Severity"><Select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}><option value="HIGH">High — action recommended</option><option value="MEDIUM">Medium — needs review</option><option value="LOW">Low — opportunity</option></Select></Field>
        </div>
        <Field label="What we observed" required><Textarea value={detail} onChange={(e) => setDetail(e.target.value)} /></Field>
        <Field label="Recommendation"><Textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} className="min-h-[64px]" /></Field>
        {error && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{error}</div>}
      </div>
    </Drawer>
  );
}

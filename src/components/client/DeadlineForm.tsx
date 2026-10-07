"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { useStore, uid } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { ALL_DOMAINS, DOMAIN_LABEL, type Deadline, type DeadlineType, type Domain, type Recurrence } from "@/lib/types";

const TYPES: { value: DeadlineType; label: string }[] = [
  { value: "REGULATORY", label: "Regulatory deadline" },
  { value: "DOCUMENT", label: "Documentation expiration" },
  { value: "TRAINING", label: "Training" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "MEDICAL_CARD", label: "DOT medical card" },
  { value: "CDL", label: "CDL" },
  { value: "VEHICLE", label: "Vehicle documentation" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "PORTAL", label: "Contractor portal" },
  { value: "POLICY", label: "Policy review" },
  { value: "AUDIT", label: "Audit" },
  { value: "REVIEW", label: "Recurring review" },
];

export function DeadlineForm({ open, onClose, orgId, existing }: { open: boolean; onClose: () => void; orgId: string; existing?: Deadline }) {
  const saveDeadline = useStore((s) => s.saveDeadline);
  const logActivity = useStore((s) => s.logActivity);
  const actions = useStore((s) => s.actions).filter((a) => a.orgId === orgId && a.status !== "COMPLETE");
  const { user, isIronwood } = useSession();
  const { toast } = useToast();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [domain, setDomain] = useState<Domain>(existing?.domain ?? "HR");
  const [type, setType] = useState<DeadlineType>(existing?.type ?? "REGULATORY");
  const [date, setDate] = useState(existing?.date ?? format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? "NONE");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [relatedActionId, setRelatedActionId] = useState(existing?.relatedActionId ?? "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) return setError("Give the deadline a title.");
    if (!date) return setError("Pick a date.");
    const d: Deadline = {
      id: existing?.id ?? uid("dl"),
      orgId,
      title: title.trim(),
      domain,
      type,
      date,
      recurrence,
      description: description.trim() || undefined,
      relatedActionId: relatedActionId || undefined,
      status: existing?.status ?? "UPCOMING",
    };
    saveDeadline(d);
    if (!existing) logActivity({ orgId, type: "DEADLINE", title: `Deadline added: ${d.title}.`, actor: isIronwood ? "IRONWOOD" : "CLIENT", actorName: user.name, href: "/app/deadlines" });
    toast(existing ? "Deadline updated" : "Deadline added", d.title);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title={existing ? "Edit deadline" : "Add deadline"} footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Save</button></>}>
      <div className="space-y-4">
        <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Forklift operator evaluations" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service area"><Select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>{ALL_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}</Select></Field>
          <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as DeadlineType)}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Recurring"><Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}><option value="NONE">One-time</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="ANNUAL">Annual</option></Select></Field>
        </div>
        <Field label="Notes"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[72px]" /></Field>
        <Field label="Related action"><Select value={relatedActionId} onChange={(e) => setRelatedActionId(e.target.value)}><option value="">None</option>{actions.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</Select></Field>
        {error && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{error}</div>}
      </div>
    </Drawer>
  );
}

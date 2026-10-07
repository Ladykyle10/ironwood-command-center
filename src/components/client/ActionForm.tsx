"use client";

import { useState } from "react";
import { useStore, uid } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { ALL_DOMAINS, DOMAIN_LABEL, type Action, type ActionStatus, type Domain, type Priority, type Recurrence, type Signal } from "@/lib/types";
import { formatISO, addDays, format } from "date-fns";

export function ActionForm({
  open,
  onClose,
  orgId,
  signal,
  existing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  signal?: Signal;
  existing?: Action;
  onSaved?: (a: Action) => void;
}) {
  const { user, isIronwood } = useSession();
  const contacts = useStore((s) => s.contacts).filter((c) => c.orgId === orgId);
  const org = useStore((s) => s.organizations).find((o) => o.id === orgId);
  const consultants = useStore((s) => s.consultants).filter((c) => org?.assignedConsultantIds.includes(c.id));
  const createAction = useStore((s) => s.createAction);
  const updateAction = useStore((s) => s.updateAction);
  const { toast } = useToast();

  const [title, setTitle] = useState(existing?.title ?? (signal ? signal.title : ""));
  const [domain, setDomain] = useState<Domain>(existing?.domain ?? signal?.domain ?? "HR");
  const [description, setDescription] = useState(existing?.description ?? (signal ? signal.summary : ""));
  const [recommended, setRecommended] = useState(existing?.recommendedAction ?? signal?.recommendedAction ?? "");
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? (signal?.urgency === "HIGH" ? "HIGH" : "MEDIUM"));
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [clientOwnerId, setClientOwnerId] = useState(existing?.clientOwnerId ?? contacts.find((c) => c.isPrimary)?.id ?? "");
  const [ironwoodOwnerId, setIronwoodOwnerId] = useState(existing?.ironwoodOwnerId ?? consultants.find((c) => c.domains.includes(signal?.domain ?? "HR"))?.id ?? "");
  const [status, setStatus] = useState<ActionStatus>(existing?.status ?? "NEW");
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? "NONE");
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) return setError("Give the action a title.");
    if (!description.trim()) return setError("Add a short description so the owner knows what to do.");
    setError("");
    const base = {
      title: title.trim(),
      domain,
      description: description.trim(),
      recommendedAction: recommended.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      clientOwnerId: clientOwnerId || undefined,
      ironwoodOwnerId: ironwoodOwnerId || undefined,
      status,
      recurrence,
    };
    if (existing) {
      updateAction(existing.id, base, user.name, isIronwood ? "IRONWOOD" : "CLIENT");
      toast("Action updated", existing.title);
      onSaved?.({ ...existing, ...base });
    } else {
      const action: Action = {
        id: uid("act"),
        orgId,
        ...base,
        notes: [],
        resourceIds: [],
        signalId: signal?.id,
        createdAt: formatISO(new Date()),
        createdBy: user.id,
      };
      createAction(action, user.name);
      toast("Action created", signal ? `Created from Signal: ${signal.title}` : action.title);
      onSaved?.(action);
    }
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={existing ? "Edit action" : signal ? "Create action from Signal" : "New action"}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{existing ? "Save changes" : "Create action"}</button>
        </>
      }
    >
      <div className="space-y-4">
        {signal && (
          <div className="rounded-lg bg-steel-50 border border-steel-200 px-3.5 py-2.5 text-[13px] text-steel-700">
            Linked to Signal: <span className="font-semibold">{signal.title}</span>
          </div>
        )}
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review flagged I-9 records" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service area">
            <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
              {ALL_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </Field>
        </div>
        <Field label="What needs to happen" required>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Recommended action" hint="Plain-language next step shown to the client.">
          <Textarea value={recommended} onChange={(e) => setRecommended(e.target.value)} className="min-h-[72px]" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Recurring">
            <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
              <option value="NONE">One-time</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client owner">
            <Select value={clientOwnerId} onChange={(e) => setClientOwnerId(e.target.value)}>
              <option value="">Unassigned</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Ironwood owner">
            <Select value={ironwoodOwnerId} onChange={(e) => setIronwoodOwnerId(e.target.value)}>
              <option value="">Unassigned</option>
              {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        {(existing || isIronwood) && (
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ActionStatus)}>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="WAITING_ON_CLIENT">Waiting on client</option>
              <option value="WAITING_ON_IRONWOOD">Waiting on Ironwood</option>
              <option value="COMPLETE">Complete</option>
              <option value="NOT_APPLICABLE">Not applicable</option>
            </Select>
          </Field>
        )}
        {error && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{error}</div>}
      </div>
    </Drawer>
  );
}

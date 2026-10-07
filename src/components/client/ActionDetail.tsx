"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Pencil, Radio, FileText } from "lucide-react";
import { formatISO } from "date-fns";
import { useSession } from "@/lib/hooks";
import { useStore, uid } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Card, DL, EmptyState, Avatar } from "@/components/ui/Primitives";
import { ActionStatusPill, DomainTag, PriorityPill, Pill } from "@/components/ui/Pill";
import { Textarea, Select, Field } from "@/components/ui/Form";
import { ActionForm } from "@/components/client/ActionForm";
import { dueLabel, fmtDateLong, fmtDateTime } from "@/lib/format";
import { DOMAIN_LABEL, type ActionStatus } from "@/lib/types";
import clsx from "clsx";

/**
 * Shared action detail used by both the client portal and the admin console.
 * `audience` controls copy and which status transitions are offered.
 */
export function ActionDetail({ actionId, audience, backHref, backLabel }: { actionId: string; audience: "CLIENT" | "IRONWOOD"; backHref: string; backLabel: string }) {
  const { user, canEdit, isIronwood } = useSession();
  const action = useStore((s) => s.actions).find((a) => a.id === actionId);
  const org = useStore((s) => s.organizations).find((o) => o.id === action?.orgId);
  const contacts = useStore((s) => s.contacts);
  const consultants = useStore((s) => s.consultants);
  const signals = useStore((s) => s.signals);
  const documents = useStore((s) => s.documents);
  const updateAction = useStore((s) => s.updateAction);
  const addNote = useStore((s) => s.addActionNote);
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  if (!action || !org) {
    return <EmptyState title="Action not found" action={<Link href={backHref} className="btn btn-secondary">{backLabel}</Link>} />;
  }

  const clientOwner = contacts.find((c) => c.id === action.clientOwnerId);
  const ironwoodOwner = consultants.find((c) => c.id === action.ironwoodOwnerId);
  const signal = signals.find((s) => s.id === action.signalId);
  const resources = documents.filter((d) => action.resourceIds.includes(d.id));
  const due = dueLabel(action.dueDate);
  const actorKind = isIronwood ? "IRONWOOD" : "CLIENT";

  const setStatus = (status: ActionStatus) => {
    updateAction(action.id, { status }, user.name, actorKind);
    toast(status === "COMPLETE" ? "Action completed" : "Status updated", action.title);
  };

  const submitNote = () => {
    if (!note.trim()) return;
    addNote(action.id, { id: uid("n"), authorId: user.id, authorName: user.name, text: note.trim(), createdAt: formatISO(new Date()) });
    setNote("");
    toast("Note added");
  };

  const clientTransitions: { label: string; status: ActionStatus; primary?: boolean }[] =
    action.status === "COMPLETE"
      ? [{ label: "Reopen", status: "IN_PROGRESS" }]
      : [
          ...(action.status !== "IN_PROGRESS" ? [{ label: "Start", status: "IN_PROGRESS" as ActionStatus }] : []),
          ...(action.status !== "WAITING_ON_IRONWOOD" ? [{ label: "Send to Ironwood", status: "WAITING_ON_IRONWOOD" as ActionStatus }] : []),
          { label: "Mark complete", status: "COMPLETE", primary: true },
        ];

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href={backHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <DomainTag domain={action.domain} />
              <ActionStatusPill status={action.status} audience={audience} />
              <PriorityPill priority={action.priority} size="md" />
              {action.recurrence !== "NONE" && <Pill tone="paper" size="md">Recurring · {action.recurrence.toLowerCase()}</Pill>}
            </div>
            <h1 className="text-[28px] sm:text-[34px] leading-[1.1] text-ink-900">{action.title}</h1>
            {audience === "IRONWOOD" && <div className="mt-2 text-[14px] text-ink-500">{org.name}</div>}
            <div className={clsx("mt-2 text-[14.5px] font-medium", due.tone === "overdue" ? "text-ember-600" : due.tone === "soon" ? "text-amber-600" : "text-ink-500")}>
              {due.text}{action.dueDate && due.tone !== "normal" ? ` · ${fmtDateLong(action.dueDate)}` : ""}
              {action.completedAt && <span className="text-sage-600"> · Completed {fmtDateLong(action.completedAt)}</span>}
            </div>
          </div>

          <Card>
            <div className="eyebrow mb-2">What needs to happen</div>
            <p className="text-[15.5px] leading-relaxed text-ink-800">{action.description}</p>
            {action.recommendedAction && (
              <div className="mt-4 rounded-lg bg-paper-100 px-4 py-3 text-[14.5px] text-ink-800">
                <span className="font-semibold">Recommended action:</span> {action.recommendedAction}
              </div>
            )}
          </Card>

          {canEdit && (
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                {clientTransitions.map((t) => (
                  <button key={t.status} onClick={() => setStatus(t.status)} className={clsx("btn", t.primary ? "btn-primary" : "btn-secondary")}>
                    {t.primary && <CheckCircle2 className="h-4 w-4" />}
                    {t.label}
                  </button>
                ))}
                {isIronwood && (
                  <div className="ml-auto flex items-center gap-2">
                    <Field label="" className="min-w-[200px]">
                      <Select value={action.status} onChange={(e) => setStatus(e.target.value as ActionStatus)}>
                        <option value="NEW">New</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="WAITING_ON_CLIENT">Waiting on client</option>
                        <option value="WAITING_ON_IRONWOOD">Waiting on Ironwood</option>
                        <option value="COMPLETE">Complete</option>
                        <option value="NOT_APPLICABLE">Not applicable</option>
                      </Select>
                    </Field>
                  </div>
                )}
                <button onClick={() => setEditOpen(true)} className="btn btn-ghost"><Pencil className="h-4 w-4" /> Edit</button>
              </div>
            </Card>
          )}

          <Card>
            <div className="eyebrow mb-3">Notes</div>
            {action.notes.length === 0 && <div className="text-[14px] text-ink-500 mb-3">No notes yet.</div>}
            <div className="space-y-3">
              {action.notes.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <Avatar name={n.authorName} size="sm" tone={consultants.some((c) => c.name === n.authorName) ? "ember" : "navy"} />
                  <div className="min-w-0 flex-1 rounded-lg bg-paper-100 px-3.5 py-2.5">
                    <div className="text-[12.5px] text-ink-500 mb-0.5">{n.authorName} · {fmtDateTime(n.createdAt)}</div>
                    <div className="text-[14.5px] text-ink-800 leading-relaxed">{n.text}</div>
                  </div>
                </div>
              ))}
            </div>
            {canEdit && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for your consultant or team…" className="min-h-[64px]" />
                <button onClick={submitNote} className="btn btn-secondary shrink-0">Add note</button>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <DL cols={1} items={[
              { label: "Client owner", value: clientOwner ? `${clientOwner.name} · ${clientOwner.title}` : "Unassigned" },
              { label: "Ironwood owner", value: ironwoodOwner ? `${ironwoodOwner.name} · ${ironwoodOwner.title}` : "Unassigned" },
              { label: "Service area", value: DOMAIN_LABEL[action.domain] },
              { label: "Created", value: fmtDateLong(action.createdAt) },
            ]} />
          </Card>
          {signal && (
            <Link href={audience === "IRONWOOD" ? `/admin/signals/${signal.id}` : `/app/signal/${signal.id}`} className="card p-4 block hover:border-ink-300 transition">
              <div className="eyebrow mb-1.5 flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" /> Originating Signal</div>
              <div className="text-[14.5px] font-semibold text-ink-900 leading-snug">{signal.title}</div>
              <div className="text-[12.5px] text-ink-500 mt-1">{signal.regulatoryBody} · {signal.jurisdiction}</div>
            </Link>
          )}
          <Card>
            <div className="eyebrow mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Resources</div>
            {resources.length ? (
              <ul className="space-y-2">
                {resources.map((d) => (
                  <li key={d.id}>
                    <Link href={audience === "IRONWOOD" ? `/admin/clients/${org.id}?tab=documents` : "/app/library"} className="text-[14px] font-medium text-navy-700 hover:text-ember-600">{d.title}</Link>
                    <div className="text-[12px] text-ink-500">v{d.version} · {d.fileName}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[13.5px] text-ink-500">No attached resources.</div>
            )}
          </Card>
        </aside>
      </div>

      {editOpen && <ActionForm open={editOpen} onClose={() => setEditOpen(false)} orgId={org.id} existing={action} signal={signal} />}
    </div>
  );
}

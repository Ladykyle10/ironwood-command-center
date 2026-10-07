"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock, Send, Plus, Eye } from "lucide-react";
import { formatISO } from "date-fns";
import { useStore, uid } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, DL, EmptyState, SectionTitle, Avatar } from "@/components/ui/Primitives";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { DomainTag, QuestionStatusPill, UrgencyPill } from "@/components/ui/Pill";
import { TriageCard } from "@/components/client/Triage";
import { QuestionThread } from "@/components/client/QuestionThread";
import { ActionForm } from "@/components/client/ActionForm";
import { fmtDateTime } from "@/lib/format";
import { DOMAIN_LABEL, type QuestionStatus } from "@/lib/types";

export default function QueueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, consultant } = useSession();
  const q = useStore((s) => s.questions).find((x) => x.id === id);
  const org = useStore((s) => s.organizations).find((o) => o.id === q?.orgId);
  const consultants = useStore((s) => s.consultants);
  const updateQuestion = useStore((s) => s.updateQuestion);
  const addInternalNote = useStore((s) => s.addInternalNote);
  const addResponse = useStore((s) => s.addResponse);
  const setViewingOrg = useStore((s) => s.setViewingOrg);
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [nextStatus, setNextStatus] = useState<QuestionStatus>("RESPONDED");
  const [actionOpen, setActionOpen] = useState(false);

  if (!q || !org) return <EmptyState title="Question not found" action={<Link href="/admin/queue" className="btn btn-secondary">Queue</Link>} />;

  const sendResponse = () => {
    if (!response.trim()) return;
    const c = consultant ?? consultants[0];
    addResponse(q.id, { id: uid("r"), consultantId: c.id, consultantName: user.name, text: response.trim(), createdAt: formatISO(new Date()) }, nextStatus);
    if (!q.assignedConsultantId && consultant) updateQuestion(q.id, { assignedConsultantId: consultant.id });
    setResponse("");
    toast("Response sent to client", `${org.name} was notified.`);
  };
  const saveNote = () => {
    if (!note.trim()) return;
    addInternalNote(q.id, { id: uid("in"), authorId: user.id, authorName: user.name, text: note.trim(), createdAt: formatISO(new Date()), internal: true });
    setNote("");
    toast("Internal note saved", "Not visible to the client.");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/admin/queue" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" /> Consultant queue</Link>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2"><DomainTag domain={q.domain} /><QuestionStatusPill status={q.status} /><UrgencyPill urgency={q.urgency} /></div>
          <h1 className="text-[24px] sm:text-[28px] leading-[1.15] text-ink-900">{q.text}</h1>
          <div className="mt-2 text-[14px] text-ink-500"><Link href={`/admin/clients/${org.id}`} className="font-semibold text-navy-700 hover:underline">{org.name}</Link> · {q.submittedByName} · {fmtDateTime(q.submittedAt)}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActionOpen(true)} className="btn btn-secondary"><Plus className="h-4 w-4" /> Create action</button>
          <Link href="/app/ask" onClick={() => setViewingOrg(org.id)} className="btn btn-ghost"><Eye className="h-4 w-4" /> View as client</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <QuestionThread question={q} allowReply={false} />

          <Card className="border-ember-200">
            <SectionTitle title="Respond to client" description="This is sent to the client and logged in their activity feed." />
            <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Write the client-facing response…" className="min-h-[140px]" />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <Field label="Set status to" className="sm:w-56">
                <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as QuestionStatus)}>
                  <option value="RESPONDED">Responded</option>
                  <option value="FOLLOW_UP_REQUIRED">Follow-up required</option>
                  <option value="CLOSED">Closed</option>
                </Select>
              </Field>
              <button onClick={sendResponse} disabled={!response.trim()} className="btn btn-primary"><Send className="h-4 w-4" /> Send response</button>
            </div>
          </Card>

          <Card className="bg-paper-50">
            <SectionTitle title={<span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-ink-400" /> Internal notes</span>} description="Visible to Ironwood only." />
            <div className="space-y-3">
              {q.internalNotes.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <Avatar name={n.authorName} size="sm" tone="ember" />
                  <div className="min-w-0 flex-1 rounded-lg bg-white border border-ink-100 px-3.5 py-2.5">
                    <div className="text-[12.5px] text-ink-500 mb-0.5">{n.authorName} · {fmtDateTime(n.createdAt)}</div>
                    <div className="text-[14px] text-ink-800 leading-relaxed">{n.text}</div>
                  </div>
                </div>
              ))}
              {q.internalNotes.length === 0 && <div className="text-[13.5px] text-ink-500">No internal notes yet.</div>}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" className="min-h-[64px]" />
              <button onClick={saveNote} disabled={!note.trim()} className="btn btn-secondary shrink-0">Save note</button>
            </div>
          </Card>

          <TriageCard triage={q.triage} />
        </div>

        <aside className="space-y-4">
          <Card>
            <SectionTitle title="Routing" />
            <div className="space-y-3">
              <Field label="Assigned consultant">
                <Select value={q.assignedConsultantId ?? ""} onChange={(e) => { updateQuestion(q.id, { assignedConsultantId: e.target.value || undefined, status: q.status === "NEW" && e.target.value ? "REVIEWING" : q.status }); toast("Assignment updated"); }}>
                  <option value="">Unassigned</option>
                  {consultants.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.title}</option>)}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={q.status} onChange={(e) => { updateQuestion(q.id, { status: e.target.value as QuestionStatus }); toast("Status updated"); }}>
                  <option value="NEW">New</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="RESPONDED">Responded</option>
                  <option value="FOLLOW_UP_REQUIRED">Follow-up required</option>
                  <option value="CLOSED">Closed</option>
                </Select>
              </Field>
              {q.status === "NEW" && <button onClick={() => { updateQuestion(q.id, { status: "REVIEWING", assignedConsultantId: q.assignedConsultantId ?? consultant?.id }); toast("You're reviewing this question"); }} className="btn btn-primary w-full">Start reviewing</button>}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Client snapshot" />
            <DL cols={1} items={[
              { label: "Industry", value: `${org.industry} · ${org.employeeCount} employees` },
              { label: "States", value: org.statesOfOperation.join(", ") },
              { label: `${DOMAIN_LABEL[q.domain]} service`, value: org.services[q.domain] === "ACTIVE" ? "Active" : org.services[q.domain] === "PROPOSED" ? "Proposed" : "Not active — opportunity" },
              { label: "Handbook", value: org.profile.hr.handbookStatus.replace("_", " ").toLowerCase() },
              { label: "DOT", value: org.profile.dot.regulated ? `${org.profile.dot.cdlDrivers} CDL drivers · ${org.profile.dot.fleetSize} vehicles` : "Not regulated" },
              { label: "Policies on file", value: org.profile.hr.policiesPresent.join(", ") || "None recorded" },
            ]} />
          </Card>
        </aside>
      </div>
      {actionOpen && <ActionForm open onClose={() => setActionOpen(false)} orgId={org.id} />}
    </div>
  );
}

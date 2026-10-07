"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, Plus, Pencil } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSession, useOrgData } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, EmptyState, SectionTitle, Tabs, Avatar, Drawer, Progress } from "@/components/ui/Primitives";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { ReadinessRing } from "@/components/ui/ReadinessRing";
import { DomainTag, MatchPill, Pill, QuestionStatusPill, ServicePill, UrgencyPill, WORK_META } from "@/components/ui/Pill";
import { ActionRow, ActivityList, DeadlineRow } from "@/components/client/Rows";
import { ActionForm } from "@/components/client/ActionForm";
import { DeadlineForm } from "@/components/client/DeadlineForm";
import { DocumentRow, DocumentForm } from "@/components/client/Documents";
import { ProfileEditor } from "@/components/client/ProfileEditor";
import { WorkForm, GapForm } from "@/components/admin/WorkForm";
import { ReadinessTrend } from "@/components/client/ReadinessTrend";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, DOMAIN_LABEL, ALL_DOMAINS, type MatchStatus, type SignalMatch, type WorkItem, type Document } from "@/lib/types";
import { isMonitored } from "@/lib/engine/readiness";
import { fmtDate, fmtDateTime } from "@/lib/format";

type Tab = "overview" | "profile" | "signals" | "actions" | "work" | "deadlines" | "documents" | "questions" | "activity";

function ClientDetailInner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useSession();
  const data = useOrgData(id);
  const signals = useStore((s) => s.signals);
  const consultants = useStore((s) => s.consultants);
  const setViewingOrg = useStore((s) => s.setViewingOrg);
  const overrideMatch = useStore((s) => s.overrideMatch);
  const updateOrganization = useStore((s) => s.updateOrganization);
  const completeDeadline = useStore((s) => s.completeDeadline);
  const resolveManualGap = useStore((s) => s.resolveManualGap);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "overview");
  const [actionOpen, setActionOpen] = useState(false);
  const [workEdit, setWorkEdit] = useState<WorkItem | "new" | null>(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [docEdit, setDocEdit] = useState<Document | "new" | null>(null);
  const [gapOpen, setGapOpen] = useState(false);
  const [override, setOverride] = useState<SignalMatch | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<MatchStatus>("HANDLING");
  const [overrideNote, setOverrideNote] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  if (!data) return <EmptyState title="Client not found" action={<Link href="/admin/clients" className="btn btn-secondary">All clients</Link>} />;
  const org = data.org;

  const viewAs = () => {
    setViewingOrg(org.id);
    router.push("/app");
  };

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "overview", label: "Overview" },
    { value: "profile", label: "Profile & services" },
    { value: "signals", label: "Signals", count: data.applies.length },
    { value: "actions", label: "Actions", count: data.openActions.length },
    { value: "work", label: "Ironwood work", count: data.activeWork.length },
    { value: "deadlines", label: "Deadlines", count: data.next30.length + data.overdueDeadlines.length },
    { value: "documents", label: "Documents", count: data.documents.length },
    { value: "questions", label: "Questions", count: data.questions.filter((q) => q.status !== "CLOSED").length },
    { value: "activity", label: "Activity" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" /> Clients</Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Pill tone={org.status === "ACTIVE" ? "sage" : org.status === "ONBOARDING" ? "amber" : "neutral"} dot size="sm">{org.status === "ACTIVE" ? "Active client" : org.status === "ONBOARDING" ? "Onboarding" : "Inactive"}</Pill>
            {ALL_DOMAINS.filter((d) => org.services[d] === "ACTIVE").map((d) => <DomainTag key={d} domain={d} />)}
          </div>
          <h1 className="text-[30px] sm:text-[36px] leading-[1.05] text-ink-900">{org.name}</h1>
          <div className="mt-2 text-[14.5px] text-ink-600">
            {org.industry} · {org.headquarters.city}, {org.headquarters.state} · <span className="font-semibold text-ink-800">{org.employeeCount} employees</span> · operates in <span className="font-semibold text-ink-800">{org.statesOfOperation.join(", ")}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAssignOpen(true)} className="btn btn-secondary"><Pencil className="h-4 w-4" /> Assign consultants</button>
          <button onClick={viewAs} className="btn btn-primary"><Eye className="h-4 w-4" /> View as client</button>
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {PRIMARY_DOMAINS.map((d) => {
              const r = data.readiness[d];
              return (
                <Card key={d} className="flex items-center gap-4 !p-4">
                  <ReadinessRing value={isMonitored(r) ? r.score : null} size={60} stroke={5} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink-900">{DOMAIN_SHORT[d]}</div>
                    <div className="text-[12px] text-ink-500">{isMonitored(r) ? `${r.requirementsMet}/${r.requirementsApplicable} requirements` : "Not monitored"}</div>
                    <ServicePill status={org.services[d]} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <SectionTitle title="Needs Ironwood's attention" />
              <ul className="space-y-2 text-[14px]">
                <Row label="Overdue actions" value={data.overdueActions.length} tone={data.overdueActions.length ? "ember" : "sage"} onClick={() => setTab("actions")} />
                <Row label="Open high-priority actions" value={data.openActions.filter((a) => a.priority === "CRITICAL" || a.priority === "HIGH").length} tone="amber" onClick={() => setTab("actions")} />
                <Row label="Waiting on Ironwood" value={data.openActions.filter((a) => a.status === "WAITING_ON_IRONWOOD").length} tone="steel" onClick={() => setTab("actions")} />
                <Row label="Open questions" value={data.questions.filter((q) => q.status === "NEW" || q.status === "REVIEWING" || q.status === "FOLLOW_UP_REQUIRED").length} tone="ember" onClick={() => setTab("questions")} />
                <Row label="Deadlines in the next 7 days" value={data.next7.length + data.overdueDeadlines.length} tone="amber" onClick={() => setTab("deadlines")} />
                <Row label="Signals that apply without an action" value={data.gaps.filter((g) => g.source === "SIGNAL").length} tone="amber" onClick={() => setTab("signals")} />
                <Row label="High-severity gaps" value={data.gaps.filter((g) => g.severity === "HIGH").length} tone="ember" />
              </ul>
            </Card>
            <Card>
              <SectionTitle title="Team" />
              <ul className="space-y-3">
                {data.consultants.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" tone="ember" />
                    <div><div className="text-[14px] font-medium text-ink-900">{c.name}</div><div className="text-[12px] text-ink-500">{c.title}</div></div>
                  </li>
                ))}
                {data.consultants.length === 0 && <li className="text-[13.5px] text-ink-500">No consultants assigned.</li>}
              </ul>
              <div className="hairline my-4" />
              <SectionTitle title="Contacts" />
              <ul className="space-y-2">
                {data.contacts.map((c) => (
                  <li key={c.id} className="text-[13.5px]"><span className="font-medium text-ink-900">{c.name}</span> <span className="text-ink-500">· {c.title}{c.isPrimary ? " · primary" : ""}</span></li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionTitle title="Readiness trend" />
              <ReadinessTrend history={data.history} current={data.readiness} height={200} />
            </Card>
            <Card>
              <SectionTitle title="Gaps & opportunities" count={data.gaps.length} action={<button onClick={() => setGapOpen(true)} className="btn btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Record gap</button>} />
              <ul className="divide-y divide-ink-100">
                {data.gaps.slice(0, 6).map((g) => (
                  <li key={g.id} className="py-2.5 flex items-start gap-3">
                    <DomainTag domain={g.domain} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{g.title}</div>
                      <div className="text-[12.5px] text-ink-500">{g.serviceActive ? g.recommendation : `Outside active services — ${DOMAIN_LABEL[g.domain]} opportunity`}</div>
                    </div>
                    <Pill tone={g.severity === "HIGH" ? "ember" : g.severity === "MEDIUM" ? "amber" : "neutral"} size="sm">{g.severity.toLowerCase()}</Pill>
                    {g.source === "MANUAL" && <button onClick={() => { resolveManualGap(g.id); toast("Gap resolved"); }} className="text-[12px] font-semibold text-navy-700 hover:text-ember-600">Resolve</button>}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === "profile" && <ProfileEditor org={org} canEdit mode="IRONWOOD" />}

      {tab === "signals" && (
        <div className="space-y-4">
          <p className="text-[14px] text-ink-600">Every published Signal evaluated against this client&apos;s profile. Override a status to mark work Ironwood is handling, or to suppress a match.</p>
          <Card padded={false} className="divide-y divide-ink-100">
            {data.matches
              .map((m) => ({ m, s: signals.find((x) => x.id === m.signalId)! }))
              .sort((a, b) => order(a.m.status) - order(b.m.status))
              .map(({ m, s }) => (
                <div key={m.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <DomainTag domain={s.domain} />
                      <span className="text-[12.5px] text-ink-500">{s.regulatoryBody} · {s.jurisdiction}</span>
                      {m.acknowledgedAt && <span className="text-[11.5px] text-sage-600 font-medium">Reviewed by client</span>}
                    </div>
                    <Link href={`/admin/signals/${s.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-navy-700">{s.title}</Link>
                    <div className="mt-1 text-[13px] text-ink-500">
                      {m.status === "NO_ACTION" ? "Profile does not match." : <>Because: {m.reasons.join("; ")}</>}
                      {m.overrideNote && <span className="text-steel-700"> · Override: {m.overrideNote}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <MatchPill status={m.status} size="sm" />
                    <button onClick={() => { setOverride(m); setOverrideStatus(m.status === "HANDLING" ? "APPLIES" : "HANDLING"); setOverrideNote(m.overrideNote ?? ""); }} className="btn btn-ghost btn-sm">Override</button>
                  </div>
                </div>
              ))}
            {data.matches.length === 0 && <div className="px-5 py-8 text-center text-[14px] text-ink-500">No published Signals yet.</div>}
          </Card>
        </div>
      )}

      {tab === "actions" && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setActionOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> New action</button></div>
          {data.actions.length === 0 ? (
            <EmptyState title="No actions yet" body="Create an action from a Signal or add one here." />
          ) : (
            <Card padded={false} className="divide-y divide-ink-100">
              {[...data.actions].sort((a, b) => (a.status === "COMPLETE" ? 1 : 0) - (b.status === "COMPLETE" ? 1 : 0) || (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9")).map((a) => (
                <ActionRow key={a.id} action={a} href={`/admin/actions/${a.id}`} audience="IRONWOOD" />
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "work" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink-600">What the client sees under “Ironwood is handling”. Keep progress current — it is the most visible proof of value.</p>
            <button onClick={() => setWorkEdit("new")} className="btn btn-primary shrink-0"><Plus className="h-4 w-4" /> Log work</button>
          </div>
          {data.workItems.length === 0 ? (
            <EmptyState title="No work logged" body="Log the work Ironwood is doing so the client can see it." />
          ) : (
            <Card padded={false} className="divide-y divide-ink-100">
              {data.workItems.map((w) => {
                const c = consultants.find((x) => x.id === w.consultantId);
                const meta = WORK_META[w.status];
                return (
                  <div key={w.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1"><DomainTag domain={w.domain} /><Pill tone={meta.tone} size="sm">{w.statusLabel}</Pill></div>
                      <div className="text-[15px] font-semibold text-ink-900">{w.title}</div>
                      <div className="text-[13px] text-ink-500">{w.summary}</div>
                      <div className="text-[12px] text-ink-400 mt-1">{c?.name} · started {fmtDate(w.startedAt)}{w.targetDate ? ` · target ${fmtDate(w.targetDate)}` : ""}{w.completedAt ? ` · completed ${fmtDate(w.completedAt)}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-3 sm:w-56">
                      <Progress value={w.progress} tone={w.status === "COMPLETE" ? "sage" : "steel"} className="flex-1" />
                      <span className="tabular text-[12px] font-semibold text-ink-600 w-9 text-right">{w.progress}%</span>
                      <button onClick={() => setWorkEdit(w)} className="btn btn-ghost btn-sm">Update</button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {tab === "deadlines" && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setDeadlineOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> Add deadline</button></div>
          <Card padded={false} className="divide-y divide-ink-100">
            {[...data.overdueDeadlines, ...data.next7, ...data.next30, ...data.next90, ...data.upcomingDeadlines.filter((d) => !data.overdueDeadlines.includes(d) && !data.next7.includes(d) && !data.next30.includes(d) && !data.next90.includes(d))].map((d) => (
              <DeadlineRow key={d.id} deadline={d} canEdit actionHref={d.relatedActionId ? `/admin/actions/${d.relatedActionId}` : undefined} onComplete={() => { completeDeadline(d.id, user.name); toast("Marked complete", d.title); }} />
            ))}
            {data.upcomingDeadlines.length === 0 && <div className="px-5 py-8 text-center text-[14px] text-ink-500">No upcoming deadlines.</div>}
          </Card>
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setDocEdit("new")} className="btn btn-primary"><Plus className="h-4 w-4" /> Add document</button></div>
          {data.documents.length === 0 ? (
            <EmptyState title="No documents" body="Attach policies, forms, programs and Ironwood resources." />
          ) : (
            <Card padded={false} className="divide-y divide-ink-100">
              {data.documents.map((d) => <DocumentRow key={d.id} doc={d} onEdit={setDocEdit} />)}
            </Card>
          )}
        </div>
      )}

      {tab === "questions" && (
        <Card padded={false} className="divide-y divide-ink-100">
          {data.questions.map((q) => (
            <Link key={q.id} href={`/admin/queue/${q.id}`} className="flex gap-4 px-5 py-4 hover:bg-paper-50 transition">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1"><DomainTag domain={q.domain} /><UrgencyPill urgency={q.urgency} /><span className="text-[12px] text-ink-500">{q.submittedByName} · {fmtDateTime(q.submittedAt)}</span></div>
                <div className="text-[14.5px] text-ink-900 line-clamp-2">{q.text}</div>
              </div>
              <QuestionStatusPill status={q.status} size="sm" />
            </Link>
          ))}
          {data.questions.length === 0 && <div className="px-5 py-8 text-center text-[14px] text-ink-500">No questions from this client yet.</div>}
        </Card>
      )}

      {tab === "activity" && (
        <Card>
          {data.activity.length ? <ActivityList events={data.activity} /> : <EmptyState compact title="No activity yet" />}
        </Card>
      )}

      {/* Drawers */}
      {actionOpen && <ActionForm open onClose={() => setActionOpen(false)} orgId={org.id} />}
      {workEdit && <WorkForm open onClose={() => setWorkEdit(null)} orgId={org.id} existing={workEdit === "new" ? undefined : workEdit} />}
      {deadlineOpen && <DeadlineForm open onClose={() => setDeadlineOpen(false)} orgId={org.id} />}
      {docEdit && <DocumentForm open onClose={() => setDocEdit(null)} orgId={org.id} existing={docEdit === "new" ? undefined : docEdit} />}
      {gapOpen && <GapForm open onClose={() => setGapOpen(false)} orgId={org.id} />}

      <Drawer open={!!override} onClose={() => setOverride(null)} title="Override Signal status" footer={<><button className="btn btn-secondary" onClick={() => setOverride(null)}>Cancel</button><button className="btn btn-primary" onClick={() => { if (!override) return; overrideMatch(override.id, overrideStatus, overrideNote.trim(), user.id); toast("Status overridden", "The client sees the new status and your note."); setOverride(null); }}>Save override</button></>}>
        {override && (
          <div className="space-y-4">
            <div className="text-[14px] text-ink-700">{signals.find((s) => s.id === override.signalId)?.title}</div>
            <Field label="Status for this client">
              <Select value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value as MatchStatus)}>
                <option value="HANDLING">Ironwood handling</option>
                <option value="APPLIES">Applies to you</option>
                <option value="WATCH">Watch</option>
                <option value="NO_ACTION">No action required</option>
              </Select>
            </Field>
            <Field label="Note shown to the client" hint="e.g. “Annual queries scheduled by Ironwood DOT.”"><Textarea value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} /></Field>
            <div className="text-[12.5px] text-ink-500">Overrides persist through re-evaluation until cleared.</div>
          </div>
        )}
      </Drawer>

      <Drawer open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign consultants" footer={<button className="btn btn-primary" onClick={() => setAssignOpen(false)}>Done</button>}>
        <div className="space-y-1">
          {consultants.map((c) => {
            const on = org.assignedConsultantIds.includes(c.id);
            return (
              <label key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-paper-100 cursor-pointer">
                <input type="checkbox" checked={on} onChange={(e) => updateOrganization(org.id, { assignedConsultantIds: e.target.checked ? [...org.assignedConsultantIds, c.id] : org.assignedConsultantIds.filter((x) => x !== c.id) })} className="h-4 w-4 accent-[#0b1526]" />
                <Avatar name={c.name} size="sm" tone="ember" />
                <span><span className="block text-[14px] font-medium text-ink-900">{c.name}</span><span className="block text-[12px] text-ink-500">{c.title} · {c.domains.map((d) => DOMAIN_SHORT[d]).join(", ")}</span></span>
              </label>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}

function Row({ label, value, tone, onClick }: { label: string; value: number; tone: "ember" | "amber" | "sage" | "steel"; onClick?: () => void }) {
  const color = value === 0 ? "text-sage-600" : { ember: "text-ember-600", amber: "text-amber-600", sage: "text-sage-600", steel: "text-steel-600" }[tone];
  const inner = (
    <>
      <span className="text-ink-800">{label}</span>
      <span className={`tabular font-display text-[20px] ${color}`}>{value}</span>
    </>
  );
  return onClick ? (
    <li><button onClick={onClick} className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-paper-100 transition text-left">{inner}</button></li>
  ) : (
    <li className="flex items-center justify-between px-3 py-2">{inner}</li>
  );
}

const order = (s: MatchStatus) => ({ APPLIES: 0, WATCH: 1, HANDLING: 2, NO_ACTION: 3 })[s];

export default function ClientDetailPage() {
  return (
    <Suspense fallback={null}>
      <ClientDetailInner />
    </Suspense>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Radio, Send, Archive, Trash2, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { format, formatISO } from "date-fns";
import { useStore, uid } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, SectionTitle, Drawer } from "@/components/ui/Primitives";
import { Field, Input, Select, Textarea, Toggle, ChipSelect } from "@/components/ui/Form";
import { DemoTag, MatchPill, Pill } from "@/components/ui/Pill";
import { RuleBuilder } from "@/components/admin/RuleBuilder";
import { ALL_DOMAINS, DOMAIN_LABEL, type Domain, type RuleSet, type Signal, type Urgency } from "@/lib/types";
import { INDUSTRIES, US_STATES, STATE_NAME } from "@/lib/engine/fields";
import { evaluateSignalForOrg, emptyRuleSet, conditionToSentence } from "@/lib/engine/rules";

const BODIES = ["OSHA", "FMCSA", "USCIS", "EEOC", "DOL / Wage & Hour", "OFCCP", "IRS", "Texas Workforce Commission", "Nevada OSHA", "Missouri Department of Labor", "Cal/OSHA", "State agency", "Customer requirement", "Other"];
const JURISDICTIONS = ["Federal", ...US_STATES.map((s) => STATE_NAME[s]), "Customer requirement"];

export function SignalEditor({ existing }: { existing?: Signal }) {
  const { user } = useSession();
  const organizations = useStore((s) => s.organizations);
  const matches = useStore((s) => s.matches);
  const saveSignal = useStore((s) => s.saveSignal);
  const publishSignal = useStore((s) => s.publishSignal);
  const unpublishSignal = useStore((s) => s.unpublishSignal);
  const archiveSignal = useStore((s) => s.archiveSignal);
  const deleteSignal = useStore((s) => s.deleteSignal);
  const { toast } = useToast();
  const router = useRouter();

  const [s, setS] = useState<Signal>(
    existing ?? {
      id: uid("sig"),
      title: "",
      domain: "HR",
      jurisdiction: "Federal",
      regulatoryBody: "OSHA",
      publishedDate: format(new Date(), "yyyy-MM-dd"),
      effectiveDate: "",
      summary: "",
      affectedIndustries: ["All industries"],
      affectedCharacteristics: [],
      applies: emptyRuleSet(),
      watch: undefined,
      recommendedAction: "",
      urgency: "MEDIUM",
      sourceUrl: "",
      sourceLabel: "",
      commentary: "",
      status: "DRAFT",
      isDemo: true,
      createdAt: formatISO(new Date()),
      createdBy: user.id,
    },
  );
  const [useWatch, setUseWatch] = useState(!!existing?.watch?.conditions.length);
  const [confirm, setConfirm] = useState<"publish" | "delete" | null>(null);
  const [error, setError] = useState("");

  const set = <K extends keyof Signal>(k: K, v: Signal[K]) => setS((x) => ({ ...x, [k]: v }));

  // Live preview: which clients would match with the current rules.
  const preview = useMemo(
    () =>
      organizations
        .filter((o) => o.status !== "INACTIVE")
        .map((o) => {
          const v = evaluateSignalForOrg({ ...s, watch: useWatch ? s.watch : undefined }, o);
          const existingMatch = matches.find((m) => m.signalId === s.id && m.orgId === o.id);
          return { org: o, verdict: v, override: existingMatch?.overrideBy ? existingMatch.status : undefined };
        }),
    [organizations, s, useWatch, matches],
  );
  const appliesCount = preview.filter((p) => p.verdict.status === "APPLIES").length;
  const watchCount = preview.filter((p) => p.verdict.status === "WATCH").length;

  const validate = () => {
    if (!s.title.trim()) return "Add a title.";
    if (!s.summary.trim()) return "Add a summary.";
    if (!s.recommendedAction.trim()) return "Add a recommended action.";
    if (s.applies.conditions.length === 0) return "Add at least one applicability condition.";
    if (s.sourceUrl && !/^https?:\/\//i.test(s.sourceUrl)) return "Source link must start with http:// or https://.";
    return "";
  };

  const persist = (): Signal => {
    const clean: Signal = { ...s, watch: useWatch && s.watch?.conditions.length ? s.watch : undefined, effectiveDate: s.effectiveDate || undefined, sourceUrl: s.sourceUrl || undefined, sourceLabel: s.sourceLabel || undefined };
    saveSignal(clean);
    return clean;
  };

  const saveDraft = () => {
    if (!s.title.trim()) return setError("Add a title before saving.");
    setError("");
    const saved = persist();
    toast(saved.status === "PUBLISHED" ? "Signal updated" : "Draft saved", saved.title);
    if (saved.status === "PUBLISHED") publishSignal(saved.id, user.id); // re-evaluate with new rules
    if (!existing) router.replace(`/admin/signals/${saved.id}`);
  };

  const publish = () => {
    const err = validate();
    if (err) { setError(err); setConfirm(null); return; }
    setError("");
    const saved = persist();
    publishSignal(saved.id, user.id);
    setS((x) => ({ ...x, status: "PUBLISHED", publishedAt: formatISO(new Date()) }));
    setConfirm(null);
    toast("Signal published", `Evaluated against ${preview.length} clients — applies to ${appliesCount}, watch for ${watchCount}.`);
    if (!existing) router.replace(`/admin/signals/${saved.id}`);
  };

  const isPublished = s.status === "PUBLISHED";

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/admin/signals" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" /> Signals</Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Pill tone={isPublished ? "sage" : s.status === "ARCHIVED" ? "neutral" : "amber"} dot size="sm">{isPublished ? "Published" : s.status === "ARCHIVED" ? "Archived" : "Draft"}</Pill>
            {s.isDemo && <DemoTag />}
          </div>
          <h1 className="text-[28px] sm:text-[34px] leading-[1.1] text-ink-900">{existing ? (s.title || "Untitled Signal") : "New Signal"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPublished && <button onClick={() => { unpublishSignal(s.id); setS((x) => ({ ...x, status: "DRAFT", publishedAt: undefined })); toast("Signal unpublished", "Removed from client portals."); }} className="btn btn-secondary"><EyeOff className="h-4 w-4" /> Unpublish</button>}
          {existing && s.status !== "ARCHIVED" && <button onClick={() => { archiveSignal(s.id); setS((x) => ({ ...x, status: "ARCHIVED" })); toast("Signal archived"); }} className="btn btn-ghost"><Archive className="h-4 w-4" /> Archive</button>}
          {existing && <button onClick={() => setConfirm("delete")} className="btn btn-ghost text-ember-600"><Trash2 className="h-4 w-4" /></button>}
          <button onClick={saveDraft} className="btn btn-secondary">{isPublished ? "Save & re-evaluate" : "Save draft"}</button>
          {!isPublished && <button onClick={() => setConfirm("publish")} className="btn btn-primary"><Send className="h-4 w-4" /> Publish</button>}
        </div>
      </div>

      {error && <div className="rounded-lg bg-ember-50 border border-ember-200 px-4 py-2.5 text-[13.5px] text-ember-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle title="Development" />
            <div className="space-y-4">
              <Field label="Title" required><Input value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Texas: harassment prevention policy and training review" /></Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Service area"><Select value={s.domain} onChange={(e) => set("domain", e.target.value as Domain)}>{ALL_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}</Select></Field>
                <Field label="Jurisdiction"><Select value={s.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)}>{JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}</Select></Field>
                <Field label="Regulatory body"><Select value={s.regulatoryBody} onChange={(e) => set("regulatoryBody", e.target.value)}>{[...BODIES, ...(BODIES.includes(s.regulatoryBody) ? [] : [s.regulatoryBody])].map((b) => <option key={b}>{b}</option>)}</Select></Field>
                <Field label="Urgency"><Select value={s.urgency} onChange={(e) => set("urgency", e.target.value as Urgency)}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="INFO">Informational</option></Select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Publication date"><Input type="date" value={s.publishedDate} onChange={(e) => set("publishedDate", e.target.value)} /></Field>
                <Field label="Effective date"><Input type="date" value={s.effectiveDate ?? ""} onChange={(e) => set("effectiveDate", e.target.value)} /></Field>
              </div>
              <Field label="Summary" required hint="What changed, in plain business language."><Textarea value={s.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
              <Field label="Recommended action" required><Textarea value={s.recommendedAction} onChange={(e) => set("recommendedAction", e.target.value)} className="min-h-[72px]" /></Field>
              <Field label="Ironwood commentary" hint="Your professional read. Shown prominently to clients."><Textarea value={s.commentary} onChange={(e) => set("commentary", e.target.value)} className="min-h-[72px]" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source link"><Input value={s.sourceUrl ?? ""} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://" /></Field>
                <Field label="Source label"><Input value={s.sourceLabel ?? ""} onChange={(e) => set("sourceLabel", e.target.value)} placeholder="e.g. OSHA Recordkeeping" /></Field>
              </div>
              <Field label="Affected industries"><ChipSelect options={["All industries", ...INDUSTRIES]} value={s.affectedIndustries} onChange={(v) => set("affectedIndustries", v)} /></Field>
              <Field label="Affected company characteristics" hint="Descriptive tags — applicability is decided by the rules below."><ChipSelect options={["DOT-regulated", "Employs CDL drivers", "Federal contractor", "15 or more employees", "50 or more employees", "Texas employees", "Operates in Nevada", "Maintains contractor portals", "OSHA recordkeeping required"]} value={s.affectedCharacteristics} onChange={(v) => set("affectedCharacteristics", v)} allowCustom /></Field>
              <Toggle checked={s.isDemo} onChange={(v) => set("isDemo", v)} label="Demo data — verify before client use" description="Shows a verification banner on the client side. Turn off once a consultant has verified the content." />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Applicability" description="Rules are evaluated against each client's profile when you publish, and again whenever a profile changes." />
            <div className="space-y-4">
              <RuleBuilder label="Applies to you" value={s.applies} onChange={(v) => set("applies", v)} hint="Required" />
              <Toggle checked={useWatch} onChange={(v) => { setUseWatch(v); if (v && !s.watch) set("watch", emptyRuleSet()); }} label="Add a broader “Watch” rule" description="Clients that match Watch but not Applies see the Signal as something to keep an eye on." />
              {useWatch && <RuleBuilder label="Watch" value={s.watch ?? emptyRuleSet()} onChange={(v) => set("watch", v)} tone="amber" />}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <SectionTitle title="Who this reaches" description="Live preview from current rules" />
            <div className="flex gap-2 mb-3">
              <Pill tone="ember" size="sm">{appliesCount} applies</Pill>
              <Pill tone="amber" size="sm">{watchCount} watch</Pill>
              <Pill tone="sage" size="sm">{preview.length - appliesCount - watchCount} no action</Pill>
            </div>
            <ul className="divide-y divide-ink-100">
              {preview.map(({ org, verdict, override }) => (
                <li key={org.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium text-ink-900 truncate">{org.name}</span>
                    <MatchPill status={override ?? verdict.status} size="sm" />
                  </div>
                  {verdict.status !== "NO_ACTION" && (
                    <ul className="mt-1 space-y-0.5">
                      {verdict.reasons.map((r) => <li key={r} className="flex gap-1.5 text-[12px] text-ink-500"><Check className="h-3 w-3 mt-0.5 text-sage-600 shrink-0" />{r}</li>)}
                    </ul>
                  )}
                  {override && <div className="text-[11.5px] text-steel-700 mt-0.5">Consultant override in place</div>}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="eyebrow mb-2 flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" /> Rule summary</div>
            <div className="text-[13px] text-ink-700 leading-relaxed">
              <span className="font-semibold">Applies</span> when {s.applies.match === "ALL" ? "all" : "any"} of:
              <ul className="list-disc pl-4 mt-1 space-y-0.5">{s.applies.conditions.map((c, i) => <li key={i}>{conditionToSentence(c)}</li>)}</ul>
              {useWatch && s.watch?.conditions.length ? (
                <>
                  <div className="mt-2"><span className="font-semibold">Watch</span> when {s.watch.match === "ALL" ? "all" : "any"} of:</div>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">{s.watch.conditions.map((c, i) => <li key={i}>{conditionToSentence(c)}</li>)}</ul>
                </>
              ) : null}
            </div>
          </Card>
          {existing && isPublished && (
            <Link href={`/app/signal/${s.id}`} className="btn btn-secondary w-full"><Eye className="h-4 w-4" /> Preview in client portal</Link>
          )}
        </aside>
      </div>

      <Drawer open={confirm === "publish"} onClose={() => setConfirm(null)} title="Publish this Signal?" footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn btn-primary" onClick={publish}><Send className="h-4 w-4" /> Publish now</button></>}>
        <div className="space-y-3 text-[14px] text-ink-700">
          <p>Publishing evaluates the rules against every active client and updates their portals immediately.</p>
          <ul className="space-y-1.5">
            {preview.map(({ org, verdict, override }) => (
              <li key={org.id} className={clsx("flex items-center justify-between rounded-lg px-3 py-2", (override ?? verdict.status) === "NO_ACTION" ? "bg-paper-100" : "bg-ember-50/60")}>
                <span className="font-medium">{org.name}</span>
                <MatchPill status={override ?? verdict.status} size="sm" />
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-ink-500">Clients with Applies or Watch receive an in-app notification and an activity entry.</p>
        </div>
      </Drawer>

      <Drawer open={confirm === "delete"} onClose={() => setConfirm(null)} title="Delete this Signal?" footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn btn-accent" onClick={() => { deleteSignal(s.id); toast("Signal deleted"); router.push("/admin/signals"); }}>Delete</button></>}>
        <p className="text-[14px] text-ink-700">This removes the Signal and its client evaluations. Actions already created from it are kept.</p>
      </Drawer>
    </div>
  );
}

export type { RuleSet };

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Check, Plus } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { Card, DL, EmptyState, SectionTitle } from "@/components/ui/Primitives";
import { DemoTag, DomainTag, MatchPill, UrgencyPill, MATCH_META } from "@/components/ui/Pill";
import { ActionRow } from "@/components/client/Rows";
import { ActionForm } from "@/components/client/ActionForm";
import { fmtDateLong } from "@/lib/format";
import { DOMAIN_LABEL } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import clsx from "clsx";

export default function SignalDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeOrgId, canEdit } = useSession();
  const data = useOrgData(activeOrgId);
  const signal = useStore((s) => s.signals).find((x) => x.id === id);
  const acknowledge = useStore((s) => s.acknowledgeMatch);
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);

  if (!data) return null;
  if (!signal || signal.status !== "PUBLISHED") {
    return <EmptyState title="Signal not available" body="This Signal is not published or does not exist." action={<Link href="/app/signal" className="btn btn-secondary">Back to Signal</Link>} />;
  }
  const match = data.matches.find((m) => m.signalId === signal.id);
  const related = data.actions.filter((a) => a.signalId === signal.id);
  const meta = match ? MATCH_META[match.status] : undefined;
  const serviceActive = data.org.services[signal.domain] === "ACTIVE";

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/app/signal" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Ironwood Signal
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <DomainTag domain={signal.domain} />
              {match && <MatchPill status={match.status} />}
              <UrgencyPill urgency={signal.urgency} />
              {signal.isDemo && <DemoTag />}
            </div>
            <h1 className="text-[28px] sm:text-[34px] leading-[1.1] text-ink-900">{signal.title}</h1>
            <div className="mt-2 text-[14px] text-ink-500">
              {signal.regulatoryBody} · {signal.jurisdiction} · Published {fmtDateLong(signal.publishedDate)}
              {signal.effectiveDate && <> · Effective {fmtDateLong(signal.effectiveDate)}</>}
            </div>
          </div>

          <Card>
            <div className="eyebrow mb-2">Summary</div>
            <p className="text-[15.5px] leading-relaxed text-ink-800">{signal.summary}</p>
            <div className="hairline my-5" />
            <div className="eyebrow mb-2">Recommended action</div>
            <p className="text-[15.5px] leading-relaxed text-ink-800">{signal.recommendedAction}</p>
            {signal.sourceUrl && (
              <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-navy-700 hover:text-ember-600">
                {signal.sourceLabel ?? "Source"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </Card>

          <div className="rounded-[var(--radius-card)] bg-navy-900 text-paper-100 p-5 sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ember-300 mb-2">Ironwood commentary</div>
            <p className="font-display text-[19px] leading-relaxed">{signal.commentary}</p>
          </div>

          <Card>
            <DL
              cols={2}
              items={[
                { label: "Service area", value: DOMAIN_LABEL[signal.domain] },
                { label: "Regulatory body", value: signal.regulatoryBody },
                { label: "Affected industries", value: signal.affectedIndustries.join(", ") },
                { label: "Affected characteristics", value: signal.affectedCharacteristics.join(", ") },
              ]}
            />
          </Card>

          <section>
            <SectionTitle
              title="Actions from this Signal"
              count={related.length}
              action={canEdit && serviceActive ? <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Create action</button> : undefined}
            />
            {related.length ? (
              <Card padded={false} className="divide-y divide-ink-100">
                {related.map((a) => <ActionRow key={a.id} action={a} />)}
              </Card>
            ) : (
              <EmptyState compact title="No actions yet" body={match?.status === "APPLIES" ? "Create an action to track what needs to happen." : "No follow-up is needed for this Signal."} />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {match && (
            <Card className={clsx("border-2", match.status === "APPLIES" ? "border-ember-200" : match.status === "WATCH" ? "border-amber-200" : match.status === "HANDLING" ? "border-steel-200" : "border-sage-200")}>
              <div className="eyebrow mb-2">Why am I seeing this?</div>
              <div className="font-display text-[20px] text-ink-900 mb-3">{meta?.label}</div>
              {match.status === "NO_ACTION" ? (
                <p className="text-[14px] text-ink-600 leading-relaxed">Ironwood reviewed this update and it does not match your company profile. No action is required.</p>
              ) : (
                <>
                  <p className="text-[14px] text-ink-600 mb-2">This update is being shown because your organization:</p>
                  <ul className="space-y-1.5">
                    {match.reasons.map((r) => (
                      <li key={r} className="flex gap-2 text-[14px] text-ink-800">
                        <Check className="h-4 w-4 shrink-0 text-sage-600 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {match.overrideNote && (
                <div className="mt-3 rounded-lg bg-steel-50 px-3 py-2.5 text-[13px] text-steel-700">
                  <span className="font-semibold">Ironwood note:</span> {match.overrideNote}
                </div>
              )}
              {!serviceActive && match.status !== "NO_ACTION" && (
                <div className="mt-3 rounded-lg bg-paper-200 px-3 py-2.5 text-[13px] text-ink-700">
                  This falls under {DOMAIN_LABEL[signal.domain]}, which is not currently included in your active Ironwood services.{" "}
                  <Link href="/app/services" className="font-semibold text-navy-700 hover:underline">Request help</Link>
                </div>
              )}
              {canEdit && !match.acknowledgedAt && match.status !== "NO_ACTION" && (
                <button
                  onClick={() => {
                    acknowledge(match.id);
                    toast("Marked as reviewed");
                  }}
                  className="btn btn-secondary w-full mt-4"
                >
                  Mark as reviewed
                </button>
              )}
              {match.acknowledgedAt && <div className="mt-4 text-[12.5px] text-sage-600 font-medium">Reviewed by your team.</div>}
            </Card>
          )}
          <Card>
            <div className="eyebrow mb-2">Your profile at a glance</div>
            <DL cols={1} items={[
              { label: "Industry", value: data.org.industry },
              { label: "Employees", value: data.org.employeeCount },
              { label: "States", value: data.org.statesOfOperation.join(", ") },
              { label: `${DOMAIN_LABEL[signal.domain]} service`, value: serviceActive ? "Active" : "Not active" },
            ]} />
          </Card>
        </aside>
      </div>

      {formOpen && <ActionForm open={formOpen} onClose={() => setFormOpen(false)} orgId={data.org.id} signal={signal} />}
    </div>
  );
}

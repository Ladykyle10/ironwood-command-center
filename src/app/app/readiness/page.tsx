"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Check, Minus, X } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader, Card, SectionTitle } from "@/components/ui/Primitives";
import { ReadinessRing } from "@/components/ui/ReadinessRing";
import { ReadinessTrend } from "@/components/client/ReadinessTrend";
import { PRIMARY_DOMAINS, DOMAIN_LABEL, DOMAIN_SHORT, type Domain } from "@/lib/types";
import { isMonitored, readinessTone } from "@/lib/engine/readiness";
import { Pill } from "@/components/ui/Pill";

function ReadinessInner() {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const params = useSearchParams();
  const initial = (params.get("domain") as Domain) || "HR";
  const [domain, setDomain] = useState<Domain>(PRIMARY_DOMAINS.includes(initial) ? initial : "HR");
  if (!data) return null;

  const r = data.readiness[domain];
  const monitored = isMonitored(r);
  const met = r.lines.filter((l) => l.kind === "requirement_met");
  const unmet = r.lines.filter((l) => l.kind === "requirement_unmet");
  const penalties = r.lines.filter((l) => l.kind === "penalty");
  const tone = readinessTone(r.score);

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        eyebrow="Program Readiness"
        title={<>Overall readiness: <span className={clsx("tabular", { good: "text-sage-600", fair: "text-amber-600", low: "text-ember-600" }[readinessTone(data.overall)])}>{data.overall}%</span></>}
        description="An internal completion indicator based on the requirements Ironwood has configured for your profile, open actions, upcoming deadlines and document reviews. It is not a legal risk measurement. Select a domain to see exactly how its score is calculated."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRIMARY_DOMAINS.map((d) => {
          const x = data.readiness[d];
          const active = d === domain;
          const mon = isMonitored(x);
          return (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={clsx("card flex flex-col items-center px-3 py-4 transition text-center", active ? "border-navy-900 ring-2 ring-navy-900/10" : "hover:border-ink-300")}
            >
              <ReadinessRing value={mon ? x.score : null} size={76} />
              <div className="mt-2 text-[13px] font-semibold text-ink-900">{DOMAIN_SHORT[d]}</div>
              <div className="text-[11.5px] text-ink-500">{mon ? `${x.requirementsMet}/${x.requirementsApplicable} requirements met` : "Not monitored"}</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionTitle
            title={<>How {DOMAIN_SHORT[domain]} is calculated</>}
            description={monitored ? (r.serviceActive ? `${DOMAIN_LABEL[domain]} is an active Ironwood service.` : `${DOMAIN_LABEL[domain]} is not an active Ironwood service, but your profile triggers requirements in this area.`) : `No requirements apply to ${DOMAIN_LABEL[domain]} based on your profile, and it is not an active service.`}
          />
          {monitored ? (
            <div className="space-y-5">
              <div className="flex items-baseline justify-between rounded-lg bg-paper-100 px-4 py-3">
                <span className="text-[14px] font-semibold text-ink-800">Starting point</span>
                <span className="tabular font-display text-[22px] text-ink-900">100</span>
              </div>

              {unmet.length > 0 && (
                <div>
                  <div className="eyebrow mb-2">Requirements not yet met</div>
                  <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
                    {unmet.map((l) => (
                      <li key={l.label} className="flex items-start gap-3 px-4 py-3">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-medium text-ink-900">{l.label}</div>
                          <div className="text-[13px] text-ink-500">{l.detail}</div>
                        </div>
                        <span className="tabular text-[14px] font-semibold text-ember-600">{l.points}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {penalties.length > 0 && (
                <div>
                  <div className="eyebrow mb-2">Open work affecting the score</div>
                  <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
                    {penalties.map((l) => (
                      <li key={l.label} className="flex items-start gap-3 px-4 py-3">
                        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-medium text-ink-900">{l.label}</div>
                          <div className="text-[13px] text-ink-500">{l.detail}</div>
                        </div>
                        <span className="tabular text-[14px] font-semibold text-amber-600">{l.points}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {met.length > 0 && (
                <div>
                  <div className="eyebrow mb-2">Requirements met</div>
                  <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
                    {met.map((l) => (
                      <li key={l.label} className="flex items-center gap-3 px-4 py-2.5">
                        <Check className="h-4 w-4 shrink-0 text-sage-600" />
                        <div className="text-[14px] text-ink-800 flex-1">{l.label}</div>
                        <span className="text-[12px] font-semibold text-sage-600">Met</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={clsx("flex items-baseline justify-between rounded-lg px-4 py-3", { good: "bg-sage-50", fair: "bg-amber-50", low: "bg-ember-50" }[tone])}>
                <span className="text-[14px] font-semibold text-ink-900">{DOMAIN_SHORT[domain]} readiness</span>
                <span className={clsx("tabular font-display text-[28px]", { good: "text-sage-700", fair: "text-amber-700", low: "text-ember-700" }[tone])}>{r.score}%</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-paper-100 px-4 py-6 text-[14px] text-ink-600">
              Nothing to calculate here. If your operations change (for example, adding regulated vehicles or contractor portals), update your company profile and this area will activate.
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <SectionTitle title="Trend" description="Monthly snapshots" />
            <ReadinessTrend history={data.history} current={data.readiness} />
          </Card>
          <Card>
            <div className="eyebrow mb-2">What moves the score</div>
            <ul className="space-y-2 text-[13.5px] text-ink-700">
              <li className="flex gap-2"><Pill tone="ember" size="sm">−5 × weight</Pill> each requirement not met</li>
              <li className="flex gap-2"><Pill tone="amber" size="sm">−5</Pill> each overdue action</li>
              <li className="flex gap-2"><Pill tone="amber" size="sm">−4 / −2</Pill> each open critical / high action</li>
              <li className="flex gap-2"><Pill tone="amber" size="sm">−3</Pill> each applicable Signal with no action yet</li>
              <li className="flex gap-2"><Pill tone="amber" size="sm">−1</Pill> each deadline inside 30 days</li>
              <li className="flex gap-2"><Pill tone="amber" size="sm">−3</Pill> each document past its review date</li>
            </ul>
            <p className="mt-3 text-[12.5px] text-ink-500 leading-relaxed">Completing an action or updating a profile field recalculates the score immediately.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReadinessPage() {
  return (
    <Suspense fallback={null}>
      <ReadinessInner />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader, Card, Avatar } from "@/components/ui/Primitives";
import { ServicePill } from "@/components/ui/Pill";
import { RequestHelp } from "@/components/client/RequestHelp";
import { ALL_DOMAINS, DOMAIN_LABEL, type Domain } from "@/lib/types";
import clsx from "clsx";

const BLURB: Record<Domain, string> = {
  HR: "Policies, handbooks, leave and accommodation processes, investigations and employment-action guidance.",
  DOT: "Driver qualification files, drug & alcohol program, Clearinghouse, vehicle files and audit readiness.",
  SAFETY: "Written programs, OSHA recordkeeping, training, inspections and incident response.",
  CONTRACTOR: "ISNetworld, Avetta, Veriforce and customer prequalification — grades, questionnaires and uploads.",
  RECRUITING: "Job descriptions, sourcing, structured interviews and offer process.",
  LEADERSHIP: "Supervisor training, coaching and leadership development.",
  OPERATIONS: "General operational compliance and process support.",
};

export default function ServicesPage() {
  const { activeOrgId, canEdit } = useSession();
  const data = useOrgData(activeOrgId);
  const [help, setHelp] = useState<Domain | null>(null);
  if (!data) return null;
  const org = data.org;

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader eyebrow="Service Coverage" title="What Ironwood covers for you" description="Your active services determine which areas Ironwood actively manages. Gaps in other areas are still surfaced, with support available on request." />
      <div className="grid gap-4 md:grid-cols-2">
        {ALL_DOMAINS.map((d) => {
          const st = org.services[d];
          const gapCount = data.gaps.filter((g) => g.domain === d).length;
          const consultants = data.consultants.filter((c) => c.domains.includes(d));
          return (
            <Card key={d} className={clsx(st === "ACTIVE" ? "border-sage-200" : "")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[18px] font-semibold text-ink-900">{DOMAIN_LABEL[d]}</div>
                  <p className="mt-1 text-[13.5px] text-ink-600 leading-relaxed">{BLURB[d]}</p>
                </div>
                <ServicePill status={st} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {st === "ACTIVE" && consultants.length > 0 && (
                  <div className="flex items-center gap-2 text-[13px] text-ink-600">
                    <div className="flex -space-x-1.5">{consultants.map((c) => <Avatar key={c.id} name={c.name} size="sm" tone="ember" />)}</div>
                    {consultants.map((c) => c.name.split(" ")[0]).join(", ")}
                  </div>
                )}
                {st !== "ACTIVE" && (
                  <>
                    {gapCount > 0 && <span className="text-[13px] text-amber-700 font-medium">{gapCount} gap{gapCount === 1 ? "" : "s"} identified in this area</span>}
                    {canEdit && <button onClick={() => setHelp(d)} className="btn btn-secondary btn-sm ml-auto">Request help</button>}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {help && <RequestHelp open onClose={() => setHelp(null)} orgId={org.id} domain={help} subject={`Interest in ${DOMAIN_LABEL[help]} support`} />}
    </div>
  );
}

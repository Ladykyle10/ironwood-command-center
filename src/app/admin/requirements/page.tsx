"use client";

import { useState } from "react";
import { REQUIREMENTS } from "@/data/requirements";
import { PageHeader, Card, Chips } from "@/components/ui/Primitives";
import { DomainTag, Pill } from "@/components/ui/Pill";
import { conditionToSentence } from "@/lib/engine/rules";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, type Domain } from "@/lib/types";
import { DEDUCTION } from "@/lib/engine/readiness";

export default function RequirementsPage() {
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");
  const rows = REQUIREMENTS.filter((r) => domain === "ALL" || r.domain === domain);
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Readiness Rules"
        title="Configured requirements"
        description={`Each requirement applies when its profile conditions hold and is met when the satisfaction conditions hold. An unmet requirement deducts ${DEDUCTION.UNMET_PER_WEIGHT} × weight from the domain score. Rules live in src/data/requirements.ts and can be moved to the database without changing the engine.`}
      />
      <Chips options={PRIMARY_DOMAINS.map((d) => ({ value: d, label: DOMAIN_SHORT[d], count: REQUIREMENTS.filter((r) => r.domain === d).length }))} value={domain} onChange={setDomain} />
      <Card padded={false} className="divide-y divide-ink-100">
        {rows.map((r) => (
          <div key={r.id} className="px-5 py-4 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 mb-1"><DomainTag domain={r.domain} /><Pill tone="neutral" size="sm">weight {r.weight}</Pill></div>
              <div className="text-[15px] font-semibold text-ink-900">{r.title}</div>
              <div className="text-[13px] text-ink-500">{r.description}</div>
              <div className="text-[12.5px] text-ink-600 mt-1"><span className="font-semibold">If unmet:</span> {r.recommendation}</div>
            </div>
            <div className="text-[13px]">
              <div className="eyebrow mb-1">Applies when ({r.appliesWhen.match.toLowerCase()})</div>
              <ul className="list-disc pl-4 space-y-0.5 text-ink-700">{r.appliesWhen.conditions.map((c, i) => <li key={i}>{conditionToSentence(c)}</li>)}</ul>
            </div>
            <div className="text-[13px]">
              <div className="eyebrow mb-1">Met when ({r.satisfiedWhen.match.toLowerCase()})</div>
              <ul className="list-disc pl-4 space-y-0.5 text-ink-700">{r.satisfiedWhen.conditions.map((c, i) => <li key={i}>{conditionToSentence(c)}</li>)}</ul>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

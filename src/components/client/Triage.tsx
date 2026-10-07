import { AlertCircle, Building2, ArrowRight } from "lucide-react";
import type { Triage } from "@/lib/types";
import { DomainTag, UrgencyPill } from "@/components/ui/Pill";

/** Structured preliminary triage card — never legal advice. */
export function TriageCard({ triage, compact }: { triage: Triage; compact?: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-ink-100 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-paper-50 px-5 py-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-500">Preliminary read</span>
        <DomainTag domain={triage.domain} />
        <UrgencyPill urgency={triage.urgency} />
        <span className="ml-auto text-[11.5px] text-ink-400">Not legal advice</span>
      </div>
      <div className={compact ? "p-4 space-y-4" : "p-5 space-y-5"}>
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ember-600 mb-2">
            <AlertCircle className="h-3.5 w-3.5" /> Potential issues detected
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {triage.potentialIssues.map((i) => (
              <li key={i} className="rounded-md bg-ember-50 px-2.5 py-1 text-[13.5px] font-medium text-ember-800">{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-navy-700 mb-2">
            <Building2 className="h-3.5 w-3.5" /> Client profile context
          </div>
          <ul className="space-y-1.5">
            {triage.profileContext.map((c) => (
              <li key={c} className="flex gap-2 text-[14px] text-ink-800 leading-relaxed">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-navy-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-navy-900 px-4 py-3 text-paper-100">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ember-300 mb-1">
            <ArrowRight className="h-3.5 w-3.5" /> Recommended next step
          </div>
          <div className="text-[14.5px] leading-relaxed">{triage.recommendedNextStep}</div>
        </div>
      </div>
    </div>
  );
}

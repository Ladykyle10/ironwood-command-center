"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, useOrgData } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, Tabs, Chips, EmptyState } from "@/components/ui/Primitives";
import { SignalRow } from "@/components/client/Rows";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, type Domain, type MatchStatus } from "@/lib/types";

type Tab = MatchStatus | "ALL";

function SignalInner() {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const signals = useStore((s) => s.signals);
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("status") as Tab) || "APPLIES");
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.matches
      .map((m) => ({ m, s: signals.find((x) => x.id === m.signalId)! }))
      .filter(({ s }) => !!s)
      .filter(({ m }) => tab === "ALL" || m.status === tab)
      .filter(({ s }) => domain === "ALL" || s.domain === domain)
      .sort((a, b) => (b.s.publishedAt ?? "").localeCompare(a.s.publishedAt ?? ""));
  }, [data, signals, tab, domain]);

  if (!data) return null;
  const count = (st: MatchStatus) => data.matches.filter((m) => m.status === st).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Ironwood Signal" title="We monitor compliance. You see what matters." description="Every regulatory development Ironwood reviews is evaluated against your company profile. You only need to read what applies." />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "APPLIES", label: "Applies to you", count: count("APPLIES") },
          { value: "WATCH", label: "Watch", count: count("WATCH") },
          { value: "HANDLING", label: "Ironwood handling", count: count("HANDLING") },
          { value: "NO_ACTION", label: "No action required", count: count("NO_ACTION") },
          { value: "ALL", label: "All reviewed", count: data.matches.length },
        ]}
      />
      <Chips options={PRIMARY_DOMAINS.map((d) => ({ value: d, label: DOMAIN_SHORT[d] }))} value={domain} onChange={setDomain} allLabel="All areas" />

      {rows.length === 0 ? (
        <EmptyState
          title={tab === "APPLIES" ? "Nothing applies to you right now" : "Nothing here"}
          body={tab === "APPLIES" ? "That's good news. Ironwood is reviewing new developments and will surface anything that matches your profile." : "No Signals match this filter."}
        />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {rows.map(({ m, s }) => (
            <SignalRow key={m.id} signal={s} match={m} />
          ))}
        </Card>
      )}
    </div>
  );
}

export default function SignalPage() {
  return (
    <Suspense fallback={null}>
      <SignalInner />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader, Chips, EmptyState, SectionTitle } from "@/components/ui/Primitives";
import { GapCard } from "@/components/client/Rows";
import { RequestHelp } from "@/components/client/RequestHelp";
import { PRIMARY_DOMAINS, DOMAIN_SHORT, DOMAIN_LABEL, type Domain, type Gap } from "@/lib/types";

export default function GapsPage() {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");
  const [help, setHelp] = useState<Gap | null>(null);
  if (!data) return null;

  const gaps = data.gaps.filter((g) => domain === "ALL" || g.domain === domain);
  const inActive = gaps.filter((g) => g.serviceActive);
  const outside = gaps.filter((g) => !g.serviceActive);
  const outsideDomains = Array.from(new Set(outside.map((g) => g.domain)));

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        eyebrow="Gaps & Opportunities"
        title="Where your programs could be stronger"
        description="Derived from your company profile, Ironwood's configured requirements, open Signals, deadlines and documents. Each item includes what we recommend."
      />
      <Chips
        options={PRIMARY_DOMAINS.map((d) => ({ value: d, label: DOMAIN_SHORT[d], count: data.gaps.filter((g) => g.domain === d).length }))}
        value={domain}
        onChange={setDomain}
        allLabel="All areas"
      />

      {gaps.length === 0 ? (
        <EmptyState title="No gaps identified" body="Your configured requirements are met and nothing is overdue in this area. Ironwood keeps checking as your profile and Signals change." />
      ) : (
        <>
          {inActive.length > 0 && (
            <section>
              <SectionTitle title="In your active services" count={inActive.length} />
              <div className="grid gap-4 md:grid-cols-2">
                {inActive.map((g) => <GapCard key={g.id} gap={g} org={data.org} />)}
              </div>
            </section>
          )}
          {outside.length > 0 && (
            <section>
              <SectionTitle
                title="Outside your current services"
                count={outside.length}
                description={`Ironwood support is available for ${outsideDomains.map((d) => DOMAIN_LABEL[d]).join(" and ")}.`}
              />
              <div className="grid gap-4 md:grid-cols-2">
                {outside.map((g) => <GapCard key={g.id} gap={g} org={data.org} onRequestHelp={setHelp} />)}
              </div>
            </section>
          )}
        </>
      )}

      {help && <RequestHelp open={!!help} onClose={() => setHelp(null)} orgId={data.org.id} domain={help.domain} subject={help.title} detail={help.detail} />}
    </div>
  );
}

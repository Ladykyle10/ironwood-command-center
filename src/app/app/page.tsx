"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { greeting, plural } from "@/lib/format";
import { Card, SectionTitle, SeeAll, EmptyState } from "@/components/ui/Primitives";
import { ActionRow, SignalRow, DeadlineRow, WorkCard, ActivityList } from "@/components/client/Rows";
import { ReadinessRing } from "@/components/ui/ReadinessRing";
import { PRIMARY_DOMAINS, DOMAIN_SHORT } from "@/lib/types";
import { isMonitored } from "@/lib/engine/readiness";
import { useStore } from "@/store/useStore";

export default function ClientHome() {
  const { user, activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const signals = useStore((s) => s.signals);
  if (!data) return null;

  const attention = data.prioritizedActions.filter((a) => a.status !== "WAITING_ON_IRONWOOD");
  const newSignals = data.matches
    .filter((m) => (m.status === "APPLIES" || m.status === "WATCH") && !m.acknowledgedAt)
    .map((m) => ({ m, s: signals.find((x) => x.id === m.signalId)! }))
    .sort((a, b) => (b.s.publishedAt ?? "").localeCompare(a.s.publishedAt ?? ""));
  const reviewedRecently = data.matches.filter((m) => {
    const s = signals.find((x) => x.id === m.signalId);
    return s?.publishedAt && Date.now() - new Date(s.publishedAt).getTime() < 14 * 86400000;
  }).length;
  const soon = [...data.overdueDeadlines, ...data.next7, ...data.next30].slice(0, 5);
  const nothing = attention.length === 0 && newSignals.length === 0 && soon.length === 0;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <div className="eyebrow mb-2">{greeting()}, {user.name.split(" ")[0]}</div>
        <h1 className="text-[30px] sm:text-[38px] leading-[1.05] text-ink-900">What needs your attention</h1>
        <p className="mt-3 text-[15px] text-ink-600 max-w-2xl leading-relaxed">
          {nothing ? (
            <>Nothing is waiting on you right now. Ironwood is monitoring your active compliance areas.</>
          ) : (
            <>
              <strong className="text-ink-900">{plural(attention.length, "item")}</strong> need{attention.length === 1 ? "s" : ""} action ·{" "}
              <strong className="text-ink-900">{plural(reviewedRecently, "regulatory development")}</strong> reviewed this month ·{" "}
              <strong className="text-ink-900">{plural(data.next7.length + data.next30.length, "upcoming deadline")}</strong> ·{" "}
              <strong className="text-ink-900">{plural(data.activeWork.length, "item")}</strong> being handled by Ironwood
            </>
          )}
        </p>
      </div>

      {nothing ? (
        <EmptyState title="Nothing needs your attention" body="That's good news. Ironwood is monitoring your active compliance areas and will surface anything that changes." />
      ) : (
        <>
          {attention.length > 0 && (
            <section>
              <SectionTitle title="Action required" count={attention.length} action={<SeeAll href="/app/actions" />} />
              <Card padded={false} className="divide-y divide-ink-100">
                {attention.slice(0, 4).map((a) => (
                  <ActionRow key={a.id} action={a} />
                ))}
              </Card>
            </section>
          )}

          {soon.length > 0 && (
            <section>
              <SectionTitle title="Upcoming deadlines" description="Next 30 days" action={<SeeAll href="/app/deadlines" />} />
              <Card padded={false} className="divide-y divide-ink-100">
                {soon.map((d) => (
                  <DeadlineRow key={d.id} deadline={d} actionHref={d.relatedActionId ? `/app/actions/${d.relatedActionId}` : undefined} />
                ))}
              </Card>
            </section>
          )}

          {newSignals.length > 0 && (
            <section>
              <SectionTitle title="New from Ironwood Signal" description="We monitor compliance. You see what matters." action={<SeeAll href="/app/signal" />} />
              <Card padded={false} className="divide-y divide-ink-100">
                {newSignals.slice(0, 3).map(({ m, s }) => (
                  <SignalRow key={m.id} signal={s} match={m} />
                ))}
              </Card>
            </section>
          )}
        </>
      )}

      {data.activeWork.length > 0 && (
        <section>
          <SectionTitle title="Ironwood is handling" description="Work our consultants are managing on your behalf" action={<SeeAll href="/app/activity" label="Activity" />} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.activeWork.slice(0, 3).map((w) => (
              <WorkCard key={w.id} item={w} consultant={data.consultants.find((c) => c.id === w.consultantId)} compact />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <SectionTitle title="Program readiness" action={<SeeAll href="/app/readiness" label="How it's calculated" />} />
          <div className="grid grid-cols-4 gap-2">
            {PRIMARY_DOMAINS.map((d) => {
              const r = data.readiness[d];
              return (
                <Link key={d} href={`/app/readiness?domain=${d}`} className="flex flex-col items-center rounded-lg py-2 hover:bg-paper-100 transition">
                  <ReadinessRing value={isMonitored(r) ? r.score : null} size={64} stroke={5} />
                  <div className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-600">{DOMAIN_SHORT[d]}</div>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-500 leading-relaxed">
            Readiness is an internal completion indicator based on requirements Ironwood has configured for you — not a legal risk measurement.
          </p>
        </Card>
        <Card className="lg:col-span-3">
          <SectionTitle title="Recent activity" action={<SeeAll href="/app/activity" />} />
          {data.activity.length ? (
            <ActivityList events={data.activity} limit={5} />
          ) : (
            <EmptyState compact title="No activity yet" body="Ironwood's work for you will appear here as it happens." />
          )}
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-900 px-5 py-4 text-paper-100">
        <div>
          <div className="font-display text-[20px]">Have a compliance question?</div>
          <div className="text-[13.5px] text-navy-200">Ask Ironwood gives you a preliminary read and routes it to your consultant.</div>
        </div>
        <Link href="/app/ask" className="btn btn-accent">
          Ask Ironwood <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

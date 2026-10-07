"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { computeReadiness, overallReadiness } from "@/lib/engine/readiness";
import { computeGaps } from "@/lib/engine/gaps";
import { REQUIREMENTS } from "@/data/requirements";
import { daysUntil } from "@/lib/format";
import { OPEN_ACTION } from "@/lib/hooks";
import type { Domain, DomainReadiness, Organization } from "@/lib/types";

export interface ClientSummary {
  org: Organization;
  readiness: Record<Domain, DomainReadiness>;
  overall: number;
  openActions: number;
  criticalActions: number;
  overdueActions: number;
  overdueDeadlines: number;
  deadlines7: number;
  deadlines30: number;
  openQuestions: number;
  applies: number;
  highGaps: number;
  activeWork: number;
  consultantNames: string[];
  lastActivity?: string;
}

/** Portfolio-level rollup for the Ironwood console. */
export function useClientSummaries(): ClientSummary[] {
  const organizations = useStore((s) => s.organizations);
  const actions = useStore((s) => s.actions);
  const deadlines = useStore((s) => s.deadlines);
  const documents = useStore((s) => s.documents);
  const questions = useStore((s) => s.questions);
  const matches = useStore((s) => s.matches);
  const signals = useStore((s) => s.signals);
  const manualGaps = useStore((s) => s.manualGaps);
  const workItems = useStore((s) => s.workItems);
  const consultants = useStore((s) => s.consultants);
  const activity = useStore((s) => s.activity);

  return useMemo(
    () =>
      organizations.map((org) => {
        const a = actions.filter((x) => x.orgId === org.id);
        const open = a.filter((x) => OPEN_ACTION.has(x.status));
        const d = deadlines.filter((x) => x.orgId === org.id && x.status === "UPCOMING");
        const docs = documents.filter((x) => x.orgId === org.id);
        const m = matches.filter((x) => x.orgId === org.id && signals.some((s) => s.id === x.signalId && s.status === "PUBLISHED"));
        const readiness = computeReadiness({ org, requirements: REQUIREMENTS, actions: a, deadlines: d, documents: docs, signals, matches: m });
        const gaps = computeGaps({ org, requirements: REQUIREMENTS, signals, matches: m, actions: a, deadlines: d, documents: docs, manualGaps: manualGaps.filter((g) => g.orgId === org.id) });
        const last = activity.filter((e) => e.orgId === org.id).sort((x, y) => y.at.localeCompare(x.at))[0];
        return {
          org,
          readiness,
          overall: overallReadiness(readiness),
          openActions: open.length,
          criticalActions: open.filter((x) => x.priority === "CRITICAL" || x.priority === "HIGH").length,
          overdueActions: open.filter((x) => (daysUntil(x.dueDate) ?? 1) < 0).length,
          overdueDeadlines: d.filter((x) => daysUntil(x.date)! < 0).length,
          deadlines7: d.filter((x) => { const n = daysUntil(x.date)!; return n >= 0 && n <= 7; }).length,
          deadlines30: d.filter((x) => { const n = daysUntil(x.date)!; return n >= 0 && n <= 30; }).length,
          openQuestions: questions.filter((q) => q.orgId === org.id && q.status !== "CLOSED" && q.status !== "RESPONDED").length,
          applies: m.filter((x) => x.status === "APPLIES").length,
          highGaps: gaps.filter((g) => g.severity === "HIGH").length,
          activeWork: workItems.filter((w) => w.orgId === org.id && w.status !== "COMPLETE").length,
          consultantNames: org.assignedConsultantIds.map((id) => consultants.find((c) => c.id === id)?.name.split(" ")[0] ?? "").filter(Boolean),
          lastActivity: last?.at,
        };
      }),
    [organizations, actions, deadlines, documents, questions, matches, signals, manualGaps, workItems, consultants, activity],
  );
}

"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { isIronwoodRole, type Domain, type Organization, type User } from "@/lib/types";
import { computeReadiness, overallReadiness } from "@/lib/engine/readiness";
import { computeGaps } from "@/lib/engine/gaps";
import { REQUIREMENTS } from "@/data/requirements";
import { daysUntil } from "@/lib/format";

/**
 * Session abstraction. In demo mode the current user comes from the store;
 * with Supabase Auth the same shape is derived from the auth session + a
 * `profiles` row. Components depend only on this hook.
 */
export function useSession() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const viewingOrgId = useStore((s) => s.viewingOrgId);
  const organizations = useStore((s) => s.organizations);
  const consultants = useStore((s) => s.consultants);

  const user: User = users.find((u) => u.id === currentUserId) ?? users[0];
  const isIronwood = isIronwoodRole(user.role);
  const isAdmin = user.role === "IRONWOOD_ADMIN";
  const canEdit = user.role !== "CLIENT_VIEWER";
  const activeOrgId = isIronwood ? viewingOrgId : user.orgId ?? null;
  const activeOrg: Organization | null = organizations.find((o) => o.id === activeOrgId) ?? null;
  const consultant = user.consultantId ? consultants.find((c) => c.id === user.consultantId) : undefined;

  return { user, isIronwood, isAdmin, canEdit, activeOrg, activeOrgId, consultant };
}

export const OPEN_ACTION = new Set(["NEW", "IN_PROGRESS", "WAITING_ON_CLIENT", "WAITING_ON_IRONWOOD"]);

/** Everything the client portal needs for one organization, derived once. */
export function useOrgData(orgId: string | null) {
  const organizations = useStore((s) => s.organizations);
  const signals = useStore((s) => s.signals);
  const matches = useStore((s) => s.matches);
  const actions = useStore((s) => s.actions);
  const workItems = useStore((s) => s.workItems);
  const deadlines = useStore((s) => s.deadlines);
  const documents = useStore((s) => s.documents);
  const questions = useStore((s) => s.questions);
  const notifications = useStore((s) => s.notifications);
  const activity = useStore((s) => s.activity);
  const manualGaps = useStore((s) => s.manualGaps);
  const readinessHistory = useStore((s) => s.readinessHistory);
  const consultants = useStore((s) => s.consultants);
  const contacts = useStore((s) => s.contacts);
  const locations = useStore((s) => s.locations);

  return useMemo(() => {
    const org = organizations.find((o) => o.id === orgId) ?? null;
    if (!org) return null;
    const byOrg = <T extends { orgId: string }>(xs: T[]) => xs.filter((x) => x.orgId === org.id);

    const orgActions = byOrg(actions);
    const orgDeadlines = byOrg(deadlines);
    const orgDocuments = byOrg(documents);
    const orgMatches = byOrg(matches).filter((m) => signals.some((s) => s.id === m.signalId && s.status === "PUBLISHED"));
    const orgQuestions = byOrg(questions).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const orgWork = byOrg(workItems);
    const orgNotifications = notifications.filter((n) => n.audience === "CLIENT" && n.orgId === org.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const orgActivity = byOrg(activity).sort((a, b) => b.at.localeCompare(a.at));
    const orgManualGaps = byOrg(manualGaps);

    const readiness = computeReadiness({ org, requirements: REQUIREMENTS, actions: orgActions, deadlines: orgDeadlines, documents: orgDocuments, signals, matches: orgMatches });
    const overall = overallReadiness(readiness);
    const gaps = computeGaps({ org, requirements: REQUIREMENTS, signals, matches: orgMatches, actions: orgActions, deadlines: orgDeadlines, documents: orgDocuments, manualGaps: orgManualGaps });

    const openActions = orgActions.filter((a) => OPEN_ACTION.has(a.status));
    const prioritized = [...openActions].sort((a, b) => {
      const pa = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.priority];
      const pb = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.priority];
      const da = daysUntil(a.dueDate) ?? 9999;
      const db = daysUntil(b.dueDate) ?? 9999;
      return da - db || pa - pb;
    });
    const overdueActions = openActions.filter((a) => (daysUntil(a.dueDate) ?? 1) < 0);
    const upcomingDeadlines = orgDeadlines
      .filter((d) => d.status === "UPCOMING")
      .sort((a, b) => a.date.localeCompare(b.date));
    const next7 = upcomingDeadlines.filter((d) => { const n = daysUntil(d.date)!; return n >= 0 && n <= 7; });
    const next30 = upcomingDeadlines.filter((d) => { const n = daysUntil(d.date)!; return n > 7 && n <= 30; });
    const next90 = upcomingDeadlines.filter((d) => { const n = daysUntil(d.date)!; return n > 30 && n <= 90; });
    const overdueDeadlines = upcomingDeadlines.filter((d) => daysUntil(d.date)! < 0);

    const applies = orgMatches.filter((m) => m.status === "APPLIES");
    const watch = orgMatches.filter((m) => m.status === "WATCH");
    const handling = orgMatches.filter((m) => m.status === "HANDLING");
    const noAction = orgMatches.filter((m) => m.status === "NO_ACTION");
    const activeWork = orgWork.filter((w) => w.status !== "COMPLETE");
    const unread = orgNotifications.filter((n) => !n.read).length;
    const history = byOrg(readinessHistory).sort((a, b) => a.date.localeCompare(b.date));
    const orgConsultants = org.assignedConsultantIds.map((id) => consultants.find((c) => c.id === id)).filter(Boolean) as typeof consultants;

    return {
      org,
      actions: orgActions,
      openActions,
      prioritizedActions: prioritized,
      overdueActions,
      deadlines: orgDeadlines,
      upcomingDeadlines,
      overdueDeadlines,
      next7,
      next30,
      next90,
      documents: orgDocuments,
      matches: orgMatches,
      applies,
      watch,
      handling,
      noAction,
      questions: orgQuestions,
      workItems: orgWork,
      activeWork,
      notifications: orgNotifications,
      unread,
      activity: orgActivity,
      readiness,
      overall,
      gaps,
      history,
      consultants: orgConsultants,
      contacts: byOrg(contacts),
      locations: byOrg(locations),
    };
  }, [orgId, organizations, signals, matches, actions, workItems, deadlines, documents, questions, notifications, activity, manualGaps, readinessHistory, consultants, contacts, locations]);
}

export type OrgData = NonNullable<ReturnType<typeof useOrgData>>;

export function domainActive(org: Organization, d: Domain) {
  return org.services[d] === "ACTIVE";
}

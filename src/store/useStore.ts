"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { formatISO } from "date-fns";
import type {
  Action,
  ActivityEvent,
  Branding,
  ConsultantResponse,
  Contact,
  Deadline,
  Document,
  Domain,
  Location,
  ManualGap,
  MatchStatus,
  Note,
  Notification,
  Organization,
  Question,
  QuestionStatus,
  Signal,
  SignalMatch,
  WorkItem,
} from "@/lib/types";
import { DOMAIN_SHORT } from "@/lib/types";
import { buildSeed, SEED_VERSION, type SeedData } from "@/data/seed";
import { evaluateSignalForOrg } from "@/lib/engine/rules";
import { triageQuestion } from "@/lib/engine/triage";

/**
 * Demo-mode data layer.
 *
 * All reads and writes go through this store. In production the same action
 * signatures are implemented against Supabase (see `src/lib/data/README.md`);
 * components never touch storage directly, so the swap is contained.
 */

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const now = () => formatISO(new Date());

export interface SessionState {
  currentUserId: string;
  /** Ironwood users can view any client portal; client users are locked to their org. */
  viewingOrgId: string | null;
}

export interface StoreState extends SeedData, SessionState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;

  // session
  setCurrentUser: (userId: string) => void;
  setViewingOrg: (orgId: string | null) => void;
  resetDemo: () => void;

  // organizations
  createOrganization: (org: Organization) => void;
  updateOrganization: (orgId: string, patch: Partial<Organization>) => void;
  addLocation: (loc: Location) => void;
  updateLocation: (id: string, patch: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  addContact: (c: Contact) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  removeContact: (id: string) => void;

  // signals
  saveSignal: (signal: Signal) => void;
  publishSignal: (signalId: string, byUserId: string) => void;
  unpublishSignal: (signalId: string) => void;
  archiveSignal: (signalId: string) => void;
  deleteSignal: (signalId: string) => void;
  reevaluateOrg: (orgId: string) => void;
  overrideMatch: (matchId: string, status: MatchStatus, note: string, byUserId: string) => void;
  acknowledgeMatch: (matchId: string) => void;

  // actions
  createAction: (action: Action, actorName: string) => void;
  updateAction: (actionId: string, patch: Partial<Action>, actorName: string, actorKind: "IRONWOOD" | "CLIENT") => void;
  addActionNote: (actionId: string, note: Note) => void;

  // work
  saveWorkItem: (item: WorkItem) => void;

  // deadlines
  saveDeadline: (d: Deadline) => void;
  completeDeadline: (id: string, actorName: string) => void;

  // documents
  saveDocument: (doc: Document, actorName: string, actorKind: "IRONWOOD" | "CLIENT") => void;
  removeDocument: (id: string) => void;

  // questions
  submitQuestion: (orgId: string, userId: string, userName: string, text: string, domain?: Domain) => Question;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  addInternalNote: (questionId: string, note: Note) => void;
  addResponse: (questionId: string, response: ConsultantResponse, nextStatus?: QuestionStatus) => void;
  addClientReply: (questionId: string, userId: string, userName: string, text: string) => void;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllRead: (audience: "CLIENT" | "IRONWOOD", orgId?: string) => void;

  // gaps
  addManualGap: (gap: ManualGap) => void;
  resolveManualGap: (id: string) => void;

  // branding
  updateBranding: (patch: Partial<Branding>) => void;

  // activity
  logActivity: (event: Omit<ActivityEvent, "id" | "at"> & { at?: string }) => void;
}

const DEFAULT_USER = "u-kyle";

function freshSeed(): SeedData {
  return buildSeed(new Date());
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...freshSeed(),
      hydrated: false,
      currentUserId: DEFAULT_USER,
      viewingOrgId: null,

      setHydrated: (v) => set({ hydrated: v }),

      /* ---------------- session ---------------- */
      setCurrentUser: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) return;
        // Client users are locked to their org; Ironwood users keep whatever client they were viewing.
        set({ currentUserId: userId, viewingOrgId: user.orgId ?? get().viewingOrgId });
      },
      setViewingOrg: (orgId) => set({ viewingOrgId: orgId }),
      resetDemo: () => set({ ...freshSeed(), currentUserId: DEFAULT_USER, viewingOrgId: null }),

      /* ---------------- organizations ---------------- */
      createOrganization: (org) => {
        set((s) => ({ organizations: [...s.organizations, org] }));
        get().reevaluateOrg(org.id);
        get().logActivity({ orgId: org.id, type: "PROFILE", title: "Organization created in Ironwood Command Center.", actor: "IRONWOOD" });
      },
      updateOrganization: (orgId, patch) => {
        set((s) => ({ organizations: s.organizations.map((o) => (o.id === orgId ? { ...o, ...patch } : o)) }));
        get().reevaluateOrg(orgId);
      },
      addLocation: (loc) => set((s) => ({ locations: [...s.locations, loc] })),
      updateLocation: (id, patch) => set((s) => ({ locations: s.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeLocation: (id) => set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, c] })),
      updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

      /* ---------------- signals ---------------- */
      saveSignal: (signal) =>
        set((s) => {
          const exists = s.signals.some((x) => x.id === signal.id);
          return { signals: exists ? s.signals.map((x) => (x.id === signal.id ? signal : x)) : [signal, ...s.signals] };
        }),

      publishSignal: (signalId, byUserId) => {
        const state = get();
        const signal = state.signals.find((x) => x.id === signalId);
        if (!signal) return;
        const publishedAt = now();
        const published: Signal = { ...signal, status: "PUBLISHED", publishedAt };
        const newMatches: SignalMatch[] = [];
        const newNotifications: Notification[] = [];
        const newActivity: ActivityEvent[] = [];
        const user = state.users.find((u) => u.id === byUserId);
        const consultant = user?.consultantId ? state.consultants.find((c) => c.id === user.consultantId) : undefined;

        for (const org of state.organizations) {
          if (org.status === "INACTIVE") continue;
          const existing = state.matches.find((m) => m.signalId === signalId && m.orgId === org.id);
          const verdict = evaluateSignalForOrg(published, org);
          const match: SignalMatch = existing?.overrideBy
            ? { ...existing, reasons: verdict.reasons, evaluatedAt: publishedAt }
            : { id: existing?.id ?? uid("m"), signalId, orgId: org.id, status: verdict.status, reasons: verdict.reasons, evaluatedAt: publishedAt };
          newMatches.push(match);

          const label = match.status === "APPLIES" ? "Applies" : match.status === "WATCH" ? "Watch" : match.status === "HANDLING" ? "Ironwood handling" : "No action required";
          newActivity.push({
            id: uid("ev"),
            orgId: org.id,
            type: "SIGNAL",
            title: `Ironwood reviewed a new ${DOMAIN_SHORT[published.domain]} development for your company.`,
            detail: `${published.title} — ${label}.`,
            at: publishedAt,
            actor: "IRONWOOD",
            actorName: consultant?.name ?? user?.name,
            href: `/app/signal/${signalId}`,
          });
          if (match.status === "APPLIES" || match.status === "WATCH") {
            newNotifications.push({
              id: uid("nt"),
              orgId: org.id,
              audience: "CLIENT",
              type: "SIGNAL",
              title: match.status === "APPLIES" ? "New Signal applies to you" : "New Signal to watch",
              body: published.title,
              createdAt: publishedAt,
              read: false,
              href: `/app/signal/${signalId}`,
            });
          }
        }

        set((s) => ({
          signals: s.signals.map((x) => (x.id === signalId ? published : x)),
          matches: [...s.matches.filter((m) => m.signalId !== signalId), ...newMatches],
          notifications: [...newNotifications, ...s.notifications],
          activity: [...newActivity, ...s.activity],
        }));
      },

      unpublishSignal: (signalId) =>
        set((s) => ({
          signals: s.signals.map((x) => (x.id === signalId ? { ...x, status: "DRAFT", publishedAt: undefined } : x)),
          matches: s.matches.filter((m) => m.signalId !== signalId),
        })),

      archiveSignal: (signalId) =>
        set((s) => ({ signals: s.signals.map((x) => (x.id === signalId ? { ...x, status: "ARCHIVED" } : x)) })),

      deleteSignal: (signalId) =>
        set((s) => ({ signals: s.signals.filter((x) => x.id !== signalId), matches: s.matches.filter((m) => m.signalId !== signalId) })),

      reevaluateOrg: (orgId) => {
        const state = get();
        const org = state.organizations.find((o) => o.id === orgId);
        if (!org) return;
        const at = now();
        const updated: SignalMatch[] = [];
        for (const signal of state.signals) {
          if (signal.status !== "PUBLISHED") continue;
          const existing = state.matches.find((m) => m.signalId === signal.id && m.orgId === orgId);
          const verdict = evaluateSignalForOrg(signal, org);
          if (existing?.overrideBy) {
            updated.push({ ...existing, reasons: verdict.reasons, evaluatedAt: at });
          } else {
            updated.push({ id: existing?.id ?? uid("m"), signalId: signal.id, orgId, status: verdict.status, reasons: verdict.reasons, evaluatedAt: at, acknowledgedAt: existing?.acknowledgedAt });
          }
        }
        set((s) => ({ matches: [...s.matches.filter((m) => m.orgId !== orgId), ...updated] }));
      },

      overrideMatch: (matchId, status, note, byUserId) =>
        set((s) => ({
          matches: s.matches.map((m) => (m.id === matchId ? { ...m, status, overrideBy: byUserId, overrideNote: note, evaluatedAt: now() } : m)),
        })),

      acknowledgeMatch: (matchId) =>
        set((s) => ({ matches: s.matches.map((m) => (m.id === matchId ? { ...m, acknowledgedAt: now() } : m)) })),

      /* ---------------- actions ---------------- */
      createAction: (action, actorName) => {
        const state = get();
        const owner = action.clientOwnerId ? state.contacts.find((c) => c.id === action.clientOwnerId) : undefined;
        const notifications: Notification[] = [];
        if (owner) {
          notifications.push({
            id: uid("nt"),
            orgId: action.orgId,
            audience: "CLIENT",
            type: "ACTION_ASSIGNED",
            title: `Action assigned to ${owner.name}`,
            body: action.title,
            createdAt: now(),
            read: false,
            href: `/app/actions/${action.id}`,
          });
        }
        set((s) => ({ actions: [action, ...s.actions], notifications: [...notifications, ...s.notifications] }));
        get().logActivity({
          orgId: action.orgId,
          type: "ACTION",
          title: `Action created: ${action.title}.`,
          detail: action.signalId ? "Created from a Signal." : undefined,
          actor: "IRONWOOD",
          actorName,
          href: `/app/actions/${action.id}`,
        });
      },

      updateAction: (actionId, patch, actorName, actorKind) => {
        const prev = get().actions.find((a) => a.id === actionId);
        if (!prev) return;
        const next: Action = { ...prev, ...patch };
        if (patch.status === "COMPLETE" && prev.status !== "COMPLETE") next.completedAt = now();
        if (patch.status && patch.status !== "COMPLETE") next.completedAt = undefined;
        set((s) => ({
          actions: s.actions.map((a) => (a.id === actionId ? next : a)),
          deadlines:
            patch.status === "COMPLETE"
              ? s.deadlines.map((d) => (d.relatedActionId === actionId && d.status === "UPCOMING" ? { ...d, status: "COMPLETE" } : d))
              : s.deadlines,
        }));
        if (patch.status && patch.status !== prev.status) {
          const label = patch.status.replace(/_/g, " ").toLowerCase();
          get().logActivity({
            orgId: prev.orgId,
            type: "ACTION",
            title: patch.status === "COMPLETE" ? `${prev.title} completed.` : `${prev.title} moved to ${label}.`,
            actor: actorKind,
            actorName,
            href: `/app/actions/${actionId}`,
          });
          if (patch.status === "COMPLETE" && actorKind === "IRONWOOD") {
            set((s) => ({
              notifications: [
                { id: uid("nt"), orgId: prev.orgId, audience: "CLIENT", type: "WORK_COMPLETE", title: "Ironwood completed work", body: prev.title, createdAt: now(), read: false, href: `/app/actions/${actionId}` },
                ...s.notifications,
              ],
            }));
          }
        }
        if (patch.clientOwnerId && patch.clientOwnerId !== prev.clientOwnerId) {
          const owner = get().contacts.find((c) => c.id === patch.clientOwnerId);
          if (owner)
            set((s) => ({
              notifications: [
                { id: uid("nt"), orgId: prev.orgId, audience: "CLIENT", type: "ACTION_ASSIGNED", title: `Action assigned to ${owner.name}`, body: prev.title, createdAt: now(), read: false, href: `/app/actions/${actionId}` },
                ...s.notifications,
              ],
            }));
        }
      },

      addActionNote: (actionId, note) =>
        set((s) => ({ actions: s.actions.map((a) => (a.id === actionId ? { ...a, notes: [...a.notes, note] } : a)) })),

      /* ---------------- work ---------------- */
      saveWorkItem: (item) => {
        const prev = get().workItems.find((w) => w.id === item.id);
        set((s) => ({ workItems: prev ? s.workItems.map((w) => (w.id === item.id ? item : w)) : [item, ...s.workItems] }));
        const consultant = get().consultants.find((c) => c.id === item.consultantId);
        if (!prev) {
          get().logActivity({ orgId: item.orgId, type: "WORK", title: `${item.title} started.`, detail: item.statusLabel, actor: "IRONWOOD", actorName: consultant?.name });
        } else if (item.status === "COMPLETE" && prev.status !== "COMPLETE") {
          get().logActivity({ orgId: item.orgId, type: "WORK", title: `${item.title} completed.`, actor: "IRONWOOD", actorName: consultant?.name });
          set((s) => ({
            notifications: [
              { id: uid("nt"), orgId: item.orgId, audience: "CLIENT", type: "WORK_COMPLETE", title: "Ironwood completed work", body: item.title, createdAt: now(), read: false, href: "/app/activity" },
              ...s.notifications,
            ],
          }));
        } else if (item.progress !== prev.progress || item.statusLabel !== prev.statusLabel) {
          get().logActivity({ orgId: item.orgId, type: "WORK", title: `${item.title}: ${item.statusLabel}.`, actor: "IRONWOOD", actorName: consultant?.name });
        }
      },

      /* ---------------- deadlines ---------------- */
      saveDeadline: (d) =>
        set((s) => ({ deadlines: s.deadlines.some((x) => x.id === d.id) ? s.deadlines.map((x) => (x.id === d.id ? d : x)) : [...s.deadlines, d] })),
      completeDeadline: (id, actorName) => {
        const d = get().deadlines.find((x) => x.id === id);
        if (!d) return;
        set((s) => ({ deadlines: s.deadlines.map((x) => (x.id === id ? { ...x, status: "COMPLETE" } : x)) }));
        get().logActivity({ orgId: d.orgId, type: "DEADLINE", title: `${d.title} marked complete.`, actor: "CLIENT", actorName, href: "/app/deadlines" });
      },

      /* ---------------- documents ---------------- */
      saveDocument: (doc, actorName, actorKind) => {
        const exists = get().documents.some((x) => x.id === doc.id);
        set((s) => ({ documents: exists ? s.documents.map((x) => (x.id === doc.id ? doc : x)) : [doc, ...s.documents] }));
        if (!exists) get().logActivity({ orgId: doc.orgId, type: "DOCUMENT", title: `${doc.title} added to your library.`, actor: actorKind, actorName, href: "/app/library" });
      },
      removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      /* ---------------- questions ---------------- */
      submitQuestion: (orgId, userId, userName, text, domain) => {
        const org = get().organizations.find((o) => o.id === orgId)!;
        const triage = triageQuestion(text, org, domain);
        const submittedAt = now();
        const q: Question = {
          id: uid("q"),
          orgId,
          submittedByUserId: userId,
          submittedByName: userName,
          text,
          domain: triage.domain,
          urgency: triage.urgency,
          submittedAt,
          status: "NEW",
          triage,
          internalNotes: [],
          responses: [],
          assignedConsultantId: org.assignedConsultantIds
            .map((id) => get().consultants.find((c) => c.id === id))
            .find((c) => c?.domains.includes(triage.domain))?.id,
        };
        set((s) => ({
          questions: [q, ...s.questions],
          notifications: [
            { id: uid("nt"), audience: "IRONWOOD", type: "QUESTION", title: `New question — ${org.name}`, body: text.length > 90 ? text.slice(0, 90) + "…" : text, createdAt: submittedAt, read: false, href: `/admin/queue/${q.id}` },
            ...s.notifications,
          ],
        }));
        get().logActivity({ orgId, type: "QUESTION", title: "Question sent to Ironwood.", detail: text.length > 80 ? text.slice(0, 80) + "…" : text, actor: "CLIENT", actorName: userName, href: `/app/ask/${q.id}` });
        return q;
      },

      updateQuestion: (id, patch) => set((s) => ({ questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),

      addInternalNote: (questionId, note) =>
        set((s) => ({ questions: s.questions.map((q) => (q.id === questionId ? { ...q, internalNotes: [...q.internalNotes, note] } : q)) })),

      addResponse: (questionId, response, nextStatus = "RESPONDED") => {
        const q = get().questions.find((x) => x.id === questionId);
        if (!q) return;
        set((s) => ({
          questions: s.questions.map((x) => (x.id === questionId ? { ...x, responses: [...x.responses, response], status: nextStatus } : x)),
          notifications: [
            { id: uid("nt"), orgId: q.orgId, audience: "CLIENT", type: "CONSULTANT_RESPONSE", title: `${response.consultantName.split(" ")[0]} responded to your question`, body: q.text.length > 90 ? q.text.slice(0, 90) + "…" : q.text, createdAt: response.createdAt, read: false, href: `/app/ask/${questionId}` },
            ...s.notifications,
          ],
        }));
        get().logActivity({ orgId: q.orgId, type: "QUESTION", title: `${response.consultantName} responded to your question.`, detail: q.text.length > 80 ? q.text.slice(0, 80) + "…" : q.text, actor: "IRONWOOD", actorName: response.consultantName, href: `/app/ask/${questionId}` });
      },

      addClientReply: (questionId, userId, userName, text) => {
        const q = get().questions.find((x) => x.id === questionId);
        if (!q) return;
        const org = get().organizations.find((o) => o.id === q.orgId);
        const at = now();
        set((s) => ({
          questions: s.questions.map((x) =>
            x.id === questionId
              ? { ...x, responses: [...x.responses, { id: uid("r"), consultantId: userId, consultantName: userName, text, createdAt: at, from: "CLIENT" }], status: "FOLLOW_UP_REQUIRED" }
              : x,
          ),
          notifications: [
            { id: uid("nt"), audience: "IRONWOOD", type: "QUESTION", title: `Follow-up from ${org?.name ?? "client"}`, body: text.length > 90 ? text.slice(0, 90) + "…" : text, createdAt: at, read: false, href: `/admin/queue/${questionId}` },
            ...s.notifications,
          ],
        }));
        get().logActivity({ orgId: q.orgId, type: "QUESTION", title: "Follow-up sent to Ironwood.", detail: text.length > 80 ? text.slice(0, 80) + "…" : text, actor: "CLIENT", actorName: userName, href: `/app/ask/${questionId}` });
      },

      /* ---------------- notifications ---------------- */
      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: (audience, orgId) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.audience === audience && (audience === "IRONWOOD" || n.orgId === orgId) ? { ...n, read: true } : n)),
        })),

      /* ---------------- gaps ---------------- */
      addManualGap: (gap) => {
        set((s) => ({
          manualGaps: [gap, ...s.manualGaps],
          notifications: gap.severity === "HIGH"
            ? [{ id: uid("nt"), orgId: gap.orgId, audience: "CLIENT", type: "GAP", title: "High-priority compliance gap identified", body: gap.title, createdAt: now(), read: false, href: "/app/gaps" }, ...s.notifications]
            : s.notifications,
        }));
      },
      resolveManualGap: (id) => set((s) => ({ manualGaps: s.manualGaps.map((g) => (g.id === id ? { ...g, resolvedAt: now() } : g)) })),

      /* ---------------- branding ---------------- */
      updateBranding: (patch) => set((s) => ({ branding: { ...s.branding, ...patch } })),

      /* ---------------- activity ---------------- */
      logActivity: (event) => set((s) => ({ activity: [{ id: uid("ev"), at: event.at ?? now(), ...event }, ...s.activity] })),
    }),
    {
      name: "ironwood-command-center",
      version: SEED_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        // Persist data + session, not functions or the hydration flag.
        const { hydrated: _h, ...rest } = s;
        void _h;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as unknown as StoreState;
      },
      migrate: (persisted, version) => {
        // Seed changed → start fresh so demo content stays coherent.
        if (version !== SEED_VERSION) return { ...freshSeed(), currentUserId: DEFAULT_USER, viewingOrgId: null } as StoreState;
        return persisted as StoreState;
      },
    },
  ),
);

# Data layer

Two implementations of one contract.

- **Demo (current):** `src/store/useStore.ts` — Zustand + localStorage, seeded by `src/data/seed.ts`.
- **Production (Option B):** the same action signatures implemented against Supabase tables defined in `supabase/schema.sql`.

Components only ever call store actions and the `useSession()` / `useOrgData()` hooks, so the swap is contained to this layer. The engines in `src/lib/engine/*` are pure functions over `src/lib/types.ts` and need no changes.

Mapping of store actions → tables:

| Store action | Tables touched |
|---|---|
| `createOrganization` / `updateOrganization` | `organizations`, then re-run `evaluateSignalForOrg` → `signal_matches` |
| `saveSignal` / `publishSignal` / `unpublishSignal` | `signals`, `signal_matches`, `notifications`, `activity` |
| `overrideMatch` / `acknowledgeMatch` | `signal_matches` |
| `createAction` / `updateAction` / `addActionNote` | `actions`, `action_notes`, `deadlines` (auto-complete), `notifications`, `activity` |
| `saveWorkItem` | `work_items`, `activity`, `notifications` |
| `saveDeadline` / `completeDeadline` | `deadlines`, `activity` |
| `saveDocument` / `removeDocument` | `documents`, `activity` |
| `submitQuestion` / `updateQuestion` / `addInternalNote` / `addResponse` / `addClientReply` | `questions`, `question_notes`, `question_responses`, `notifications`, `activity` |
| `markNotificationRead` / `markAllRead` | `notifications` |
| `addManualGap` / `resolveManualGap` | `manual_gaps`, `notifications` |
| `updateBranding` | `branding` |

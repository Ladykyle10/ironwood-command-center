# QA Log — Ironwood Command Center MVP

Build verified on Next.js 16.4 / React 19.3 / Tailwind 4.3 / Node 22. All checks below were run against the production build (`next build` + `next start`) with headless Chromium (Playwright), not against dev mode.

## Build & static checks

| Check | Result |
|---|---|
| `tsc --noEmit` (strict) | ✅ 0 errors |
| `next build` | ✅ 32 routes compile; 0 warnings |
| `npm audit` | ✅ 0 vulnerabilities |
| Hydration | ✅ store rehydrates behind a gate — no SSR/CSR mismatch warnings in any route |

## Route crawl (34 URLs, two roles)

Every client-portal and console route loaded as the appropriate role with **zero console errors and zero page errors**, including dynamic routes (`/app/signal/[id]`, `/app/actions/[id]`, `/app/ask/[id]`, `/admin/clients/[id]`, `/admin/signals/[id]`, `/admin/queue/[id]`, `/admin/actions/[id]`) and query-param variants (`?tab=`, `?domain=`, `?status=`).

Role guard: a Client Viewer requesting `/admin` is redirected to `/app`. An Ironwood user with no client selected requesting `/app` is redirected to the client picker.

## The 20-step success scenario — automated, driven through the real UI

| # | Step | Result |
|---|---|---|
| 1 | Log in as Ironwood | ✅ console dashboard |
| 2 | Open a client | ✅ Lone Star Fabrication & Supply |
| 3 | See Texas + 75 employees | ✅ |
| 4 | Create a regulatory Signal | ✅ |
| 5 | Configure applicability (`states includes TX AND employees ≥ 15 AND HR active`) | ✅ live preview: 3 clients apply, with reasons |
| 6 | Publish | ✅ evaluated against all clients, notifications + activity written |
| 7 | Switch to the client | ✅ via the user menu |
| 8 | See that the Signal applies | ✅ under *Applies to you* |
| 9 | See why it applies | ✅ "operates in Texas · has 75 employees (at least 15) · receives HR compliance support" |
| 10 | Create an action from the Signal | ✅ linked, listed under *Actions from this Signal* |
| 11 | Assign the action | ✅ client owner Dana, Ironwood owner Emily; assignment notification created |
| 12 | Complete the action | ✅ |
| 13 | See readiness update | ✅ 76% (Signal unaddressed) → 77% (action exists) → 77% (complete) — every line itemized on the Readiness page |
| 14 | Submit an Ask Ironwood question | ✅ triage: ADA / leave-FMLA / termination, profile context, next step; routed to queue |
| 15 | Switch back to consultant | ✅ |
| 16 | See the question in the queue | ✅ sorted by urgency, client + domain shown |
| 17 | Respond | ✅ internal note saved privately; client-facing response sent; status → Responded |
| 18 | Return to the client portal | ✅ |
| 19 | See the response and activity history | ✅ response visible, **internal note not visible**, activity + notification present |
| 20 | View the executive summary | ✅ readiness, priorities, deadlines, Signals, Ironwood activity, gaps, trend |
| + | Persistence | ✅ data survives full reload |

## Workflow checks (16 additional automated assertions)

- Editing a client profile re-evaluates Signals immediately (75 → 10 employees flips the Texas harassment Signal from *Applies* to *Watch*; restoring flips it back).
- Consultant override of a match to *Ironwood handling* with a note; the client sees the note.
- Logging Ironwood work in the console shows up under *Ironwood is handling* on the client home.
- Creating a new client from the form lands on its page and evaluates it against every published Signal (a DOT fleet with 6 CDL drivers gets the Clearinghouse Signal with "employs 6 CDL drivers").
- Client: marking a deadline complete, adding a document, marking a Signal reviewed.
- Gap in a non-active service → *Request help* creates a routed question (cross-sell path).
- Client Viewer role is read-only (no New action, cannot submit questions).
- Notifications mark-all-read.
- Reset demo data restores the original dataset.

## Mobile (390 × 844, touch)

All 29 client and console routes render with **no horizontal overflow**. Bottom tab bar + "More" sheet navigation works; drawers become bottom sheets; tables collapse to stacked cards; action rows move status pills inline.

Fixed during QA: button row overflow on *Ask Ironwood*; list-row overflow on the *Executive View*.

## Forms

Validation is in place on: Signal editor (title, summary, recommended action, ≥1 applicability condition, source URL format), action, deadline, document (URL format), new client (name, HQ city, contact email), contact (email), location. Errors are shown inline; nothing submits silently.

## Polish pass — findings addressed

- Readiness formula rebalanced so demo clients read as realistic (81 / 73 / — / — ; 84 / 62 / 74 / — ; 91 / 96 / 92 / 96) rather than alarming; non-monitored domains show "—" instead of a misleading 100.
- "Why am I seeing this?" sentences made specific ("has 75 employees (at least 15)", "operates in Texas") instead of generic field dumps.
- Unmet-requirement gap titles rewritten in plain language ("Fall protection program gap", "No ADA accommodation process documented").
- Rule builder: list fields start empty instead of pre-selecting the first state.
- Client table header overlap at the Contractor column fixed; Executive KPI labels shortened.
- Triage keyword matching rewritten with stems so "terminate?", "disability", "tested positive" all match.
- Ironwood users keep their client context when switching users; user switch no longer races the route guard.
- Print stylesheet added so the Executive View exports cleanly to PDF.

## Known limitations (by design for this MVP)

- Demo mode stores everything in the browser; two people on different machines see different data. Option B in `DEPLOYMENT.md` makes it shared.
- Authentication is a role switcher, not sign-in. The seam for Supabase Auth is `useSession()`.
- Document uploads are metadata + links until Supabase Storage is configured.
- Email notifications are architected (`notifications.emailed_at`) but not sent.
- Readiness history is seeded; automatic monthly snapshots are a cron job for Option B.
- Server-side route protection (`proxy.ts`) is listed under Option C; guards are client-side today.

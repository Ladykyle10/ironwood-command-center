/**
 * Seed a Supabase project with the demo dataset.
 *
 *   npx tsx scripts/seed.ts
 *
 * Requires in .env.local (or the shell):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: SEED_DEMO_PASSWORD (default "IronwoodDemo!2026") for the demo auth users.
 *
 * Idempotent-ish: re-running creates duplicate rows. Reset with `supabase db reset`
 * or truncate the tables first. Safe to run only against a dev/staging project.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { buildSeed } from "../src/data/seed";
import { REQUIREMENTS } from "../src/data/requirements";

// Minimal .env.local loader (avoids a dotenv dependency).
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });
const password = process.env.SEED_DEMO_PASSWORD ?? "IronwoodDemo!2026";

const seed = buildSeed(new Date());
const ids = new Map<string, string>();
const id = (demoId: string) => {
  if (!ids.has(demoId)) ids.set(demoId, randomUUID());
  return ids.get(demoId)!;
};
const opt = (demoId?: string) => (demoId ? id(demoId) : null);

async function insert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length}`);
}

async function main() {
  console.log("Seeding", url);

  // Auth users → profiles (trigger creates the profile row; we then set role/org).
  for (const u of seed.users) {
    const { data, error } = await supabase.auth.admin.createUser({ email: u.email, password, email_confirm: true, user_metadata: { name: u.name } });
    if (error) {
      // Already exists → look it up.
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const found = list?.users.find((x) => x.email === u.email);
      if (!found) throw new Error(`auth user ${u.email}: ${error.message}`);
      ids.set(u.id, found.id);
    } else {
      ids.set(u.id, data.user.id);
    }
  }
  console.log(`  auth users: ${seed.users.length} (password: ${password})`);

  await insert("consultants", seed.consultants.map((c) => ({ id: id(c.id), name: c.name, title: c.title, email: c.email, domains: c.domains })));

  await insert("organizations", seed.organizations.map((o) => ({
    id: id(o.id), name: o.name, slug: o.slug, industry: o.industry, naics_code: o.naicsCode ?? null,
    hq_city: o.headquarters.city, hq_state: o.headquarters.state, states_of_operation: o.statesOfOperation,
    employee_count: o.employeeCount, revenue_range: o.revenueRange ?? null, facility_count: o.facilityCount,
    website: o.website ?? null, phone: o.phone ?? null, status: o.status, services: o.services, profile: o.profile, created_at: o.createdAt,
  })));

  await insert("org_consultants", seed.organizations.flatMap((o) => o.assignedConsultantIds.map((c) => ({ org_id: id(o.id), consultant_id: id(c) }))));

  for (const u of seed.users) {
    const { error } = await supabase.from("profiles").upsert({ id: id(u.id), name: u.name, email: u.email, role: u.role, org_id: opt(u.orgId), consultant_id: opt(u.consultantId), title: u.title ?? null });
    if (error) throw new Error(`profiles: ${error.message}`);
  }
  console.log(`  profiles: ${seed.users.length}`);

  await insert("locations", seed.locations.map((l) => ({ id: id(l.id), org_id: id(l.orgId), name: l.name, address: l.address, city: l.city, state: l.state, zip: l.zip, employee_count: l.employeeCount, is_headquarters: l.isHeadquarters })));
  await insert("contacts", seed.contacts.map((c) => ({ id: id(c.id), org_id: id(c.orgId), name: c.name, title: c.title, email: c.email, phone: c.phone ?? null, is_primary: c.isPrimary })));

  await insert("requirements", REQUIREMENTS.map((r) => ({ id: r.id, domain: r.domain, title: r.title, gap_title: r.gapTitle ?? null, description: r.description, weight: r.weight, applies_when: r.appliesWhen, satisfied_when: r.satisfiedWhen, recommendation: r.recommendation })));

  await insert("signals", seed.signals.map((s) => ({
    id: id(s.id), title: s.title, domain: s.domain, jurisdiction: s.jurisdiction, regulatory_body: s.regulatoryBody,
    published_date: s.publishedDate, effective_date: s.effectiveDate || null, summary: s.summary,
    affected_industries: s.affectedIndustries, affected_characteristics: s.affectedCharacteristics,
    applies: s.applies, watch: s.watch ?? null, recommended_action: s.recommendedAction, urgency: s.urgency,
    source_url: s.sourceUrl ?? null, source_label: s.sourceLabel ?? null, commentary: s.commentary,
    status: s.status, is_demo: s.isDemo, created_by: opt(s.createdBy), created_at: s.createdAt, published_at: s.publishedAt ?? null,
  })));

  await insert("signal_matches", seed.matches.map((m) => ({ id: id(m.id), signal_id: id(m.signalId), org_id: id(m.orgId), status: m.status, reasons: m.reasons, evaluated_at: m.evaluatedAt, override_by: opt(m.overrideBy), override_note: m.overrideNote ?? null, acknowledged_at: m.acknowledgedAt ?? null })));

  await insert("actions", seed.actions.map((a) => ({
    id: id(a.id), org_id: id(a.orgId), title: a.title, domain: a.domain, description: a.description, recommended_action: a.recommendedAction ?? null,
    ironwood_owner_id: opt(a.ironwoodOwnerId), client_owner_id: opt(a.clientOwnerId), priority: a.priority, due_date: a.dueDate ?? null,
    status: a.status, recurrence: a.recurrence, signal_id: opt(a.signalId), completed_at: a.completedAt ?? null, created_by: opt(a.createdBy), created_at: a.createdAt,
  })));
  await insert("action_notes", seed.actions.flatMap((a) => a.notes.map((n) => ({ id: randomUUID(), action_id: id(a.id), author_id: opt(n.authorId), author_name: n.authorName, text: n.text, internal: !!n.internal, created_at: n.createdAt }))));

  await insert("documents", seed.documents.map((d) => ({
    id: id(d.id), org_id: id(d.orgId), title: d.title, description: d.description, category: d.category, domain: d.domain ?? null, version: d.version,
    uploaded_at: d.uploadedAt, owner_name: d.ownerName, review_date: d.reviewDate ?? null, expiration_date: d.expirationDate ?? null, url: d.url ?? null, file_name: d.fileName ?? null, size_label: d.sizeLabel ?? null,
  })));
  await insert("action_resources", seed.actions.flatMap((a) => a.resourceIds.map((r) => ({ action_id: id(a.id), document_id: id(r) }))));

  await insert("work_items", seed.workItems.map((w) => ({ id: id(w.id), org_id: id(w.orgId), title: w.title, domain: w.domain, consultant_id: id(w.consultantId), status: w.status, status_label: w.statusLabel, progress: w.progress, started_at: w.startedAt, target_date: w.targetDate ?? null, completed_at: w.completedAt ?? null, summary: w.summary, signal_id: opt(w.signalId) })));

  await insert("deadlines", seed.deadlines.map((d) => ({ id: id(d.id), org_id: id(d.orgId), title: d.title, domain: d.domain, date: d.date, type: d.type, description: d.description ?? null, related_action_id: opt(d.relatedActionId), related_document_id: opt(d.relatedDocumentId), recurrence: d.recurrence, status: d.status })));

  await insert("questions", seed.questions.map((q) => ({ id: id(q.id), org_id: id(q.orgId), submitted_by: opt(q.submittedByUserId), submitted_by_name: q.submittedByName, text: q.text, domain: q.domain, urgency: q.urgency, submitted_at: q.submittedAt, assigned_consultant_id: opt(q.assignedConsultantId), status: q.status, triage: q.triage })));
  await insert("question_notes", seed.questions.flatMap((q) => q.internalNotes.map((n) => ({ id: randomUUID(), question_id: id(q.id), author_id: opt(n.authorId), author_name: n.authorName, text: n.text, created_at: n.createdAt }))));
  await insert("question_responses", seed.questions.flatMap((q) => q.responses.map((r) => ({ id: randomUUID(), question_id: id(q.id), author_id: opt(r.consultantId), author_name: r.consultantName, from_side: r.from === "CLIENT" ? "CLIENT" : "IRONWOOD", text: r.text, created_at: r.createdAt }))));

  await insert("notifications", seed.notifications.map((n) => ({ id: id(n.id), org_id: opt(n.orgId), audience: n.audience, type: n.type, title: n.title, body: n.body, href: n.href ?? null, read: n.read, created_at: n.createdAt })));
  await insert("activity", seed.activity.map((e) => ({ id: id(e.id), org_id: id(e.orgId), type: e.type, title: e.title, detail: e.detail ?? null, at: e.at, actor: e.actor, actor_name: e.actorName ?? null, href: e.href ?? null })));
  await insert("readiness_snapshots", seed.readinessHistory.map((r) => ({ id: id(r.id), org_id: id(r.orgId), date: r.date, scores: r.scores })));
  await insert("manual_gaps", seed.manualGaps.map((g) => ({ id: id(g.id), org_id: id(g.orgId), domain: g.domain, title: g.title, detail: g.detail, recommendation: g.recommendation, severity: g.severity, created_at: g.createdAt, resolved_at: g.resolvedAt ?? null })));

  console.log("\nDone. Demo logins (all use the same password):");
  for (const u of seed.users) console.log(`  ${u.email}  →  ${u.role}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

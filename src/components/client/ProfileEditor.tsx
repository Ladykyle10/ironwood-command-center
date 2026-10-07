"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useStore, uid } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Card, DL, Drawer, SectionTitle } from "@/components/ui/Primitives";
import { Field, Input, Select, Toggle, ChipSelect, TagList } from "@/components/ui/Form";
import { ServicePill, Pill } from "@/components/ui/Pill";
import { ALL_DOMAINS, DOMAIN_LABEL, type ClientProfile, type Contact, type Location, type Organization, type ServiceStatus } from "@/lib/types";
import { CONTRACTOR_PORTALS, EXPOSURES, HR_POLICIES, INDUSTRIES, STATE_NAME, US_STATES, WRITTEN_PROGRAMS } from "@/lib/engine/fields";
import { titleCase } from "@/lib/format";

type Section = "org" | "hr" | "dot" | "safety" | "contractor" | "services" | null;

export function ProfileEditor({ org, canEdit, mode }: { org: Organization; canEdit: boolean; mode: "CLIENT" | "IRONWOOD" }) {
  const updateOrganization = useStore((s) => s.updateOrganization);
  const locations = useStore((s) => s.locations).filter((l) => l.orgId === org.id);
  const contacts = useStore((s) => s.contacts).filter((c) => c.orgId === org.id);
  const addLocation = useStore((s) => s.addLocation);
  const removeLocation = useStore((s) => s.removeLocation);
  const addContact = useStore((s) => s.addContact);
  const removeContact = useStore((s) => s.removeContact);
  const logActivity = useStore((s) => s.logActivity);
  const { toast } = useToast();
  const [section, setSection] = useState<Section>(null);
  const [draft, setDraft] = useState<Organization>(org);
  const [locOpen, setLocOpen] = useState(false);
  const [ctOpen, setCtOpen] = useState(false);

  const openSection = (s: Section) => {
    setDraft(org);
    setSection(s);
  };
  const save = () => {
    updateOrganization(org.id, {
      name: draft.name,
      industry: draft.industry,
      naicsCode: draft.naicsCode,
      headquarters: draft.headquarters,
      statesOfOperation: draft.statesOfOperation,
      employeeCount: draft.employeeCount,
      revenueRange: draft.revenueRange,
      facilityCount: draft.facilityCount,
      website: draft.website,
      phone: draft.phone,
      services: draft.services,
      profile: { ...draft.profile, hr: { ...draft.profile.hr, employeeCount: draft.employeeCount } },
    });
    logActivity({ orgId: org.id, type: "PROFILE", title: `Company profile updated (${section === "org" ? "organization" : section}).`, detail: "Signals and readiness re-evaluated.", actor: mode, href: "/app/profile" });
    toast("Profile updated", "Signals and readiness were re-evaluated.");
    setSection(null);
  };
  const p = draft.profile;
  const setP = <K extends keyof ClientProfile>(k: K, patch: Partial<ClientProfile[K]>) => setDraft((d) => ({ ...d, profile: { ...d.profile, [k]: { ...d.profile[k], ...patch } } }));

  const editBtn = (s: Section) => canEdit && (
    <button onClick={() => openSection(s)} className="btn btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</button>
  );

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Organization" action={editBtn("org")} />
        <DL cols={3} items={[
          { label: "Company", value: org.name },
          { label: "Industry", value: `${org.industry}${org.naicsCode ? ` · NAICS ${org.naicsCode}` : ""}` },
          { label: "Headquarters", value: `${org.headquarters.city}, ${org.headquarters.state}` },
          { label: "States of operation", value: org.statesOfOperation.map((s) => STATE_NAME[s] ?? s).join(", ") },
          { label: "Employees", value: org.employeeCount },
          { label: "Facilities", value: org.facilityCount },
          { label: "Revenue range", value: org.revenueRange ?? "—" },
          { label: "Website", value: org.website ?? "—" },
          { label: "Phone", value: org.phone ?? "—" },
        ]} />
      </Card>

      <Card>
        <SectionTitle title="Ironwood services" action={mode === "IRONWOOD" ? editBtn("services") : undefined} />
        <div className="flex flex-wrap gap-2">
          {ALL_DOMAINS.map((d) => (
            <div key={d} className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2">
              <span className="text-[13.5px] font-medium text-ink-800">{DOMAIN_LABEL[d]}</span>
              <ServicePill status={org.services[d]} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="HR profile" action={editBtn("hr")} />
          <DL cols={2} items={[
            { label: "States with employees", value: org.profile.hr.statesWithEmployees.join(", ") || "—" },
            { label: "Remote employees", value: org.profile.hr.remoteEmployees },
            { label: "Federal contractor", value: org.profile.hr.federalContractor ? "Yes" : "No" },
            { label: "EEO-1 applies", value: org.profile.hr.eeoApplicable ? "Yes" : "No" },
            { label: "ACA applies", value: org.profile.hr.acaApplicable ? "Yes" : "No" },
            { label: "Handbook", value: <Pill tone={org.profile.hr.handbookStatus === "CURRENT" ? "sage" : "amber"} size="sm">{titleCase(org.profile.hr.handbookStatus)}</Pill> },
            { label: "Leave requirements", value: <TagList items={org.profile.hr.leaveRequirements} /> },
            { label: "Policies on file", value: <TagList items={org.profile.hr.policiesPresent} /> },
          ]} />
        </Card>
        <Card>
          <SectionTitle title="DOT profile" action={editBtn("dot")} />
          {org.profile.dot.regulated ? (
            <DL cols={2} items={[
              { label: "USDOT number", value: org.profile.dot.usdotNumber ?? "—" },
              { label: "Operation", value: titleCase(org.profile.dot.operationType ?? "—") },
              { label: "CDL drivers", value: org.profile.dot.cdlDrivers },
              { label: "Non-CDL drivers", value: org.profile.dot.nonCdlDrivers },
              { label: "Fleet size", value: org.profile.dot.fleetSize },
              { label: "Hazmat", value: org.profile.dot.hazmat ? "Yes" : "No" },
              { label: "D&A testing program", value: org.profile.dot.drugAlcoholTesting ? "In place" : "Not recorded" },
              { label: "Clearinghouse", value: org.profile.dot.clearinghouseRegistered ? "Registered" : "Not recorded" },
              { label: "DQ files", value: titleCase(org.profile.dot.dqFileStatus) },
              { label: "Vehicle files", value: titleCase(org.profile.dot.vehicleFileStatus) },
            ]} />
          ) : (
            <p className="text-[14px] text-ink-500">Not DOT regulated. {org.profile.dot.fleetSize > 0 && `${org.profile.dot.fleetSize} non-regulated vehicles recorded.`}</p>
          )}
        </Card>
        <Card>
          <SectionTitle title="Safety profile" action={editBtn("safety")} />
          <DL cols={2} items={[
            { label: "OSHA applicable", value: org.profile.safety.oshaApplicable ? "Yes" : "No" },
            { label: "Recordkeeping", value: titleCase(org.profile.safety.recordkeepingStatus) },
            { label: "High-hazard industry", value: org.profile.safety.highHazard ? "Yes" : "No" },
            { label: "Incidents (12 mo)", value: `${org.profile.safety.incidentsLast12Months} recordable · ${org.profile.safety.inspectionsLast12Months} inspections` },
            { label: "Hazard exposures", value: <TagList items={org.profile.safety.exposures} /> },
            { label: "Written programs", value: <TagList items={org.profile.safety.writtenPrograms} /> },
            { label: "Training requirements", value: <TagList items={org.profile.safety.trainingRequirements} /> },
          ]} />
        </Card>
        <Card>
          <SectionTitle title="Contractor compliance" action={editBtn("contractor")} />
          <DL cols={2} items={[
            { label: "Portals", value: <TagList items={org.profile.contractor.portals} /> },
            { label: "Insurance expiration", value: org.profile.contractor.insuranceExpiration ?? "—" },
            { label: "Customer requirements", value: org.profile.contractor.customerRequirements.length ? <ul className="list-disc pl-4 space-y-0.5">{org.profile.contractor.customerRequirements.map((r) => <li key={r}>{r}</li>)}</ul> : "—" },
            { label: "Document expirations", value: org.profile.contractor.documentExpirations.length ? <ul className="space-y-0.5">{org.profile.contractor.documentExpirations.map((d) => <li key={d.name}>{d.name} — {d.date}</li>)}</ul> : "—" },
          ]} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Locations" count={locations.length} action={canEdit ? <button onClick={() => setLocOpen(true)} className="btn btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Add</button> : undefined} />
          <ul className="divide-y divide-ink-100">
            {locations.map((l) => (
              <li key={l.id} className="py-2.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium text-ink-900">{l.name} {l.isHeadquarters && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 ml-1">HQ</span>}</div>
                  <div className="text-[13px] text-ink-500">{l.address}, {l.city}, {l.state} {l.zip} · {l.employeeCount} employees</div>
                </div>
                {canEdit && mode === "IRONWOOD" && <button onClick={() => removeLocation(l.id)} className="text-ink-400 hover:text-ember-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle title="Contacts" count={contacts.length} action={canEdit ? <button onClick={() => setCtOpen(true)} className="btn btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Add</button> : undefined} />
          <ul className="divide-y divide-ink-100">
            {contacts.map((c) => (
              <li key={c.id} className="py-2.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium text-ink-900">{c.name} {c.isPrimary && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 ml-1">Primary</span>}</div>
                  <div className="text-[13px] text-ink-500">{c.title} · {c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                </div>
                {canEdit && mode === "IRONWOOD" && <button onClick={() => removeContact(c.id)} className="text-ink-400 hover:text-ember-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---------- Section editors ---------- */}
      <Drawer open={section !== null} onClose={() => setSection(null)} title={`Edit ${section === "org" ? "organization" : section === "services" ? "services" : `${(section ?? "").toUpperCase()} profile`}`} footer={<><button className="btn btn-secondary" onClick={() => setSection(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save and re-evaluate</button></>}>
        {section === "org" && (
          <div className="space-y-4">
            <Field label="Company name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Industry"><Select value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</Select></Field>
              <Field label="NAICS code"><Input value={draft.naicsCode ?? ""} onChange={(e) => setDraft({ ...draft, naicsCode: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="HQ city"><Input value={draft.headquarters.city} onChange={(e) => setDraft({ ...draft, headquarters: { ...draft.headquarters, city: e.target.value } })} /></Field>
              <Field label="HQ state"><Select value={draft.headquarters.state} onChange={(e) => setDraft({ ...draft, headquarters: { ...draft.headquarters, state: e.target.value } })}>{US_STATES.map((s) => <option key={s} value={s}>{STATE_NAME[s]}</option>)}</Select></Field>
            </div>
            <Field label="States of operation"><ChipSelect options={US_STATES} value={draft.statesOfOperation} onChange={(v) => setDraft({ ...draft, statesOfOperation: v })} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Employees"><Input type="number" min={0} value={draft.employeeCount} onChange={(e) => setDraft({ ...draft, employeeCount: Number(e.target.value) })} /></Field>
              <Field label="Facilities"><Input type="number" min={0} value={draft.facilityCount} onChange={(e) => setDraft({ ...draft, facilityCount: Number(e.target.value) })} /></Field>
              <Field label="Revenue range"><Input value={draft.revenueRange ?? ""} onChange={(e) => setDraft({ ...draft, revenueRange: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Website"><Input value={draft.website ?? ""} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></Field>
              <Field label="Phone"><Input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
            </div>
          </div>
        )}
        {section === "services" && (
          <div className="space-y-3">
            {ALL_DOMAINS.map((d) => (
              <Field key={d} label={DOMAIN_LABEL[d]}>
                <Select value={draft.services[d]} onChange={(e) => setDraft({ ...draft, services: { ...draft.services, [d]: e.target.value as ServiceStatus } })}>
                  <option value="ACTIVE">Active</option>
                  <option value="PROPOSED">Proposed</option>
                  <option value="NOT_ACTIVE">Not active</option>
                </Select>
              </Field>
            ))}
          </div>
        )}
        {section === "hr" && (
          <div className="space-y-4">
            <Field label="States with employees"><ChipSelect options={US_STATES} value={p.hr.statesWithEmployees} onChange={(v) => setP("hr", { statesWithEmployees: v })} /></Field>
            <Field label="Remote employees"><Input type="number" min={0} value={p.hr.remoteEmployees} onChange={(e) => setP("hr", { remoteEmployees: Number(e.target.value) })} /></Field>
            <Toggle checked={p.hr.federalContractor} onChange={(v) => setP("hr", { federalContractor: v })} label="Federal contractor" />
            <Toggle checked={p.hr.eeoApplicable} onChange={(v) => setP("hr", { eeoApplicable: v })} label="EEO-1 reporting applies" />
            <Toggle checked={p.hr.acaApplicable} onChange={(v) => setP("hr", { acaApplicable: v })} label="ACA employer mandate applies" />
            <Field label="Handbook status">
              <Select value={p.hr.handbookStatus} onChange={(e) => setP("hr", { handbookStatus: e.target.value as ClientProfile["hr"]["handbookStatus"] })}>
                <option value="CURRENT">Current</option><option value="NEEDS_UPDATE">Needs update</option><option value="IN_PROGRESS">In progress</option><option value="MISSING">Missing</option>
              </Select>
            </Field>
            <Field label="Leave requirements"><ChipSelect options={["FMLA", "Jury duty", "Military leave", "State paid leave", "Nevada paid leave", "Missouri jury duty"]} value={p.hr.leaveRequirements} onChange={(v) => setP("hr", { leaveRequirements: v })} allowCustom /></Field>
            <Field label="Policies on file"><ChipSelect options={HR_POLICIES} value={p.hr.policiesPresent} onChange={(v) => setP("hr", { policiesPresent: v })} allowCustom /></Field>
          </div>
        )}
        {section === "dot" && (
          <div className="space-y-4">
            <Toggle checked={p.dot.regulated} onChange={(v) => setP("dot", { regulated: v })} label="DOT regulated" description="Operates commercial motor vehicles subject to FMCSA rules." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="USDOT number"><Input value={p.dot.usdotNumber ?? ""} onChange={(e) => setP("dot", { usdotNumber: e.target.value })} /></Field>
              <Field label="Operation type"><Select value={p.dot.operationType ?? ""} onChange={(e) => setP("dot", { operationType: (e.target.value || undefined) as ClientProfile["dot"]["operationType"] })}><option value="">—</option><option value="INTERSTATE">Interstate</option><option value="INTRASTATE">Intrastate</option></Select></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="CDL drivers"><Input type="number" min={0} value={p.dot.cdlDrivers} onChange={(e) => setP("dot", { cdlDrivers: Number(e.target.value) })} /></Field>
              <Field label="Non-CDL drivers"><Input type="number" min={0} value={p.dot.nonCdlDrivers} onChange={(e) => setP("dot", { nonCdlDrivers: Number(e.target.value) })} /></Field>
              <Field label="Fleet size"><Input type="number" min={0} value={p.dot.fleetSize} onChange={(e) => setP("dot", { fleetSize: Number(e.target.value) })} /></Field>
            </div>
            <Toggle checked={p.dot.hazmat} onChange={(v) => setP("dot", { hazmat: v })} label="Transports hazardous materials" />
            <Toggle checked={p.dot.drugAlcoholTesting} onChange={(v) => setP("dot", { drugAlcoholTesting: v })} label="Drug & alcohol testing program in place" />
            <Toggle checked={p.dot.clearinghouseRegistered} onChange={(v) => setP("dot", { clearinghouseRegistered: v })} label="Registered in the FMCSA Clearinghouse" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Driver qualification files"><Select value={p.dot.dqFileStatus} onChange={(e) => setP("dot", { dqFileStatus: e.target.value as ClientProfile["dot"]["dqFileStatus"] })}><option value="CURRENT">Current</option><option value="NEEDS_REVIEW">Needs review</option><option value="INCOMPLETE">Incomplete</option><option value="NOT_APPLICABLE">Not applicable</option></Select></Field>
              <Field label="Vehicle files"><Select value={p.dot.vehicleFileStatus} onChange={(e) => setP("dot", { vehicleFileStatus: e.target.value as ClientProfile["dot"]["vehicleFileStatus"] })}><option value="CURRENT">Current</option><option value="NEEDS_REVIEW">Needs review</option><option value="INCOMPLETE">Incomplete</option><option value="NOT_APPLICABLE">Not applicable</option></Select></Field>
            </div>
          </div>
        )}
        {section === "safety" && (
          <div className="space-y-4">
            <Toggle checked={p.safety.oshaApplicable} onChange={(v) => setP("safety", { oshaApplicable: v })} label="Covered by OSHA" />
            <Toggle checked={p.safety.highHazard} onChange={(v) => setP("safety", { highHazard: v })} label="High-hazard industry" />
            <Field label="Recordkeeping status"><Select value={p.safety.recordkeepingStatus} onChange={(e) => setP("safety", { recordkeepingStatus: e.target.value as ClientProfile["safety"]["recordkeepingStatus"] })}><option value="EXEMPT">Exempt</option><option value="REQUIRED_CURRENT">Required — current</option><option value="REQUIRED_INCOMPLETE">Required — incomplete</option><option value="UNKNOWN">Unknown</option></Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Recordable incidents (12 mo)"><Input type="number" min={0} value={p.safety.incidentsLast12Months} onChange={(e) => setP("safety", { incidentsLast12Months: Number(e.target.value) })} /></Field>
              <Field label="Inspections (12 mo)"><Input type="number" min={0} value={p.safety.inspectionsLast12Months} onChange={(e) => setP("safety", { inspectionsLast12Months: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Hazard exposures" hint="Drives which written programs are required."><ChipSelect options={EXPOSURES} value={p.safety.exposures} onChange={(v) => setP("safety", { exposures: v })} allowCustom /></Field>
            <Field label="Written programs on file"><ChipSelect options={WRITTEN_PROGRAMS} value={p.safety.writtenPrograms} onChange={(v) => setP("safety", { writtenPrograms: v })} allowCustom /></Field>
            <Field label="Training requirements"><ChipSelect options={["OSHA 10", "OSHA 30 (supervisors)", "Forklift operator", "HazCom", "Fall protection", "Confined space entrant/attendant", "Fire extinguisher", "Hearing conservation", "Hot work", "Excavation competent person"]} value={p.safety.trainingRequirements} onChange={(v) => setP("safety", { trainingRequirements: v })} allowCustom /></Field>
          </div>
        )}
        {section === "contractor" && (
          <div className="space-y-4">
            <Field label="Contractor portals"><ChipSelect options={CONTRACTOR_PORTALS} value={p.contractor.portals} onChange={(v) => setP("contractor", { portals: v })} allowCustom /></Field>
            <Field label="Insurance expiration"><Input type="date" value={p.contractor.insuranceExpiration ?? ""} onChange={(e) => setP("contractor", { insuranceExpiration: e.target.value || undefined })} /></Field>
            <Field label="Customer requirements"><ChipSelect options={[]} value={p.contractor.customerRequirements} onChange={(v) => setP("contractor", { customerRequirements: v })} allowCustom placeholder="Add a requirement…" /></Field>
          </div>
        )}
      </Drawer>

      <LocationForm open={locOpen} onClose={() => setLocOpen(false)} onSave={(l) => { addLocation({ ...l, id: uid("loc"), orgId: org.id }); toast("Location added", l.name); }} />
      <ContactForm open={ctOpen} onClose={() => setCtOpen(false)} onSave={(c) => { addContact({ ...c, id: uid("ct"), orgId: org.id }); toast("Contact added", c.name); }} />
    </div>
  );
}

function LocationForm({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (l: Omit<Location, "id" | "orgId">) => void }) {
  const [f, setF] = useState({ name: "", address: "", city: "", state: "TX", zip: "", employeeCount: 0, isHeadquarters: false });
  const [err, setErr] = useState("");
  return (
    <Drawer open={open} onClose={onClose} title="Add location" footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { if (!f.name.trim() || !f.city.trim()) return setErr("Name and city are required."); onSave(f); setF({ name: "", address: "", city: "", state: "TX", zip: "", employeeCount: 0, isHeadquarters: false }); setErr(""); onClose(); }}>Add location</button></>}>
      <div className="space-y-4">
        <Field label="Location name" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Houston Distribution" /></Field>
        <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" required><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
          <Field label="State"><Select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>{US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
          <Field label="ZIP"><Input value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value })} /></Field>
        </div>
        <Field label="Employees at this location"><Input type="number" min={0} value={f.employeeCount} onChange={(e) => setF({ ...f, employeeCount: Number(e.target.value) })} /></Field>
        <Toggle checked={f.isHeadquarters} onChange={(v) => setF({ ...f, isHeadquarters: v })} label="This is the headquarters" />
        {err && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{err}</div>}
      </div>
    </Drawer>
  );
}

function ContactForm({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (c: Omit<Contact, "id" | "orgId">) => void }) {
  const [f, setF] = useState({ name: "", title: "", email: "", phone: "", isPrimary: false });
  const [err, setErr] = useState("");
  return (
    <Drawer open={open} onClose={onClose} title="Add contact" footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Name and a valid email are required."); onSave({ ...f, phone: f.phone || undefined }); setF({ name: "", title: "", email: "", phone: "", isPrimary: false }); setErr(""); onClose(); }}>Add contact</button></>}>
      <div className="space-y-4">
        <Field label="Name" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Toggle checked={f.isPrimary} onChange={(v) => setF({ ...f, isPrimary: v })} label="Primary contact" />
        {err && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{err}</div>}
      </div>
    </Drawer>
  );
}

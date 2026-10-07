"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatISO } from "date-fns";
import { useStore, uid } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, SectionTitle } from "@/components/ui/Primitives";
import { Field, Input, Select, Toggle, ChipSelect } from "@/components/ui/Form";
import { ALL_DOMAINS, DOMAIN_LABEL, type Domain, type Organization, type ServiceStatus } from "@/lib/types";
import { CONTRACTOR_PORTALS, EXPOSURES, INDUSTRIES, STATE_NAME, US_STATES, WRITTEN_PROGRAMS, HR_POLICIES } from "@/lib/engine/fields";

export default function NewClientPage() {
  const createOrganization = useStore((s) => s.createOrganization);
  const addContact = useStore((s) => s.addContact);
  const addLocation = useStore((s) => s.addLocation);
  const consultants = useStore((s) => s.consultants);
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [naics, setNaics] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [states, setStates] = useState<string[]>(["TX"]);
  const [employees, setEmployees] = useState(25);
  const [facilities, setFacilities] = useState(1);
  const [services, setServices] = useState<Record<Domain, ServiceStatus>>({ HR: "ACTIVE", DOT: "NOT_ACTIVE", SAFETY: "NOT_ACTIVE", CONTRACTOR: "NOT_ACTIVE", RECRUITING: "NOT_ACTIVE", LEADERSHIP: "NOT_ACTIVE", OPERATIONS: "NOT_ACTIVE" });
  const [assigned, setAssigned] = useState<string[]>([]);
  const [dot, setDot] = useState(false);
  const [cdl, setCdl] = useState(0);
  const [fleet, setFleet] = useState(0);
  const [osha, setOsha] = useState(true);
  const [exposures, setExposures] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [policies, setPolicies] = useState<string[]>([]);
  const [portals, setPortals] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) return setError("Company name is required.");
    if (!city.trim()) return setError("Headquarters city is required.");
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) return setError("Primary contact email looks invalid.");
    const id = uid("org");
    const org: Organization = {
      id,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      industry,
      naicsCode: naics || undefined,
      headquarters: { city: city.trim(), state },
      statesOfOperation: states.length ? states : [state],
      employeeCount: employees,
      facilityCount: facilities,
      status: "ONBOARDING",
      assignedConsultantIds: assigned,
      services,
      createdAt: formatISO(new Date()),
      profile: {
        hr: { employeeCount: employees, statesWithEmployees: states.length ? states : [state], remoteEmployees: 0, federalContractor: false, eeoApplicable: employees >= 100, acaApplicable: employees >= 50, leaveRequirements: employees >= 50 ? ["FMLA"] : [], policiesPresent: policies, handbookStatus: "MISSING" },
        dot: { regulated: dot, cdlDrivers: cdl, nonCdlDrivers: 0, fleetSize: fleet, hazmat: false, drugAlcoholTesting: false, clearinghouseRegistered: false, dqFileStatus: dot ? "NEEDS_REVIEW" : "NOT_APPLICABLE", vehicleFileStatus: dot ? "NEEDS_REVIEW" : "NOT_APPLICABLE", operationType: dot ? "INTERSTATE" : undefined },
        safety: { oshaApplicable: osha, naics: naics || undefined, recordkeepingStatus: employees > 10 ? "UNKNOWN" : "EXEMPT", highHazard: ["Construction", "Manufacturing", "Oil & Gas Services", "Industrial Services"].includes(industry), writtenPrograms: programs, trainingRequirements: [], exposures, inspectionsLast12Months: 0, incidentsLast12Months: 0 },
        contractor: { portals, customerRequirements: [], documentExpirations: [] },
      },
    };
    createOrganization(org);
    addLocation({ id: uid("loc"), orgId: id, name: `${city.trim()} (HQ)`, address: "", city: city.trim(), state, zip: "", employeeCount: employees, isHeadquarters: true });
    if (contactName.trim()) addContact({ id: uid("ct"), orgId: id, name: contactName.trim(), title: contactTitle.trim(), email: contactEmail.trim(), isPrimary: true });
    toast("Client created", `${org.name} — Signals evaluated against the new profile.`);
    router.push(`/admin/clients/${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" /> Clients</Link>
      <PageHeader eyebrow="New client" title="Create a client organization" description="Enter the essentials now. The full profile can be refined on the client page — Signals and readiness re-evaluate on every change." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle title="Organization" />
            <div className="space-y-4">
              <Field label="Company name" required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Industry"><Select value={industry} onChange={(e) => setIndustry(e.target.value)}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</Select></Field>
                <Field label="NAICS code"><Input value={naics} onChange={(e) => setNaics(e.target.value)} placeholder="Optional" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="HQ city" required><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
                <Field label="HQ state"><Select value={state} onChange={(e) => { setState(e.target.value); if (!states.includes(e.target.value)) setStates([...states, e.target.value]); }}>{US_STATES.map((s) => <option key={s} value={s}>{STATE_NAME[s]}</option>)}</Select></Field>
              </div>
              <Field label="States of operation"><ChipSelect options={US_STATES} value={states} onChange={setStates} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employees"><Input type="number" min={1} value={employees} onChange={(e) => setEmployees(Number(e.target.value))} /></Field>
                <Field label="Facilities"><Input type="number" min={1} value={facilities} onChange={(e) => setFacilities(Number(e.target.value))} /></Field>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Compliance profile" description="Enough to drive applicability. Refine later." />
            <div className="space-y-4">
              <Field label="HR policies on file"><ChipSelect options={HR_POLICIES} value={policies} onChange={setPolicies} /></Field>
              <Toggle checked={dot} onChange={setDot} label="DOT regulated" description="Operates commercial motor vehicles subject to FMCSA rules." />
              {dot && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CDL drivers"><Input type="number" min={0} value={cdl} onChange={(e) => setCdl(Number(e.target.value))} /></Field>
                  <Field label="Fleet size"><Input type="number" min={0} value={fleet} onChange={(e) => setFleet(Number(e.target.value))} /></Field>
                </div>
              )}
              <Toggle checked={osha} onChange={setOsha} label="Covered by OSHA" />
              <Field label="Hazard exposures"><ChipSelect options={EXPOSURES} value={exposures} onChange={setExposures} /></Field>
              <Field label="Written programs on file"><ChipSelect options={WRITTEN_PROGRAMS} value={programs} onChange={setPrograms} /></Field>
              <Field label="Contractor portals"><ChipSelect options={CONTRACTOR_PORTALS} value={portals} onChange={setPortals} /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle title="Services" />
            <div className="space-y-3">
              {ALL_DOMAINS.map((d) => (
                <Field key={d} label={DOMAIN_LABEL[d]}>
                  <Select value={services[d]} onChange={(e) => setServices({ ...services, [d]: e.target.value as ServiceStatus })}>
                    <option value="ACTIVE">Active</option>
                    <option value="PROPOSED">Proposed</option>
                    <option value="NOT_ACTIVE">Not active</option>
                  </Select>
                </Field>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Assigned consultants" />
            <div className="space-y-1">
              {consultants.map((c) => (
                <Toggle key={c.id} checked={assigned.includes(c.id)} onChange={(v) => setAssigned(v ? [...assigned, c.id] : assigned.filter((x) => x !== c.id))} label={c.name} description={c.title} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Primary contact" />
            <div className="space-y-3">
              <Field label="Name"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
              <Field label="Title"><Input value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></Field>
            </div>
          </Card>
          {error && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{error}</div>}
          <button onClick={submit} className="btn btn-primary w-full">Create client</button>
        </div>
      </div>
    </div>
  );
}

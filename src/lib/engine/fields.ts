import type { Organization } from "@/lib/types";

/**
 * Field registry for the applicability engine.
 *
 * Every rule condition references a field by key. Each field knows how to
 * resolve its value from an organization and what type it is, which drives
 * both evaluation and the rule-builder UI. Adding a new profile attribute to
 * the engine is a one-line addition here — no UI changes required.
 */

export type FieldType = "number" | "boolean" | "string" | "list";

export interface FieldDef {
  key: string;
  label: string;
  group: string;
  type: FieldType;
  /** Suggested values for the rule builder (optional). */
  options?: string[];
  resolve: (org: Organization) => string | number | boolean | string[];
  /** How the value reads in a "why am I seeing this" sentence. */
  describe: (org: Organization) => string;
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export const STATE_NAME: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",
  FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",
  LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",
  MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",
  NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",
  RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia",
};

export const INDUSTRIES = [
  "Construction",
  "Industrial Services",
  "Manufacturing",
  "Transportation & Logistics",
  "Oil & Gas Services",
  "Healthcare",
  "Professional Services",
  "Retail",
  "Hospitality",
  "Utilities",
  "Warehousing & Distribution",
];

export const WRITTEN_PROGRAMS = [
  "Hazard Communication",
  "Fall Protection",
  "Lockout/Tagout",
  "Confined Space",
  "Respiratory Protection",
  "Emergency Action Plan",
  "Fire Prevention",
  "PPE Assessment",
  "Hearing Conservation",
  "Bloodborne Pathogens",
  "Forklift / Powered Industrial Trucks",
  "Electrical Safety",
  "Heat Illness Prevention",
];

export const EXPOSURES = [
  "Fall hazards (6 ft+)",
  "Confined spaces",
  "Hazardous chemicals",
  "Powered industrial trucks",
  "Noise above action level",
  "Respiratory hazards",
  "Electrical work",
  "Excavation / trenching",
  "Heat exposure",
  "Bloodborne pathogens",
  "Machine guarding",
  "Hot work / welding",
];

export const HR_POLICIES = [
  "Anti-harassment",
  "EEO / Non-discrimination",
  "FMLA",
  "ADA Accommodation",
  "Drug & Alcohol",
  "Paid Leave",
  "Remote Work",
  "Timekeeping / Overtime",
  "Workplace Violence Prevention",
  "Social Media",
];

export const CONTRACTOR_PORTALS = ["ISNetworld", "Avetta", "Veriforce", "PEC Safety", "ComplyWorks", "Browz"];

const list = (v: string[]) => (v.length ? v.join(", ") : "none");
const yn = (v: boolean) => (v ? "yes" : "no");

export const FIELD_REGISTRY: FieldDef[] = [
  // Organization
  { key: "org.industry", label: "Industry", group: "Organization", type: "string", options: INDUSTRIES,
    resolve: (o) => o.industry, describe: (o) => `operates in the ${o.industry} industry` },
  { key: "org.naics", label: "NAICS code", group: "Organization", type: "string",
    resolve: (o) => o.naicsCode ?? "", describe: (o) => `has NAICS code ${o.naicsCode ?? "not set"}` },
  { key: "org.employeeCount", label: "Employee count", group: "Organization", type: "number",
    resolve: (o) => o.employeeCount, describe: (o) => `has ${o.employeeCount} employees` },
  { key: "org.states", label: "States of operation", group: "Organization", type: "list", options: US_STATES,
    resolve: (o) => o.statesOfOperation, describe: (o) => `operates in ${list(o.statesOfOperation.map((s) => STATE_NAME[s] ?? s))}` },
  { key: "org.hqState", label: "Headquarters state", group: "Organization", type: "string", options: US_STATES,
    resolve: (o) => o.headquarters.state, describe: (o) => `is headquartered in ${STATE_NAME[o.headquarters.state] ?? o.headquarters.state}` },
  { key: "org.facilityCount", label: "Number of facilities", group: "Organization", type: "number",
    resolve: (o) => o.facilityCount, describe: (o) => `has ${o.facilityCount} facilities` },

  // Services
  { key: "services.hr", label: "HR service active", group: "Ironwood Services", type: "boolean",
    resolve: (o) => o.services.HR === "ACTIVE", describe: (o) => o.services.HR === "ACTIVE" ? "receives HR compliance support" : "does not currently receive HR support" },
  { key: "services.dot", label: "DOT service active", group: "Ironwood Services", type: "boolean",
    resolve: (o) => o.services.DOT === "ACTIVE", describe: (o) => o.services.DOT === "ACTIVE" ? "receives DOT compliance support" : "does not currently receive DOT support" },
  { key: "services.safety", label: "Safety service active", group: "Ironwood Services", type: "boolean",
    resolve: (o) => o.services.SAFETY === "ACTIVE", describe: (o) => o.services.SAFETY === "ACTIVE" ? "receives Safety support" : "does not currently receive Safety support" },
  { key: "services.contractor", label: "Contractor Compliance service active", group: "Ironwood Services", type: "boolean",
    resolve: (o) => o.services.CONTRACTOR === "ACTIVE", describe: (o) => o.services.CONTRACTOR === "ACTIVE" ? "receives Contractor Compliance support" : "does not currently receive Contractor Compliance support" },

  // HR
  { key: "hr.employeeCount", label: "HR employee count", group: "HR Profile", type: "number",
    resolve: (o) => o.profile.hr.employeeCount, describe: (o) => `has ${o.profile.hr.employeeCount} employees on payroll` },
  { key: "hr.statesWithEmployees", label: "States with employees", group: "HR Profile", type: "list", options: US_STATES,
    resolve: (o) => o.profile.hr.statesWithEmployees, describe: (o) => `has employees in ${list(o.profile.hr.statesWithEmployees.map((s) => STATE_NAME[s] ?? s))}` },
  { key: "hr.remoteEmployees", label: "Remote employees", group: "HR Profile", type: "number",
    resolve: (o) => o.profile.hr.remoteEmployees, describe: (o) => `has ${o.profile.hr.remoteEmployees} remote employees` },
  { key: "hr.federalContractor", label: "Federal contractor", group: "HR Profile", type: "boolean",
    resolve: (o) => o.profile.hr.federalContractor, describe: (o) => o.profile.hr.federalContractor ? "is a federal contractor" : "is not a federal contractor" },
  { key: "hr.eeoApplicable", label: "EEO-1 reporting applies", group: "HR Profile", type: "boolean",
    resolve: (o) => o.profile.hr.eeoApplicable, describe: (o) => `EEO-1 reporting: ${yn(o.profile.hr.eeoApplicable)}` },
  { key: "hr.acaApplicable", label: "ACA employer mandate applies", group: "HR Profile", type: "boolean",
    resolve: (o) => o.profile.hr.acaApplicable, describe: (o) => `ACA employer mandate: ${yn(o.profile.hr.acaApplicable)}` },
  { key: "hr.policiesPresent", label: "Policies present", group: "HR Profile", type: "list", options: HR_POLICIES,
    resolve: (o) => o.profile.hr.policiesPresent, describe: (o) => `has these policies on file: ${list(o.profile.hr.policiesPresent)}` },
  { key: "hr.handbookStatus", label: "Handbook status", group: "HR Profile", type: "string", options: ["CURRENT", "NEEDS_UPDATE", "IN_PROGRESS", "MISSING"],
    resolve: (o) => o.profile.hr.handbookStatus, describe: (o) => `handbook status is ${o.profile.hr.handbookStatus.toLowerCase().replace("_", " ")}` },

  // DOT
  { key: "dot.regulated", label: "DOT regulated", group: "DOT Profile", type: "boolean",
    resolve: (o) => o.profile.dot.regulated, describe: (o) => o.profile.dot.regulated ? "operates a DOT-regulated fleet" : "is not DOT regulated" },
  { key: "dot.operationType", label: "Operation type", group: "DOT Profile", type: "string", options: ["INTERSTATE", "INTRASTATE"],
    resolve: (o) => o.profile.dot.operationType ?? "", describe: (o) => `operates ${(o.profile.dot.operationType ?? "n/a").toLowerCase()}` },
  { key: "dot.cdlDrivers", label: "CDL drivers", group: "DOT Profile", type: "number",
    resolve: (o) => o.profile.dot.cdlDrivers, describe: (o) => `employs ${o.profile.dot.cdlDrivers} CDL drivers` },
  { key: "dot.nonCdlDrivers", label: "Non-CDL drivers", group: "DOT Profile", type: "number",
    resolve: (o) => o.profile.dot.nonCdlDrivers, describe: (o) => `employs ${o.profile.dot.nonCdlDrivers} non-CDL drivers` },
  { key: "dot.fleetSize", label: "Fleet size", group: "DOT Profile", type: "number",
    resolve: (o) => o.profile.dot.fleetSize, describe: (o) => `operates ${o.profile.dot.fleetSize} vehicles` },
  { key: "dot.hazmat", label: "Hazmat", group: "DOT Profile", type: "boolean",
    resolve: (o) => o.profile.dot.hazmat, describe: (o) => o.profile.dot.hazmat ? "transports hazardous materials" : "does not transport hazmat" },
  { key: "dot.drugAlcoholTesting", label: "Drug & alcohol program in place", group: "DOT Profile", type: "boolean",
    resolve: (o) => o.profile.dot.drugAlcoholTesting, describe: (o) => `drug & alcohol testing program: ${yn(o.profile.dot.drugAlcoholTesting)}` },
  { key: "dot.clearinghouseRegistered", label: "Clearinghouse registered", group: "DOT Profile", type: "boolean",
    resolve: (o) => o.profile.dot.clearinghouseRegistered, describe: (o) => `Clearinghouse registration: ${yn(o.profile.dot.clearinghouseRegistered)}` },
  { key: "dot.dqFileStatus", label: "Driver qualification files", group: "DOT Profile", type: "string", options: ["CURRENT", "NEEDS_REVIEW", "INCOMPLETE", "NOT_APPLICABLE"],
    resolve: (o) => o.profile.dot.dqFileStatus, describe: (o) => `driver qualification files are ${o.profile.dot.dqFileStatus.toLowerCase().replace("_", " ")}` },
  { key: "dot.vehicleFileStatus", label: "Vehicle maintenance files", group: "DOT Profile", type: "string", options: ["CURRENT", "NEEDS_REVIEW", "INCOMPLETE", "NOT_APPLICABLE"],
    resolve: (o) => o.profile.dot.vehicleFileStatus, describe: (o) => `vehicle files are ${o.profile.dot.vehicleFileStatus.toLowerCase().replace("_", " ")}` },

  // Safety
  { key: "safety.oshaApplicable", label: "OSHA applicable", group: "Safety Profile", type: "boolean",
    resolve: (o) => o.profile.safety.oshaApplicable, describe: (o) => o.profile.safety.oshaApplicable ? "is covered by OSHA" : "is not covered by OSHA" },
  { key: "safety.highHazard", label: "High-hazard industry", group: "Safety Profile", type: "boolean",
    resolve: (o) => o.profile.safety.highHazard, describe: (o) => o.profile.safety.highHazard ? "is in a high-hazard industry" : "is not in a high-hazard industry" },
  { key: "safety.recordkeepingStatus", label: "OSHA recordkeeping status", group: "Safety Profile", type: "string", options: ["EXEMPT", "REQUIRED_CURRENT", "REQUIRED_INCOMPLETE", "UNKNOWN"],
    resolve: (o) => o.profile.safety.recordkeepingStatus, describe: (o) => `OSHA recordkeeping status is ${o.profile.safety.recordkeepingStatus.toLowerCase().replace("_", " ")}` },
  { key: "safety.writtenPrograms", label: "Written programs on file", group: "Safety Profile", type: "list", options: WRITTEN_PROGRAMS,
    resolve: (o) => o.profile.safety.writtenPrograms, describe: (o) => `has written programs: ${list(o.profile.safety.writtenPrograms)}` },
  { key: "safety.exposures", label: "Hazard exposures", group: "Safety Profile", type: "list", options: EXPOSURES,
    resolve: (o) => o.profile.safety.exposures, describe: (o) => `profile indicates exposures: ${list(o.profile.safety.exposures)}` },
  { key: "safety.incidentsLast12Months", label: "Recordable incidents (12 mo)", group: "Safety Profile", type: "number",
    resolve: (o) => o.profile.safety.incidentsLast12Months, describe: (o) => `recorded ${o.profile.safety.incidentsLast12Months} incidents in the last 12 months` },

  // Contractor
  { key: "contractor.portals", label: "Contractor portals", group: "Contractor Profile", type: "list", options: CONTRACTOR_PORTALS,
    resolve: (o) => o.profile.contractor.portals, describe: (o) => `maintains contractor portals: ${list(o.profile.contractor.portals)}` },
  { key: "contractor.portalCount", label: "Number of portals", group: "Contractor Profile", type: "number",
    resolve: (o) => o.profile.contractor.portals.length, describe: (o) => `maintains ${o.profile.contractor.portals.length} contractor portal(s)` },
];

export const FIELD_MAP: Record<string, FieldDef> = Object.fromEntries(
  FIELD_REGISTRY.map((f) => [f.key, f]),
);

export const FIELD_GROUPS = Array.from(new Set(FIELD_REGISTRY.map((f) => f.group)));

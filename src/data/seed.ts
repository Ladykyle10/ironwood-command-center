import { addDays, formatISO, subMonths, format } from "date-fns";
import type {
  Action,
  ActivityEvent,
  Branding,
  Consultant,
  Contact,
  Deadline,
  Document,
  Location,
  ManualGap,
  Notification,
  Organization,
  Question,
  ReadinessSnapshot,
  Signal,
  SignalMatch,
  User,
  WorkItem,
} from "@/lib/types";
import { REQUIREMENTS } from "./requirements";
import { evaluateSignalForOrg } from "@/lib/engine/rules";
import { triageQuestion } from "@/lib/engine/triage";

/**
 * Demo seed. All regulatory content is DEMO DATA — VERIFY BEFORE CLIENT USE.
 * Dates are generated relative to `now` so the demo always feels current.
 */
export const SEED_VERSION = 7;

export interface SeedData {
  seedVersion: number;
  seededAt: string;
  branding: Branding;
  users: User[];
  consultants: Consultant[];
  organizations: Organization[];
  locations: Location[];
  contacts: Contact[];
  signals: Signal[];
  matches: SignalMatch[];
  actions: Action[];
  workItems: WorkItem[];
  deadlines: Deadline[];
  documents: Document[];
  questions: Question[];
  notifications: Notification[];
  activity: ActivityEvent[];
  readinessHistory: ReadinessSnapshot[];
  manualGaps: ManualGap[];
}

export function buildSeed(now = new Date()): SeedData {
  const day = (n: number) => format(addDays(now, n), "yyyy-MM-dd");
  const ts = (n: number, hour = 9) => {
    const d = addDays(now, n);
    d.setHours(hour, Math.abs((n * 7) % 60), 0, 0);
    return formatISO(d);
  };

  const branding: Branding = {
    portalName: "Ironwood Command Center",
    primaryColor: "#0b1526",
    logoText: "IRONWOOD",
    supportEmail: "info@ironwoodbc.com",
    supportPhone: "888-743-5238",
  };

  /* ---------------- Consultants & users ---------------- */
  const consultants: Consultant[] = [
    { id: "c-kyle", name: "Kyle Heslin", title: "Platform & Product", email: "kyle@ironwoodbc.com", domains: ["OPERATIONS"] },
    { id: "c-emily", name: "Emily Hartigan", title: "HR Consultant", email: "emily@ironwoodbc.com", domains: ["HR", "RECRUITING"] },
    { id: "c-roxanne", name: "Roxanne Delgado", title: "DOT Compliance Consultant", email: "roxanne@ironwoodbc.com", domains: ["DOT"] },
    { id: "c-lindsey", name: "Lindsey Moreau", title: "Safety Consultant", email: "lindsey@ironwoodbc.com", domains: ["SAFETY"] },
    { id: "c-marcus", name: "Marcus Bell", title: "Contractor Compliance Specialist", email: "marcus@ironwoodbc.com", domains: ["CONTRACTOR"] },
  ];

  const users: User[] = [
    { id: "u-kyle", name: "Kyle Heslin", email: "kyle@ironwoodbc.com", role: "IRONWOOD_ADMIN", consultantId: "c-kyle", title: "Ironwood Admin" },
    { id: "u-emily", name: "Emily Hartigan", email: "emily@ironwoodbc.com", role: "IRONWOOD_CONSULTANT", consultantId: "c-emily", title: "HR Consultant" },
    { id: "u-roxanne", name: "Roxanne Delgado", email: "roxanne@ironwoodbc.com", role: "IRONWOOD_CONSULTANT", consultantId: "c-roxanne", title: "DOT Consultant" },
    { id: "u-lindsey", name: "Lindsey Moreau", email: "lindsey@ironwoodbc.com", role: "IRONWOOD_CONSULTANT", consultantId: "c-lindsey", title: "Safety Consultant" },
    { id: "u-dana", name: "Dana Whitfield", email: "dana@lonestarfab.example", role: "CLIENT_ADMIN", orgId: "org-lonestar", title: "HR Manager" },
    { id: "u-tom", name: "Tom Reyes", email: "tom@lonestarfab.example", role: "CLIENT_VIEWER", orgId: "org-lonestar", title: "Operations Director" },
    { id: "u-carla", name: "Carla Jensen", email: "carla@cimarronfreight.example", role: "CLIENT_ADMIN", orgId: "org-cimarron", title: "Safety & Compliance Manager" },
    { id: "u-mike", name: "Mike Oduya", email: "mike@cimarronfreight.example", role: "CLIENT_VIEWER", orgId: "org-cimarron", title: "Owner" },
    { id: "u-priya", name: "Priya Natarajan", email: "priya@meridianind.example", role: "CLIENT_ADMIN", orgId: "org-meridian", title: "HSE Director" },
    { id: "u-greg", name: "Greg Hollis", email: "greg@meridianind.example", role: "CLIENT_VIEWER", orgId: "org-meridian", title: "President" },
  ];

  /* ---------------- Organizations ---------------- */
  const organizations: Organization[] = [
    {
      id: "org-lonestar",
      name: "Lone Star Fabrication & Supply",
      slug: "lone-star-fabrication",
      industry: "Manufacturing",
      naicsCode: "332312",
      headquarters: { city: "Conroe", state: "TX" },
      statesOfOperation: ["TX"],
      employeeCount: 75,
      revenueRange: "$10M – $25M",
      facilityCount: 3,
      website: "lonestarfab.example",
      phone: "(936) 555-0142",
      status: "ACTIVE",
      assignedConsultantIds: ["c-emily", "c-lindsey"],
      services: { HR: "ACTIVE", DOT: "NOT_ACTIVE", SAFETY: "ACTIVE", CONTRACTOR: "NOT_ACTIVE", RECRUITING: "NOT_ACTIVE", LEADERSHIP: "PROPOSED", OPERATIONS: "NOT_ACTIVE" },
      createdAt: ts(-410),
      profile: {
        hr: {
          employeeCount: 75,
          statesWithEmployees: ["TX"],
          remoteEmployees: 2,
          federalContractor: false,
          eeoApplicable: false,
          acaApplicable: true,
          leaveRequirements: ["FMLA", "Jury duty", "Military leave"],
          policiesPresent: ["Anti-harassment", "EEO / Non-discrimination", "FMLA", "Drug & Alcohol", "Timekeeping / Overtime"],
          handbookStatus: "NEEDS_UPDATE",
          handbookLastReviewed: day(-470),
        },
        dot: { regulated: false, cdlDrivers: 0, nonCdlDrivers: 4, fleetSize: 5, hazmat: false, drugAlcoholTesting: false, clearinghouseRegistered: false, dqFileStatus: "NOT_APPLICABLE", vehicleFileStatus: "NOT_APPLICABLE" },
        safety: {
          oshaApplicable: true,
          naics: "332312",
          recordkeepingStatus: "REQUIRED_CURRENT",
          highHazard: true,
          writtenPrograms: ["Hazard Communication", "Emergency Action Plan", "Forklift / Powered Industrial Trucks", "PPE Assessment"],
          trainingRequirements: ["Forklift operator", "HazCom", "Fire extinguisher", "Hearing conservation"],
          exposures: ["Fall hazards (6 ft+)", "Powered industrial trucks", "Hazardous chemicals", "Noise above action level", "Hot work / welding"],
          inspectionsLast12Months: 0,
          incidentsLast12Months: 3,
        },
        contractor: { portals: [], customerRequirements: ["One customer has requested ISNetworld enrollment (pending decision)"], documentExpirations: [] },
      },
    },
    {
      id: "org-cimarron",
      name: "Cimarron Freight Lines",
      slug: "cimarron-freight",
      industry: "Transportation & Logistics",
      naicsCode: "484121",
      headquarters: { city: "Tulsa", state: "OK" },
      statesOfOperation: ["OK", "TX", "KS", "MO", "AR"],
      employeeCount: 62,
      revenueRange: "$10M – $25M",
      facilityCount: 2,
      website: "cimarronfreight.example",
      phone: "(918) 555-0188",
      status: "ACTIVE",
      assignedConsultantIds: ["c-emily", "c-roxanne"],
      services: { HR: "ACTIVE", DOT: "ACTIVE", SAFETY: "NOT_ACTIVE", CONTRACTOR: "NOT_ACTIVE", RECRUITING: "PROPOSED", LEADERSHIP: "NOT_ACTIVE", OPERATIONS: "NOT_ACTIVE" },
      createdAt: ts(-620),
      profile: {
        hr: {
          employeeCount: 62,
          statesWithEmployees: ["OK", "KS"],
          remoteEmployees: 0,
          federalContractor: false,
          eeoApplicable: false,
          acaApplicable: true,
          leaveRequirements: ["FMLA", "Jury duty"],
          policiesPresent: ["Anti-harassment", "EEO / Non-discrimination", "FMLA", "ADA Accommodation", "Drug & Alcohol", "Timekeeping / Overtime"],
          handbookStatus: "IN_PROGRESS",
          handbookLastReviewed: day(-300),
        },
        dot: {
          regulated: true,
          usdotNumber: "3XXXXXX",
          operationType: "INTERSTATE",
          cdlDrivers: 45,
          nonCdlDrivers: 3,
          fleetSize: 52,
          hazmat: false,
          drugAlcoholTesting: true,
          clearinghouseRegistered: true,
          dqFileStatus: "NEEDS_REVIEW",
          vehicleFileStatus: "NEEDS_REVIEW",
        },
        safety: {
          oshaApplicable: true,
          naics: "484121",
          recordkeepingStatus: "REQUIRED_INCOMPLETE",
          highHazard: false,
          writtenPrograms: ["Hazard Communication", "Emergency Action Plan"],
          trainingRequirements: ["HazCom", "Forklift operator (shop)"],
          exposures: ["Powered industrial trucks", "Hazardous chemicals"],
          inspectionsLast12Months: 1,
          incidentsLast12Months: 2,
        },
        contractor: {
          portals: [],
          customerRequirements: ["Permian Basin customer requires ISNetworld grade B or better before Q1 lane award"],
          insuranceExpiration: day(41),
          documentExpirations: [{ name: "Auto liability COI", date: day(41) }],
        },
      },
    },
    {
      id: "org-meridian",
      name: "Meridian Industrial Contractors",
      slug: "meridian-industrial",
      industry: "Construction",
      naicsCode: "238990",
      headquarters: { city: "Houston", state: "TX" },
      statesOfOperation: ["TX", "MO", "NV"],
      employeeCount: 180,
      revenueRange: "$50M – $100M",
      facilityCount: 4,
      website: "meridianind.example",
      phone: "(713) 555-0120",
      status: "ACTIVE",
      assignedConsultantIds: ["c-emily", "c-roxanne", "c-lindsey", "c-marcus"],
      services: { HR: "ACTIVE", DOT: "ACTIVE", SAFETY: "ACTIVE", CONTRACTOR: "ACTIVE", RECRUITING: "NOT_ACTIVE", LEADERSHIP: "ACTIVE", OPERATIONS: "NOT_ACTIVE" },
      createdAt: ts(-900),
      profile: {
        hr: {
          employeeCount: 180,
          statesWithEmployees: ["TX", "MO", "NV"],
          remoteEmployees: 6,
          federalContractor: true,
          eeoApplicable: true,
          acaApplicable: true,
          leaveRequirements: ["FMLA", "Nevada paid leave", "Missouri jury duty", "Military leave"],
          policiesPresent: ["Anti-harassment", "EEO / Non-discrimination", "FMLA", "ADA Accommodation", "Drug & Alcohol", "Paid Leave", "Timekeeping / Overtime", "Workplace Violence Prevention"],
          handbookStatus: "CURRENT",
          handbookLastReviewed: day(-95),
        },
        dot: {
          regulated: true,
          usdotNumber: "2XXXXXX",
          operationType: "INTERSTATE",
          cdlDrivers: 12,
          nonCdlDrivers: 30,
          fleetSize: 48,
          hazmat: false,
          drugAlcoholTesting: true,
          clearinghouseRegistered: true,
          dqFileStatus: "CURRENT",
          vehicleFileStatus: "CURRENT",
        },
        safety: {
          oshaApplicable: true,
          naics: "238990",
          recordkeepingStatus: "REQUIRED_CURRENT",
          highHazard: true,
          writtenPrograms: ["Hazard Communication", "Fall Protection", "Confined Space", "Emergency Action Plan", "PPE Assessment", "Lockout/Tagout", "Respiratory Protection", "Electrical Safety"],
          trainingRequirements: ["OSHA 10", "OSHA 30 (supervisors)", "Fall protection", "Confined space entrant/attendant", "Excavation competent person", "Hot work"],
          exposures: ["Fall hazards (6 ft+)", "Confined spaces", "Excavation / trenching", "Hot work / welding", "Electrical work", "Respiratory hazards", "Heat exposure", "Hazardous chemicals"],
          inspectionsLast12Months: 2,
          incidentsLast12Months: 5,
        },
        contractor: {
          portals: ["ISNetworld", "Avetta", "Veriforce"],
          customerRequirements: ["Avetta grade A required by two refinery customers", "Veriforce OQ records for pipeline work"],
          insuranceExpiration: day(22),
          documentExpirations: [
            { name: "General liability COI", date: day(22) },
            { name: "Workers' comp COI", date: day(22) },
            { name: "Avetta questionnaire", date: day(6) },
          ],
        },
      },
    },
  ];

  /* ---------------- Locations & contacts ---------------- */
  const locations: Location[] = [
    { id: "loc-ls-1", orgId: "org-lonestar", name: "Conroe Plant (HQ)", address: "1400 Industrial Pkwy", city: "Conroe", state: "TX", zip: "77301", employeeCount: 48, isHeadquarters: true },
    { id: "loc-ls-2", orgId: "org-lonestar", name: "Houston Distribution", address: "9200 Wallisville Rd", city: "Houston", state: "TX", zip: "77029", employeeCount: 19, isHeadquarters: false },
    { id: "loc-ls-3", orgId: "org-lonestar", name: "San Antonio Sales Office", address: "515 Broadway", city: "San Antonio", state: "TX", zip: "78215", employeeCount: 8, isHeadquarters: false },
    { id: "loc-cf-1", orgId: "org-cimarron", name: "Tulsa Terminal (HQ)", address: "6800 E 46th St N", city: "Tulsa", state: "OK", zip: "74117", employeeCount: 50, isHeadquarters: true },
    { id: "loc-cf-2", orgId: "org-cimarron", name: "Wichita Yard", address: "2100 S West St", city: "Wichita", state: "KS", zip: "67213", employeeCount: 12, isHeadquarters: false },
    { id: "loc-mi-1", orgId: "org-meridian", name: "Houston Office (HQ)", address: "7700 N Sam Houston Pkwy", city: "Houston", state: "TX", zip: "77064", employeeCount: 70, isHeadquarters: true },
    { id: "loc-mi-2", orgId: "org-meridian", name: "Beaumont Fabrication Yard", address: "3400 Gulf St", city: "Beaumont", state: "TX", zip: "77701", employeeCount: 55, isHeadquarters: false },
    { id: "loc-mi-3", orgId: "org-meridian", name: "St. Louis Regional", address: "1 Metropolitan Sq", city: "St. Louis", state: "MO", zip: "63102", employeeCount: 25, isHeadquarters: false },
    { id: "loc-mi-4", orgId: "org-meridian", name: "Reno Project Office", address: "5190 Neil Rd", city: "Reno", state: "NV", zip: "89502", employeeCount: 30, isHeadquarters: false },
  ];

  const contacts: Contact[] = [
    { id: "ct-dana", orgId: "org-lonestar", name: "Dana Whitfield", title: "HR Manager", email: "dana@lonestarfab.example", phone: "(936) 555-0142", isPrimary: true },
    { id: "ct-tom", orgId: "org-lonestar", name: "Tom Reyes", title: "Operations Director", email: "tom@lonestarfab.example", isPrimary: false },
    { id: "ct-carla", orgId: "org-cimarron", name: "Carla Jensen", title: "Safety & Compliance Manager", email: "carla@cimarronfreight.example", phone: "(918) 555-0188", isPrimary: true },
    { id: "ct-mike", orgId: "org-cimarron", name: "Mike Oduya", title: "Owner", email: "mike@cimarronfreight.example", isPrimary: false },
    { id: "ct-priya", orgId: "org-meridian", name: "Priya Natarajan", title: "HSE Director", email: "priya@meridianind.example", phone: "(713) 555-0120", isPrimary: true },
    { id: "ct-greg", orgId: "org-meridian", name: "Greg Hollis", title: "President", email: "greg@meridianind.example", isPrimary: false },
    { id: "ct-luis", orgId: "org-meridian", name: "Luis Ortega", title: "Fleet Manager", email: "luis@meridianind.example", isPrimary: false },
  ];

  /* ---------------- Signals (DEMO DATA) ---------------- */
  const signals: Signal[] = [
    {
      id: "sig-i9",
      title: "Form I-9: current edition and reverification tracking",
      domain: "HR",
      jurisdiction: "Federal",
      regulatoryBody: "USCIS",
      publishedDate: day(-9),
      effectiveDate: day(-9),
      summary: "Employers must use the current Form I-9 edition for new hires and track reverification dates for employees with time-limited work authorization. Ironwood recommends a periodic self-audit of I-9 records.",
      affectedIndustries: ["All industries"],
      affectedCharacteristics: ["Any employer with W-2 employees"],
      applies: { match: "ALL", conditions: [{ field: "org.employeeCount", operator: "gte", value: 1 }] },
      recommendedAction: "Confirm the current form edition is in use and review flagged records for missing or expiring documentation.",
      urgency: "MEDIUM",
      sourceUrl: "https://www.uscis.gov/i-9",
      sourceLabel: "USCIS — Form I-9",
      commentary: "I-9 issues are the most common finding in our HR audits. Most are paperwork errors that are correctable if caught early. We recommend a full self-audit every 12–18 months.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-10),
      createdBy: "u-emily",
      publishedAt: ts(-9),
    },
    {
      id: "sig-clearinghouse",
      title: "FMCSA Drug & Alcohol Clearinghouse — annual query cycle",
      domain: "DOT",
      jurisdiction: "Federal",
      regulatoryBody: "FMCSA",
      publishedDate: day(-14),
      summary: "Motor carriers must conduct a limited query in the Clearinghouse on every CDL driver at least once per year and a full pre-employment query before a new driver operates. Ironwood recommends scheduling the annual cycle now so queries do not lapse.",
      affectedIndustries: ["Transportation & Logistics", "Construction", "Oil & Gas Services"],
      affectedCharacteristics: ["DOT-regulated", "Employs CDL drivers"],
      applies: { match: "ALL", conditions: [{ field: "dot.regulated", operator: "is_true" }, { field: "dot.cdlDrivers", operator: "gt", value: 0 }] },
      recommendedAction: "Verify driver consent on file, run annual limited queries for all CDL drivers, and document results in each DQ file.",
      urgency: "HIGH",
      sourceUrl: "https://clearinghouse.fmcsa.dot.gov/",
      sourceLabel: "FMCSA Clearinghouse",
      commentary: "Missed annual queries are an easy audit finding. If Ironwood manages your DOT program, we run these on your behalf and record them in the DQ file.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-15),
      createdBy: "u-roxanne",
      publishedAt: ts(-14),
    },
    {
      id: "sig-dq-medical",
      title: "Driver qualification files — medical certificate tracking",
      domain: "DOT",
      jurisdiction: "Federal",
      regulatoryBody: "FMCSA",
      publishedDate: day(-21),
      summary: "Medical examiner's certificates must be current for every driver in a DQ file. Ironwood recommends a 60-day look-ahead on expirations so drivers are not placed out of service.",
      affectedIndustries: ["Transportation & Logistics", "Construction"],
      affectedCharacteristics: ["DOT-regulated"],
      applies: { match: "ALL", conditions: [{ field: "dot.regulated", operator: "is_true" }] },
      recommendedAction: "Review the DQ expiration report and schedule physicals for drivers expiring within 60 days.",
      urgency: "MEDIUM",
      sourceUrl: "https://www.fmcsa.dot.gov/regulations/medical",
      sourceLabel: "FMCSA — Medical requirements",
      commentary: "A lapsed medical card means the driver cannot legally operate. We track this for managed-DOT clients and flag it 60 days out.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-22),
      createdBy: "u-roxanne",
      publishedAt: ts(-21),
    },
    {
      id: "sig-tx-harassment",
      title: "Texas: harassment prevention policy and training review",
      domain: "HR",
      jurisdiction: "Texas",
      regulatoryBody: "Texas Workforce Commission",
      publishedDate: day(-6),
      summary: "Texas extended sexual-harassment liability to employers of all sizes and lengthened the complaint filing window. Employers with Texas employees should confirm their policy, reporting channels and supervisor training reflect current expectations.",
      affectedIndustries: ["All industries"],
      affectedCharacteristics: ["Texas employees", "15 or more employees"],
      applies: { match: "ALL", conditions: [{ field: "org.states", operator: "includes", value: ["TX"] }, { field: "org.employeeCount", operator: "gte", value: 15 }, { field: "services.hr", operator: "is_true" }] },
      watch: { match: "ALL", conditions: [{ field: "org.states", operator: "includes", value: ["TX"] }] },
      recommendedAction: "Review the anti-harassment policy with Ironwood HR and schedule annual supervisor training.",
      urgency: "MEDIUM",
      sourceUrl: "https://www.twc.texas.gov/",
      sourceLabel: "Texas Workforce Commission",
      commentary: "The practical exposure here is supervisors who do not know how to receive a complaint. Training is inexpensive relative to a claim.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-7),
      createdBy: "u-emily",
      publishedAt: ts(-6),
    },
    {
      id: "sig-nv-osha10",
      title: "Nevada: OSHA-10 / OSHA-30 construction training requirements",
      domain: "SAFETY",
      jurisdiction: "Nevada",
      regulatoryBody: "Nevada OSHA",
      publishedDate: day(-12),
      summary: "Nevada requires construction workers to complete an OSHA-10 course and supervisors an OSHA-30 course within a set period of hire, with cards renewed every five years. Crews mobilizing to Nevada sites must have current cards.",
      affectedIndustries: ["Construction"],
      affectedCharacteristics: ["Operates in Nevada", "Construction"],
      applies: { match: "ALL", conditions: [{ field: "org.industry", operator: "eq", value: "Construction" }, { field: "org.states", operator: "includes", value: ["NV"] }] },
      watch: { match: "ALL", conditions: [{ field: "org.industry", operator: "eq", value: "Construction" }] },
      recommendedAction: "Pull training records for every employee assigned to Nevada work and schedule OSHA-30 for site supervisors.",
      urgency: "HIGH",
      sourceUrl: "https://dir.nv.gov/OSHA/Home/",
      sourceLabel: "Nevada OSHA",
      commentary: "This is enforced at the jobsite. Have cards available on site and keep a roster with expiration dates.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-13),
      createdBy: "u-lindsey",
      publishedAt: ts(-12),
    },
    {
      id: "sig-osha-300a",
      title: "OSHA recordkeeping — year-end 300A certification and electronic submission",
      domain: "SAFETY",
      jurisdiction: "Federal",
      regulatoryBody: "OSHA",
      publishedDate: day(-3),
      summary: "Covered establishments must certify and post the Form 300A summary from February 1 to April 30 and, where applicable, submit injury and illness data electronically by March 2. Ironwood recommends reconciling the 300 log now to avoid year-end scrambles.",
      affectedIndustries: ["Manufacturing", "Construction", "Transportation & Logistics", "Warehousing & Distribution"],
      affectedCharacteristics: ["OSHA recordkeeping required", "20+ employees at an establishment"],
      applies: { match: "ALL", conditions: [{ field: "safety.recordkeepingStatus", operator: "in", value: ["REQUIRED_CURRENT", "REQUIRED_INCOMPLETE"] }, { field: "org.employeeCount", operator: "gte", value: 20 }] },
      recommendedAction: "Reconcile the 300 log for the current year and confirm which establishments must submit electronically.",
      urgency: "LOW",
      sourceUrl: "https://www.osha.gov/recordkeeping",
      sourceLabel: "OSHA Recordkeeping",
      commentary: "Most of our clients' 300 logs have classification errors — first-aid cases logged as recordables or vice versa. A reconciliation now makes February easy.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-4),
      createdBy: "u-lindsey",
      publishedAt: ts(-3),
    },
    {
      id: "sig-mo-leave",
      title: "Missouri: paid sick leave requirement changed — handbook review",
      domain: "HR",
      jurisdiction: "Missouri",
      regulatoryBody: "Missouri Department of Labor",
      publishedDate: day(-18),
      summary: "Missouri's earned paid sick time requirement was changed by the legislature in 2025. Employers with Missouri employees should verify handbook leave language and any accrual practices adopted earlier in the year.",
      affectedIndustries: ["All industries"],
      affectedCharacteristics: ["Missouri employees"],
      applies: { match: "ALL", conditions: [{ field: "hr.statesWithEmployees", operator: "includes", value: ["MO"] }] },
      recommendedAction: "Review Missouri leave language in the handbook with Ironwood HR.",
      urgency: "LOW",
      sourceUrl: "https://labor.mo.gov/",
      sourceLabel: "Missouri Department of Labor",
      commentary: "If you adopted an accrual policy earlier this year, decide deliberately whether to keep it — reversing a benefit requires clear communication.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-19),
      createdBy: "u-emily",
      publishedAt: ts(-18),
    },
    {
      id: "sig-coi-cycle",
      title: "Contractor portals: certificate of insurance expiration cycle",
      domain: "CONTRACTOR",
      jurisdiction: "Customer requirement",
      regulatoryBody: "ISNetworld / Avetta / Veriforce",
      publishedDate: day(-5),
      summary: "Portal grades drop automatically when a certificate of insurance expires. Ironwood recommends requesting renewal certificates from your broker 30 days ahead and uploading before the expiration date.",
      affectedIndustries: ["Construction", "Industrial Services", "Oil & Gas Services", "Transportation & Logistics"],
      affectedCharacteristics: ["Maintains one or more contractor portals"],
      applies: { match: "ALL", conditions: [{ field: "contractor.portalCount", operator: "gte", value: 1 }] },
      watch: { match: "ALL", conditions: [{ field: "org.industry", operator: "in", value: ["Construction", "Industrial Services", "Oil & Gas Services", "Transportation & Logistics"] }] },
      recommendedAction: "Confirm COI renewal dates and assign an owner for each portal upload.",
      urgency: "MEDIUM",
      commentary: "A lapsed COI can take a contractor from grade A to F overnight. The customer sees it before you do.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-6),
      createdBy: "u-kyle",
      publishedAt: ts(-5),
    },
    {
      id: "sig-heat",
      title: "Heat illness prevention — written program expectations",
      domain: "SAFETY",
      jurisdiction: "Federal",
      regulatoryBody: "OSHA",
      publishedDate: day(-27),
      summary: "OSHA has advanced rulemaking on heat injury and illness prevention and continues National Emphasis Program inspections. Employers with outdoor or hot indoor work should have a written plan, acclimatization and rest/water/shade practices.",
      affectedIndustries: ["Construction", "Manufacturing", "Transportation & Logistics", "Utilities"],
      affectedCharacteristics: ["Heat exposure"],
      applies: { match: "ALL", conditions: [{ field: "safety.exposures", operator: "includes", value: ["Heat exposure"] }] },
      watch: { match: "ALL", conditions: [{ field: "safety.oshaApplicable", operator: "is_true" }] },
      recommendedAction: "Review the heat illness prevention plan before next season; confirm acclimatization procedures for new hires.",
      urgency: "LOW",
      sourceUrl: "https://www.osha.gov/heat-exposure",
      sourceLabel: "OSHA — Heat",
      commentary: "Inspectors ask for the written plan first. Having one — even a short one — changes the tone of the visit.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-28),
      createdBy: "u-lindsey",
      publishedAt: ts(-27),
    },
    {
      id: "sig-fed-contractor",
      title: "Federal contractors: affirmative action program obligations changed",
      domain: "HR",
      jurisdiction: "Federal",
      regulatoryBody: "OFCCP",
      publishedDate: day(-33),
      summary: "Executive Order 11246 was rescinded in 2025, changing affirmative action program obligations for federal contractors. Obligations under Section 503 and VEVRAA remain. Federal contractors should review which plans they still maintain.",
      affectedIndustries: ["All industries"],
      affectedCharacteristics: ["Federal contractor"],
      applies: { match: "ALL", conditions: [{ field: "hr.federalContractor", operator: "is_true" }] },
      recommendedAction: "Review AAP obligations with Ironwood HR and confirm which plans remain in place.",
      urgency: "LOW",
      sourceUrl: "https://www.dol.gov/agencies/ofccp",
      sourceLabel: "OFCCP",
      commentary: "Do not discard existing plans without a documented decision. Keep the Section 503 and VEVRAA components current.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-34),
      createdBy: "u-emily",
      publishedAt: ts(-33),
    },
    {
      id: "sig-eld",
      title: "FMCSA removes ELDs from the self-certified registered devices list",
      domain: "DOT",
      jurisdiction: "Federal",
      regulatoryBody: "FMCSA",
      publishedDate: day(-2),
      summary: "FMCSA periodically revokes ELD self-certifications. Carriers using a revoked device must replace it within the published window. Ironwood checks the registry against each managed client's device list.",
      affectedIndustries: ["Transportation & Logistics", "Construction"],
      affectedCharacteristics: ["DOT-regulated", "Employs CDL drivers"],
      applies: { match: "ALL", conditions: [{ field: "dot.regulated", operator: "is_true" }, { field: "dot.cdlDrivers", operator: "gt", value: 0 }] },
      recommendedAction: "Confirm your ELD vendor and model are not on the revocation list.",
      urgency: "MEDIUM",
      sourceUrl: "https://eld.fmcsa.dot.gov/List",
      sourceLabel: "FMCSA ELD registry",
      commentary: "We have checked managed clients' device lists against the current registry. No action is required unless we contact you.",
      status: "PUBLISHED",
      isDemo: true,
      createdAt: ts(-2),
      createdBy: "u-roxanne",
      publishedAt: ts(-2),
    },
    {
      id: "sig-eeo1-draft",
      title: "EEO-1 Component 1 data collection — upcoming filing window",
      domain: "HR",
      jurisdiction: "Federal",
      regulatoryBody: "EEOC",
      publishedDate: day(0),
      summary: "The EEOC will announce the next EEO-1 Component 1 collection window. Covered employers (100+ employees, or federal contractors with 50+) should prepare workforce snapshot data.",
      affectedIndustries: ["All industries"],
      affectedCharacteristics: ["100+ employees", "Federal contractor with 50+ employees"],
      applies: { match: "ANY", conditions: [{ field: "org.employeeCount", operator: "gte", value: 100 }, { field: "hr.eeoApplicable", operator: "is_true" }] },
      recommendedAction: "Confirm the workforce snapshot period and prepare job-category data.",
      urgency: "LOW",
      sourceUrl: "https://www.eeocdata.org/eeo1",
      sourceLabel: "EEOC — EEO-1",
      commentary: "Draft — awaiting EEOC announcement of the collection window before publishing.",
      status: "DRAFT",
      isDemo: true,
      createdAt: ts(0, 8),
      createdBy: "u-emily",
    },
  ];

  /* ---------------- Matches (computed, then selected overrides) ---------------- */
  const matches: SignalMatch[] = [];
  for (const s of signals) {
    if (s.status !== "PUBLISHED") continue;
    for (const org of organizations) {
      const v = evaluateSignalForOrg(s, org);
      matches.push({ id: `m-${s.id}-${org.id}`, signalId: s.id, orgId: org.id, status: v.status, reasons: v.reasons, evaluatedAt: s.publishedAt ?? s.createdAt });
    }
  }
  const override = (sigId: string, orgId: string, note: string) => {
    const m = matches.find((x) => x.signalId === sigId && x.orgId === orgId);
    if (m) {
      m.status = "HANDLING";
      m.overrideBy = "u-roxanne";
      m.overrideNote = note;
    }
  };
  override("sig-dq-medical", "org-cimarron", "Roxanne is completing the DQ file review and scheduling physicals.");
  override("sig-eld", "org-cimarron", "Device list verified against registry — no revoked units.");
  override("sig-eld", "org-meridian", "Device list verified against registry — no revoked units.");
  override("sig-clearinghouse", "org-meridian", "Annual queries scheduled by Ironwood DOT for all 12 drivers.");

  /* ---------------- Actions ---------------- */
  const actions: Action[] = [
    // Lone Star
    { id: "act-ls-i9", orgId: "org-lonestar", title: "I-9 documentation review", domain: "HR", description: "Four employee records require documentation review following the I-9 self-audit.", recommendedAction: "Review flagged forms with your Ironwood HR consultant.", ironwoodOwnerId: "c-emily", clientOwnerId: "ct-dana", priority: "HIGH", dueDate: day(11), status: "IN_PROGRESS", notes: [{ id: "n1", authorId: "u-emily", authorName: "Emily Hartigan", text: "Flagged records: 2 missing Section 2 signatures, 1 expired List B document, 1 reverification due.", createdAt: ts(-6) }], resourceIds: ["doc-ls-i9-checklist"], recurrence: "NONE", signalId: "sig-i9", createdAt: ts(-8), createdBy: "u-emily" },
    { id: "act-ls-ada", orgId: "org-lonestar", title: "Adopt ADA accommodation procedure", domain: "HR", description: "No written accommodation request process is on file. A documented interactive process protects both the employee and the company.", recommendedAction: "Approve the draft procedure Ironwood provided and add it to the handbook update.", ironwoodOwnerId: "c-emily", clientOwnerId: "ct-dana", priority: "MEDIUM", dueDate: day(25), status: "NEW", notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-5), createdBy: "u-emily" },
    { id: "act-ls-fall", orgId: "org-lonestar", title: "Fall protection program development", domain: "SAFETY", description: "Mezzanine and loading dock work at Conroe involves fall exposure above 4 ft. No written program is recorded.", recommendedAction: "Ironwood Safety is drafting the program; client to confirm equipment inventory.", ironwoodOwnerId: "c-lindsey", clientOwnerId: "ct-tom", priority: "HIGH", dueDate: day(40), status: "WAITING_ON_IRONWOOD", notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-20), createdBy: "u-lindsey" },
    { id: "act-ls-forklift", orgId: "org-lonestar", title: "Forklift operator re-evaluations — Conroe", domain: "SAFETY", description: "Six operators are past their three-year evaluation date.", recommendedAction: "Schedule evaluations with the Ironwood Safety consultant and record results.", ironwoodOwnerId: "c-lindsey", clientOwnerId: "ct-tom", priority: "MEDIUM", dueDate: day(-3), status: "WAITING_ON_CLIENT", notes: [{ id: "n2", authorId: "u-lindsey", authorName: "Lindsey Moreau", text: "Waiting on a date from Tom — proposed two options for next week.", createdAt: ts(-2) }], resourceIds: [], recurrence: "NONE", createdAt: ts(-30), createdBy: "u-lindsey" },
    { id: "act-ls-harass", orgId: "org-lonestar", title: "Supervisor harassment-prevention training", domain: "HR", description: "Annual supervisor training to align with the Texas policy review.", recommendedAction: "Pick a session date; Ironwood HR delivers the training.", ironwoodOwnerId: "c-emily", clientOwnerId: "ct-dana", priority: "LOW", dueDate: day(50), status: "NEW", notes: [], resourceIds: [], recurrence: "ANNUAL", signalId: "sig-tx-harassment", createdAt: ts(-4), createdBy: "u-emily" },
    { id: "act-ls-ack", orgId: "org-lonestar", title: "Collect handbook acknowledgments", domain: "HR", description: "Signed acknowledgments for the current handbook edition.", clientOwnerId: "ct-dana", priority: "LOW", status: "COMPLETE", completedAt: ts(-20), notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-45), createdBy: "u-emily" },
    { id: "act-ls-300a", orgId: "org-lonestar", title: "Post OSHA 300A summary", domain: "SAFETY", description: "Annual posting of the prior-year summary.", clientOwnerId: "ct-tom", priority: "MEDIUM", status: "COMPLETE", completedAt: ts(-240), notes: [], resourceIds: [], recurrence: "ANNUAL", createdAt: ts(-260), createdBy: "u-lindsey" },

    // Cimarron
    { id: "act-cf-medcard", orgId: "org-cimarron", title: "Driver medical certificate expirations", domain: "DOT", description: "Two driver qualification records have medical certificates expiring within 30 days.", recommendedAction: "Schedule DOT physicals and upload new certificates to the DQ files.", ironwoodOwnerId: "c-roxanne", clientOwnerId: "ct-carla", priority: "HIGH", dueDate: day(20), status: "NEW", notes: [], resourceIds: [], recurrence: "NONE", signalId: "sig-dq-medical", createdAt: ts(-3), createdBy: "u-roxanne" },
    { id: "act-cf-ch", orgId: "org-cimarron", title: "Annual Clearinghouse queries — 45 drivers", domain: "DOT", description: "Limited queries due for the annual cycle. Consent forms on file for 43 of 45 drivers.", recommendedAction: "Collect the two outstanding consent forms; Ironwood runs the queries.", ironwoodOwnerId: "c-roxanne", clientOwnerId: "ct-carla", priority: "HIGH", dueDate: day(38), status: "IN_PROGRESS", notes: [], resourceIds: ["doc-cf-consent"], recurrence: "ANNUAL", signalId: "sig-clearinghouse", createdAt: ts(-12), createdBy: "u-roxanne" },
    { id: "act-cf-random", orgId: "org-cimarron", title: "Random testing pool reconciliation — Q4", domain: "DOT", description: "Reconcile the consortium roster against current drivers before Q4 selections.", ironwoodOwnerId: "c-roxanne", priority: "MEDIUM", dueDate: day(14), status: "WAITING_ON_IRONWOOD", notes: [], resourceIds: [], recurrence: "QUARTERLY", createdAt: ts(-9), createdBy: "u-roxanne" },
    { id: "act-cf-isn", orgId: "org-cimarron", title: "ISNetworld enrollment for Permian customer", domain: "CONTRACTOR", description: "A customer requires an ISNetworld grade of B or better before awarding Q1 lanes.", recommendedAction: "Decide whether to enroll; Ironwood Contractor Compliance can manage the setup and questionnaire.", clientOwnerId: "ct-mike", priority: "MEDIUM", dueDate: day(30), status: "NEW", notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-7), createdBy: "u-kyle" },
    { id: "act-cf-inspections", orgId: "org-cimarron", title: "Annual vehicle inspections — 6 units", domain: "DOT", description: "Six tractors are past their annual inspection date per the maintenance file review.", recommendedAction: "Schedule inspections and send the reports to Ironwood for the vehicle files.", ironwoodOwnerId: "c-roxanne", clientOwnerId: "ct-carla", priority: "HIGH", dueDate: day(-5), status: "WAITING_ON_CLIENT", notes: [{ id: "n3", authorId: "u-roxanne", authorName: "Roxanne Delgado", text: "Units 204, 207, 211, 215, 218, 221. Shop has capacity next week per Carla.", createdAt: ts(-4) }], resourceIds: [], recurrence: "ANNUAL", createdAt: ts(-25), createdBy: "u-roxanne" },
    { id: "act-cf-handbook", orgId: "org-cimarron", title: "Handbook update — Oklahoma and Kansas addenda", domain: "HR", description: "State addenda for the two states with employees.", ironwoodOwnerId: "c-emily", clientOwnerId: "ct-carla", priority: "LOW", dueDate: day(45), status: "WAITING_ON_IRONWOOD", notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-15), createdBy: "u-emily" },
    { id: "act-cf-mvr", orgId: "org-cimarron", title: "Annual MVR review — all drivers", domain: "DOT", description: "Motor vehicle records pulled and reviewed for all 45 CDL drivers.", ironwoodOwnerId: "c-roxanne", priority: "MEDIUM", status: "COMPLETE", completedAt: ts(-15), notes: [], resourceIds: [], recurrence: "ANNUAL", createdAt: ts(-40), createdBy: "u-roxanne" },

    // Meridian
    { id: "act-mi-osha30", orgId: "org-meridian", title: "Nevada OSHA-30 for site supervisors — Reno project", domain: "SAFETY", description: "Three supervisors assigned to the Reno project do not have current OSHA-30 cards.", recommendedAction: "Enroll supervisors in the Ironwood-scheduled OSHA-30 session before mobilization.", ironwoodOwnerId: "c-lindsey", clientOwnerId: "ct-priya", priority: "CRITICAL", dueDate: day(18), status: "IN_PROGRESS", notes: [{ id: "n4", authorId: "u-lindsey", authorName: "Lindsey Moreau", text: "Session booked for next week; two of three confirmed.", createdAt: ts(-1) }], resourceIds: ["doc-mi-nv-roster"], recurrence: "NONE", signalId: "sig-nv-osha10", createdAt: ts(-11), createdBy: "u-lindsey" },
    { id: "act-mi-confined", orgId: "org-meridian", title: "Confined space rescue plan — Las Vegas tank site", domain: "SAFETY", description: "Permit-required entries begin in two weeks; a site-specific rescue plan is required.", recommendedAction: "Confirm rescue service arrangement and complete the site plan with Ironwood Safety.", ironwoodOwnerId: "c-lindsey", clientOwnerId: "ct-priya", priority: "HIGH", dueDate: day(9), status: "NEW", notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-2), createdBy: "u-lindsey" },
    { id: "act-mi-avetta", orgId: "org-meridian", title: "Avetta questionnaire renewal", domain: "CONTRACTOR", description: "Annual questionnaire expires in six days. Grade A is required by two refinery customers.", recommendedAction: "Ironwood is completing the questionnaire; client to approve the updated EMR letter.", ironwoodOwnerId: "c-marcus", clientOwnerId: "ct-priya", priority: "HIGH", dueDate: day(6), status: "IN_PROGRESS", notes: [], resourceIds: [], recurrence: "ANNUAL", signalId: "sig-coi-cycle", createdAt: ts(-14), createdBy: "u-kyle" },
    { id: "act-mi-coi", orgId: "org-meridian", title: "COI renewal — general liability and workers' comp", domain: "CONTRACTOR", description: "Certificates on all three portals expire on the same date.", recommendedAction: "Request renewal certificates from the broker and send to Ironwood for upload.", ironwoodOwnerId: "c-marcus", clientOwnerId: "ct-greg", priority: "MEDIUM", dueDate: day(22), status: "NEW", notes: [], resourceIds: [], recurrence: "ANNUAL", signalId: "sig-coi-cycle", createdAt: ts(-5), createdBy: "u-kyle" },
    { id: "act-mi-mo", orgId: "org-meridian", title: "Missouri handbook addendum update", domain: "HR", description: "Leave language for the St. Louis office following the 2025 change.", ironwoodOwnerId: "c-emily", clientOwnerId: "ct-priya", priority: "LOW", dueDate: day(35), status: "WAITING_ON_IRONWOOD", notes: [], resourceIds: [], recurrence: "NONE", signalId: "sig-mo-leave", createdAt: ts(-16), createdBy: "u-emily" },
    { id: "act-mi-ch", orgId: "org-meridian", title: "Annual Clearinghouse queries — 12 CDL drivers", domain: "DOT", description: "Annual limited queries for the fleet.", ironwoodOwnerId: "c-roxanne", priority: "MEDIUM", dueDate: day(45), status: "NEW", notes: [], resourceIds: [], recurrence: "ANNUAL", signalId: "sig-clearinghouse", createdAt: ts(-10), createdBy: "u-roxanne" },
    { id: "act-mi-heat", orgId: "org-meridian", title: "Heat illness prevention plan review", domain: "SAFETY", description: "Update the written plan before next season; add acclimatization steps for new hires.", ironwoodOwnerId: "c-lindsey", clientOwnerId: "ct-priya", priority: "LOW", dueDate: day(60), status: "NEW", notes: [], resourceIds: [], recurrence: "ANNUAL", signalId: "sig-heat", createdAt: ts(-20), createdBy: "u-lindsey" },
    { id: "act-mi-ravs", orgId: "org-meridian", title: "ISNetworld RAVS program updates", domain: "CONTRACTOR", description: "Uploaded revised fall protection and confined space programs.", ironwoodOwnerId: "c-marcus", priority: "MEDIUM", status: "COMPLETE", completedAt: ts(-8), notes: [], resourceIds: [], recurrence: "NONE", createdAt: ts(-20), createdBy: "u-kyle" },
    { id: "act-mi-300", orgId: "org-meridian", title: "OSHA 300 log reconciliation — Q3", domain: "SAFETY", description: "Quarterly reconciliation of the injury and illness log.", ironwoodOwnerId: "c-lindsey", priority: "MEDIUM", status: "COMPLETE", completedAt: ts(-12), notes: [], resourceIds: [], recurrence: "QUARTERLY", signalId: "sig-osha-300a", createdAt: ts(-30), createdBy: "u-lindsey" },
  ];

  /* ---------------- Ironwood work ---------------- */
  const workItems: WorkItem[] = [
    { id: "w-ls-handbook", orgId: "org-lonestar", title: "Employee handbook update", domain: "HR", consultantId: "c-emily", status: "IN_PROGRESS", statusLabel: "Drafting", progress: 45, startedAt: ts(-18), targetDate: day(28), summary: "Full revision including Texas addendum, ADA procedure and updated leave language." },
    { id: "w-ls-osha", orgId: "org-lonestar", title: "OSHA program review", domain: "SAFETY", consultantId: "c-lindsey", status: "SCHEDULED", statusLabel: "Scheduled", progress: 0, startedAt: ts(-2), targetDate: day(12), summary: "On-site review of written programs and training records at Conroe." },
    { id: "w-ls-fall", orgId: "org-lonestar", title: "Fall protection program draft", domain: "SAFETY", consultantId: "c-lindsey", status: "IN_PROGRESS", statusLabel: "Drafting", progress: 30, startedAt: ts(-10), targetDate: day(40), summary: "Site-specific program for mezzanine and dock work." },
    { id: "w-cf-dq", orgId: "org-cimarron", title: "DOT file review", domain: "DOT", consultantId: "c-roxanne", status: "IN_PROGRESS", statusLabel: "70% complete", progress: 70, startedAt: ts(-21), targetDate: day(10), summary: "Line-by-line review of all 45 DQ files and 52 vehicle files." },
    { id: "w-cf-handbook", orgId: "org-cimarron", title: "Handbook update — OK & KS addenda", domain: "HR", consultantId: "c-emily", status: "IN_PROGRESS", statusLabel: "Drafting", progress: 55, startedAt: ts(-15), targetDate: day(45), summary: "State addenda plus updated drug & alcohol policy language." },
    { id: "w-cf-random", orgId: "org-cimarron", title: "Random pool reconciliation", domain: "DOT", consultantId: "c-roxanne", status: "IN_PROGRESS", statusLabel: "In progress", progress: 20, startedAt: ts(-3), targetDate: day(14), summary: "Reconcile consortium roster before Q4 selections." },
    { id: "w-mi-nv", orgId: "org-meridian", title: "Nevada site safety plan — Reno", domain: "SAFETY", consultantId: "c-lindsey", status: "IN_PROGRESS", statusLabel: "60% complete", progress: 60, startedAt: ts(-14), targetDate: day(16), summary: "Site-specific safety plan, training roster and Nevada OSHA requirements." },
    { id: "w-mi-avetta", orgId: "org-meridian", title: "Avetta renewal package", domain: "CONTRACTOR", consultantId: "c-marcus", status: "REVIEW", statusLabel: "In review", progress: 80, startedAt: ts(-12), targetDate: day(6), summary: "Questionnaire, EMR letter and updated program uploads." },
    { id: "w-mi-mo", orgId: "org-meridian", title: "Missouri handbook addendum", domain: "HR", consultantId: "c-emily", status: "IN_PROGRESS", statusLabel: "Drafting", progress: 25, startedAt: ts(-9), targetDate: day(35), summary: "Leave language update for St. Louis employees." },
    { id: "w-mi-dq", orgId: "org-meridian", title: "DQ file audit — 12 drivers", domain: "DOT", consultantId: "c-roxanne", status: "COMPLETE", statusLabel: "Complete", progress: 100, startedAt: ts(-40), completedAt: ts(-8), summary: "All 12 files complete; two medical cards renewed." },
  ];

  /* ---------------- Deadlines ---------------- */
  const deadlines: Deadline[] = [
    // Lone Star
    { id: "dl-ls-1", orgId: "org-lonestar", title: "I-9 review due", domain: "HR", date: day(11), type: "DOCUMENT", relatedActionId: "act-ls-i9", recurrence: "NONE", status: "UPCOMING", description: "Four flagged records." },
    { id: "dl-ls-2", orgId: "org-lonestar", title: "Forklift operator evaluations", domain: "SAFETY", date: day(-3), type: "TRAINING", relatedActionId: "act-ls-forklift", recurrence: "NONE", status: "UPCOMING", description: "Six operators past the three-year mark." },
    { id: "dl-ls-3", orgId: "org-lonestar", title: "Hearing conservation audiograms", domain: "SAFETY", date: day(24), type: "TRAINING", recurrence: "ANNUAL", status: "UPCOMING", description: "Annual audiograms for the fabrication floor." },
    { id: "dl-ls-4", orgId: "org-lonestar", title: "Fire extinguisher inspection", domain: "SAFETY", date: day(5), type: "REVIEW", recurrence: "MONTHLY", status: "UPCOMING" },
    { id: "dl-ls-5", orgId: "org-lonestar", title: "Handbook review", domain: "HR", date: day(28), type: "POLICY", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-ls-6", orgId: "org-lonestar", title: "ACA 1095-C preparation", domain: "HR", date: day(75), type: "REGULATORY", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-ls-7", orgId: "org-lonestar", title: "OSHA 300A posting window opens", domain: "SAFETY", date: day(117), type: "REGULATORY", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-ls-8", orgId: "org-lonestar", title: "Supervisor harassment training", domain: "HR", date: day(50), type: "TRAINING", relatedActionId: "act-ls-harass", recurrence: "ANNUAL", status: "UPCOMING" },

    // Cimarron
    { id: "dl-cf-1", orgId: "org-cimarron", title: "Medical card — J. Alvarez", domain: "DOT", date: day(12), type: "MEDICAL_CARD", relatedActionId: "act-cf-medcard", recurrence: "NONE", status: "UPCOMING" },
    { id: "dl-cf-2", orgId: "org-cimarron", title: "Medical card — T. Nguyen", domain: "DOT", date: day(20), type: "MEDICAL_CARD", relatedActionId: "act-cf-medcard", recurrence: "NONE", status: "UPCOMING" },
    { id: "dl-cf-3", orgId: "org-cimarron", title: "Annual inspections — 6 units", domain: "DOT", date: day(-5), type: "VEHICLE", relatedActionId: "act-cf-inspections", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-cf-4", orgId: "org-cimarron", title: "Q4 random selections", domain: "DOT", date: day(14), type: "REGULATORY", relatedActionId: "act-cf-random", recurrence: "QUARTERLY", status: "UPCOMING" },
    { id: "dl-cf-5", orgId: "org-cimarron", title: "Auto liability COI expires", domain: "CONTRACTOR", date: day(41), type: "INSURANCE", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-cf-6", orgId: "org-cimarron", title: "Clearinghouse annual queries", domain: "DOT", date: day(38), type: "REGULATORY", relatedActionId: "act-cf-ch", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-cf-7", orgId: "org-cimarron", title: "CDL renewal — R. Pacheco", domain: "DOT", date: day(3), type: "CDL", recurrence: "NONE", status: "UPCOMING" },
    { id: "dl-cf-8", orgId: "org-cimarron", title: "UCR registration", domain: "DOT", date: day(85), type: "REGULATORY", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-cf-9", orgId: "org-cimarron", title: "Handbook addenda delivery", domain: "HR", date: day(45), type: "POLICY", relatedActionId: "act-cf-handbook", recurrence: "NONE", status: "UPCOMING" },

    // Meridian
    { id: "dl-mi-1", orgId: "org-meridian", title: "Avetta questionnaire expires", domain: "CONTRACTOR", date: day(6), type: "PORTAL", relatedActionId: "act-mi-avetta", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-mi-2", orgId: "org-meridian", title: "GL and WC certificates expire", domain: "CONTRACTOR", date: day(22), type: "INSURANCE", relatedActionId: "act-mi-coi", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-mi-3", orgId: "org-meridian", title: "OSHA-30 session — Reno supervisors", domain: "SAFETY", date: day(8), type: "TRAINING", relatedActionId: "act-mi-osha30", recurrence: "NONE", status: "UPCOMING" },
    { id: "dl-mi-4", orgId: "org-meridian", title: "Las Vegas confined space entries begin", domain: "SAFETY", date: day(14), type: "REVIEW", relatedActionId: "act-mi-confined", recurrence: "NONE", status: "UPCOMING" },
    { id: "dl-mi-5", orgId: "org-meridian", title: "Excavation competent-person refresher", domain: "SAFETY", date: day(33), type: "TRAINING", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-mi-6", orgId: "org-meridian", title: "Clearinghouse annual queries", domain: "DOT", date: day(45), type: "REGULATORY", relatedActionId: "act-mi-ch", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-mi-7", orgId: "org-meridian", title: "Veriforce OQ evaluations — 8 technicians", domain: "CONTRACTOR", date: day(52), type: "CERTIFICATION", recurrence: "NONE", status: "UPCOMING" },
    { id: "dl-mi-8", orgId: "org-meridian", title: "EEO-1 snapshot period", domain: "HR", date: day(68), type: "REGULATORY", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-mi-9", orgId: "org-meridian", title: "Annual safety audit — Beaumont yard", domain: "SAFETY", date: day(80), type: "AUDIT", recurrence: "ANNUAL", status: "UPCOMING" },
    { id: "dl-mi-10", orgId: "org-meridian", title: "Medical card — D. Kessler", domain: "DOT", date: day(2), type: "MEDICAL_CARD", recurrence: "NONE", status: "UPCOMING" },
  ];

  /* ---------------- Documents ---------------- */
  const documents: Document[] = [
    { id: "doc-ls-handbook", orgId: "org-lonestar", title: "Employee Handbook", description: "Current edition in use; revision in progress with Ironwood HR.", category: "POLICY", domain: "HR", version: "4.2", uploadedAt: ts(-470), ownerName: "Dana Whitfield", reviewDate: day(28), fileName: "LSF-Handbook-v4.2.pdf", sizeLabel: "1.8 MB" },
    { id: "doc-ls-i9-checklist", orgId: "org-lonestar", title: "I-9 Self-Audit Checklist", description: "Ironwood checklist used in the current review.", category: "IRONWOOD", domain: "HR", version: "2025.1", uploadedAt: ts(-8), ownerName: "Emily Hartigan", fileName: "Ironwood-I9-Checklist.pdf", sizeLabel: "240 KB" },
    { id: "doc-ls-hazcom", orgId: "org-lonestar", title: "Hazard Communication Program", description: "Written program with SDS index.", category: "SAFETY", domain: "SAFETY", version: "3.0", uploadedAt: ts(-200), ownerName: "Tom Reyes", reviewDate: day(165), fileName: "LSF-HazCom-v3.pdf", sizeLabel: "920 KB" },
    { id: "doc-ls-eap", orgId: "org-lonestar", title: "Emergency Action Plan — Conroe", description: "Site-specific EAP with evacuation maps.", category: "SAFETY", domain: "SAFETY", version: "2.1", uploadedAt: ts(-150), ownerName: "Tom Reyes", reviewDate: day(215), fileName: "LSF-EAP-Conroe.pdf", sizeLabel: "3.1 MB" },
    { id: "doc-ls-pit", orgId: "org-lonestar", title: "Forklift Operator Evaluation Form", description: "Three-year evaluation form.", category: "FORM", domain: "SAFETY", version: "1.0", uploadedAt: ts(-400), ownerName: "Lindsey Moreau", fileName: "PIT-Eval-Form.pdf", sizeLabel: "110 KB" },
    { id: "doc-ls-harass", orgId: "org-lonestar", title: "Anti-Harassment Policy", description: "Standalone policy with reporting channels.", category: "POLICY", domain: "HR", version: "2.0", uploadedAt: ts(-300), ownerName: "Dana Whitfield", reviewDate: day(65), fileName: "LSF-AntiHarassment.pdf", sizeLabel: "180 KB" },
    { id: "doc-ls-training", orgId: "org-lonestar", title: "HazCom Training Deck", description: "Annual refresher training.", category: "TRAINING", domain: "SAFETY", version: "2026", uploadedAt: ts(-60), ownerName: "Lindsey Moreau", fileName: "HazCom-Refresher-2026.pptx", sizeLabel: "6.4 MB" },

    { id: "doc-cf-da", orgId: "org-cimarron", title: "Drug & Alcohol Policy", description: "FMCSA Part 382 policy with consortium details.", category: "DOT", domain: "DOT", version: "5.1", uploadedAt: ts(-180), ownerName: "Carla Jensen", reviewDate: day(185), fileName: "CFL-DA-Policy-v5.1.pdf", sizeLabel: "640 KB" },
    { id: "doc-cf-consent", orgId: "org-cimarron", title: "Clearinghouse Limited Query Consent", description: "Driver consent form template.", category: "FORM", domain: "DOT", version: "1.2", uploadedAt: ts(-365), ownerName: "Roxanne Delgado", fileName: "CH-Consent.pdf", sizeLabel: "95 KB" },
    { id: "doc-cf-dq-checklist", orgId: "org-cimarron", title: "DQ File Contents Checklist", description: "Ironwood checklist used in the file review.", category: "IRONWOOD", domain: "DOT", version: "2025.2", uploadedAt: ts(-21), ownerName: "Roxanne Delgado", fileName: "Ironwood-DQ-Checklist.pdf", sizeLabel: "210 KB" },
    { id: "doc-cf-handbook", orgId: "org-cimarron", title: "Employee Handbook", description: "Current edition; state addenda in progress.", category: "POLICY", domain: "HR", version: "3.0", uploadedAt: ts(-300), ownerName: "Carla Jensen", reviewDate: day(45), fileName: "CFL-Handbook-v3.pdf", sizeLabel: "1.4 MB" },
    { id: "doc-cf-hazcom", orgId: "org-cimarron", title: "Hazard Communication Program — Shop", description: "Written program for the Tulsa shop.", category: "SAFETY", domain: "SAFETY", version: "1.0", uploadedAt: ts(-500), ownerName: "Carla Jensen", reviewDate: day(-135), fileName: "CFL-HazCom.pdf", sizeLabel: "480 KB" },
    { id: "doc-cf-coi", orgId: "org-cimarron", title: "Certificate of Insurance — Auto Liability", description: "Current COI.", category: "CONTRACTOR", domain: "CONTRACTOR", version: "2026", uploadedAt: ts(-320), ownerName: "Mike Oduya", expirationDate: day(41), fileName: "CFL-COI-Auto.pdf", sizeLabel: "320 KB" },
    { id: "doc-cf-maint", orgId: "org-cimarron", title: "Preventive Maintenance Schedule", description: "Fleet PM intervals and inspection calendar.", category: "DOT", domain: "DOT", version: "2026.Q3", uploadedAt: ts(-45), ownerName: "Carla Jensen", fileName: "CFL-PM-Schedule.xlsx", sizeLabel: "88 KB" },

    { id: "doc-mi-ssp", orgId: "org-meridian", title: "Corporate Safety Manual", description: "Master written programs document.", category: "SAFETY", domain: "SAFETY", version: "8.0", uploadedAt: ts(-120), ownerName: "Priya Natarajan", reviewDate: day(245), fileName: "MIC-Safety-Manual-v8.pdf", sizeLabel: "12.6 MB" },
    { id: "doc-mi-fall", orgId: "org-meridian", title: "Fall Protection Program", description: "Revised program uploaded to ISNetworld.", category: "SAFETY", domain: "SAFETY", version: "4.1", uploadedAt: ts(-8), ownerName: "Lindsey Moreau", reviewDate: day(357), fileName: "MIC-FallProtection-v4.1.pdf", sizeLabel: "1.1 MB" },
    { id: "doc-mi-confined", orgId: "org-meridian", title: "Confined Space Program", description: "Permit-required confined space program.", category: "SAFETY", domain: "SAFETY", version: "3.2", uploadedAt: ts(-8), ownerName: "Lindsey Moreau", reviewDate: day(357), fileName: "MIC-ConfinedSpace-v3.2.pdf", sizeLabel: "980 KB" },
    { id: "doc-mi-nv-roster", orgId: "org-meridian", title: "Nevada Training Roster", description: "OSHA-10/30 card status for Reno crews.", category: "TRAINING", domain: "SAFETY", version: "Oct", uploadedAt: ts(-3), ownerName: "Lindsey Moreau", fileName: "NV-Training-Roster.xlsx", sizeLabel: "64 KB" },
    { id: "doc-mi-handbook", orgId: "org-meridian", title: "Employee Handbook", description: "Current edition with TX, MO and NV addenda.", category: "POLICY", domain: "HR", version: "6.0", uploadedAt: ts(-95), ownerName: "Priya Natarajan", reviewDate: day(270), fileName: "MIC-Handbook-v6.pdf", sizeLabel: "2.2 MB" },
    { id: "doc-mi-coi-gl", orgId: "org-meridian", title: "Certificate of Insurance — GL / WC", description: "Portal copy.", category: "CONTRACTOR", domain: "CONTRACTOR", version: "2026", uploadedAt: ts(-340), ownerName: "Greg Hollis", expirationDate: day(22), fileName: "MIC-COI-GL-WC.pdf", sizeLabel: "410 KB" },
    { id: "doc-mi-da", orgId: "org-meridian", title: "Drug & Alcohol Policy", description: "Part 382 policy for CDL drivers and non-DOT policy for all employees.", category: "DOT", domain: "DOT", version: "4.0", uploadedAt: ts(-200), ownerName: "Luis Ortega", reviewDate: day(165), fileName: "MIC-DA-Policy.pdf", sizeLabel: "720 KB" },
    { id: "doc-mi-heat", orgId: "org-meridian", title: "Heat Illness Prevention Plan", description: "Written plan — review scheduled before next season.", category: "SAFETY", domain: "SAFETY", version: "2.0", uploadedAt: ts(-400), ownerName: "Priya Natarajan", reviewDate: day(60), fileName: "MIC-Heat-Plan.pdf", sizeLabel: "350 KB" },
    { id: "doc-mi-template", orgId: "org-meridian", title: "Site-Specific Safety Plan Template", description: "Ironwood template for new projects.", category: "TEMPLATE", domain: "SAFETY", version: "2025.3", uploadedAt: ts(-100), ownerName: "Lindsey Moreau", fileName: "Ironwood-SSSP-Template.docx", sizeLabel: "180 KB" },
  ];

  /* ---------------- Questions ---------------- */
  const lonestar = organizations[0];
  const cimarron = organizations[1];
  const meridian = organizations[2];

  const q1Text = "An employee has been on short-term disability while attending rehabilitation. We do not qualify for FMLA. Can we terminate?";
  const q2Text = "Can we require a doctor's note for any absence longer than two days? We have a few people with attendance issues.";
  const q3Text = "One of our drivers tested positive on a random test this morning. He says the result is wrong. What do we have to do today?";
  const q4Text = "Does our Nevada crew need OSHA-10 cards before they mobilize next month, or can they complete it on site?";
  const q5Text = "Our refinery customer is asking for a site-specific safety plan before we start. Do we have a template, and does Ironwood build it or do we?";

  const questions: Question[] = [
    {
      id: "q-ls-1", orgId: "org-lonestar", submittedByUserId: "u-dana", submittedByName: "Dana Whitfield", text: q1Text, domain: "HR", urgency: "HIGH", submittedAt: ts(-5, 10), assignedConsultantId: "c-emily", status: "RESPONDED",
      triage: triageQuestion(q1Text, lonestar),
      internalNotes: [{ id: "in1", authorId: "u-emily", authorName: "Emily Hartigan", text: "Called Dana. Employee is in a 30-day program; STD carrier has return-to-work estimate. Advised pause.", createdAt: ts(-5, 14), internal: true }],
      responses: [{ id: "r1", consultantId: "c-emily", consultantName: "Emily Hartigan", text: "Please do not take any employment action yet. Even if this employee is not FMLA-eligible, ADA accommodation obligations very likely do, and a leave for rehabilitation can be a reasonable accommodation. Let's document the interactive process: I'll send you a request-for-information letter today and we'll set a check-in with the employee's return-to-work estimate. I'll call you at 2:00 to walk through it.", createdAt: ts(-5, 13) }],
    },
    {
      id: "q-ls-2", orgId: "org-lonestar", submittedByUserId: "u-tom", submittedByName: "Tom Reyes", text: q2Text, domain: "HR", urgency: "LOW", submittedAt: ts(0, 7), status: "NEW",
      triage: triageQuestion(q2Text, lonestar), internalNotes: [], responses: [],
    },
    {
      id: "q-cf-1", orgId: "org-cimarron", submittedByUserId: "u-carla", submittedByName: "Carla Jensen", text: q3Text, domain: "DOT", urgency: "HIGH", submittedAt: ts(0, 8), assignedConsultantId: "c-roxanne", status: "REVIEWING",
      triage: triageQuestion(q3Text, cimarron),
      internalNotes: [{ id: "in2", authorId: "u-roxanne", authorName: "Roxanne Delgado", text: "Confirm MRO verification status before responding. Driver must be removed from safety-sensitive duty immediately regardless of split-specimen request.", createdAt: ts(0, 8), internal: true }],
      responses: [],
    },
    {
      id: "q-mi-1", orgId: "org-meridian", submittedByUserId: "u-priya", submittedByName: "Priya Natarajan", text: q4Text, domain: "SAFETY", urgency: "MEDIUM", submittedAt: ts(-13, 9), assignedConsultantId: "c-lindsey", status: "CLOSED",
      triage: triageQuestion(q4Text, meridian), internalNotes: [],
      responses: [{ id: "r2", consultantId: "c-lindsey", consultantName: "Lindsey Moreau", text: "Nevada allows a window after hire, but your customer's site rules require cards on day one. We've pulled the roster — 11 workers and 3 supervisors need training. I've scheduled OSHA-10 for next week and OSHA-30 for the supervisors; both will be complete before mobilization. I created an action item so you can track it.", createdAt: ts(-12, 11) }],
    },
    {
      id: "q-mi-2", orgId: "org-meridian", submittedByUserId: "u-greg", submittedByName: "Greg Hollis", text: q5Text, domain: "SAFETY", urgency: "MEDIUM", submittedAt: ts(-2, 15), assignedConsultantId: "c-lindsey", status: "FOLLOW_UP_REQUIRED",
      triage: triageQuestion(q5Text, meridian), internalNotes: [],
      responses: [{ id: "r3", consultantId: "c-lindsey", consultantName: "Lindsey Moreau", text: "Yes — the Site-Specific Safety Plan template is in your library. Ironwood builds the plan; we need the scope of work, site contacts and the customer's contractor safety requirements document. Can you send those over?", createdAt: ts(-1, 10) }],
    },
  ];

  /* ---------------- Notifications ---------------- */
  const notifications: Notification[] = [
    { id: "nt-ls-1", orgId: "org-lonestar", audience: "CLIENT", type: "CONSULTANT_RESPONSE", title: "Emily responded to your question", body: "Short-term disability / termination question — please read before taking action.", createdAt: ts(-5, 13), read: true, href: "/app/ask/q-ls-1" },
    { id: "nt-ls-2", orgId: "org-lonestar", audience: "CLIENT", type: "SIGNAL", title: "New Signal applies to you", body: "Texas: harassment prevention policy and training review", createdAt: ts(-6), read: false, href: "/app/signal/sig-tx-harassment" },
    { id: "nt-ls-3", orgId: "org-lonestar", audience: "CLIENT", type: "DEADLINE", title: "Deadline approaching", body: "Fire extinguisher inspection due in 5 days.", createdAt: ts(-1), read: false, href: "/app/deadlines" },
    { id: "nt-ls-4", orgId: "org-lonestar", audience: "CLIENT", type: "ACTION_ASSIGNED", title: "Action assigned to Dana Whitfield", body: "Adopt ADA accommodation procedure — due in 25 days.", createdAt: ts(-5), read: false, href: "/app/actions/act-ls-ada" },
    { id: "nt-ls-5", orgId: "org-lonestar", audience: "CLIENT", type: "GAP", title: "Safety program gap identified", body: "Fall-protection exposure with no written program recorded.", createdAt: ts(-20), read: true, href: "/app/gaps" },
    { id: "nt-cf-1", orgId: "org-cimarron", audience: "CLIENT", type: "DEADLINE", title: "Medical card expiring", body: "J. Alvarez — medical certificate expires in 12 days.", createdAt: ts(-2), read: false, href: "/app/deadlines" },
    { id: "nt-cf-2", orgId: "org-cimarron", audience: "CLIENT", type: "SIGNAL", title: "Ironwood is handling a Signal for you", body: "FMCSA ELD registry check — device list verified.", createdAt: ts(-2), read: false, href: "/app/signal/sig-eld" },
    { id: "nt-cf-3", orgId: "org-cimarron", audience: "CLIENT", type: "DEADLINE", title: "CDL renewal", body: "R. Pacheco — CDL expires in 3 days.", createdAt: ts(0, 6), read: false, href: "/app/deadlines" },
    { id: "nt-cf-4", orgId: "org-cimarron", audience: "CLIENT", type: "WORK_COMPLETE", title: "Ironwood completed work", body: "Annual MVR review — all 45 drivers.", createdAt: ts(-15), read: true, href: "/app/activity" },
    { id: "nt-mi-1", orgId: "org-meridian", audience: "CLIENT", type: "DEADLINE", title: "Avetta questionnaire expires in 6 days", body: "Ironwood is completing the renewal; your EMR letter approval is needed.", createdAt: ts(0, 7), read: false, href: "/app/actions/act-mi-avetta" },
    { id: "nt-mi-2", orgId: "org-meridian", audience: "CLIENT", type: "CONSULTANT_RESPONSE", title: "Lindsey responded — follow-up needed", body: "Site-specific safety plan: scope of work and customer requirements requested.", createdAt: ts(-1, 10), read: false, href: "/app/ask/q-mi-2" },
    { id: "nt-mi-3", orgId: "org-meridian", audience: "CLIENT", type: "WORK_COMPLETE", title: "Ironwood completed work", body: "DQ file audit — 12 drivers. Two medical cards renewed.", createdAt: ts(-8), read: true, href: "/app/activity" },
    { id: "nt-mi-4", orgId: "org-meridian", audience: "CLIENT", type: "DOCUMENT_EXPIRATION", title: "Insurance certificates expire in 22 days", body: "GL and WC certificates on all three portals.", createdAt: ts(-3), read: true, href: "/app/library" },
    // Ironwood-side
    { id: "nt-iw-1", audience: "IRONWOOD", type: "QUESTION", title: "New question — Cimarron Freight Lines", body: "Positive random test — driver disputes result. Flagged HIGH urgency.", createdAt: ts(0, 8), read: false, href: "/admin/queue/q-cf-1" },
    { id: "nt-iw-2", audience: "IRONWOOD", type: "QUESTION", title: "New question — Lone Star Fabrication", body: "Doctor's note policy for absences over two days.", createdAt: ts(0, 7), read: false, href: "/admin/queue/q-ls-2" },
    { id: "nt-iw-3", audience: "IRONWOOD", type: "DEADLINE", title: "Overdue — Cimarron Freight Lines", body: "Annual vehicle inspections (6 units) are 5 days overdue.", createdAt: ts(-1), read: false, href: "/admin/clients/org-cimarron" },
    { id: "nt-iw-4", audience: "IRONWOOD", type: "SIGNAL", title: "Draft Signal awaiting review", body: "EEO-1 Component 1 data collection — upcoming filing window.", createdAt: ts(0, 8), read: true, href: "/admin/signals/sig-eeo1-draft" },
  ];

  /* ---------------- Activity ---------------- */
  const activity: ActivityEvent[] = [
    { id: "ev-ls-1", orgId: "org-lonestar", type: "SIGNAL", title: "Ironwood reviewed a new OSHA recordkeeping development for your company.", detail: "Applies — reconcile the 300 log before year-end.", at: ts(-3), actor: "IRONWOOD", actorName: "Lindsey Moreau", href: "/app/signal/sig-osha-300a" },
    { id: "ev-ls-2", orgId: "org-lonestar", type: "WORK", title: "OSHA program review scheduled.", detail: "On-site at Conroe in 12 days.", at: ts(-2), actor: "IRONWOOD", actorName: "Lindsey Moreau" },
    { id: "ev-ls-3", orgId: "org-lonestar", type: "QUESTION", title: "Emily responded to your short-term disability question.", at: ts(-5, 13), actor: "IRONWOOD", actorName: "Emily Hartigan", href: "/app/ask/q-ls-1" },
    { id: "ev-ls-4", orgId: "org-lonestar", type: "SIGNAL", title: "Ironwood reviewed a Texas harassment-prevention development.", detail: "Applies — policy review and supervisor training recommended.", at: ts(-6), actor: "IRONWOOD", actorName: "Emily Hartigan", href: "/app/signal/sig-tx-harassment" },
    { id: "ev-ls-5", orgId: "org-lonestar", type: "ACTION", title: "I-9 documentation review started.", detail: "Four records flagged.", at: ts(-8), actor: "IRONWOOD", actorName: "Emily Hartigan", href: "/app/actions/act-ls-i9" },
    { id: "ev-ls-6", orgId: "org-lonestar", type: "DOCUMENT", title: "I-9 Self-Audit Checklist added to your library.", at: ts(-8), actor: "IRONWOOD", actorName: "Emily Hartigan", href: "/app/library" },
    { id: "ev-ls-7", orgId: "org-lonestar", type: "SIGNAL", title: "Ironwood reviewed a Form I-9 development for your company.", detail: "Applies — self-audit recommended.", at: ts(-9), actor: "IRONWOOD", actorName: "Emily Hartigan", href: "/app/signal/sig-i9" },
    { id: "ev-ls-8", orgId: "org-lonestar", type: "WORK", title: "Employee handbook update started.", detail: "Drafting — Texas addendum and ADA procedure.", at: ts(-18), actor: "IRONWOOD", actorName: "Emily Hartigan" },
    { id: "ev-ls-9", orgId: "org-lonestar", type: "ACTION", title: "Handbook acknowledgments collected.", at: ts(-20), actor: "CLIENT", actorName: "Dana Whitfield" },
    { id: "ev-ls-10", orgId: "org-lonestar", type: "READINESS", title: "Safety readiness decreased to 76%.", detail: "Forklift evaluations passed due date.", at: ts(-3, 6), actor: "SYSTEM", href: "/app/readiness" },

    { id: "ev-cf-1", orgId: "org-cimarron", type: "SIGNAL", title: "Ironwood checked your ELD devices against the FMCSA registry.", detail: "No action required — no revoked units.", at: ts(-2), actor: "IRONWOOD", actorName: "Roxanne Delgado", href: "/app/signal/sig-eld" },
    { id: "ev-cf-2", orgId: "org-cimarron", type: "ACTION", title: "Driver medical certificate expirations flagged.", detail: "Two drivers within 30 days.", at: ts(-3), actor: "IRONWOOD", actorName: "Roxanne Delgado", href: "/app/actions/act-cf-medcard" },
    { id: "ev-cf-3", orgId: "org-cimarron", type: "WORK", title: "DOT file review 70% complete.", detail: "31 of 45 DQ files reviewed.", at: ts(-4), actor: "IRONWOOD", actorName: "Roxanne Delgado" },
    { id: "ev-cf-4", orgId: "org-cimarron", type: "DEADLINE", title: "Annual inspections for 6 units passed due date.", at: ts(-5), actor: "SYSTEM", href: "/app/deadlines" },
    { id: "ev-cf-5", orgId: "org-cimarron", type: "ACTION", title: "ISNetworld enrollment decision added.", detail: "Customer requirement for Q1 lane award.", at: ts(-7), actor: "IRONWOOD", actorName: "Kyle Heslin", href: "/app/actions/act-cf-isn" },
    { id: "ev-cf-6", orgId: "org-cimarron", type: "SIGNAL", title: "Ironwood reviewed the Clearinghouse annual query cycle for your fleet.", detail: "Applies — queries in progress.", at: ts(-14), actor: "IRONWOOD", actorName: "Roxanne Delgado", href: "/app/signal/sig-clearinghouse" },
    { id: "ev-cf-7", orgId: "org-cimarron", type: "WORK", title: "Annual MVR review completed for all 45 drivers.", at: ts(-15), actor: "IRONWOOD", actorName: "Roxanne Delgado" },
    { id: "ev-cf-8", orgId: "org-cimarron", type: "DOCUMENT", title: "DQ File Contents Checklist added to your library.", at: ts(-21), actor: "IRONWOOD", actorName: "Roxanne Delgado", href: "/app/library" },

    { id: "ev-mi-1", orgId: "org-meridian", type: "QUESTION", title: "Lindsey responded to your site-specific safety plan question.", detail: "Follow-up needed.", at: ts(-1, 10), actor: "IRONWOOD", actorName: "Lindsey Moreau", href: "/app/ask/q-mi-2" },
    { id: "ev-mi-2", orgId: "org-meridian", type: "ACTION", title: "Confined space rescue plan action created.", detail: "Las Vegas tank site.", at: ts(-2), actor: "IRONWOOD", actorName: "Lindsey Moreau", href: "/app/actions/act-mi-confined" },
    { id: "ev-mi-3", orgId: "org-meridian", type: "DOCUMENT", title: "Nevada Training Roster uploaded.", at: ts(-3), actor: "IRONWOOD", actorName: "Lindsey Moreau", href: "/app/library" },
    { id: "ev-mi-4", orgId: "org-meridian", type: "SIGNAL", title: "Ironwood reviewed the contractor COI expiration cycle for your portals.", detail: "Applies — certificates expire in 22 days.", at: ts(-5), actor: "IRONWOOD", actorName: "Kyle Heslin", href: "/app/signal/sig-coi-cycle" },
    { id: "ev-mi-5", orgId: "org-meridian", type: "WORK", title: "DQ file audit completed — 12 drivers.", detail: "Two medical cards renewed.", at: ts(-8), actor: "IRONWOOD", actorName: "Roxanne Delgado" },
    { id: "ev-mi-6", orgId: "org-meridian", type: "ACTION", title: "ISNetworld RAVS program updates completed.", at: ts(-8), actor: "IRONWOOD", actorName: "Marcus Bell" },
    { id: "ev-mi-7", orgId: "org-meridian", type: "SIGNAL", title: "Ironwood reviewed Nevada OSHA-10/30 training requirements for your Reno project.", detail: "Applies — supervisor training scheduled.", at: ts(-12), actor: "IRONWOOD", actorName: "Lindsey Moreau", href: "/app/signal/sig-nv-osha10" },
    { id: "ev-mi-8", orgId: "org-meridian", type: "ACTION", title: "OSHA 300 log reconciliation (Q3) completed.", at: ts(-12), actor: "IRONWOOD", actorName: "Lindsey Moreau" },
    { id: "ev-mi-9", orgId: "org-meridian", type: "QUESTION", title: "Nevada OSHA-10 question closed.", at: ts(-12, 11), actor: "IRONWOOD", actorName: "Lindsey Moreau", href: "/app/ask/q-mi-1" },
    { id: "ev-mi-10", orgId: "org-meridian", type: "WORK", title: "Nevada site safety plan started.", at: ts(-14), actor: "IRONWOOD", actorName: "Lindsey Moreau" },
  ];

  /* ---------------- Readiness history (monthly snapshots) ---------------- */
  const readinessHistory: ReadinessSnapshot[] = [];
  const hist: Record<string, number[][]> = {
    // [HR, DOT, SAFETY, CONTRACTOR] for months -5..-1
    "org-lonestar": [[64, 100, 58, 100], [66, 100, 62, 100], [70, 100, 66, 100], [72, 100, 70, 100], [74, 100, 74, 100]],
    "org-cimarron": [[78, 66, 70, 100], [80, 68, 72, 100], [82, 70, 74, 100], [84, 72, 75, 100], [86, 70, 76, 100]],
    "org-meridian": [[88, 84, 80, 82], [90, 86, 82, 84], [91, 88, 84, 86], [92, 92, 86, 88], [94, 94, 88, 90]],
  };
  for (const org of organizations) {
    const rows = hist[org.id];
    rows.forEach((r, i) => {
      readinessHistory.push({
        id: `rs-${org.id}-${i}`,
        orgId: org.id,
        date: format(subMonths(now, 5 - i), "yyyy-MM-dd"),
        scores: { HR: r[0], DOT: r[1], SAFETY: r[2], CONTRACTOR: r[3], RECRUITING: 0, LEADERSHIP: 0, OPERATIONS: 0 },
      });
    });
  }

  const manualGaps: ManualGap[] = [
    { id: "mg-cf-isn", orgId: "org-cimarron", domain: "CONTRACTOR", title: "Customer requires ISNetworld enrollment", detail: "A Permian Basin customer requires an ISNetworld grade of B or better before awarding Q1 lanes. No portal account exists.", recommendation: "Decide on enrollment this month; setup and questionnaire take 4–6 weeks.", severity: "HIGH", createdAt: ts(-7) },
    { id: "mg-cf-osha", orgId: "org-cimarron", domain: "SAFETY", title: "OSHA 300 log incomplete for the shop", detail: "The Tulsa shop is a covered establishment and two incidents this year are not logged.", recommendation: "Review with Ironwood Safety.", severity: "MEDIUM", createdAt: ts(-30) },
    { id: "mg-ls-isn", orgId: "org-lonestar", domain: "CONTRACTOR", title: "Customer has requested ISNetworld enrollment", detail: "One customer has asked for portal enrollment; no decision has been made.", recommendation: "Ironwood Contractor Compliance can scope the effort.", severity: "LOW", createdAt: ts(-40) },
  ];

  return {
    seedVersion: SEED_VERSION,
    seededAt: formatISO(now),
    branding,
    users,
    consultants,
    organizations,
    locations,
    contacts,
    signals,
    matches,
    actions,
    workItems,
    deadlines,
    documents,
    questions,
    notifications,
    activity,
    readinessHistory,
    manualGaps,
  };
}

export { REQUIREMENTS };

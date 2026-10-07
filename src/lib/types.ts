/**
 * Ironwood Command Center — core data model.
 *
 * Every entity carries an `id` and references other entities by id.
 * This model is mirrored in `supabase/schema.sql` so the demo store and the
 * production database describe the same shapes.
 */

export type Domain =
  | "HR"
  | "DOT"
  | "SAFETY"
  | "CONTRACTOR"
  | "RECRUITING"
  | "LEADERSHIP"
  | "OPERATIONS";

export const PRIMARY_DOMAINS: Domain[] = ["HR", "DOT", "SAFETY", "CONTRACTOR"];
export const ALL_DOMAINS: Domain[] = [
  "HR",
  "DOT",
  "SAFETY",
  "CONTRACTOR",
  "RECRUITING",
  "LEADERSHIP",
  "OPERATIONS",
];

export const DOMAIN_LABEL: Record<Domain, string> = {
  HR: "Human Resources",
  DOT: "DOT / Transportation",
  SAFETY: "HSE / Safety",
  CONTRACTOR: "Contractor Compliance",
  RECRUITING: "Recruiting",
  LEADERSHIP: "Leadership / Coaching",
  OPERATIONS: "General Operations",
};

export const DOMAIN_SHORT: Record<Domain, string> = {
  HR: "HR",
  DOT: "DOT",
  SAFETY: "Safety",
  CONTRACTOR: "Contractor",
  RECRUITING: "Recruiting",
  LEADERSHIP: "Leadership",
  OPERATIONS: "Operations",
};

export type Role =
  | "CLIENT_VIEWER"
  | "CLIENT_ADMIN"
  | "IRONWOOD_CONSULTANT"
  | "IRONWOOD_ADMIN";

export const ROLE_LABEL: Record<Role, string> = {
  CLIENT_VIEWER: "Client Viewer",
  CLIENT_ADMIN: "Client Admin",
  IRONWOOD_CONSULTANT: "Ironwood Consultant",
  IRONWOOD_ADMIN: "Ironwood Admin",
};

export const isIronwoodRole = (r: Role) =>
  r === "IRONWOOD_ADMIN" || r === "IRONWOOD_CONSULTANT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Client users belong to exactly one organization. */
  orgId?: string;
  /** Ironwood users map to a consultant record. */
  consultantId?: string;
  title?: string;
}

export interface Consultant {
  id: string;
  name: string;
  title: string;
  email: string;
  domains: Domain[];
}

export type ServiceStatus = "ACTIVE" | "NOT_ACTIVE" | "PROPOSED";

export type HandbookStatus = "CURRENT" | "NEEDS_UPDATE" | "IN_PROGRESS" | "MISSING";
export type RecordkeepingStatus =
  | "EXEMPT"
  | "REQUIRED_CURRENT"
  | "REQUIRED_INCOMPLETE"
  | "UNKNOWN";
export type FileStatus = "CURRENT" | "NEEDS_REVIEW" | "INCOMPLETE" | "NOT_APPLICABLE";

export interface HRProfile {
  employeeCount: number;
  statesWithEmployees: string[];
  remoteEmployees: number;
  federalContractor: boolean;
  eeoApplicable: boolean;
  acaApplicable: boolean;
  leaveRequirements: string[];
  policiesPresent: string[];
  handbookStatus: HandbookStatus;
  handbookLastReviewed?: string;
}

export interface DOTProfile {
  regulated: boolean;
  usdotNumber?: string;
  operationType?: "INTERSTATE" | "INTRASTATE";
  cdlDrivers: number;
  nonCdlDrivers: number;
  fleetSize: number;
  hazmat: boolean;
  drugAlcoholTesting: boolean;
  clearinghouseRegistered: boolean;
  dqFileStatus: FileStatus;
  vehicleFileStatus: FileStatus;
}

export interface SafetyProfile {
  oshaApplicable: boolean;
  naics?: string;
  recordkeepingStatus: RecordkeepingStatus;
  highHazard: boolean;
  writtenPrograms: string[];
  trainingRequirements: string[];
  exposures: string[];
  inspectionsLast12Months: number;
  incidentsLast12Months: number;
}

export interface ContractorProfile {
  portals: string[];
  customerRequirements: string[];
  insuranceExpiration?: string;
  documentExpirations: { name: string; date: string }[];
}

export interface ClientProfile {
  hr: HRProfile;
  dot: DOTProfile;
  safety: SafetyProfile;
  contractor: ContractorProfile;
}

export interface Branding {
  portalName: string;
  primaryColor: string;
  logoText: string;
  logoUrl?: string;
  supportEmail: string;
  supportPhone: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string;
  naicsCode?: string;
  headquarters: { city: string; state: string };
  statesOfOperation: string[];
  employeeCount: number;
  revenueRange?: string;
  facilityCount: number;
  website?: string;
  phone?: string;
  status: "ACTIVE" | "ONBOARDING" | "INACTIVE";
  assignedConsultantIds: string[];
  services: Record<Domain, ServiceStatus>;
  profile: ClientProfile;
  createdAt: string;
  /** Optional white-label override. Falls back to platform branding. */
  branding?: Partial<Branding>;
}

export interface Location {
  id: string;
  orgId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  employeeCount: number;
  isHeadquarters: boolean;
}

export interface Contact {
  id: string;
  orgId: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

/* ------------------------------------------------------------------ */
/* Applicability engine                                                */
/* ------------------------------------------------------------------ */

export type Operator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "includes"
  | "not_includes"
  | "is_true"
  | "is_false"
  | "in";

export interface Condition {
  field: string; // key in FIELD_REGISTRY
  operator: Operator;
  value?: string | number | boolean | string[];
}

export interface RuleSet {
  match: "ALL" | "ANY";
  conditions: Condition[];
}

/** A standalone requirement used by the readiness calculator. */
export interface Requirement {
  id: string;
  domain: Domain;
  title: string;
  /** Short headline used when the requirement is unmet. */
  gapTitle?: string;
  description: string;
  weight: number;
  /** When these conditions hold, the requirement applies to the organization. */
  appliesWhen: RuleSet;
  /** When these conditions hold, the requirement is considered satisfied. */
  satisfiedWhen: RuleSet;
  /** Shown as the gap recommendation when unmet. */
  recommendation: string;
}

/* ------------------------------------------------------------------ */
/* Signals                                                             */
/* ------------------------------------------------------------------ */

export type Urgency = "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type SignalStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type MatchStatus = "APPLIES" | "WATCH" | "NO_ACTION" | "HANDLING";

export interface Signal {
  id: string;
  title: string;
  domain: Domain;
  jurisdiction: string;
  regulatoryBody: string;
  publishedDate: string;
  effectiveDate?: string;
  summary: string;
  affectedIndustries: string[];
  affectedCharacteristics: string[];
  /** Conditions that make the signal APPLY to a client. */
  applies: RuleSet;
  /** Optional looser conditions that place a client on WATCH. */
  watch?: RuleSet;
  recommendedAction: string;
  urgency: Urgency;
  sourceUrl?: string;
  sourceLabel?: string;
  commentary: string;
  status: SignalStatus;
  isDemo: boolean;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
}

export interface SignalMatch {
  id: string;
  signalId: string;
  orgId: string;
  status: MatchStatus;
  /** Human-readable "why am I seeing this" bullets. */
  reasons: string[];
  evaluatedAt: string;
  /** Consultant override, e.g. marking as HANDLING. */
  overrideBy?: string;
  overrideNote?: string;
  acknowledgedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Actions, work, deadlines                                            */
/* ------------------------------------------------------------------ */

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ActionStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING_ON_CLIENT"
  | "WAITING_ON_IRONWOOD"
  | "COMPLETE"
  | "NOT_APPLICABLE";
export type Recurrence = "NONE" | "MONTHLY" | "QUARTERLY" | "ANNUAL";

export interface Note {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  internal?: boolean;
}

export interface Action {
  id: string;
  orgId: string;
  title: string;
  domain: Domain;
  description: string;
  recommendedAction?: string;
  ironwoodOwnerId?: string;
  clientOwnerId?: string;
  priority: Priority;
  dueDate?: string;
  status: ActionStatus;
  notes: Note[];
  resourceIds: string[];
  recurrence: Recurrence;
  signalId?: string;
  completedAt?: string;
  createdAt: string;
  createdBy: string;
}

export type WorkStatus = "SCHEDULED" | "IN_PROGRESS" | "REVIEW" | "COMPLETE";

/** Work Ironwood consultants are performing on behalf of a client. */
export interface WorkItem {
  id: string;
  orgId: string;
  title: string;
  domain: Domain;
  consultantId: string;
  status: WorkStatus;
  statusLabel: string;
  progress: number;
  startedAt: string;
  targetDate?: string;
  completedAt?: string;
  summary: string;
  signalId?: string;
}

export type DeadlineType =
  | "REGULATORY"
  | "DOCUMENT"
  | "TRAINING"
  | "CERTIFICATION"
  | "MEDICAL_CARD"
  | "CDL"
  | "VEHICLE"
  | "INSURANCE"
  | "PORTAL"
  | "POLICY"
  | "AUDIT"
  | "REVIEW";

export interface Deadline {
  id: string;
  orgId: string;
  title: string;
  domain: Domain;
  date: string;
  type: DeadlineType;
  description?: string;
  relatedActionId?: string;
  relatedDocumentId?: string;
  recurrence: Recurrence;
  status: "UPCOMING" | "COMPLETE" | "MISSED";
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export type DocumentCategory =
  | "POLICY"
  | "FORM"
  | "TRAINING"
  | "HR"
  | "DOT"
  | "SAFETY"
  | "CONTRACTOR"
  | "GUIDANCE"
  | "TEMPLATE"
  | "IRONWOOD";

export interface Document {
  id: string;
  orgId: string;
  title: string;
  description: string;
  category: DocumentCategory;
  domain?: Domain;
  version: string;
  uploadedAt: string;
  ownerName: string;
  reviewDate?: string;
  expirationDate?: string;
  /** MVP: metadata + optional external link. Future: storage bucket path. */
  url?: string;
  storagePath?: string;
  fileName?: string;
  sizeLabel?: string;
}

/* ------------------------------------------------------------------ */
/* Ask Ironwood                                                        */
/* ------------------------------------------------------------------ */

export type QuestionStatus =
  | "NEW"
  | "REVIEWING"
  | "RESPONDED"
  | "FOLLOW_UP_REQUIRED"
  | "CLOSED";

export interface Triage {
  domain: Domain;
  urgency: Urgency;
  potentialIssues: string[];
  profileContext: string[];
  recommendedNextStep: string;
}

export interface ConsultantResponse {
  id: string;
  consultantId: string;
  consultantName: string;
  text: string;
  createdAt: string;
  /** Client follow-ups share the thread; default is IRONWOOD. */
  from?: "CLIENT" | "IRONWOOD";
}

export interface Question {
  id: string;
  orgId: string;
  submittedByUserId: string;
  submittedByName: string;
  text: string;
  domain: Domain;
  urgency: Urgency;
  submittedAt: string;
  assignedConsultantId?: string;
  status: QuestionStatus;
  triage: Triage;
  internalNotes: Note[];
  responses: ConsultantResponse[];
}

/* ------------------------------------------------------------------ */
/* Notifications, activity, readiness                                  */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "DEADLINE"
  | "ACTION_ASSIGNED"
  | "SIGNAL"
  | "DOCUMENT_EXPIRATION"
  | "CONSULTANT_RESPONSE"
  | "WORK_COMPLETE"
  | "GAP"
  | "QUESTION";

export interface Notification {
  id: string;
  /** Client notifications are scoped to an org. Ironwood notifications have no org. */
  orgId?: string;
  audience: "CLIENT" | "IRONWOOD";
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export type ActivityType =
  | "SIGNAL"
  | "ACTION"
  | "WORK"
  | "DOCUMENT"
  | "DEADLINE"
  | "QUESTION"
  | "READINESS"
  | "PROFILE";

export interface ActivityEvent {
  id: string;
  orgId: string;
  type: ActivityType;
  title: string;
  detail?: string;
  at: string;
  actor: "IRONWOOD" | "CLIENT" | "SYSTEM";
  actorName?: string;
  href?: string;
}

export interface ReadinessSnapshot {
  id: string;
  orgId: string;
  date: string;
  scores: Record<Domain, number>;
}

/** Manually recorded gap (in addition to engine-derived gaps). */
export interface ManualGap {
  id: string;
  orgId: string;
  domain: Domain;
  title: string;
  detail: string;
  recommendation: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  resolvedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Derived (not stored)                                                */
/* ------------------------------------------------------------------ */

export interface Gap {
  id: string;
  orgId: string;
  domain: Domain;
  title: string;
  detail: string;
  recommendation: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  source: "REQUIREMENT" | "EXPOSURE" | "TRAINING" | "SERVICE" | "SIGNAL" | "DEADLINE" | "DOCUMENT" | "MANUAL";
  serviceActive: boolean;
  href?: string;
}

export interface ReadinessLine {
  label: string;
  detail?: string;
  points: number;
  kind: "requirement_met" | "requirement_unmet" | "penalty";
}

export interface DomainReadiness {
  domain: Domain;
  score: number;
  base: number;
  requirementsApplicable: number;
  requirementsMet: number;
  penalties: number;
  lines: ReadinessLine[];
  serviceActive: boolean;
}

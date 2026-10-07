import type { Domain, Organization, Triage, Urgency } from "@/lib/types";

/**
 * Ask Ironwood — preliminary triage.
 *
 * Rule-based keyword + profile analysis that produces a structured
 * preliminary read of a client question. It does NOT provide legal advice;
 * every result routes to a consultant. Architected so an AI-assisted
 * summarizer can replace `triageQuestion` behind the same interface.
 */

interface IssuePattern {
  domain: Domain;
  issue: string;
  keywords: RegExp;
  weight?: number;
}

const PATTERNS: IssuePattern[] = [
  // HR
  { domain: "HR", issue: "ADA / disability accommodation", keywords: /\b(ada\b|disabilit\w*|accommodat\w*|rehab\w*|medical condition|impairment|interactive process)/i, weight: 2 },
  { domain: "HR", issue: "Leave / FMLA interaction", keywords: /\b(fmla\b|leave of absence|medical leave|short[- ]term disability|\bstd\b|\bltd\b|maternity|paternity|parental leave)/i, weight: 2 },
  { domain: "HR", issue: "Termination / employment action", keywords: /\b(terminat\w*|fir(e|ed|ing)\b|let (him|her|them) go|separat\w*|layoff|lay off|discharg\w*|dismiss\w*)/i, weight: 3 },
  { domain: "HR", issue: "Harassment / discrimination", keywords: /\b(harass\w*|discriminat\w*|hostile|retaliat\w*|complain\w*|sexual|protected class|eeoc\b)/i, weight: 3 },
  { domain: "HR", issue: "Wage & hour / overtime", keywords: /\b(overtime|exempt|non-exempt|salar\w*|hourly|wage\w*|timekeeping|meal break|rest break|comp time|final paycheck|final pay)/i, weight: 2 },
  { domain: "HR", issue: "I-9 / work authorization", keywords: /\b(i-?9\b|e-?verify|work authorization|visa\b)/i, weight: 2 },
  { domain: "HR", issue: "Policy / handbook", keywords: /\b(handbook|polic(y|ies)|pto\b|vacation|remote work|dress code)/i, weight: 1 },
  { domain: "HR", issue: "Performance / discipline documentation", keywords: /\b(write[- ]up|written warning|performance|disciplin\w*|\bpip\b|attendance|no[- ]call)/i, weight: 1 },
  { domain: "HR", issue: "Medical documentation / privacy", keywords: /\b(doctor'?s note|physician|medical note|medical record|hipaa|diagnos\w*)/i, weight: 2 },
  { domain: "HR", issue: "Benefits / ACA", keywords: /\b(benefit\w*|\baca\b|health insurance|cobra\b|401k|open enrollment)/i, weight: 1 },
  { domain: "HR", issue: "Workers' compensation / injury leave", keywords: /\b(workers'? comp\w*|work comp|injur\w* at work|light duty|return to work)/i, weight: 2 },

  // DOT
  { domain: "DOT", issue: "Driver qualification file", keywords: /\b(dq file|driver qualification|\bmvr\b|medical card|med card|medical certificate|road test|\bcdl\b)/i, weight: 2 },
  { domain: "DOT", issue: "Drug & alcohol testing / Clearinghouse", keywords: /\b(clearinghouse|drug test\w*|alcohol test\w*|random pool|random test\w*|consortium|positive test|positive result|tested positive|refus\w*|return[- ]to[- ]duty|\bsap\b|split specimen)/i, weight: 3 },
  { domain: "DOT", issue: "Hours of service / ELD", keywords: /\b(hours of service|\bhos\b|\beld\b|logbook|log book|driving hours|34[- ]hour)/i, weight: 2 },
  { domain: "DOT", issue: "Vehicle maintenance / inspection", keywords: /\b(annual inspection|\bdvir\b|pre[- ]trip|maintenance record|out of service|roadside)/i, weight: 2 },
  { domain: "DOT", issue: "Crash / accident register", keywords: /\b(accident|crash|collision|tow(ed|ing)?\b|fatalit\w*)/i, weight: 3 },
  { domain: "DOT", issue: "Audit / compliance review", keywords: /\b(dot audit|compliance review|new entrant|safety audit|csa score|fmcsa\b)/i, weight: 2 },
  { domain: "DOT", issue: "Driver fitness for duty", keywords: /\b(driver\w*)/i, weight: 1 },

  // SAFETY
  { domain: "SAFETY", issue: "OSHA injury reporting", keywords: /\b(hospitaliz\w*|amputat\w*|loss of an eye|fatal\w*|report to osha|8 hours|24 hours)/i, weight: 3 },
  { domain: "SAFETY", issue: "OSHA recordkeeping (300 log)", keywords: /\b(300 log|300a\b|recordable|first aid|recordkeeping|injury log)/i, weight: 2 },
  { domain: "SAFETY", issue: "OSHA inspection / citation", keywords: /\b(inspector|inspection|citation|osha (showed|came|visit\w*|is here)|osha complaint)/i, weight: 3 },
  { domain: "SAFETY", issue: "Written program requirement", keywords: /\b(written program|hazcom|hazard communication|lockout|tagout|\bloto\b|confined space|fall protection|respirator\w*|\bppe\b|site[- ]specific safety plan|safety plan)/i, weight: 2 },
  { domain: "SAFETY", issue: "Safety training", keywords: /\b(osha[- ]?(10|30)|training|certif\w*|forklift|toolbox|orientation)/i, weight: 1 },
  { domain: "SAFETY", issue: "Workplace injury", keywords: /\b(injur\w*|hurt|fell\b|fall\b|laceration|burn\w*|near miss)/i, weight: 2 },

  // CONTRACTOR
  { domain: "CONTRACTOR", issue: "Contractor portal requirement", keywords: /\b(isnetworld|\bisn\b|avetta|veriforce|\bpec\b|portal|questionnaire|\brav\w*|portal grade)/i, weight: 3 },
  { domain: "CONTRACTOR", issue: "Insurance / certificate requirement", keywords: /\b(certificate of insurance|\bcoi\b|insurance|additional insured|waiver of subrogation)/i, weight: 2 },
  { domain: "CONTRACTOR", issue: "Customer compliance requirement", keywords: /\b(customer requir\w*|prequal\w*|pre-qual\w*|vendor|client site)/i, weight: 2 },
];

const HIGH_URGENCY = /\b(today|immediately|right now|urgent\w*|asap|tomorrow|this morning|inspector|fatal\w*|hospitaliz\w*|amputat\w*|lawsuit|attorney|eeoc\b|terminat\w*|fir(e|ed|ing)\b|positive (test|result)|tested positive|crash|accident|refus\w*)/i;
const MEDIUM_URGENCY = /\b(this week|deadline|expir\w*|overdue|\bdue\b|audit|complain\w*|injur\w*|leave\b|disabilit\w*)/i;

export function triageQuestion(text: string, org: Organization, chosenDomain?: Domain): Triage {
  const scores: Partial<Record<Domain, number>> = {};
  const issues: { domain: Domain; issue: string }[] = [];

  for (const p of PATTERNS) {
    if (p.keywords.test(text)) {
      scores[p.domain] = (scores[p.domain] ?? 0) + (p.weight ?? 1);
      if (!issues.some((i) => i.issue === p.issue)) issues.push({ domain: p.domain, issue: p.issue });
    }
  }

  const domain: Domain =
    chosenDomain ??
    ((Object.entries(scores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as Domain | undefined) ?? "OPERATIONS");

  const urgency: Urgency = HIGH_URGENCY.test(text) ? "HIGH" : MEDIUM_URGENCY.test(text) ? "MEDIUM" : "LOW";

  const potentialIssues = issues
    .filter((i) => i.domain === domain || scores[i.domain]! >= 2)
    .map((i) => i.issue);
  if (potentialIssues.length === 0) potentialIssues.push("General compliance question — consultant review recommended");

  // Profile context — the part that makes triage specific to this client.
  const ctx: string[] = [];
  const p = org.profile;
  const mentions = (re: RegExp) => re.test(text);

  if (mentions(/\b(fmla|leave|disability|medical)\b/i)) {
    ctx.push(
      org.employeeCount >= 50
        ? `FMLA employer coverage likely applies (${org.employeeCount} employees; 50-employee threshold). Confirm the individual employee's eligibility (12 months of service / 1,250 hours) before relying on it.`
        : `FMLA appears not to apply based on current profile settings (${org.employeeCount} employees, below the 50-employee threshold).`,
    );
    ctx.push(
      org.employeeCount >= 15
        ? `ADA accommodation obligations likely apply (${org.employeeCount} employees; 15-employee threshold).`
        : `ADA federal coverage threshold is 15 employees; your profile shows ${org.employeeCount}. State law may still apply.`,
    );
    if (!p.hr.policiesPresent.includes("ADA Accommodation")) ctx.push("No ADA accommodation policy is recorded in your profile.");
    if (!p.hr.policiesPresent.includes("FMLA") && org.employeeCount >= 50) ctx.push("No FMLA policy is recorded in your profile.");
  }
  if (mentions(/\b(terminat|fire|firing|discharge|separat|let go)\b/i)) {
    ctx.push(`Employment action in ${p.hr.statesWithEmployees.join(", ") || org.headquarters.state} — state-specific final pay and notice rules may apply.`);
    if (p.hr.handbookStatus !== "CURRENT") ctx.push(`Handbook status is "${p.hr.handbookStatus.toLowerCase().replace("_", " ")}" — confirm the policy you are relying on is current.`);
  }
  if (mentions(/\b(harass|discriminat|hostile|retaliat)\b/i)) {
    ctx.push(p.hr.policiesPresent.includes("Anti-harassment") ? "An anti-harassment policy is on file; follow its reporting and investigation steps." : "No anti-harassment policy is recorded in your profile.");
  }
  if (domain === "DOT" || mentions(/\b(driver|cdl|truck|fleet|clearinghouse)\b/i)) {
    if (p.dot.regulated) {
      ctx.push(`Your profile shows a DOT-regulated ${p.dot.operationType?.toLowerCase() ?? ""} operation with ${p.dot.cdlDrivers} CDL drivers and ${p.dot.fleetSize} vehicles.`);
      if (!p.dot.clearinghouseRegistered) ctx.push("Clearinghouse registration is not recorded.");
      if (!p.dot.drugAlcoholTesting) ctx.push("No drug & alcohol testing program is recorded.");
      if (p.dot.dqFileStatus !== "CURRENT") ctx.push(`Driver qualification files are marked ${p.dot.dqFileStatus.toLowerCase().replace("_", " ")}.`);
    } else {
      ctx.push("Your profile indicates the company is not DOT regulated. If vehicles or drivers have changed, update the profile.");
    }
  }
  if (domain === "SAFETY" || mentions(/\b(osha|injur|inspect|hazard)\b/i)) {
    if (p.safety.oshaApplicable) {
      ctx.push(`OSHA recordkeeping status: ${p.safety.recordkeepingStatus.toLowerCase().replace("_", " ")}.`);
      if (p.safety.highHazard) ctx.push("Your industry is flagged as high-hazard in your profile.");
      const missing = p.safety.exposures.length ? undefined : null;
      if (missing !== null && p.safety.writtenPrograms.length < 3) ctx.push(`Only ${p.safety.writtenPrograms.length} written program(s) are recorded.`);
    }
  }
  if (domain === "CONTRACTOR" || mentions(/\b(isn|avetta|veriforce|portal|coi|insurance)\b/i)) {
    ctx.push(p.contractor.portals.length ? `Active contractor portals: ${p.contractor.portals.join(", ")}.` : "No contractor portals are recorded in your profile.");
    if (p.contractor.insuranceExpiration) ctx.push(`Insurance expiration on file: ${p.contractor.insuranceExpiration}.`);
  }
  if (ctx.length === 0) ctx.push(`Profile: ${org.industry}, ${org.employeeCount} employees, operating in ${org.statesOfOperation.join(", ")}.`);

  const serviceActive = org.services[domain] === "ACTIVE";
  const consultantLabel = domain === "OPERATIONS" ? "Ironwood consultant" : `Ironwood ${domainWord(domain)} consultant`;
  const recommendedNextStep = HIGH_URGENCY.test(text)
    ? `Contact your ${consultantLabel} before taking any action. This has been flagged as time-sensitive.`
    : serviceActive
      ? `Send this to your ${consultantLabel} for review before proceeding.`
      : `This falls under ${domainWord(domain)}, which is not currently included in your active Ironwood services. Ironwood support is available for this area.`;

  return { domain, urgency, potentialIssues, profileContext: ctx, recommendedNextStep };
}

function domainWord(d: Domain) {
  return { HR: "HR", DOT: "DOT", SAFETY: "Safety", CONTRACTOR: "Contractor Compliance", RECRUITING: "Recruiting", LEADERSHIP: "Leadership", OPERATIONS: "Operations" }[d];
}

import type {
  AdministrativeRequest,
  DocumentProcedure,
  Notification,
  RequestHistory,
  User,
} from "@/types";
import { mockHash } from "@/lib/utils";

export const DEMO_PASSWORD = "civic1234";

function iso(daysAgo: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, Math.floor(Math.random() * 50) + 5, 0, 0);
  return d.toISOString();
}

function future(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(17, 0, 0, 0);
  return d.toISOString();
}

export function seedUsers(): User[] {
  return [
    {
      id: "u_citizen",
      name: "Amara Osei",
      email: "citizen@example.com",
      passwordHash: mockHash(DEMO_PASSWORD),
      role: "citizen",
      createdAt: iso(320),
      avatarColor: "#274C77",
    },
    {
      id: "u_admin",
      name: "Daniel Reyes",
      email: "admin@example.com",
      passwordHash: mockHash(DEMO_PASSWORD),
      role: "admin",
      createdAt: iso(400),
      avatarColor: "#6096BA",
    },
    {
      id: "u_maya",
      name: "Maya Lindqvist",
      email: "maya@example.com",
      passwordHash: mockHash(DEMO_PASSWORD),
      role: "citizen",
      createdAt: iso(200),
      avatarColor: "#39856A",
    },
  ];
}

export function seedProcedures(): DocumentProcedure[] {
  return [
    {
      id: "proc_residence",
      name: "Certificate of Residence",
      category: "Residency",
      description:
        "Illustrative mock entry. Confirms a citizen's registered address for administrative use such as schooling, banking, or local registration.",
      eligibility: [
        "Registered resident of the municipality (mock rule)",
        "Valid identity document held by applicant",
        "No conflicting active residence record",
      ],
      requiredDocuments: [
        "National ID card (copy + original for verification)",
        "Proof of address — utility bill or rental agreement",
        "Completed residence declaration form",
        "Passport-size photograph (recent)",
      ],
      procedureSteps: [
        { title: "Submit application", detail: "File the request online or at the front office with all attachments.", duration: "~10 min" },
        { title: "Address verification", detail: "Officer checks the address record against the civil registry.", duration: "1–3 days (sample)" },
        { title: "Department review", detail: "Residency unit validates eligibility and supporting evidence.", duration: "2–4 days (sample)" },
        { title: "Issuance", detail: "Certificate is signed and made available for pickup or download.", duration: "Same day after approval" },
      ],
      responsibleDepartment: "Civil Registry — Residency Unit",
      processingTarget: "7 working days (demonstration value)",
      processingDays: 7,
      commonPitfalls: [
        "Address on ID does not match proof of address",
        "Utility bill older than 3 months",
        "Missing signature on declaration form",
      ],
      sourceReference: "Mock reference — CIV-REG-04 (illustrative only)",
      lastVerifiedAt: iso(12),
    },
    {
      id: "proc_family",
      name: "Family Card Update",
      category: "Family",
      description:
        "Illustrative mock entry. Updates household composition after birth, marriage, relocation, or other family changes.",
      eligibility: [
        "Head of household or authorized family member",
        "Event (birth / marriage / move) already recorded",
        "Existing family card number available",
      ],
      requiredDocuments: [
        "Existing family card",
        "Event certificate (birth / marriage / move letter)",
        "IDs of affected members",
        "Updated household declaration",
      ],
      procedureSteps: [
        { title: "Declare change", detail: "Describe the family event and list affected members.", duration: "~15 min" },
        { title: "Document check", detail: "Officer verifies event certificate authenticity.", duration: "1–2 days (sample)" },
        { title: "Registry update", detail: "Household record is amended in the civil registry.", duration: "3–5 days (sample)" },
        { title: "New card issuance", detail: "Updated family card is printed and released.", duration: "1 day (sample)" },
      ],
      responsibleDepartment: "Civil Registry — Family Records",
      processingTarget: "10 working days (demonstration value)",
      processingDays: 10,
      commonPitfalls: [
        "Event certificate not yet issued",
        "Name spelling inconsistent across documents",
        "Missing signature of head of household",
      ],
      sourceReference: "Mock reference — CIV-FAM-02 (illustrative only)",
      lastVerifiedAt: iso(20),
    },
    {
      id: "proc_birth",
      name: "Birth Certificate Application",
      category: "Civil Status",
      description:
        "Illustrative mock entry. First-time registration of a birth and issuance of the official certificate.",
      eligibility: [
        "Child born within the last 60 days (mock rule) or late-registration path",
        "Parent or legal guardian applying",
        "Birth attestation from health facility or witness statement",
      ],
      requiredDocuments: [
        "Birth attestation letter from clinic / hospital",
        "Parents' identity documents",
        "Parents' family card",
        "Marriage certificate (if applicable)",
      ],
      procedureSteps: [
        { title: "File birth report", detail: "Enter child details and attach the attestation letter.", duration: "~15 min" },
        { title: "Verification", detail: "Health record and parent identities are cross-checked.", duration: "2–3 days (sample)" },
        { title: "Registration", detail: "Birth is entered into the civil status register.", duration: "2 days (sample)" },
        { title: "Certificate printing", detail: "Certificate is signed, sealed, and released.", duration: "1 day (sample)" },
      ],
      responsibleDepartment: "Civil Status Office",
      processingTarget: "5 working days (demonstration value)",
      processingDays: 5,
      commonPitfalls: [
        "Attestation letter missing facility stamp",
        "Parent names differ from ID spelling",
        "Late application without witness statement",
      ],
      sourceReference: "Mock reference — CIV-BIR-01 (illustrative only)",
      lastVerifiedAt: iso(6),
    },
    {
      id: "proc_business",
      name: "Business Registration Inquiry",
      category: "Business",
      description:
        "Illustrative mock entry. Pre-check and filing for a small business operating permit, including name availability.",
      eligibility: [
        "Applicant aged 18+ (mock rule)",
        "Proposed business address within municipality",
        "No identical registered business name",
      ],
      requiredDocuments: [
        "Applicant ID",
        "Proposed business name (3 alternatives)",
        "Premises proof — lease or ownership letter",
        "Brief business activity description",
      ],
      procedureSteps: [
        { title: "Name pre-check", detail: "System checks proposed names for conflicts.", duration: "Instant – 1 day" },
        { title: "Dossier review", detail: "Licensing desk reviews premises and activity fit.", duration: "3–5 days (sample)" },
        { title: "Field confirmation", detail: "Optional premises confirmation for certain activities.", duration: "2–4 days (sample)" },
        { title: "Permit decision", detail: "Decision letter and permit number are issued.", duration: "2 days (sample)" },
      ],
      responsibleDepartment: "Licensing Desk — Small Business Unit",
      processingTarget: "14 working days (demonstration value)",
      processingDays: 14,
      commonPitfalls: [
        "All three proposed names already taken",
        "Lease letter without owner signature",
        "Activity description too vague for classification",
      ],
      sourceReference: "Mock reference — LIC-BIZ-09 (illustrative only)",
      lastVerifiedAt: iso(30),
    },
    {
      id: "proc_idcard",
      name: "National ID Renewal",
      category: "Identity",
      description:
        "Illustrative mock entry. Renewal of an expired or damaged identity card with biometric confirmation.",
      eligibility: ["Existing ID record found", "Expired, damaged, or data-change case", "Applicant present for photo (mock rule)"],
      requiredDocuments: ["Expired / damaged ID card", "Family card copy", "Proof of data change (if any)", "Recent photograph (if remote pre-filing)"],
      procedureSteps: [
        { title: "Pre-file renewal", detail: "Confirm identity record and renewal reason.", duration: "~10 min" },
        { title: "Biometric capture", detail: "Photo and fingerprints captured at service point.", duration: "Same visit" },
        { title: "Central validation", detail: "Record validated against national index (mock).", duration: "3–6 days (sample)" },
        { title: "Card release", detail: "New card printed and handed over.", duration: "2 days (sample)" },
      ],
      responsibleDepartment: "Identity Services — Card Center",
      processingTarget: "12 working days (demonstration value)",
      processingDays: 12,
      commonPitfalls: ["Old card not surrendered", "Photo does not meet specification", "Unreported address change"],
      sourceReference: "Mock reference — ID-RE-11 (illustrative only)",
      lastVerifiedAt: iso(9),
    },
  ];
}

export function seedRequests(): AdministrativeRequest[] {
  return [
    {
      id: "CF-2026-481201",
      ownerId: "u_citizen",
      documentType: "Certificate of Residence",
      title: "Residence certificate for school enrollment",
      description: "Needed for my daughter's primary school enrollment file. Address: 14 Harbor Lane, Apt 4B.",
      status: "under_review",
      createdAt: iso(9),
      updatedAt: iso(1, 14),
      targetCompletionAt: future(2),
      assignedDepartment: "Civil Registry — Residency Unit",
      requiredActions: [],
      metadata: { purpose: "School enrollment", delivery: "Pickup", copies: "2" },
    },
    {
      id: "CF-2026-377450",
      ownerId: "u_citizen",
      documentType: "Family Card Update",
      title: "Add newborn to family card",
      description: "Our son was born on March 12. Attestation letter attached at submission.",
      status: "action_required",
      createdAt: iso(14),
      updatedAt: iso(2, 11),
      targetCompletionAt: future(-2),
      assignedDepartment: "Civil Registry — Family Records",
      requiredActions: ["Upload a clearer scan of the birth attestation letter", "Confirm spelling: 'Elio' vs 'Ellio'"],
      delayReason: "Awaiting clearer attestation scan from applicant.",
      escalationFlag: true,
      metadata: { event: "Birth", member: "Elio Osei", delivery: "Pickup", copies: "1" },
    },
    {
      id: "CF-2026-902311",
      ownerId: "u_citizen",
      documentType: "Birth Certificate Application",
      title: "Birth certificate — Elio Osei",
      description: "First-time birth certificate request with clinic attestation.",
      status: "submitted",
      createdAt: iso(3),
      updatedAt: iso(3),
      targetCompletionAt: future(4),
      assignedDepartment: "Civil Status Office",
      requiredActions: [],
      metadata: { child: "Elio Osei", facility: "Harbor Clinic", delivery: "Pickup" },
    },
    {
      id: "CF-2026-118822",
      ownerId: "u_citizen",
      documentType: "National ID Renewal",
      title: "ID renewal after expiry",
      description: "Previous card expired in January. Requesting renewal with same address.",
      status: "completed",
      createdAt: iso(40),
      updatedAt: iso(22, 15),
      targetCompletionAt: iso(28, 17),
      assignedDepartment: "Identity Services — Card Center",
      requiredActions: [],
      metadata: { reason: "Expiry", delivery: "Pickup" },
    },
    {
      id: "CF-2026-550193",
      ownerId: "u_citizen",
      documentType: "Business Registration Inquiry",
      title: "Neighborhood bakery — name pre-check",
      description: "Proposed names: Harbor Crumb, Crumb & Tide, Morning Ferment. Premises at 8 Market Row.",
      status: "approved",
      createdAt: iso(18),
      updatedAt: iso(4, 10),
      targetCompletionAt: future(6),
      assignedDepartment: "Licensing Desk — Small Business Unit",
      requiredActions: [],
      metadata: { activity: "Bakery / retail", premises: "Leased", delivery: "Email + pickup" },
    },
    {
      id: "CF-2026-663021",
      ownerId: "u_citizen",
      documentType: "Certificate of Residence",
      title: "Residence certificate — bank file (draft)",
      description: "Draft for upcoming mortgage file. Not submitted yet.",
      status: "draft",
      createdAt: iso(1, 16),
      updatedAt: iso(1, 16),
      targetCompletionAt: future(7),
      assignedDepartment: "Civil Registry — Residency Unit",
      requiredActions: [],
      metadata: { purpose: "Bank file", delivery: "Download" },
    },
    {
      id: "CF-2026-204518",
      ownerId: "u_maya",
      documentType: "Family Card Update",
      title: "Family card — address move",
      description: "Moved from North Pier to Elm District. Move letter attached.",
      status: "under_review",
      createdAt: iso(11),
      updatedAt: iso(2, 9),
      targetCompletionAt: future(-1),
      assignedDepartment: "Civil Registry — Family Records",
      requiredActions: [],
      delayReason: "High volume in Family Records queue.",
      escalationFlag: true,
      metadata: { event: "Relocation", delivery: "Pickup" },
    },
    {
      id: "CF-2026-771290",
      ownerId: "u_maya",
      documentType: "Business Registration Inquiry",
      title: "Tailoring studio permit",
      description: "Home-based tailoring studio, low-impact activity.",
      status: "completed",
      createdAt: iso(60),
      updatedAt: iso(44),
      targetCompletionAt: iso(46),
      assignedDepartment: "Licensing Desk — Small Business Unit",
      requiredActions: [],
      metadata: { activity: "Tailoring", delivery: "Pickup" },
    },
    {
      id: "CF-2026-310077",
      ownerId: "u_maya",
      documentType: "Birth Certificate Application",
      title: "Late birth registration — correction",
      description: "Name correction requested after initial filing.",
      status: "rejected",
      createdAt: iso(25),
      updatedAt: iso(15),
      targetCompletionAt: iso(20),
      assignedDepartment: "Civil Status Office",
      requiredActions: ["Re-apply with corrected attestation"],
      delayReason: "Attestation name mismatch — returned for correction.",
      metadata: { delivery: "Pickup" },
    },
  ];
}

export function seedHistory(): RequestHistory[] {
  const h: RequestHistory[] = [];
  const push = (
    requestId: string,
    previousStatus: RequestHistory["previousStatus"],
    newStatus: RequestHistory["newStatus"],
    explanation: string,
    actorId: string,
    actorName: string,
    actorRole: RequestHistory["actorRole"],
    daysAgo: number
  ) => {
    h.push({
      id: `h_${requestId}_${daysAgo}_${newStatus}`,
      requestId,
      previousStatus,
      newStatus,
      explanation,
      actorId,
      actorName,
      actorRole,
      timestamp: iso(daysAgo),
    });
  };
  push("CF-2026-481201", "—", "submitted", "Request received at front office intake.", "u_citizen", "Amara Osei", "citizen", 9);
  push("CF-2026-481201", "submitted", "under_review", "Address record matched. Moved to Residency Unit queue.", "u_admin", "Daniel Reyes", "admin", 5);
  push("CF-2026-377450", "—", "submitted", "Family card update filed with birth attestation.", "u_citizen", "Amara Osei", "citizen", 14);
  push("CF-2026-377450", "submitted", "under_review", "Dossier opened by Family Records.", "u_admin", "Daniel Reyes", "admin", 10);
  push("CF-2026-377450", "under_review", "action_required", "Attestation scan is blurry; spelling confirmation needed.", "u_admin", "Daniel Reyes", "admin", 2);
  push("CF-2026-902311", "—", "submitted", "Birth certificate application received.", "u_citizen", "Amara Osei", "citizen", 3);
  push("CF-2026-118822", "—", "submitted", "ID renewal pre-filed.", "u_citizen", "Amara Osei", "citizen", 40);
  push("CF-2026-118822", "submitted", "under_review", "Biometrics captured at Card Center.", "u_admin", "Daniel Reyes", "admin", 35);
  push("CF-2026-118822", "under_review", "approved", "Central validation passed.", "u_admin", "Daniel Reyes", "admin", 26);
  push("CF-2026-118822", "approved", "completed", "New card handed over at pickup desk.", "u_admin", "Daniel Reyes", "admin", 22);
  push("CF-2026-550193", "—", "submitted", "Business name pre-check filed.", "u_citizen", "Amara Osei", "citizen", 18);
  push("CF-2026-550193", "submitted", "under_review", "Name 'Harbor Crumb' available. Dossier in licensing review.", "u_admin", "Daniel Reyes", "admin", 12);
  push("CF-2026-550193", "under_review", "approved", "Activity classified as low-impact retail. Approved in principle.", "u_admin", "Daniel Reyes", "admin", 4);
  push("CF-2026-204518", "—", "submitted", "Relocation update filed.", "u_maya", "Maya Lindqvist", "citizen", 11);
  push("CF-2026-204518", "submitted", "under_review", "Move letter accepted. Queued for registry amendment.", "u_admin", "Daniel Reyes", "admin", 7);
  push("CF-2026-771290", "—", "submitted", "Tailoring studio filing.", "u_maya", "Maya Lindqvist", "citizen", 60);
  push("CF-2026-771290", "submitted", "under_review", "Premises confirmed as home-based.", "u_admin", "Daniel Reyes", "admin", 55);
  push("CF-2026-771290", "under_review", "approved", "Permit approved.", "u_admin", "Daniel Reyes", "admin", 48);
  push("CF-2026-771290", "approved", "completed", "Permit collected.", "u_admin", "Daniel Reyes", "admin", 44);
  push("CF-2026-310077", "—", "submitted", "Late registration filed.", "u_maya", "Maya Lindqvist", "citizen", 25);
  push("CF-2026-310077", "submitted", "under_review", "Opened for verification.", "u_admin", "Daniel Reyes", "admin", 22);
  push("CF-2026-310077", "under_review", "rejected", "Returned: attestation name mismatch. Re-apply with correction.", "u_admin", "Daniel Reyes", "admin", 15);
  return h;
}

export function seedNotifications(): Notification[] {
  return [
    {
      id: "n1",
      recipientId: "u_citizen",
      requestId: "CF-2026-377450",
      title: "Action needed on your Family Card Update",
      message: "Prototype message: the attestation scan is blurry. Please upload a clearer copy and confirm the spelling of 'Elio'.",
      type: "action_required",
      isRead: false,
      createdAt: iso(2, 11),
    },
    {
      id: "n2",
      recipientId: "u_citizen",
      requestId: "CF-2026-481201",
      title: "Your Residence Certificate moved to review",
      message: "Prototype message: your file passed intake verification and is now with the Residency Unit.",
      type: "status_change",
      isRead: false,
      createdAt: iso(5, 10),
    },
    {
      id: "n3",
      recipientId: "u_citizen",
      requestId: "CF-2026-550193",
      title: "Bakery inquiry approved in principle",
      message: "Prototype message: 'Harbor Crumb' cleared the name check and your activity was approved in principle.",
      type: "status_change",
      isRead: true,
      createdAt: iso(4, 10),
    },
    {
      id: "n4",
      recipientId: "u_citizen",
      requestId: "CF-2026-118822",
      title: "ID renewal completed",
      message: "Prototype message: your renewed ID card is ready. This is a demonstration notification.",
      type: "completed",
      isRead: true,
      createdAt: iso(22, 15),
    },
    {
      id: "n5",
      recipientId: "u_citizen",
      title: "Welcome to CivicFlow",
      message: "Prototype message: this inbox demonstrates how status updates, reminders, and overdue flags would appear.",
      type: "info",
      isRead: true,
      createdAt: iso(30, 9),
    },
    {
      id: "n6",
      recipientId: "u_admin",
      requestId: "CF-2026-204518",
      title: "Review: request exceeded its sample target",
      message: "Prototype message: CF-2026-204518 passed its demonstration processing target. Reason recorded for review.",
      type: "overdue",
      isRead: false,
      createdAt: iso(1, 8),
    },
  ];
}

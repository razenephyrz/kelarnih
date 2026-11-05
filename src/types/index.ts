export type Role = "citizen" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  avatarColor?: string;
}

export type RequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "action_required"
  | "approved"
  | "completed"
  | "rejected";

export interface AdministrativeRequest {
  id: string;
  ownerId: string;
  documentType: string;
  title: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  targetCompletionAt: string;
  assignedDepartment: string;
  requiredActions: string[];
  delayReason?: string;
  escalationFlag?: boolean;
  metadata: Record<string, string>;
  progressOverride?: number;
}

export interface RequestHistory {
  id: string;
  requestId: string;
  previousStatus: RequestStatus | "—";
  newStatus: RequestStatus;
  explanation: string;
  actorId: string;
  actorName: string;
  actorRole: Role | "system";
  timestamp: string;
}

export type NotificationType =
  | "request_created"
  | "status_change"
  | "action_required"
  | "completed"
  | "overdue"
  | "info";

export interface Notification {
  id: string;
  recipientId: string;
  requestId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface DocumentProcedure {
  id: string;
  name: string;
  category: string;
  description: string;
  eligibility: string[];
  requiredDocuments: string[];
  procedureSteps: { title: string; detail: string; duration: string }[];
  responsibleDepartment: string;
  processingTarget: string;
  processingDays: number;
  commonPitfalls: string[];
  sourceReference: string;
  lastVerifiedAt: string;
}

export const STATUS_META: Record<
  RequestStatus,
  { label: string; color: string; bg: string; dot: string; description: string }
> = {
  draft: {
    label: "Draft",
    color: "#647587",
    bg: "#E7ECEF",
    dot: "#647587",
    description: "Not yet submitted. Only visible to you.",
  },
  submitted: {
    label: "Submitted",
    color: "#274C77",
    bg: "#E7ECEF",
    dot: "#274C77",
    description: "Received by the front office. Awaiting verification.",
  },
  under_review: {
    label: "Under Review",
    color: "#274C77",
    bg: "#D8E8F5",
    dot: "#6096BA",
    description: "Being checked by the responsible department.",
  },
  action_required: {
    label: "Action Required",
    color: "#7A5A1F",
    bg: "#F7EBCF",
    dot: "#B78032",
    description: "We need something from you to continue.",
  },
  approved: {
    label: "Approved",
    color: "#2E6B57",
    bg: "#D9EBE3",
    dot: "#39856A",
    description: "Approved. Final issuance is being prepared.",
  },
  completed: {
    label: "Completed",
    color: "#2E6B57",
    bg: "#D9EBE3",
    dot: "#39856A",
    description: "Finished. Document ready for collection or download.",
  },
  rejected: {
    label: "Returned",
    color: "#8E4444",
    bg: "#F3DEDE",
    dot: "#B85C5C",
    description: "Returned with an explanation. You may re-apply.",
  },
};

export const PIPELINE_STAGES = [
  { key: "received", label: "Received", hint: "Front office intake" },
  { key: "verification", label: "Verification", hint: "Files & identity check" },
  { key: "review", label: "Department review", hint: "Responsible unit" },
  { key: "decision", label: "Decision", hint: "Approval & signing" },
  { key: "issuance", label: "Issuance", hint: "Ready for pickup" },
] as const;

export function statusToStageIndex(status: RequestStatus): number {
  switch (status) {
    case "draft":
      return 0;
    case "submitted":
      return 1;
    case "under_review":
      return 2;
    case "action_required":
      return 2;
    case "approved":
      return 3;
    case "completed":
      return 4;
    case "rejected":
      return 2;
    default:
      return 1;
  }
}

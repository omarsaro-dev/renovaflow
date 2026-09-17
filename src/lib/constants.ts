import type { LucideIcon } from "lucide-react";
import {
  Circle,
  PauseCircle,
  ClipboardCheck,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Ban,
  Eye,
  CircleDashed,
  PenLine,
} from "lucide-react";

export const ROLES = {
  ADMIN: { label: "Owner / Admin", short: "Admin" },
  MANAGER: { label: "Project Manager", short: "Manager" },
  WORKER: { label: "Worker / Subcontractor", short: "Worker" },
  CUSTOMER: { label: "Customer", short: "Customer" },
} as const;

export type RoleKey = keyof typeof ROLES;

export const PROJECT_STATUS = {
  PLANNING: {
    label: "Planning",
    description: "Project is being scoped and scheduled",
    tone: "info",
  },
  ACTIVE: { label: "Active", description: "Work is underway", tone: "success" },
  ON_HOLD: {
    label: "On hold",
    description: "Work has been paused",
    tone: "warning",
  },
  READY_FOR_REVIEW: {
    label: "Ready for review",
    description: "Work is finished and ready for customer review",
    tone: "accent",
  },
  COMPLETED: {
    label: "Completed",
    description: "Project has been completed",
    tone: "neutral",
  },
} as const;

export type ProjectStatusKey = keyof typeof PROJECT_STATUS;

export const TASK_STATUS: Record<
  string,
  { label: string; icon: LucideIcon; tone: "neutral" | "info" | "warning" | "accent" | "success" }
> = {
  TODO: { label: "To do", icon: ClipboardList, tone: "neutral" },
  IN_PROGRESS: { label: "In progress", icon: Loader2, tone: "info" },
  BLOCKED: { label: "Blocked", icon: Ban, tone: "warning" },
  IN_REVIEW: { label: "In review", icon: Eye, tone: "accent" },
  DONE: { label: "Done", icon: CheckCircle2, tone: "success" },
} as const;

export type TaskStatusKey = keyof typeof TASK_STATUS;

export const TASK_STATUS_ORDER = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"] as TaskStatusKey[];

export const TASK_PRIORITY = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "info" },
  HIGH: { label: "High", tone: "warning" },
  URGENT: { label: "Urgent", tone: "danger" },
} as const;

export type TaskPriorityKey = keyof typeof TASK_PRIORITY;

export const CHANGE_REQUEST_STATUS = {
  DRAFT: { label: "Draft", icon: PenLine, tone: "neutral" },
  PENDING_APPROVAL: { label: "Pending approval", icon: ClipboardCheck, tone: "accent" },
  APPROVED: { label: "Approved", icon: CheckCircle2, tone: "success" },
  REJECTED: { label: "Rejected", icon: CircleDashed, tone: "danger" },
  CANCELLED: { label: "Cancelled", icon: Circle, tone: "neutral" },
} as const;

export type ChangeRequestStatusKey = keyof typeof CHANGE_REQUEST_STATUS;

export const BUDGET_CATEGORIES = [
  { key: "MATERIALS", label: "Materials", sort: 10 },
  { key: "LABOR", label: "Labor", sort: 20 },
  { key: "PERMITS", label: "Permits", sort: 30 },
  { key: "SUBCONTRACTORS", label: "Subcontractors", sort: 40 },
  { key: "OTHER", label: "Other", sort: 50 },
] as const;

export const STATUS_ICONS: Record<string, LucideIcon> = {
  PLANNING: Circle,
  ACTIVE: PauseCircle,
  ON_HOLD: PauseCircle,
  READY_FOR_REVIEW: ClipboardCheck,
  COMPLETED: CheckCircle2,
};

export function projectStatusTone(status: string) {
  return PROJECT_STATUS[status as ProjectStatusKey]?.tone ?? "neutral";
}

export function taskStatusTone(status: string) {
  return TASK_STATUS[status as TaskStatusKey]?.tone ?? "neutral";
}
import { StatusBadge } from "@/components/ui/badge";
import { PROJECT_STATUS, TASK_STATUS, TASK_PRIORITY, CHANGE_REQUEST_STATUS } from "@/lib/constants";

export function ProjectStatusBadge({ status, showLabel = true }: { status: string; showLabel?: boolean }) {
  const meta = PROJECT_STATUS[status as keyof typeof PROJECT_STATUS];
  if (!meta) return <StatusBadge label={status} tone="neutral" />;
  return <StatusBadge tone={meta.tone as never} label={showLabel ? meta.label : status} />;
}

export function TaskStatusBadge({ status }: { status: string }) {
  const meta = TASK_STATUS[status as keyof typeof TASK_STATUS];
  if (!meta) return <StatusBadge label={status} tone="neutral" />;
  return <StatusBadge icon={meta.icon} tone={meta.tone as never} label={meta.label} />;
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const meta = TASK_PRIORITY[priority as keyof typeof TASK_PRIORITY];
  if (!meta) return <StatusBadge label={priority} tone="neutral" />;
  return <StatusBadge tone={meta.tone as never} label={meta.label} />;
}

export function ChangeRequestStatusBadge({ status }: { status: string }) {
  const meta = CHANGE_REQUEST_STATUS[status as keyof typeof CHANGE_REQUEST_STATUS];
  if (!meta) return <StatusBadge label={status} tone="neutral" />;
  return <StatusBadge icon={meta.icon} tone={meta.tone as never} label={meta.label} />;
}
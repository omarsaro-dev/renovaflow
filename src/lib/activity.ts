import { prisma } from "./db";
import type { ActivityEventType, Prisma } from "@prisma/client";

export interface ActivityInput {
  organizationId: string;
  actorId?: string | null;
  projectId?: string | null;
  type: ActivityEventType;
  title: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records a chronological activity event. This is the audit trail for the
 * entire product — project changes, task lifecycle, budget decisions, and
 * approvals all flow through here.
 */
export async function recordActivity(input: ActivityInput) {
  return prisma.activityEvent.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      projectId: input.projectId ?? null,
      type: input.type,
      title: input.title,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
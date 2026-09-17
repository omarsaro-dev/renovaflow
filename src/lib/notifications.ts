import { prisma } from "./db";
import type { NotificationType } from "@prisma/client";

interface NotifyInput {
  userId: string;
  organizationId: string;
  projectId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Creates an in-app notification for a user, honoring their stored
 * notification preferences for that type. Missing preferences default to on.
 */
export async function notifyUser(input: NotifyInput) {
  const pref = await prisma.notificationPreference.findUnique({
    where: {
      userId_type: { userId: input.userId, type: input.type },
    },
  });
  if (pref && !pref.enabled) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      projectId: input.projectId ?? undefined,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}

/**
 * Notifies every active team member in the org, optionally excluding the
 * person who performed the action.
 */
export async function notifyTeam({
  organizationId,
  exceptUserId,
  projectId,
  type,
  title,
  body,
  link,
}: {
  organizationId: string;
  exceptUserId?: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId, isActive: true },
    select: { userId: true },
  });

  for (const member of members) {
    if (member.userId === exceptUserId) continue;
    await notifyUser({
      userId: member.userId,
      organizationId,
      projectId,
      type,
      title,
      body,
      link,
    });
  }
}

/**
 * Notify all active project team members (admins/managers who manage the org
 * plus the project's assigned team) about an approval decision.
 */
export async function notifyProjectTeamApproval({
  projectId,
  organizationId,
  type,
  title,
  body,
  link,
}: {
  projectId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  const orgLeads = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true,
      role: { in: ["ADMIN", "MANAGER"] },
    },
    select: { userId: true },
  });
  const ids = new Set([...projectMembers.map((m) => m.userId), ...orgLeads.map((m) => m.userId)]);
  for (const userId of ids) {
    await notifyUser({ userId, organizationId, projectId, type, title, body, link });
  }
}
import { prisma } from "./db";
import { clamp } from "./utils";

/**
 * Recomputes and persists a project's progress percentage based on its tasks.
 * Uses task priority as a weight so high-priority work counts for more.
 */
export async function recomputeProjectProgress(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { status: true, priority: true },
  });

  const weights: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  let total = 0;
  let done = 0;
  for (const task of tasks) {
    const w = weights[task.priority] ?? 1;
    total += w;
    if (task.status === "DONE") done += w;
  }

  const progress = total === 0 ? 0 : clamp(Math.round((done / total) * 100), 0, 100);

  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });

  return progress;
}

/**
 * Recomputes progress for every project in an organization (used by seeding).
 */
export async function recomputeAllProgress(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: { id: true },
  });
  for (const project of projects) {
    await recomputeProjectProgress(project.id);
  }
}
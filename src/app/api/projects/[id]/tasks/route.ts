import { prisma } from "@/lib/db";
import { apiError, created, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, requireProject, forbidden, invalidInput } from "@/lib/permissions";
import { createTaskSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import { notifyUser } from "@/lib/notifications";
import { recomputeProjectProgress } from "@/lib/progress";
import type { TaskPriority, TaskStatus } from "@prisma/client";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();
    await requireProject(ctx, params.id, "read");

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { assignee: { select: { id: true, name: true } } },
    });

    return ok({ tasks });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();
    await requireProject(ctx, params.id, "write");

    const body = await parseBody(request, createTaskSchema);
    if (body.projectId !== params.id) invalidInput("Project mismatch.");

    if (body.assigneeId) {
      const member = await prisma.organizationMember.findFirst({
        where: { userId: body.assigneeId, organizationId: ctx.organizationId, isActive: true },
      });
      if (!member) invalidInput("The assignee is not a member of your organization.");
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: params.id, userId: body.assigneeId } },
        update: {},
        create: {
          organizationId: ctx.organizationId,
          projectId: params.id,
          userId: body.assigneeId,
          role: member.role,
        },
      });
    }

    const task = await prisma.task.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: params.id,
        creatorId: ctx.user.id,
        title: body.title,
        description: body.description ?? null,
        assigneeId: body.assigneeId || null,
        priority: body.priority as TaskPriority,
        status: body.status as TaskStatus,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completedAt: body.status === "DONE" ? new Date() : null,
      },
    });

    await recomputeProjectProgress(params.id);

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: params.id,
      actorId: ctx.user.id,
      type: "TASK_CREATED",
      title: `Created task "${task.title}"`,
    });

    if (task.assigneeId) {
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: params.id,
        actorId: ctx.user.id,
        type: "TASK_ASSIGNED",
        title: `Assigned "${task.title}" to ${body.assigneeId === ctx.user.id ? "themselves" : "a crew member"}`,
      });
      await notifyUser({
        userId: task.assigneeId,
        organizationId: ctx.organizationId,
        projectId: params.id,
        type: "TASK_ASSIGNED",
        title: `New task assigned: ${task.title}`,
        link: `/app/projects/${params.id}/tasks`,
      });
    }

    return created({ task });
  } catch (error) {
    return apiError(error);
  }
}
import { prisma } from "@/lib/db";
import { apiError, parseBody, ok } from "@/lib/api";
import { getServerAuthContext, forbidden, notFound } from "@/lib/permissions";
import { updateTaskSchema, workerTaskUpdateSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import { notifyTeam, notifyUser } from "@/lib/notifications";
import { recomputeProjectProgress } from "@/lib/progress";
import { TaskStatus, TaskPriority } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();

    const task = await prisma.task.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!task) notFound();
    if (ctx.teamRole === "WORKER" && !ctx.projectIds.includes(task.projectId)) forbidden();

    if (ctx.teamRole === "WORKER") {
      if (task.assigneeId !== ctx.user.id) {
        forbidden("You can only update tasks assigned to you.");
      }
      const body = await parseBody(request, workerTaskUpdateSchema);
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: body.status as TaskStatus,
          completedAt: body.status === "DONE" ? new Date() : null,
        },
      });
      if (body.note) {
        await prisma.taskNote.create({
          data: {
            taskId: task.id,
            authorId: ctx.user.id,
            body: body.note,
          },
        });
      }
      await recomputeProjectProgress(task.projectId);

      const completed = body.status === "DONE";
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: task.projectId,
        actorId: ctx.user.id,
        type: completed ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
        title: `${ctx.user.name} ${completed ? "completed" : "moved"} "${updated.title}" ${
          completed ? "" : `to ${String(body.status).toLowerCase()}`
        }`,
      });
      await notifyTeam({
        organizationId: ctx.organizationId,
        projectId: task.projectId,
        exceptUserId: ctx.user.id,
        type: "TASK_STATUS_CHANGED",
        title: `${ctx.user.name} ${completed ? "completed" : "updated"} "${updated.title}"`,
        body: body.note ?? undefined,
        link: `/app/projects/${task.projectId}/tasks`,
      });
      return ok({ task: updated });
    }

    const body = await parseBody(request, updateTaskSchema);

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: body.title,
        description: body.description ?? null,
        assigneeId: body.assigneeId || null,
        priority: body.priority as TaskPriority | undefined,
        status: body.status as TaskStatus | undefined,
        startDate: body.startDate ? new Date(body.startDate) : task.startDate,
        dueDate: body.dueDate ? new Date(body.dueDate) : task.dueDate,
        completedAt: body.status === "DONE" ? new Date() : null,
      },
    });

    await recomputeProjectProgress(task.projectId);

    if (body.assigneeId && body.assigneeId !== task.assigneeId) {
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: task.projectId,
        actorId: ctx.user.id,
        type: "TASK_ASSIGNED",
        title: `Assigned "${updated.title}" to ${task.assignee?.name ?? "a crew member"}`,
      });
      await notifyUser({
        userId: body.assigneeId,
        organizationId: ctx.organizationId,
        projectId: task.projectId,
        type: "TASK_ASSIGNED",
        title: `New task assigned to you: ${updated.title}`,
        body: task.project.name,
        link: `/app/projects/${task.projectId}/tasks`,
      });
    } else if (body.status !== task.status) {
      const completed = body.status === "DONE";
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: task.projectId,
        actorId: ctx.user.id,
        type: completed ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
        title: `${ctx.user.name} ${completed ? "completed" : "moved"} "${updated.title}" ${
          completed ? "" : `to ${String(body.status).toLowerCase()}`
        }`,
      });
      await notifyTeam({
        organizationId: ctx.organizationId,
        projectId: task.projectId,
        exceptUserId: ctx.user.id,
        type: "TASK_STATUS_CHANGED",
        title: `${ctx.user.name} ${completed ? "completed" : "updated"} "${updated.title}"`,
        body: task.project.name,
        link: `/app/projects/${task.projectId}/tasks`,
      });
    }

    return ok({ task: updated });
  } catch (error) {
    return apiError(error);
  }
}

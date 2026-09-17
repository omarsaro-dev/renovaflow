import { prisma } from "@/lib/db";
import { apiError, ok } from "@/lib/api";
import { getServerAuthContext, forbidden, invalidInput } from "@/lib/permissions";
import { saveUploadedFile } from "@/lib/files";
import { recordActivity } from "@/lib/activity";
import type { FileVisibility } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();

    const form = await request.formData().catch(() => invalidInput("Expected a multipart upload."));
    const file = form.get("file");
    if (!(file instanceof File)) invalidInput("A `file` field is required.");

    const projectId = String(form.get("projectId") ?? "");
    const taskId = String(form.get("taskId") ?? "");
    const expenseId = String(form.get("expenseId") ?? "");
    const changeRequestId = String(form.get("changeRequestId") ?? "");
    const updateId = String(form.get("updateId") ?? "");
    const visibility = String(form.get("visibility") ?? "INTERNAL");
    const description = String(form.get("description") ?? "") || undefined;

    if (visibility !== "INTERNAL" && visibility !== "CUSTOMER_VISIBLE") {
      invalidInput("Invalid visibility.", { visibility });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organizationId },
      include: { members: true },
    });
    if (!project) forbidden("Project not found.");

    if (ctx.teamRole === "WORKER" && !project.members.some((m) => m.userId === ctx.user.id)) {
      forbidden();
    }
    if (ctx.isCustomer) forbidden();

    if (taskId) {
      const task = await prisma.task.findFirst({ where: { id: taskId, projectId, organizationId: ctx.organizationId } });
      if (!task) invalidInput("The task does not belong to this project.");
    }
    if (expenseId) {
      const expense = await prisma.expense.findFirst({ where: { id: expenseId, projectId, organizationId: ctx.organizationId } });
      if (!expense) invalidInput("The expense does not belong to this project.");
    }
    if (changeRequestId) {
      const cr = await prisma.changeRequest.findFirst({ where: { id: changeRequestId, projectId, organizationId: ctx.organizationId } });
      if (!cr) invalidInput("The change request does not belong to this project.");
    }
    if (updateId) {
      const update = await prisma.update.findFirst({ where: { id: updateId, projectId, organizationId: ctx.organizationId } });
      if (!update) invalidInput("The update does not belong to this project.");
    }

    const row = await saveUploadedFile({
      uploaderId: ctx.user.id,
      organizationId: ctx.organizationId,
      file,
      projectId,
      taskId: taskId || undefined,
      expenseId: expenseId || undefined,
      changeRequestId: changeRequestId || undefined,
      updateId: updateId || undefined,
      visibility: visibility as FileVisibility,
      description,
    });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId,
      actorId: ctx.user.id,
      type: "FILE_UPLOADED",
      title: `Uploaded ${row.originalName}`,
    });

    return ok({ file: row });
  } catch (error) {
    return apiError(error);
  }
}
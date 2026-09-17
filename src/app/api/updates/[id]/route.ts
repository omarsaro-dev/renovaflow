import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden } from "@/lib/permissions";
import { updateSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import { notifyUser } from "@/lib/notifications";
import type { UpdateVisibility } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const update = await prisma.update.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!update) forbidden("This update does not exist in your organization.");
    if (ctx.teamRole === "WORKER") forbidden();

    const body = await parseBody(request, updateSchema);

    const wasPublished = update.isPublished;
    const willPublish = body.publish;

    const updated = await prisma.update.update({
      where: { id: update.id },
      data: {
        title: body.title,
        body: body.body,
        visibility: body.visibility as UpdateVisibility,
        isPublished: willPublish,
        publishedAt: willPublish && !wasPublished ? new Date() : update.publishedAt,
      },
    });

    if (willPublish && !wasPublished) {
      const project = await prisma.project.findUnique({
        where: { id: update.projectId },
        select: { customerId: true, name: true },
      });
      if (project?.customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: project.customerId },
          select: { userId: true },
        });
        if (customer?.userId) {
          await notifyUser({
            userId: customer.userId,
            organizationId: ctx.organizationId,
            projectId: update.projectId,
            type: "UPDATE_PUBLISHED",
            title: `New update on ${project.name}`,
            body: updated.title,
            link: `/portal/projects/${update.projectId}/updates`,
          });
        }
      }
    }

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: update.projectId,
      actorId: ctx.user.id,
      type: "UPDATE_PUBLISHED",
      title: `${ctx.user.name} ${willPublish ? "published" : "updated"} "${updated.title}"`,
    });

    return ok({ update: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const update = await prisma.update.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!update) forbidden("This update does not exist in your organization.");
    if (ctx.teamRole === "WORKER") forbidden();

    await prisma.update.delete({ where: { id: update.id } });

    return ok({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
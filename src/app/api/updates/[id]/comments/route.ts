import { prisma } from "@/lib/db";
import { apiError, created, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden } from "@/lib/permissions";
import { commentSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const update = await prisma.update.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, projectId: true, title: true },
    });
    if (!update) forbidden("This update does not exist in your organization.");

    const body = await parseBody(request, commentSchema);

    const comment = await prisma.comment.create({
      data: {
        organizationId: ctx.organizationId,
        updateId: update.id,
        authorId: ctx.user.id,
        body: body.body,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: update.projectId,
      actorId: ctx.user.id,
      type: "CUSTOMER_COMMENTED",
      title: `${ctx.user.name} commented on "${update.title}"`,
    });

    return created({ comment });
  } catch (error) {
    return apiError(error);
  }
}
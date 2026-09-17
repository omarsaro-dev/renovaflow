import { prisma } from "@/lib/db";
import { apiError, created, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, requireProject, forbidden } from "@/lib/permissions";
import { updateSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import { notifyUser } from "@/lib/notifications";
import type { UpdateVisibility } from "@prisma/client";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();
    await requireProject(ctx, params.id, "read");

    const updates = await prisma.update.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true } } },
        },
        files: { select: { id: true, originalName: true, url: true, thumbnailUrl: true, isImage: true } },
      },
    });

    return ok({ updates });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();
    await requireProject(ctx, params.id, "write");

    const body = await parseBody(request, updateSchema);

    const update = await prisma.update.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: params.id,
        authorId: ctx.user.id,
        title: body.title,
        body: body.body,
        visibility: body.visibility as UpdateVisibility,
        isPublished: body.publish,
        publishedAt: body.publish ? new Date() : null,
      },
    });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: params.id,
      actorId: ctx.user.id,
      type: "UPDATE_PUBLISHED",
      title: `${body.publish ? "Published" : "Drafted"} update "${update.title}"`,
    });

    if (body.publish) {
      const project = await prisma.project.findUnique({
        where: { id: params.id },
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
            projectId: params.id,
            type: "UPDATE_PUBLISHED",
            title: `New update on ${project.name}`,
            body: body.title,
            link: `/portal/projects/${params.id}/updates`,
          });
        }
      }
    }

    return created({ update });
  } catch (error) {
    return apiError(error);
  }
}
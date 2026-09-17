import { prisma } from "@/lib/db";
import { apiError, created, parseBody } from "@/lib/api";
import { getServerAuthContext, requireProject, forbidden, invalidInput } from "@/lib/permissions";
import { changeRequestSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import { notifyUser, notifyTeam } from "@/lib/notifications";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();
    await requireProject(ctx, params.id, "write");

    const body = await parseBody(request, changeRequestSchema);
    if (body.projectId !== params.id) invalidInput("Project mismatch.");

    if (body.budgetCategoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: { id: body.budgetCategoryId, projectId: params.id, organizationId: ctx.organizationId },
      });
      if (!category) invalidInput("The category does not belong to this project.");
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, name: true, customerId: true },
    });
    if (!project) forbidden();

    const changeRequest = await prisma.changeRequest.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: params.id,
        budgetCategoryId: body.budgetCategoryId || null,
        title: body.title,
        reason: body.reason,
        costImpact: body.costImpact,
        scheduleImpactDays: body.scheduleImpactDays,
        scheduleImpactNote: body.scheduleImpactNote ?? null,
        status: "PENDING_APPROVAL",
        requesterId: ctx.user.id,
        submittedAt: new Date(),
      },
    });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: params.id,
      actorId: ctx.user.id,
      type: "CHANGE_REQUEST_CREATED",
      title: `Created change request: ${changeRequest.title}`,
    });

    if (project.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: project.customerId, organizationId: ctx.organizationId },
        select: { userId: true, name: true },
      });
      if (customer?.userId) {
        await notifyUser({
          userId: customer.userId,
          organizationId: ctx.organizationId,
          projectId: params.id,
          type: "CHANGE_REQUEST_CREATED",
          title: `A change request needs your approval: ${changeRequest.title}`,
          body: `${project.name} · ${ctx.user.name}`,
          link: `/portal/projects/${params.id}/approvals`,
        });
      } else {
        await notifyTeam({
          organizationId: ctx.organizationId,
          exceptUserId: ctx.user.id,
          projectId: params.id,
          type: "CHANGE_REQUEST_CREATED",
          title: `Change request created: ${changeRequest.title}`,
          body: `${customer?.name ?? "The customer"} has no portal login yet, so this cannot be approved online yet.`,
          link: `/app/projects/${params.id}/budget`,
        });
      }
    } else {
      await notifyTeam({
        organizationId: ctx.organizationId,
        exceptUserId: ctx.user.id,
        projectId: params.id,
        type: "CHANGE_REQUEST_CREATED",
        title: `Change request created: ${changeRequest.title}`,
        body: `No customer is linked to ${project.name} yet, so there is no one to approve this.`,
        link: `/app/projects/${params.id}/budget`,
      });
    }

    return created({ changeRequest });
  } catch (error) {
    return apiError(error);
  }
}
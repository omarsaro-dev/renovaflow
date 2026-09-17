import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, requireProject, forbidden, invalidInput } from "@/lib/permissions";
import { updateProjectSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import type { ProjectStatus } from "@prisma/client";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();
    await requireProject(ctx, params.id, "read");

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    return ok({ project });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();
    await requireProject(ctx, params.id, "write");

    const body = await parseBody(request, updateProjectSchema);

    if (body.customerId !== undefined && body.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: body.customerId, organizationId: ctx.organizationId },
      });
      if (!customer) invalidInput("The selected customer does not exist in your organization.");
    }
    if (body.managerId !== undefined && body.managerId) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: body.managerId, organizationId: ctx.organizationId, isActive: true },
      });
      if (!membership) invalidInput("The selected manager is not a member of your organization.");
    }

    const current = await prisma.project.findUnique({ where: { id: params.id } });
    if (!current) forbidden();

    let currentApprovedBudget: number | undefined;
    if (body.initialBudget !== undefined && body.initialBudget !== current.initialBudget) {
      const delta = body.initialBudget - current.initialBudget;
      currentApprovedBudget = Math.max(0, current.currentApprovedBudget + delta);
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        customerId: body.customerId === undefined ? undefined : body.customerId || null,
        managerId: body.managerId === undefined ? undefined : body.managerId || null,
        description: body.description,
        address: body.address,
        status: body.status as ProjectStatus,
        startDate: body.startDate ? new Date(body.startDate) : body.startDate === null ? null : undefined,
        expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : body.expectedCompletionDate === null ? null : undefined,
        initialBudget: body.initialBudget,
        currentApprovedBudget,
      },
    });

    if (body.status) {
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: params.id,
        actorId: ctx.user.id,
        type: "PROJECT_STATUS_CHANGED",
        title: `Project moved to ${project.status}`,
      });
    }

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: params.id,
      actorId: ctx.user.id,
      type: "BUDGET_CHANGED",
      title: `Updated project "${project.name}"`,
    });

    return ok({ project });
  } catch (error) {
    return apiError(error);
  }
}
import { prisma } from "@/lib/db";
import { apiError, ok, created, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden, invalidInput } from "@/lib/permissions";
import { createProjectSchema } from "@/lib/validation";
import { BUDGET_CATEGORIES } from "@/lib/constants";
import type { ProjectStatus } from "@prisma/client";

export function GET() {
  // List handled server-side through /app/projects; kept for API completeness.
  return ok({ message: "Use /app/projects for the project list UI." });
}

export async function POST(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer || !ctx.teamRole) forbidden();
    if (ctx.teamRole === "WORKER") forbidden();

    const body = await parseBody(request, createProjectSchema);

    // Customer must belong to this organization.
    if (body.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: body.customerId, organizationId: ctx.organizationId },
      });
      if (!customer) invalidInput("The selected customer does not exist in your organization.");
    }

    // Manager must be an active member of this organization.
    if (body.managerId) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: body.managerId, organizationId: ctx.organizationId, isActive: true },
      });
      if (!membership) invalidInput("The selected manager is not a member of your organization.");
    }

    const initialBudget = body.initialBudget ?? 0;

    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          organizationId: ctx.organizationId,
          name: body.name,
          customerId: body.customerId ?? null,
          managerId: body.managerId ?? null,
          createdById: ctx.user.id,
          description: body.description ?? null,
          address: body.address ?? null,
          status: body.status as ProjectStatus,
          startDate: body.startDate ? new Date(body.startDate) : null,
          expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : null,
          initialBudget,
          currentApprovedBudget: initialBudget,
        },
      });

      await tx.budgetCategory.createMany({
        data: BUDGET_CATEGORIES.map((c, i) => ({
          organizationId: ctx.organizationId,
          projectId: p.id,
          name: c.label,
          type: c.key,
          sortOrder: c.sort ?? (i + 1) * 10,
        })),
      });

      await tx.activityEvent.create({
        data: {
          organizationId: ctx.organizationId,
          projectId: p.id,
          actorId: ctx.user.id,
          type: "PROJECT_CREATED",
          title: `Project "Created ${p.name}"`,
          metadata: { initialBudget },
        },
      });

      return p;
    });

    return created({ project });
  } catch (error) {
    return apiError(error);
  }
}
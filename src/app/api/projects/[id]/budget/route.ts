import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, requireProject, forbidden } from "@/lib/permissions";
import { getProjectBudgetSnapshot } from "@/lib/money";
import { recordActivity } from "@/lib/activity";
import { budgetSchema } from "@/lib/validation";
import type { BudgetCategoryType } from "@prisma/client";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();
    await requireProject(ctx, params.id, "read");

    const page = await prisma.project.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, initialBudget: true, currentApprovedBudget: true },
    });
    if (!page) forbidden("Project not found.");

    const categories = await prisma.budgetCategory.findMany({
      where: { projectId: params.id },
      include: {
        _count: { select: { expenses: true } },
        expenses: { select: { actualAmount: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const [expenses, changeRequests] = await Promise.all([
      prisma.expense.findMany({
        where: { projectId: params.id },
        include: {
          category: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.changeRequest.findMany({
        where: { projectId: params.id },
        include: { budgetCategory: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const summary = await getProjectBudgetSnapshot(params.id, ctx.organization.budgetWarningThreshold);

    return ok({
      budget: page,
      categories,
      expenses,
      changeRequests,
      summary,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();
    await requireProject(ctx, params.id, "write", { finance: true });

    const body = await parseBody(request, budgetSchema);

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      select: { id: true, name: true, currentApprovedBudget: true },
    });
    if (!project) forbidden("Project not found.");

    await prisma.$transaction(async (tx) => {
      if (body.initialBudget !== undefined || body.currentApprovedBudget !== undefined) {
        await tx.project.update({
          where: { id: params.id },
          data: {
            ...(body.initialBudget !== undefined ? { initialBudget: body.initialBudget } : {}),
            ...(body.currentApprovedBudget !== undefined ? { currentApprovedBudget: body.currentApprovedBudget } : {}),
          },
        });
      }

      if (body.categories) {
        const existing = await tx.budgetCategory.findMany({
          where: { projectId: params.id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((c) => c.id));
        const seen = new Set<string>();

        await Promise.all(
          body.categories.map((cat, index) => {
            if (cat.id && existingIds.has(cat.id)) {
              seen.add(cat.id);
              return tx.budgetCategory.update({
                where: { id: cat.id },
                data: { name: cat.name, type: cat.type as BudgetCategoryType, estimatedAmount: cat.estimatedAmount, sortOrder: index },
              });
            }
            return tx.budgetCategory.create({
              data: {
                organizationId: ctx.organizationId,
                projectId: params.id,
                name: cat.name,
                type: cat.type as BudgetCategoryType,
                estimatedAmount: cat.estimatedAmount,
                sortOrder: index,
              },
            });
          })
        );

        const removed = existing.filter((c) => !seen.has(c.id));
        if (removed.length > 0) {
          const removedIds = removed.map((c) => c.id);
          await tx.expense.updateMany({ where: { categoryId: { in: removedIds } }, data: { categoryId: null } });
          await tx.budgetCategory.deleteMany({ where: { id: { in: removedIds } } });
        }
      }
    });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: params.id,
      actorId: ctx.user.id,
      type: "BUDGET_CHANGED",
      title: `Updated the budget for ${project.name}`,
    });

    return ok({ updated: true });
  } catch (error) {
    return apiError(error);
  }
}
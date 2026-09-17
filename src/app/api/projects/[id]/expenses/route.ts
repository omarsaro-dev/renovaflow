import { prisma } from "@/lib/db";
import { apiError, created, parseBody } from "@/lib/api";
import { getServerAuthContext, requireProject, forbidden, invalidInput } from "@/lib/permissions";
import { expenseSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();
    await requireProject(ctx, params.id, "read");

    const body = await parseBody(request, expenseSchema);
    if (body.projectId !== params.id) invalidInput("Project mismatch.");

    if (body.categoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: { id: body.categoryId, projectId: params.id, organizationId: ctx.organizationId },
      });
      if (!category) invalidInput("The category does not belong to this project.");
    }

    const expense = await prisma.expense.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: params.id,
        categoryId: body.categoryId || null,
        createdById: ctx.user.id,
        description: body.description,
        estimatedAmount: body.estimatedAmount ?? null,
        actualAmount: body.actualAmount,
        vendor: body.vendor ?? null,
        date: body.date ? new Date(body.date) : new Date(),
        notes: body.notes ?? null,
      },
    });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: params.id,
      actorId: ctx.user.id,
      type: "EXPENSE_ADDED",
      title: `Logged expense: ${expense.description}`,
    });

    return created({ expense });
  } catch (error) {
    return apiError(error);
  }
}
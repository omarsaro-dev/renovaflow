import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden, isFinanciallyCleared } from "@/lib/permissions";
import { updateExpenseSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";

async function getExpense(ctx: NonNullable<Awaited<ReturnType<typeof getServerAuthContext>>>, id: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId: ctx.organizationId },
  });
  if (!expense) forbidden("This expense does not exist in your organization.");
  return expense;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();

    const expense = await getExpense(ctx, params.id);
    const canEdit = isFinanciallyCleared(ctx) || expense.createdById === ctx.user.id;
    if (!canEdit) forbidden();

    const body = await parseBody(request, updateExpenseSchema);

    if (body.categoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: { id: body.categoryId, projectId: expense.projectId, organizationId: ctx.organizationId },
      });
      if (!category) forbidden("The category does not belong to this project.");
    }

    const updated = await prisma.expense.update({
      where: { id: expense.id },
      data: {
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.actualAmount !== undefined ? { actualAmount: body.actualAmount } : {}),
        ...(body.estimatedAmount !== undefined ? { estimatedAmount: body.estimatedAmount } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId || null } : {}),
        ...(body.vendor !== undefined ? { vendor: body.vendor || null } : {}),
        ...(body.date !== undefined && body.date ? { date: new Date(body.date) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      },
    });

    if (updated.actualAmount !== expense.actualAmount) {
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: expense.projectId,
        actorId: ctx.user.id,
        type: "EXPENSE_ADDED",
        title: `Updated expense: ${updated.description}`,
      });
    }

    return ok({ expense: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();
    if (!isFinanciallyCleared(ctx)) forbidden();

    const expense = await getExpense(ctx, params.id);
    await prisma.expense.delete({ where: { id: expense.id } });

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: expense.projectId,
      actorId: ctx.user.id,
      type: "EXPENSE_ADDED",
      title: `Deleted expense: ${expense.description}`,
    });

    return ok({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
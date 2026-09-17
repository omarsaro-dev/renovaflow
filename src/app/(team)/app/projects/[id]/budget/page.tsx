import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getProjectBudgetSnapshot } from "@/lib/money";
import { BudgetOverview } from "@/components/budget/budget-overview";

export const metadata = { title: "Budget" };

export default async function ProjectBudgetPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";
  const canFinance = !isWorker;

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!project) notFound();
  if (isWorker && !ctx.projectIds.includes(project.id)) notFound();

  const [categories, expenses, changeRequests, summary] = await Promise.all([
    prisma.budgetCategory.findMany({
      where: { projectId: project.id },
      include: { _count: { select: { expenses: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.expense.findMany({
      where: { projectId: project.id },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.changeRequest.findMany({
      where: { projectId: project.id },
      include: { budgetCategory: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getProjectBudgetSnapshot(project.id, ctx.organization.budgetWarningThreshold),
  ]);

  if (!summary) notFound();

  return (
    <BudgetOverview
      projectId={project.id}
      projectName={project.name}
      canFinance={canFinance}
      warnIfAtOrAbove={ctx.organization.budgetWarningThreshold}
      budget={{
        initialBudget: project.initialBudget,
        currentApprovedBudget: project.currentApprovedBudget,
        budgetWarningThreshold: ctx.organization.budgetWarningThreshold,
      }}
      summary={{
        originalBudget: summary.originalBudget,
        approvedChanges: summary.approvedChanges,
        currentApprovedBudget: summary.currentApprovedBudget,
        totalEstimated: summary.totalEstimated,
        totalActual: summary.totalActual,
        remainingBudget: summary.remainingBudget,
        usedPercent: summary.usedPercent,
        variance: summary.variance,
        approvedVsEstimated: summary.approvedVsEstimated,
      }}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        estimatedAmount: c.estimatedAmount,
        approvedAmount: c.approvedAmount,
        expenseCount: c._count.expenses,
      }))}
      expenses={expenses.map((e) => ({
        id: e.id,
        description: e.description,
        actualAmount: e.actualAmount,
        estimatedAmount: e.estimatedAmount,
        vendor: e.vendor,
        date: e.date.toISOString().slice(0, 10),
        categoryId: e.categoryId,
        categoryName: e.category?.name ?? null,
        createdById: e.createdById,
        createdByName: e.createdBy.name,
      }))}
      changeRequests={changeRequests.map((cr) => ({
        id: cr.id,
        title: cr.title,
        reason: cr.reason,
        costImpact: cr.costImpact,
        scheduleImpactDays: cr.scheduleImpactDays,
        scheduleImpactNote: cr.scheduleImpactNote,
        status: cr.status,
        categoryId: cr.budgetCategoryId,
        categoryName: cr.budgetCategory?.name ?? null,
        createdAt: cr.createdAt.toISOString(),
        customerComment: cr.customerComment,
        decisionAt: cr.decisionAt?.toISOString() ?? null,
      }))}
      currentUserId={ctx.user.id}
    />
  );
}
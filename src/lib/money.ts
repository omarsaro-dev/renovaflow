import type { BudgetCategory, Expense, Project } from "@prisma/client";
import { prisma } from "./db";
import { percentUsed } from "./utils";

export interface BudgetSummary {
  originalBudget: number;
  approvedChanges: number;
  currentApprovedBudget: number;
  totalEstimated: number;
  totalActual: number;
  remainingBudget: number;
  usedPercent: number;
  variance: number;
  approvedVsEstimated: number;
  categories: Array<{
    category: Pick<BudgetCategory, "id" | "name" | "estimatedAmount" | "approvedAmount" | "sortOrder">;
    spent: number;
    estimatedUsedPercent: number;
    approvedUsedPercent: number;
  }>;
  warningThreshold: number;
}

export function buildBudgetSummary(
  project: Pick<Project, "initialBudget" | "currentApprovedBudget">,
  categories: Array<Pick<BudgetCategory, "id" | "name" | "approvedAmount" | "estimatedAmount" | "sortOrder">>,
  expenses: Array<Pick<Expense, "categoryId" | "actualAmount">>,
  warningThreshold = 85
): BudgetSummary {
  const approvedChanges = Math.max(0, project.currentApprovedBudget - project.initialBudget);

  const totalEstimated = categories.reduce((sum, c) => sum + (c.approvedAmount > 0 ? c.approvedAmount : c.estimatedAmount), 0);
  const totalActual = expenses.reduce((sum, e) => sum + e.actualAmount, 0);

  const currentApprovedBudget =
    project.currentApprovedBudget > 0
      ? project.currentApprovedBudget
      : Math.max(project.initialBudget, totalEstimated);

  const remainingBudget = Math.max(0, currentApprovedBudget - totalActual);
  const usedPercent = percentUsed(totalActual, currentApprovedBudget);
  const variance = totalActual - totalEstimated;

  const categoryRows = categories
    .map((category) => {
      const spent = expenses
        .filter((e) => e.categoryId === category.id)
        .reduce((sum, e) => sum + e.actualAmount, 0);
      const approved = category.approvedAmount > 0 ? category.approvedAmount : category.estimatedAmount;
      return {
        category,
        spent,
        estimatedUsedPercent: percentUsed(spent, category.estimatedAmount || approved),
        approvedUsedPercent: percentUsed(spent, approved),
      };
    })
    .sort((a, b) => (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0));

  return {
    originalBudget: project.initialBudget,
    approvedChanges,
    currentApprovedBudget,
    totalEstimated,
    totalActual,
    remainingBudget,
    usedPercent,
    variance,
    approvedVsEstimated: currentApprovedBudget - totalEstimated,
    categories: categoryRows,
    warningThreshold,
  };
}

export async function getProjectBudgetSnapshot(projectId: string, warningThreshold?: number) {
  const [project, categories, expenses] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.budgetCategory.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.expense.findMany({
      where: { projectId },
      orderBy: { date: "desc" },
      include: { category: true, createdBy: { select: { id: true, name: true } }, files: true },
    }),
  ]);
  if (!project) return null;
  return buildBudgetSummary(project, categories, expenses, warningThreshold);
}

export function budgetHealth(summary: BudgetSummary) {
  if (summary.usedPercent >= summary.warningThreshold) return "warning";
  if (summary.variance > summary.warningThreshold / 100 * summary.currentApprovedBudget) return "attention";
  return "healthy";
}
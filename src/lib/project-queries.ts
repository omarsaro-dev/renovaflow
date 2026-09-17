import type { AuthContext } from "./permissions";
import { prisma } from "./db";
import { buildBudgetSummary } from "./money";
import type { Prisma, ProjectStatus } from "@prisma/client";

export const PROJECT_LIST_FIELDS = {
  id: true,
  name: true,
  address: true,
  status: true,
  progress: true,
  expectedCompletionDate: true,
  actualCompletionDate: true,
  initialBudget: true,
  currentApprovedBudget: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProjectListRow = Awaited<ReturnType<typeof getProjectsFor>>[number];

export async function getProjectsFor(
  ctx: NonNullable<AuthContext>,
  filters: {
    search?: string;
    status?: string;
    managerId?: string;
    customerId?: string;
    sort?: string;
  }
) {
  const where: Prisma.ProjectWhereInput = {
    organizationId: ctx.organizationId,
  };
  if (ctx.teamRole === "WORKER") {
    where.id = { in: ctx.projectIds };
  }
  if (filters.status) where.status = filters.status as ProjectStatus;
  if (filters.managerId) where.managerId = filters.managerId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { address: { contains: filters.search } },
      { customer: { name: { contains: filters.search } } },
    ];
  }

  const orderBy = ((): Prisma.ProjectOrderByWithRelationInput => {
    switch (filters.sort) {
      case "deadline":
        return { expectedCompletionDate: "asc" };
      case "progress":
        return { progress: "desc" };
      case "budget":
        return { currentApprovedBudget: "desc" };
      case "created":
        return { createdAt: "desc" };
      default:
        return { updatedAt: "desc" };
    }
  })();

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    include: {
      customer: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      organization: { select: { budgetWarningThreshold: true } },
    },
  });

  const ids = projects.map((p) => p.id);
  const [tasks, categories, expenses, changeRequests] = await Promise.all([
    prisma.task.findMany({ where: { projectId: { in: ids } }, select: { id: true, projectId: true, status: true, dueDate: true } }),
    prisma.budgetCategory.findMany({ where: { projectId: { in: ids } }, select: { id: true, projectId: true, name: true, sortOrder: true, estimatedAmount: true, approvedAmount: true } }),
    prisma.expense.findMany({ where: { projectId: { in: ids } }, select: { id: true, projectId: true, categoryId: true, actualAmount: true } }),
    prisma.changeRequest.findMany({ where: { projectId: { in: ids }, status: "PENDING_APPROVAL" }, select: { id: true, projectId: true } }),
  ]);

  return projects.map((p) => {
    const pTasks = tasks.filter((t) => t.projectId === p.id);
    const doneCount = pTasks.filter((t) => t.status === "DONE").length;
    const overdueCount = pTasks.filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate < new Date()).length;
    const blockedCount = pTasks.filter((t) => t.status === "BLOCKED").length;
    const pendingApprovals = changeRequests.filter((c) => c.projectId === p.id).length;

    const summary = buildBudgetSummary(
      p,
      categories.filter((c) => c.projectId === p.id),
      expenses.filter((e) => e.projectId === p.id),
      p.organization.budgetWarningThreshold
    );

    const taskCount = pTasks.length;
    const computedProgress = taskCount === 0 ? p.progress : Math.round((doneCount / taskCount) * 100);

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      status: p.status,
      progress: computedProgress,
      expectedCompletionDate: p.expectedCompletionDate,
      actualCompletionDate: p.actualCompletionDate,
      initialBudget: p.initialBudget,
      currentApprovedBudget: p.currentApprovedBudget,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      customer: p.customer,
      manager: p.manager,
      overdueCount,
      blockedCount,
      pendingApprovals,
      totalTasks: taskCount,
      doneTasks: doneCount,
      usedPercent: summary.usedPercent,
      actualSpend: summary.totalActual,
      budgetHealth: summary.usedPercent >= (p.organization.budgetWarningThreshold ?? 85) ? "warning" : "healthy",
    };
  });
}

export async function getProjectDetails(ctx: NonNullable<AuthContext>, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organizationId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
      manager: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { tasks: true, files: true, updates: true, changeRequests: true } },
    },
  });
  return project;
}
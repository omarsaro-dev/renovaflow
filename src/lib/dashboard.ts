import type { AuthContext } from "./permissions";
import { prisma } from "./db";
import { buildBudgetSummary } from "./money";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardData {
  greeting: string;
  date: string;
  orgName: string;
  firstName: string;
  kpis: {
    activeProjects: number;
    overdueTasks: number;
    pendingApprovals: number;
    budgetWarnings: number;
  };
  attentionProjects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    expectedCompletionDate: Date | null;
    overdueCount: number;
    blockedCount: number;
    pendingApprovals: number;
    budgetWarning: boolean;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: Date | null;
    priority: string;
    projectId: string;
    projectName: string;
    assigneeName: string | null;
    overdue: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: Date;
    actorName: string | null;
    projectId: string | null;
    projectName: string | null;
  }>;
  teamWorkload: Array<{
    userId: string;
    name: string;
    role: string;
    openTasks: number;
    doneTasks: number;
    overdueTasks: number;
  }>;
  budgetOverview: Array<{
    projectId: string;
    name: string;
    usedPercent: number;
    actual: number;
    approved: number;
    status: string;
  }>;
  recentUpdates: Array<{
    id: string;
    title: string;
    body: string;
    publishedAt: Date;
    authorName: string;
    projectId: string;
    projectName: string;
    hasComments: number;
  }>;
  recentPhotos: Array<{
    id: string;
    thumbnailUrl: string | null;
    url: string;
    originalName: string;
    projectId: string;
  }>;
}

export async function getTeamDashboard(ctx: NonNullable<AuthContext>): Promise<DashboardData> {
  const now = new Date();
  const isWorker = ctx.teamRole === "WORKER";
  const { organizationId } = ctx;

  const taskWhere = isWorker ? { assigneeId: ctx.user.id } : { organizationId };

  const [projects, orgTasks, pendingApprovals, budgetThreshold] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: isWorker ? { in: ctx.projectIds } : ctx.organizationId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.task.findMany({
      where: { ...taskWhere, project: { organizationId } },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.changeRequest.count({ where: { status: "PENDING_APPROVAL", organizationId } }),
    prisma.organization.findUnique({ where: { id: organizationId }, select: { budgetWarningThreshold: true } }),
  ]);

  const threshold = budgetThreshold?.budgetWarningThreshold ?? 85;

  const overdueTasks = orgTasks.filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate < now);
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;

  const activeIds = projects.filter((p) => p.status !== "COMPLETED").map((p) => p.id);
  const allExpenses = activeIds.length
    ? await prisma.expense.findMany({ where: { projectId: { in: activeIds } }, select: { projectId: true, categoryId: true, actualAmount: true } })
    : [];
  const allCategories = activeIds.length
    ? await prisma.budgetCategory.findMany({ where: { projectId: { in: activeIds } } })
    : [];

  let budgetWarnings = 0;
  const attentionProjects = [];
  for (const p of projects) {
    if (p.status === "COMPLETED") continue;
    const projTasks = orgTasks.filter((t) => t.projectId === p.id);
    const overdueCount = projTasks.filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate < now).length;
    const blockedCount = projTasks.filter((t) => t.status === "BLOCKED").length;
    const projApprovals = await prisma.changeRequest.count({ where: { projectId: p.id, status: "PENDING_APPROVAL" } });
    const catFor = allCategories.filter((c) => c.projectId === p.id);
    const expensesFor = allExpenses.filter((e) => e.projectId === p.id);
    const summary = buildBudgetSummary(p, catFor, expensesFor, threshold);
    const budgetWarning = summary.usedPercent >= threshold && summary.currentApprovedBudget > 0;
    if (budgetWarning) budgetWarnings += 1;

    attentionProjects.push({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      expectedCompletionDate: p.expectedCompletionDate,
      overdueCount,
      blockedCount,
      pendingApprovals: projApprovals,
      budgetWarning,
    });
  }

  attentionProjects.sort((a, b) => {
    const scoreA = a.overdueCount + a.blockedCount + a.pendingApprovals + (a.budgetWarning ? 1 : 0);
    const scoreB = b.overdueCount + b.blockedCount + b.pendingApprovals + (b.budgetWarning ? 1 : 0);
    return scoreB - scoreA;
  });

  const [activity, teamMembers, recentUpdates, recentPhotos] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId, isActive: true },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.update.findMany({
      where: { organizationId, isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: {
        author: { select: { name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.file.findMany({
      where: { organizationId, isImage: true, visibility: "CUSTOMER_VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, thumbnailUrl: true, url: true, originalName: true, projectId: true, project: { select: { name: true } } },
    }),
  ]);

  const memberIds = teamMembers.map((m) => m.userId);
  const openByAssignee = new Map<string, number>();
  const doneByAssignee = new Map<string, number>();
  const overdueByAssignee = new Map<string, number>();
  for (const t of orgTasks) {
    if (!t.assigneeId) continue;
    if (t.status !== "DONE") {
      openByAssignee.set(t.assigneeId, (openByAssignee.get(t.assigneeId) ?? 0) + 1);
      if (t.dueDate && t.dueDate < now) overdueByAssignee.set(t.assigneeId, (overdueByAssignee.get(t.assigneeId) ?? 0) + 1);
    } else {
      doneByAssignee.set(t.assigneeId, (doneByAssignee.get(t.assigneeId) ?? 0) + 1);
    }
  }
  const teamWorkload = memberIds.map((id) => {
    const m = teamMembers.find((x) => x.userId === id)!;
    return {
      userId: id,
      name: m.user.name,
      role: m.user.role,
      openTasks: openByAssignee.get(id) ?? 0,
      doneTasks: doneByAssignee.get(id) ?? 0,
      overdueTasks: overdueByAssignee.get(id) ?? 0,
    };
  }).sort((a, b) => b.openTasks - a.openTasks);

  const budgetOverview = projects
    .filter((p) => p.status !== "COMPLETED")
    .map((p) => {
      const catFor = allCategories.filter((c) => c.projectId === p.id);
      const expensesFor = allExpenses.filter((e) => e.projectId === p.id);
      const summary = buildBudgetSummary(p, catFor, expensesFor, threshold);
      return {
        projectId: p.id,
        name: p.name,
        usedPercent: summary.usedPercent,
        actual: summary.totalActual,
        approved: summary.currentApprovedBudget,
        status: p.status,
      };
    })
    .sort((a, b) => b.usedPercent - a.usedPercent)
    .slice(0, 5);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return {
    greeting,
    date: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    orgName: ctx.organization.name,
    firstName: ctx.user.name.split(" ")[0] ?? ctx.user.name,
    kpis: {
      activeProjects: isWorker ? projects.filter((p) => p.status === "ACTIVE").length : activeProjects,
      overdueTasks: overdueTasks.length,
      pendingApprovals: isWorker ? 0 : pendingApprovals,
      budgetWarnings: isWorker ? 0 : budgetWarnings,
    },
    attentionProjects: attentionProjects.slice(0, 6),
    upcomingDeadlines: orgTasks
      .filter((t) => t.status !== "DONE" && t.dueDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        projectId: t.projectId,
        projectName: t.project.name,
        assigneeName: t.assignee?.name ?? null,
        overdue: t.dueDate! < now,
      }))
      .sort((a, b) => ((b.overdue ? 0 : 1) - (a.overdue ? 0 : 1)) || (a.dueDate!.getTime() - b.dueDate!.getTime()))
      .slice(0, 6),
    recentActivity: activity.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      createdAt: a.createdAt,
      actorName: a.actor?.name ?? null,
      projectId: a.projectId,
      projectName: a.project?.name ?? null,
    })),
    teamWorkload,
    budgetOverview,
    recentUpdates: recentUpdates.map((u) => ({
      id: u.id,
      title: u.title,
      body: u.body,
      publishedAt: u.publishedAt ?? u.createdAt,
      authorName: u.author.name,
      projectId: u.projectId,
      projectName: u.project.name,
      hasComments: u._count.comments,
    })),
    recentPhotos: recentPhotos.map((f) => ({
      id: f.id,
      thumbnailUrl: f.thumbnailUrl,
      url: f.url,
      originalName: f.originalName,
      projectId: f.projectId ?? "",
    })),
  };
}

export { DAY_MS };
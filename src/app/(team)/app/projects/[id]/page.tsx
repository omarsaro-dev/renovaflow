import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  FileCheck2,
  Wallet,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Camera,
  PlusCircle,
  Activity as ActivityIcon,
} from "lucide-react";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getProjectBudgetSnapshot } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/shared/status-badges";
import { formatMoney, formatDate, relativeTime } from "@/lib/utils";

export default async function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
    include: { customer: { select: { name: true } } },
  });
  if (!project) notFound();
  if (isWorker && !ctx.projectIds.includes(project.id)) notFound();

  const [tasks, pendingChangeRequests, activity, photos, budget] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: project.id },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.changeRequest.findMany({
      where: { projectId: project.id, status: "PENDING_APPROVAL" },
      include: { requester: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.activityEvent.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true } } },
    }),
    prisma.file.findMany({
      where: { projectId: project.id, isImage: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    getProjectBudgetSnapshot(project.id, ctx.organization.budgetWarningThreshold),
  ]);

  const overdue = tasks.filter((t) => t.status !== "DONE" && t.status !== "BLOCKED" && t.dueDate && t.dueDate < new Date());
  const blocked = tasks.filter((t) => t.status === "BLOCKED");
  const upcoming = tasks
    .filter((t) => t.status !== "DONE" && t.status !== "BLOCKED" && t.dueDate && t.dueDate >= new Date())
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
    .slice(0, 5);
  const recentDone = tasks
    .filter((t) => t.status === "DONE")
    .sort((a, b) => ((b.completedAt ?? b.updatedAt).getTime() - (a.completedAt ?? a.updatedAt).getTime()))
    .slice(0, 4);

  const warning = budget && budget.usedPercent >= (ctx.organization.budgetWarningThreshold ?? 85);

  return (
    <div className="space-y-6">
      {/* Primary attention row */}
      {(isWorker ? overdue.length + blocked.length > 0 : overdue.length + blocked.length + pendingChangeRequests.length + (warning ? 1 : 0) > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          {overdue.length > 0 && (
            <Badge tone="danger" className="px-3 py-1 text-[13px]">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {overdue.length} overdue task{overdue.length > 1 ? "s" : ""}
            </Badge>
          )}
          {blocked.length > 0 && (
            <Badge tone="warning" className="px-3 py-1 text-[13px]">
              <Ban className="h-4 w-4" aria-hidden />
              {blocked.length} blocked task{blocked.length > 1 ? "s" : ""}
            </Badge>
          )}
          {!isWorker && pendingChangeRequests.length > 0 && (
            <Badge tone="accent" className="px-3 py-1 text-[13px]">
              <FileCheck2 className="h-4 w-4" aria-hidden />
              {pendingChangeRequests.length} pending approval{pendingChangeRequests.length > 1 ? "s" : ""}
            </Badge>
          )}
          {warning && !isWorker && (
            <Badge tone="warning" className="px-3 py-1 text-[13px]">
              <Wallet className="h-4 w-4" aria-hidden />
              Budget at {budget!.usedPercent}%
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: attention lists */}
        <div className="space-y-6 lg:col-span-2">
          {(overdue.length > 0 || blocked.length > 0) && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Needs attention</CardTitle>
                  <CardDescription>Tasks holding up progress.</CardDescription>
                </div>
                <Link href={`/app/projects/${project.id}/tasks`} className="text-[13px] font-medium text-brand hover:underline">
                  All tasks
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...overdue, ...blocked].slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-control border border-border bg-elevated/40 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-ink">{t.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-muted">
                        <TaskPriorityBadge priority={t.priority} />
                        {t.assignee && (
                          <span className="flex items-center gap-1">
                            <Avatar name={t.assignee.name} size="xs" />
                            {t.assignee.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!isWorker && pendingChangeRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Awaiting customer decision</CardTitle>
                <CardDescription>Change requests that need an approve or reject.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingChangeRequests.map((cr) => (
                  <Link key={cr.id} href={`/app/projects/${project.id}/budget#cr-${cr.id}`} className="flex items-center justify-between gap-3 rounded-control border border-border p-3 transition-colors hover:border-brand/40 hover:bg-elevated">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-ink">{cr.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {formatMoney(cr.costImpact)} · {cr.scheduleImpactDays > 0 ? `+${cr.scheduleImpactDays} day${cr.scheduleImpactDays > 1 ? "s" : ""}` : "no schedule change"} · by {cr.requester.name}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-ink-faint" aria-hidden />
                  Upcoming work
                </CardTitle>
                <CardDescription>Scheduled next.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcoming.length === 0 ? (
                  <p className="py-4 text-center text-[13px] text-ink-muted">Nothing scheduled. Add tasks to keep momentum.</p>
                ) : (
                  upcoming.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[13px] font-medium text-ink">{t.title}</p>
                      <p className="shrink-0 text-[12px] tabular-nums text-ink-muted">{formatDate(t.dueDate, "MMM d")}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  Recently completed
                </CardTitle>
                <CardDescription>Recent wins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDone.length === 0 ? (
                  <p className="py-4 text-center text-[13px] text-ink-muted">No completed tasks yet.</p>
                ) : (
                  recentDone.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[13px] font-medium text-ink">{t.title}</p>
                      <p className="shrink-0 text-[12px] text-ink-muted">{relativeTime(t.completedAt ?? t.updatedAt)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column: fins, activity, photos */}
        <div className="space-y-6">
          {!isWorker && budget && (
            <Card>
              <CardHeader>
                <CardTitle>Financial summary</CardTitle>
                <CardDescription>Budget health at a glance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Approved budget</span>
                  <span className="font-semibold tabular-nums text-ink">{formatMoney(budget.currentApprovedBudget)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Spent to date</span>
                  <span className={`font-semibold tabular-nums ${budget.usedPercent >= 85 ? "text-danger" : "text-ink"}`}>{formatMoney(budget.totalActual)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Remaining</span>
                  <span className="font-semibold tabular-nums text-success">{formatMoney(budget.remainingBudget)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-[13px]">
                  <span className="text-ink-muted">Est. vs actual variance</span>
                  <span className={`font-semibold tabular-nums ${budget.variance > 0 ? "text-warning" : "text-success"}`}>
                    {formatMoney(budget.variance)}
                  </span>
                </div>
                <div>
                  <Progress value={budget.usedPercent} size="sm" />
                </div>
                <Link href={`/app/projects/${project.id}/budget`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Open budget <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-ink-faint" aria-hidden />
                Progress photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[13px] text-ink-muted">No photos yet.</p>
                  {!isWorker && (
                    <Link href={`/app/projects/${project.id}/files`} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                      <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                      Upload photos
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((f) => (
                    <Link key={f.id} href={`/app/projects/${project.id}/files`} className="group aspect-[4/3] overflow-hidden rounded-control border border-border">
                      <img src={f.thumbnailUrl ?? f.url} alt={f.originalName} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-ink-faint" aria-hidden />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative ml-2 space-y-4 border-l border-border pl-4">
                {activity.map((a) => (
                  <div key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                    <p className="text-[13px] leading-snug text-ink">{a.title}</p>
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      {a.actor?.name ?? "System"} · {relativeTime(a.createdAt)}
                    </p>
                  </div>
                ))}
                {activity.length === 0 && <p className="text-[13px] text-ink-muted">Activity will appear here.</p>}
              </div>
              <Link href={`/app/projects/${project.id}/timeline`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                Full timeline <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
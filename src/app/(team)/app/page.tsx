import Link from "next/link";
import {
  FolderKanban,
  AlertTriangle,
  FileCheck2,
  Wallet,
  ArrowRight,
  Plus,
  CalendarClock,
  History,
  Users,
  MessageSquareText,
  Gauge,
} from "lucide-react";
import { getTeamDashboard } from "@/lib/dashboard";
import { requireTeam } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge, TaskPriorityBadge } from "@/components/shared/status-badges";
import { relativeTime } from "@/lib/utils";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const ctx = await requireTeam();
  const data = await getTeamDashboard(ctx);
  const isWorker = ctx.teamRole === "WORKER";

  const kpis = [
    {
      key: "active",
      label: "Active projects",
      value: data.kpis.activeProjects,
      icon: FolderKanban,
      tone: "text-brand bg-brandTint",
      href: "/app/projects?status=ACTIVE",
    },
    {
      key: "overdue",
      label: "Overdue tasks",
      value: data.kpis.overdueTasks,
      icon: AlertTriangle,
      tone: "text-danger bg-dangerTint",
      href: "/app/tasks?status=overdue",
      alert: data.kpis.overdueTasks > 0,
    },
    ...(!isWorker
      ? [
          {
            key: "approvals",
            label: "Pending approvals",
            value: data.kpis.pendingApprovals,
            icon: FileCheck2,
            tone: "text-[#7D5A23] bg-accentTint",
            href: "/app/projects?approvals=pending",
            alert: data.kpis.pendingApprovals > 0,
          },
          {
            key: "budget",
            label: "Budget warnings",
            value: data.kpis.budgetWarnings,
            icon: Wallet,
            tone: "text-warning bg-warningTint",
            href: "/app/budget",
            alert: data.kpis.budgetWarnings > 0,
          },
        ]
      : [
          {
            key: "done",
            label: "My completed tasks",
            value: data.teamWorkload[0]?.doneTasks ?? 0,
            icon: Gauge,
            tone: "text-success bg-successTint",
            href: "/app/tasks?mine=1",
          },
          {
            key: "open",
            label: "My open tasks",
            value: data.teamWorkload[0]?.openTasks ?? 0,
            icon: FolderKanban,
            tone: "text-info bg-infoTint",
            href: "/app/tasks?mine=1",
          },
        ]),
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-ink-muted">{data.date}</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-ink">
            {data.greeting}, {data.firstName}
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Here&apos;s what needs your attention at {data.orgName}.
          </p>
        </div>
        {!isWorker && (
          <Link href="/app/projects/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              New project
            </Button>
          </Link>
        )}
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.key} href={kpi.href} className="group">
            <Card className="transition-colors hover:border-brand/30">
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.03em] text-ink-muted">
                    {kpi.label}
                  </p>
                  <p className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
                    {kpi.value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${kpi.tone}`}>
                  <kpi.icon className="h-5 w-5" aria-hidden />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main grid: attention + deadlines + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Projects requiring attention</CardTitle>
            <CardDescription>Where something needs a decision or a nudge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.attentionProjects.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-muted">
                Nothing needs attention right now. Nice pace.
              </p>
            ) : (
              data.attentionProjects.map((p) => {
                const issues = [
                  p.overdueCount > 0 && `${p.overdueCount} overdue`,
                  p.blockedCount > 0 && `${p.blockedCount} blocked`,
                  p.pendingApprovals > 0 && `${p.pendingApprovals} pending approval`,
                  p.budgetWarning && "budget",
                ].filter(Boolean);
                return (
                  <Link key={p.id} href={`/app/projects/${p.id}`} className="group block rounded-control border border-border bg-elevated/40 p-3.5 transition-colors hover:border-brand/40 hover:bg-elevated">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-medium text-ink group-hover:text-brand">{p.name}</p>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <Progress value={p.progress} size="sm" className="flex-1" />
                      <span className="text-[12px] font-medium tabular-nums text-ink-muted">{p.progress}%</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {issues.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-dangerTint px-2 py-0.5 text-[11px] font-medium text-danger">
                          <AlertTriangle className="h-3 w-3" aria-hidden />
                          {issues.join(", ")}
                        </span>
                      )}
                      {p.expectedCompletionDate && (
                        <span className="text-[11px] text-ink-faint">
                          Due {formatDate(p.expectedCompletionDate)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Tasks due soon or already past due.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingDeadlines.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-muted">
                No deadlines in the near future.
              </p>
            ) : (
              data.upcomingDeadlines.map((t) => (
                <Link key={t.id} href={`/app/projects/${t.projectId}/tasks`} className="block rounded-control border border-border bg-elevated/40 p-3 transition-colors hover:border-brand/40 hover:bg-elevated">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-[14px] font-medium ${t.overdue ? "text-danger" : "text-ink"}`}>{t.title}</p>
                    <span className={`flex items-center gap-1 text-[11px] font-medium ${t.overdue ? "text-danger" : "text-ink-muted"}`}>
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(t.dueDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <TaskPriorityBadge priority={t.priority} />
                    <span className="truncate text-[12px] text-ink-faint">{t.projectName}</span>
                    {t.assigneeName && (
                      <span className="ml-auto flex items-center gap-1.5 text-[12px] text-ink-muted">
                        <Avatar name={t.assigneeName} size="xs" />
                        {t.assigneeName}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>The audit trail at a glance.</CardDescription>
            </div>
            <History className="h-4 w-4 text-ink-faint" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="relative ml-2 space-y-5 border-l border-border pl-5">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[26px] top-1 h-2 w-2 rounded-full bg-accent" aria-hidden />
                  <p className="text-[13px] leading-snug text-ink">{a.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {a.actorName ?? "System"} · {relativeTime(a.createdAt)}
                    {a.projectName && (
                      <Link href={`/app/projects/${a.projectId}`} className="ml-1 font-medium text-brand hover:underline">
                        {a.projectName}
                      </Link>
                    )}
                  </p>
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <p className="text-[13px] text-ink-muted">Activity will appear here as you work.</p>
              )}
            </div>
            {data.recentActivity.length > 0 && (
              <Link href="/app" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-hover">
                View timeline <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary: workload + budget + updates */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Team workload</CardTitle>
            <CardDescription>Open tasks per crew member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {data.teamWorkload.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <Avatar name={m.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-ink">{m.name}</p>
                    <p className="shrink-0 text-[12px] text-ink-muted">
                      <span className="font-semibold tabular-nums text-ink">{m.openTasks}</span> open
                      {m.overdueTasks > 0 && (
                        <span className="ml-1.5 font-medium text-danger">· {m.overdueTasks} late</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-brand"
                      style={{ width: `${Math.min(100, m.openTasks * 14)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {data.teamWorkload.length === 0 && (
              <p className="py-6 text-center text-[13px] text-ink-muted">Invite crew members to see workload.</p>
            )}
          </CardContent>
        </Card>

        {!isWorker && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Budget overview</CardTitle>
              <CardDescription>Spend vs. approved budget per project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.budgetOverview.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-muted">No budget data yet for active projects.</p>
              ) : (
                data.budgetOverview.map((b) => {
                  const warn = b.usedPercent >= 85;
                  return (
                    <Link key={b.projectId} href={`/app/projects/${b.projectId}/budget`} className="group block">
                      <div className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="truncate font-medium text-ink group-hover:text-brand">{b.name}</span>
                        <span className={`shrink-0 tabular-nums ${warn ? "font-semibold text-danger" : "text-ink-muted"}`}>
                          {b.usedPercent}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <Progress value={b.usedPercent} size="sm" className="flex-1" />
                        <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
                          {formatMoney(b.actual, { compact: true })} of {formatMoney(b.approved, { compact: true })}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Customer updates</CardTitle>
            <CardDescription>Latest published progress notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {data.recentUpdates.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-muted">
                {isWorker ? "Updates from your team will appear here." : "Publish a customer update to keep clients in the loop."}
              </p>
            ) : (
              data.recentUpdates.map((u) => (
                <Link key={u.id} href={`/app/projects/${u.projectId}/updates`} className="block rounded-control border border-border bg-elevated/40 p-3 transition-colors hover:border-brand/40 hover:bg-elevated">
                  <p className="text-[13px] font-medium text-ink">{u.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-muted">{u.body}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <MessageSquareText className="h-3 w-3" aria-hidden />
                    {u.authorName} · {u.projectName} · {relativeTime(u.publishedAt)}
                    {u.hasComments > 0 && <span> · {u.hasComments} reply{u.hasComments > 1 ? "s" : ""}</span>}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent photos strip */}
      {data.recentPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest progress photos</CardTitle>
            <CardDescription>Fresh images shared with customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {data.recentPhotos.map((f) => (
                <Link key={f.id} href={f.projectId ? `/app/projects/${f.projectId}/files` : "/app/files"} className="group relative aspect-[4/3] overflow-hidden rounded-control border border-border">
                  <img
                    src={f.thumbnailUrl ?? f.url}
                    alt={f.originalName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isWorker && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-5">
            <Users className="h-6 w-6 text-ink-faint" aria-hidden />
            <p className="text-[13px] text-ink-muted">
              You&apos;ll see tasks assigned to you here and on the <Link className="font-medium text-brand hover:underline" href="/app/tasks">Tasks</Link> page. Updates flow best from the field.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import Link from "next/link";
import { Plus, FolderKanban, AlertTriangle } from "lucide-react";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getProjectsFor } from "@/lib/project-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/shared/status-badges";
import { ProjectFilters } from "@/components/projects/project-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";

  const [projects, managers, customers] = await Promise.all([
    getProjectsFor(ctx, {
      search: searchParams.search,
      status: searchParams.status,
      managerId: searchParams.manager,
      customerId: searchParams.customer,
      sort: searchParams.sort,
    }),
    isWorker
      ? []
      : prisma.organizationMember.findMany({
          where: { organizationId: ctx.organizationId, isActive: true },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { user: { name: "asc" } },
        }),
    prisma.customer.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const managerList = managers.map((m) => ({ id: m.userId, name: m.user.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">Projects</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace
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
      </div>

      <ProjectFilters managers={managerList} customers={customers} isWorker={isWorker} />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Try adjusting your filters or create a new project to get started."
          action={
            !isWorker ? (
              <Link href="/app/projects/new">
                <Button>
                  <Plus className="h-4 w-4" aria-hidden />
                  New project
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/app/projects/${p.id}`} className="group">
              <Card className="h-full transition-colors hover:border-brand/40">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink group-hover:text-brand">{p.name}</p>
                      {p.address && <p className="mt-0.5 truncate text-[13px] text-ink-muted">{p.address}</p>}
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={p.progress} size="sm" className="flex-1" />
                    <span className="text-[12px] font-medium tabular-nums text-ink-muted">{p.progress}%</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ink-muted">
                    {p.customer && <span>Client: <span className="font-medium text-ink">{p.customer.name}</span></span>}
                    {p.manager && <span>PM: <span className="font-medium text-ink">{p.manager.name}</span></span>}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-[12px]">
                    <div className="flex items-center gap-3">
                      {p.overdueCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-danger">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          {p.overdueCount} overdue
                        </span>
                      )}
                      {p.pendingApprovals > 0 && (
                        <span className="text-accent font-medium">{p.pendingApprovals} pending approval</span>
                      )}
                    </div>
                    <span className="tabular-nums text-ink-faint">
                      {formatMoney(p.initialBudget, { compact: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
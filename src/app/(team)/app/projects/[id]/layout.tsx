import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, CalendarClock, Wallet } from "lucide-react";
import { requireTeam, forbidden } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getProjectBudgetSnapshot } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, formatMoney } from "@/lib/utils";
import { ProjectTabBar } from "@/components/projects/project-tab-bar";

const TABS = [
  { slug: "", label: "Overview" },
  { slug: "tasks", label: "Tasks" },
  { slug: "budget", label: "Budget" },
  { slug: "updates", label: "Updates" },
  { slug: "files", label: "Files" },
  { slug: "timeline", label: "Timeline" },
  { slug: "settings", label: "Settings" },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const ctx = await requireTeam();
  if (ctx.isCustomer) forbidden();

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      manager: { select: { id: true, name: true } },
    },
  });
  if (!project) notFound();

  const isWorker = ctx.teamRole === "WORKER";
  if (isWorker && !ctx.projectIds.includes(project.id)) forbidden();

  const budget = await getProjectBudgetSnapshot(project.id, ctx.organization.budgetWarningThreshold);
  const budgetWarning = budget ? budget.usedPercent >= (ctx.organization.budgetWarningThreshold ?? 85) : false;

  const visibleTabs = isWorker ? TABS.filter((t) => t.slug !== "budget" && t.slug !== "settings") : TABS;

  return (
    <div className="space-y-6">
      <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Projects
      </Link>

      <div className="rounded-card border border-border bg-surface shadow-card">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
                {project.customer && (
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-ink">Client:</span> {project.customer.name}
                  </span>
                )}
                {project.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                    {project.address}
                  </span>
                )}
                {project.expectedCompletionDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                    Due {formatDate(project.expectedCompletionDate)}
                  </span>
                )}
                {project.manager && (
                  <span className="flex items-center gap-1.5">
                    PM:
                    <Avatar name={project.manager.name} size="xs" />
                    {project.manager.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5 text-right">
              {budget && !isWorker && (
                <div>
                  <p className="flex items-center justify-end gap-1 text-[12px] font-medium uppercase tracking-[0.03em] text-ink-muted">
                    <Wallet className="h-3.5 w-3.5" aria-hidden />
                    Budget health
                  </p>
                  <p className={`mt-0.5 text-[14px] font-semibold tabular-nums ${budgetWarning ? "text-danger" : budget.usedPercent >= 60 ? "text-warning" : "text-success"}`}>
                    {budget.usedPercent}% used
                  </p>
                </div>
              )}
              <div className="min-w-[120px]">
                <p className="text-[12px] font-medium uppercase tracking-[0.03em] text-ink-muted">Progress</p>
                <p className="mt-0.5 text-[22px] font-semibold leading-none tabular-nums text-ink">{project.progress}%</p>
              </div>
            </div>
          </div>

          <div className="mt-5 max-w-xl">
            <Progress value={project.progress} size="md" showLabel={false} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-[13px] text-ink-muted">
            <span>
              Approved budget: <span className="font-semibold tabular-nums text-ink">{formatMoney(project.currentApprovedBudget)}</span>
            </span>
            {budget && (
              <>
                <span>
                  Spent: <span className="font-semibold tabular-nums text-ink">{formatMoney(budget.totalActual)}</span>
                </span>
                <span>
                  Remaining:{" "}
                  <span className={`font-semibold tabular-nums ${budget.remainingBudget < budget.currentApprovedBudget * 0.15 && budget.currentApprovedBudget > 0 ? "text-danger" : "text-ink"}`}>
                    {formatMoney(budget.remainingBudget)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border px-5 sm:px-6">
          <ProjectTabBar tabs={visibleTabs} basePath={`/app/projects/${project.id}`} />
        </div>
      </div>

      {children}
    </div>
  );
}
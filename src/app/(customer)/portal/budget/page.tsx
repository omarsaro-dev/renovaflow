import { requireCustomer } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getProjectBudgetSnapshot } from "@/lib/money";
import { formatMoney, percentUsed } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Budget & costs" };

export default async function PortalBudgetPage() {
  const ctx = await requireCustomer();

  const projects = await prisma.project.findMany({
    where: { customerId: ctx.customerRecord!.id, organizationId: ctx.organizationId },
    orderBy: { updatedAt: "desc" },
  });

  const rows = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      summary: await getProjectBudgetSnapshot(p.id),
    }))
  );

  const totals = rows.reduce(
    (acc, { summary }) => {
      if (!summary) return acc;
      acc.approved += summary.currentApprovedBudget;
      acc.spent += summary.totalActual;
      acc.estimated += summary.totalEstimated;
      return acc;
    },
    { approved: 0, spent: 0, estimated: 0 }
  );
  const used = percentUsed(totals.spent, totals.approved);

  if (projects.length === 0) {
    return <EmptyState icon={Wallet} title="No budget details yet" description="Once projects are set up for you, budgets and spending will show up here." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Budget & costs</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">A transparent look at what has been approved and spent.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">Approved budget</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.approved)}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">Spent so far</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.spent)}</p>
          <p className="text-[13px] text-ink-muted">{used}% of approved</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">Estimated total</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.estimated)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(({ project, summary }) => {
          const over = summary && summary.usedPercent >= summary.warningThreshold;
          return (
            <Link key={project.id} href={`/portal/projects/${project.id}`} className="block rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-brand/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-ink">{project.name}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Approved {formatMoney(summary?.currentApprovedBudget ?? project.currentApprovedBudget)} · Spent{" "}
                    {formatMoney(summary?.totalActual ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {summary ? (
                    over ? (
                      <StatusBadge tone="danger" label="Over budget" />
                    ) : summary.usedPercent >= summary.warningThreshold - 15 ? (
                      <StatusBadge tone="warning" label="Watching" />
                    ) : (
                      <StatusBadge tone="success" label="On track" />
                    )
                  ) : (
                    <StatusBadge tone="neutral" label="No budget" />
                  )}
                  <ArrowRight className="h-4 w-4 text-ink-faint" aria-hidden />
                </div>
              </div>
              {summary && (
                <p className="mt-3 text-[12px] text-ink-faint">
                  {summary.remainingBudget > 0
                    ? `${formatMoney(summary.remainingBudget)} remaining`
                    : "Spend has reached the approved budget."}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
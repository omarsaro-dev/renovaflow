import { redirect } from "next/navigation";
import Link from "next/link";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getProjectBudgetSnapshot, budgetHealth } from "@/lib/money";
import { formatMoney, percentUsed } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";

export const metadata = { title: "Budget & expenses" };

export default async function BudgetPage() {
  const ctx = await requireTeam();
  if (ctx.teamRole === "WORKER") redirect("/app/projects");

  const projects = await prisma.project.findMany({
    where: { organizationId: ctx.organizationId },
    include: { customer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const rows = await Promise.all(
    projects.map(async (p) => {
      const summary = await getProjectBudgetSnapshot(p.id, ctx.organization.budgetWarningThreshold);
      return { project: p, summary };
    })
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
  const usedPercent = percentUsed(totals.spent, totals.approved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Budget & expenses</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Approved budgets and spending across every project.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">Approved budget</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.approved)}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">Spent</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.spent)}</p>
          <p className="text-[13px] text-ink-muted">{usedPercent}% of approved</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">Estimated</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.estimated)}</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={Wallet} title="No budgets yet" description="Create a project and set its budget to start tracking spending here." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-elevated text-[12px] uppercase tracking-[0.04em] text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Project</th>
                <th className="px-4 py-2.5 font-medium text-right">Approved</th>
                <th className="px-4 py-2.5 font-medium text-right">Spent</th>
                <th className="px-4 py-2.5 font-medium text-right">Remaining</th>
                <th className="px-4 py-2.5 font-medium text-right">Used</th>
                <th className="px-4 py-2.5 font-medium text-right">Health</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project, summary }) => {
                const health = summary ? budgetHealth(summary) : "attention";
                return (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-elevated/60">
                    <td className="px-4 py-3">
                      <Link href={`/app/projects/${project.id}/budget`} className="font-medium text-ink hover:text-brand">
                        {project.name}
                      </Link>
                      {project.customer && (
                        <span className="block text-[12px] text-ink-faint">{project.customer.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">{formatMoney(summary?.currentApprovedBudget ?? project.currentApprovedBudget)}</td>
                    <td className="px-4 py-3 text-right text-ink">{formatMoney(summary?.totalActual ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-ink-muted">{formatMoney(summary?.remainingBudget ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-ink">{summary ? `${summary.usedPercent}%` : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {summary ? (
                        health === "warning" ? (
                          <StatusBadge tone="danger" label="Over budget" />
                        ) : health === "attention" ? (
                          <StatusBadge tone="warning" label="Attention" />
                        ) : (
                          <StatusBadge tone="success" label="On track" />
                        )
                      ) : (
                        <StatusBadge tone="neutral" label="No budget" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
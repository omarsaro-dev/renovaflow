import { requireCustomer } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProjectStatusBadge } from "@/components/shared/status-badges";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Home, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My projects" };

export default async function PortalHomePage() {
  const ctx = await requireCustomer();
  const customerId = ctx.customerRecord!.id;

  const projects = await prisma.project.findMany({
    where: { customerId, organizationId: ctx.organizationId },
    include: {
      manager: { select: { name: true } },
      _count: { select: { updates: true, files: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const openRequests = await prisma.changeRequest.findMany({
    where: { project: { customerId }, status: "PENDING_APPROVAL" },
    select: { id: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">My projects</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          {projects.length > 0 ? `${projects.length} active project${projects.length === 1 ? "" : "s"} being built for you.` : "Your projects will appear here once your contractor adds you."}
        </p>
      </div>

      {openRequests.length > 0 && (
        <Link
          href="/portal/approvals"
          className="flex items-center justify-between gap-3 rounded-card border border-accent/30 bg-accentTint px-4 py-3 text-[14px] font-medium text-[#7D5A23] hover:bg-accentTint/70"
        >
          <span>
            {openRequests.length} change request{openRequests.length === 1 ? "" : "s"} waiting for your approval
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}

      {projects.length === 0 ? (
        <EmptyState icon={Home} title="No projects yet" description="When your contractor creates a project for you, it will show up here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/portal/projects/${p.id}`} className="group rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-brand/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink group-hover:text-brand">{p.name}</h2>
                  {p.address && <p className="mt-0.5 text-[13px] text-ink-muted">{p.address}</p>}
                </div>
                <ProjectStatusBadge status={p.status} />
              </div>

              {p.description && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{p.description}</p>}

              <div className="mt-4">
                <div className="flex items-center justify-between text-[12px] text-ink-muted">
                  <span>{p.progress}% complete</span>
                  {p.expectedCompletionDate && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      Est. {new Date(p.expectedCompletionDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <Progress value={p.progress} className="mt-1.5" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[12px] text-ink-muted">
                {p.manager && <span>Managed by {p.manager.name}</span>}
                {p.currentApprovedBudget > 0 && <span>{formatMoney(p.currentApprovedBudget)} approved budget</span>}
                <span>{p._count.updates} update{p._count.updates === 1 ? "" : "s"}</span>
                <span>{p._count.files} file{p._count.files === 1 ? "" : "s"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
import { requireCustomer } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { CustomerChangeRequests, type CustomerChangeRequestItem } from "@/components/approvals/customer-change-requests";

export const metadata = { title: "Approvals" };

export default async function PortalApprovalsPage() {
  const ctx = await requireCustomer();

  const requests = await prisma.changeRequest.findMany({
    where: { project: { customerId: ctx.customerRecord!.id }, status: { not: "DRAFT" } },
    include: {
      project: { select: { name: true, status: true, currentApprovedBudget: true } },
      budgetCategory: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items: CustomerChangeRequestItem[] = requests.map((r) => ({
    id: r.id,
    title: r.title,
    reason: r.reason,
    costImpact: r.costImpact,
    scheduleImpactDays: r.scheduleImpactDays,
    scheduleImpactNote: r.scheduleImpactNote,
    status: r.status,
    categoryName: r.budgetCategory?.name ?? null,
    createdAt: r.createdAt.toISOString(),
    customerComment: r.customerComment,
    decisionAt: r.decisionAt?.toISOString() ?? null,
    projectName: r.project.name,
  }));

  const pending = items.filter((r) => r.status === "PENDING_APPROVAL");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Approvals</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {pending.length > 0 ? `${pending.length} change request${pending.length === 1 ? "" : "s"} waiting on you.` : "You're all caught up — any decided changes are listed below."}
        </p>
      </div>
      <CustomerChangeRequests requests={items} />
    </div>
  );
}
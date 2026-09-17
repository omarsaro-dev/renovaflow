import { requireCustomer, requireCustomerProject } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { CustomerChangeRequests, type CustomerChangeRequestItem } from "@/components/approvals/customer-change-requests";

export const metadata = { title: "Approvals" };

export default async function PortalProjectApprovalsPage({ params }: { params: { id: string } }) {
  const ctx = await requireCustomer();
  const project = await requireCustomerProject(ctx, params.id);

  const requests = await prisma.changeRequest.findMany({
    where: { projectId: project.id },
    include: { budgetCategory: { select: { name: true } } },
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
    projectName: project.name,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Approvals</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">Change requests for {project.name}</p>
      </div>
      <CustomerChangeRequests requests={items} />
    </div>
  );
}
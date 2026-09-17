import { notFound, redirect } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = { title: "Project settings" };

export default async function ProjectSettingsPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  if (ctx.teamRole === "WORKER") redirect(`/app/projects/${params.id}`);

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!project) notFound();

  const [customers, managers] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Project settings</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Change the name, customer, manager, or schedule. Budget changes shift the approved budget by the same amount.</p>
      </div>

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <ProjectForm
          customers={customers}
          managers={managers.map((m) => ({ id: m.userId, name: m.user.name }))}
          endpoint={`/api/projects/${project.id}`}
          method="PATCH"
          submitLabel="Save changes"
          isEdit
          initial={{
            name: project.name,
            customerId: project.customerId ?? "",
            managerId: project.managerId ?? "",
            address: project.address ?? "",
            description: project.description ?? "",
            status: project.status,
            startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : "",
            expectedCompletionDate: project.expectedCompletionDate ? project.expectedCompletionDate.toISOString().slice(0, 10) : "",
            initialBudget: project.initialBudget,
          }}
          redirectBase={`/app/projects/${project.id}`}
        />
      </div>
    </div>
  );
}
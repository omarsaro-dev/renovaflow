import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const ctx = await requireTeam();
  if (ctx.teamRole === "WORKER") redirect("/app/projects");

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
        <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to projects
        </Link>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-ink">New project</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Set up the basics now — you can build out the budget and plan later.
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <ProjectForm
          customers={customers}
          managers={managers.map((m) => ({ id: m.userId, name: m.user.name }))}
          endpoint="/api/projects"
          method="POST"
        />
      </div>
    </div>
  );
}
import { notFound } from "next/navigation";
import { requireCustomer, requireCustomerProject } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProjectStatusBadge } from "@/components/shared/status-badges";
import { Progress } from "@/components/ui/progress";
import { formatMoney, relativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Newspaper, FileCheck2, Images, CalendarDays } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Project" };

export default async function PortalProjectPage({ params }: { params: { id: string } }) {
  const ctx = await requireCustomer();
  await requireCustomerProject(ctx, params.id);

  const [project, updates, pendingRequests, files] = await Promise.all([
    prisma.project.findFirst({
      where: { id: params.id, customerId: ctx.customerRecord!.id },
      include: { manager: { select: { name: true } } },
    }),
    prisma.update.findMany({
      where: { projectId: params.id, isPublished: true, visibility: "CUSTOMER_VISIBLE" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    prisma.changeRequest.findMany({
      where: { projectId: params.id, status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, costImpact: true },
    }),
    prisma.file.findMany({
      where: { projectId: params.id, visibility: "CUSTOMER_VISIBLE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, originalName: true, thumbnailUrl: true, isImage: true, url: true },
      take: 8,
    }),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.address && <p className="mt-1 text-[14px] text-ink-muted">{project.address}</p>}
            {project.manager && (
              <p className="mt-1 text-[13px] text-ink-muted">Managed by {project.manager.name}</p>
            )}
          </div>
          {project.expectedCompletionDate && (
            <p className="inline-flex items-center gap-1.5 rounded-control border border-border bg-elevated px-3 py-1.5 text-[13px] text-ink-muted">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Est. completion {new Date(project.expectedCompletionDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        {project.description && <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">{project.description}</p>}

        <div className="mt-5 grid max-w-md gap-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center justify-between text-[13px] text-ink-muted">
              Progress
              <span className="font-medium text-ink">{project.progress}%</span>
            </p>
            <Progress value={project.progress} className="mt-1.5" />
          </div>
          <div>
            <p className="text-[13px] text-ink-muted">Approved budget</p>
            <p className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-ink">{formatMoney(project.currentApprovedBudget)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href={`/portal/projects/${project.id}/updates`} className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-brand/40">
          <span className="inline-flex items-center gap-2 text-[14px] font-medium text-ink">
            <Newspaper className="h-5 w-5 text-brand" aria-hidden />
            Updates
          </span>
          <span className="text-[13px] text-ink-muted">{updates.length} new</span>
        </Link>
        <Link href={`/portal/projects/${project.id}/approvals`} className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-brand/40">
          <span className="inline-flex items-center gap-2 text-[14px] font-medium text-ink">
            <FileCheck2 className="h-5 w-5 text-accent" aria-hidden />
            Approvals
          </span>
          <span className="text-[13px] text-ink-muted">{pendingRequests.length} pending</span>
        </Link>
        <Link href="/portal/files" className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-brand/40">
          <span className="inline-flex items-center gap-2 text-[14px] font-medium text-ink">
            <Images className="h-5 w-5 text-success" aria-hidden />
            Photos & files
          </span>
          <span className="text-[13px] text-ink-muted">{files.length}</span>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[16px]">Latest updates</CardTitle>
            <CardDescription>Progress notes shared by your contractor.</CardDescription>
          </div>
          <Link href={`/portal/projects/${project.id}/updates`} className="inline-flex h-8 items-center rounded-control px-3 text-[13px] font-medium text-brand transition-colors hover:bg-elevated hover:text-brand-hover">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <EmptyState icon={Newspaper} title="No updates yet" description="Progress updates from your contractor will appear here." />
          ) : (
            <div className="space-y-3">
              {updates.map((u) => (
                <div key={u.id} className="rounded-control border border-border bg-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14px] font-medium text-ink">{u.title}</p>
                    <span className="shrink-0 text-[12px] text-ink-faint">{relativeTime(u.publishedAt ?? u.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{u.body}</p>
                  {u.author && <p className="mt-2 text-[12px] text-ink-faint">— {u.author.name}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[16px]">Recent photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {files.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] overflow-hidden rounded-control border border-border">
                  {f.isImage && f.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.thumbnailUrl} alt={f.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-elevated">
                      <Images className="h-5 w-5 text-ink-faint" aria-hidden />
                    </div>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
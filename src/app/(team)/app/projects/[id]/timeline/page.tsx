import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { relativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { History } from "lucide-react";

export const metadata = { title: "Timeline" };

export default async function ProjectTimelinePage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!project) notFound();
  if (isWorker && !ctx.projectIds.includes(project.id)) notFound();

  const events = await prisma.activityEvent.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { id: true, name: true } } },
  });

  const grouped = events.reduce<Record<string, typeof events>>((acc, e) => {
    const key = e.createdAt.toISOString().slice(0, 10);
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Timeline</h1>
        <p className="mt-1 text-[13px] text-ink-muted">The full audit trail for this project.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" description="Actions like creating tasks, uploading files, and budget changes will show up here." />
      ) : (
        Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day} className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <p className="pt-2 text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">{day}</p>
            <div className="relative ml-1 space-y-4 border-l border-border pl-5 sm:ml-0">
              {dayEvents.map((e) => (
                <div key={e.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-accent ring-4 ring-surface" aria-hidden />
                  <p className="text-[14px] leading-snug text-ink">{e.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {e.actor ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar name={e.actor.name} size="xs" />
                        {e.actor.name}
                      </span>
                    ) : (
                      "System"
                    )}
                    <span className="mx-1">·</span>
                    {relativeTime(e.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { UpdatesFeed } from "@/components/updates/updates-feed";
import type { UpdateItem } from "@/components/updates/updates-feed";

export const metadata = { title: "Updates" };

export default async function ProjectUpdatesPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!project) notFound();
  if (isWorker && !ctx.projectIds.includes(project.id)) notFound();

  const updates = await prisma.update.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
      files: { select: { id: true, originalName: true, url: true, thumbnailUrl: true, isImage: true } },
    },
  });

  const items: UpdateItem[] = updates.map((u) => ({
    id: u.id,
    title: u.title,
    body: u.body,
    isPublished: u.isPublished,
    visibility: u.visibility,
    publishedAt: u.publishedAt ? u.publishedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    author: u.author,
    comments: u.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
    files: u.files,
  }));

  return (
    <UpdatesFeed
      updates={items}
      projectId={project.id}
      canWrite={!isWorker}
    />
  );
}
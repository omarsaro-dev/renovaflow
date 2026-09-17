import { requireCustomer, requireCustomerProject } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { UpdatesFeed, type UpdateItem } from "@/components/updates/updates-feed";

export const metadata = { title: "Updates" };

export default async function PortalProjectUpdatesPage({ params }: { params: { id: string } }) {
  const ctx = await requireCustomer();
  const project = await requireCustomerProject(ctx, params.id);

  const updates = await prisma.update.findMany({
    where: { projectId: project.id, isPublished: true, visibility: "CUSTOMER_VISIBLE" },
    orderBy: { publishedAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
      files: {
        where: { visibility: "CUSTOMER_VISIBLE" },
        select: { id: true, originalName: true, url: true, thumbnailUrl: true, isImage: true },
      },
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Updates</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">Progress notes for {project.name}</p>
        </div>
      </div>

      <UpdatesFeed updates={items} projectId={project.id} canWrite={false} />
    </div>
  );
}
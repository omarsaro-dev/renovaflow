import { requireCustomer } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { UpdatesFeed, type UpdateItem } from "@/components/updates/updates-feed";

export const metadata = { title: "Updates" };

export default async function PortalUpdatesPage() {
  const ctx = await requireCustomer();

  const updates = await prisma.update.findMany({
    where: { project: { customerId: ctx.customerRecord!.id }, isPublished: true, visibility: "CUSTOMER_VISIBLE" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      project: { select: { id: true, name: true } },
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
    project: { id: u.project.id, name: u.project.name },
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
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Updates</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">Latest progress posts across all your projects.</p>
      </div>
      <UpdatesFeed updates={items} projectId={""} canWrite={false} />
    </div>
  );
}
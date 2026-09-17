import { requireCustomer } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatBytes, relativeTime } from "@/lib/utils";
import { FileText, Image as ImageIcon, Folder } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export const metadata = { title: "Photos & files" };

export default async function PortalFilesPage() {
  const ctx = await requireCustomer();

  const files = await prisma.file.findMany({
    where: {
      organizationId: ctx.organizationId,
      visibility: "CUSTOMER_VISIBLE",
      project: { customerId: ctx.customerRecord!.id },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  if (files.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Photos & files</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">Documents and progress photos shared with you.</p>
        </div>
        <EmptyState icon={ImageIcon} title="Nothing shared yet" description="When your contractor shares files with you, they'll appear here." />
      </div>
    );
  }

  const images = files.filter((f) => f.isImage);
  const documents = files.filter((f) => !f.isImage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Photos & files</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">Documents and progress photos shared with you.</p>
      </div>

      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Photos</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((f) => (
              <div key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block aspect-[4/3] overflow-hidden rounded-card border border-border bg-elevated"
                >
                  {f.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.thumbnailUrl} alt={f.originalName} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-ink-faint" aria-hidden />
                    </div>
                  )}
                </a>
                <p className="mt-1.5 truncate text-[12px] text-ink-muted" title={f.originalName}>{f.originalName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Documents</h3>
          <div className="space-y-2">
            {documents.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-3 transition-colors hover:border-brand/40">
                <FileText className="h-6 w-6 shrink-0 text-brand/70" aria-hidden />
                <div className="min-w-0 flex-1">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate text-[14px] font-medium text-ink hover:text-brand">
                    {f.originalName}
                  </a>
                  <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-ink-faint">
                    <span>{formatBytes(f.size)}</span>
                    <span>·</span>
                    <span>{relativeTime(f.createdAt)}</span>
                    {f.project && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-ink-muted">
                          <Folder className="h-3 w-3" aria-hidden />
                          <Link href={`/portal/projects/${f.project.id}`} className="hover:text-brand">{f.project.name}</Link>
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
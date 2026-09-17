"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Image, Trash2, Loader2 } from "lucide-react";
import { formatBytes, relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogBody, DialogTrigger } from "@/components/ui/dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { EmptyState } from "@/components/ui/empty-state";

export interface GridFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  url: string;
  thumbnailUrl: string | null;
  visibility: string;
  description: string | null;
  createdAt: string;
  uploader: { id: string; name: string } | null;
}

export function FilesGrid({
  files,
  projectId,
  projectName,
  canUpload,
  isWorker,
  currentUserId,
}: {
  files: GridFile[];
  projectId: string;
  projectName: string;
  canUpload: boolean;
  isWorker: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const canDeleteFile = (f: GridFile) => (!isWorker || f.uploader?.id === currentUserId);

  const images = files.filter((f) => f.isImage);
  const documents = files.filter((f) => !f.isImage);

  async function remove(id: string) {
    setDeleting(id);
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-ink-muted">{files.length} file{files.length !== 1 ? "s" : ""} on this project</p>
        {canUpload && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UploadCloud className="h-4 w-4" aria-hidden />
                Upload file
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>Upload file</DialogHeader>
              <DialogDescription>Attach documents or progress photos to {projectName}.</DialogDescription>
              <DialogBody>
                <FileUploader
                  endpoint="/api/files"
                  metadata={{ projectId, visibility: "INTERNAL" }}
                  maxFiles={5}
                  onDone={() => {
                    setUploadOpen(false);
                    router.refresh();
                  }}
                />
              </DialogBody>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No files yet"
          description="Upload contracts, invoices, permits, and progress photos. Photos can be shared with the customer."
          action={
            canUpload ? (
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <UploadCloud className="h-4 w-4" aria-hidden />
                Upload the first file
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {images.length > 0 && (
            <div>
              <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Photos</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((f) => (
                  <div key={f.id} className="group relative">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-[4/3] overflow-hidden rounded-card border border-border bg-elevated"
                    >
                      {f.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.thumbnailUrl} alt={f.originalName} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-elevated">
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <Image className="h-8 w-8 text-ink-faint" aria-hidden />
                        </div>
                      )}
                    </a>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[12px] text-ink-muted" title={f.originalName}>
                        {f.originalName}
                      </p>
                      {canDeleteFile(f) && (
                        <button
                          type="button"
                          aria-label="Delete file"
                          onClick={() => remove(f.id)}
                          className="shrink-0 rounded p-1 text-ink-faint hover:bg-danger/10 hover:text-danger"
                        >
                          {deleting === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
                        </button>
                      )}
                    </div>
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
                  <div key={f.id} className={cn("flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-3 transition-colors hover:border-brand/40")}>
                    <FileText className="h-6 w-6 shrink-0 text-brand/70" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate text-[14px] font-medium text-ink hover:text-brand">
                        {f.originalName}
                      </a>
                      <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-ink-faint">
                        <span>{formatBytes(f.size)}</span>
                        <span>·</span>
                        <span>{f.uploader?.name ?? "unknown"}</span>
                        <span>·</span>
                        <span>{relativeTime(f.createdAt)}</span>
                        {f.description && <span>·</span>}
                        {f.description && <span className="truncate text-ink-muted">{f.description}</span>}
                      </p>
                    </div>
                    {canDeleteFile(f) && (
                      <Button variant="ghost" size="sm" onClick={() => remove(f.id)} disabled={deleting === f.id}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
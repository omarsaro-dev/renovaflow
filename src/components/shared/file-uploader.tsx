"use client";

import * as React from "react";
import { Camera, UploadCloud, X, Loader2, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
}

export function FileUploader({
  endpoint,
  metadata,
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx",
  maxFiles = 8,
  multiple = true,
  description,
  onDone,
  className,
}: {
  endpoint: string;
  metadata: Record<string, string>;
  accept?: string;
  maxFiles?: number;
  multiple?: boolean;
  description?: string;
  onDone?: (urls: string[]) => void;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = React.useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).slice(0, Math.max(0, maxFiles - items.length));
    setItems((prev) => [
      ...prev,
      ...next.map((file) => ({ id: crypto.randomUUID(), file, status: "pending" as const, progress: 0 })),
    ]);
  }

  const hasPending = items.some((i) => i.status === "pending");

  React.useEffect(() => {
    if (!hasPending) return;
    const pendingIds = items.filter((i) => i.status === "pending").slice(0, 2).map((i) => i.id);
    for (const id of pendingIds) uploadOne(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending]);

  async function uploadOne(id: string) {
    runUpload(id);
  }

  async function runUpload(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "uploading", progress: 2 } : i)));

    const form = new FormData();
    form.append("file", item.file);
    for (const [k, v] of Object.entries(metadata)) form.append(k, v);

    try {
      const res = await fetch(endpoint, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: "error", error: json.error?.message ?? "Upload failed" } : i))
        );
        return;
      }
      const url = json.data?.file?.url ?? json.data?.url;
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "done", progress: 100, url } : i))
      );
      onDone?.(json.data?.file?.id ? [json.data.file.id] : []);
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "error", error: "Network error" } : i)));
    }
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const allDone = items.length > 0 && items.every((i) => i.status === "done");
  const anyError = items.some((i) => i.status === "error");

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-control border border-dashed px-4 py-8 text-center transition-colors",
          dragOver ? "border-brand bg-brandTint" : "border-border bg-elevated/60 hover:border-brand/40 hover:bg-elevated"
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brandTint">
          <UploadCloud className="h-5 w-5 text-brand" aria-hidden />
        </span>
        <span className="text-[13px] font-medium text-ink">
          {dragOver ? "Drop to upload" : "Click to browse or drag files here"}
        </span>
        {description && <span className="text-[12px] text-ink-muted">{description}</span>}
      </button>

      {(items.length > 0 || anyError) && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-control border border-border bg-elevated/60 px-3 py-2.5">
              {item.file.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(item.file)} alt="" className="h-8 w-10 rounded object-cover" />
              ) : (
                <span className="flex h-8 w-10 items-center justify-center rounded bg-border/60 text-[10px] font-semibold uppercase text-ink-muted">
                  {item.file.name.split(".").pop()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{item.file.name}</p>
                <p className="text-[11px] text-ink-muted">{formatBytes(item.file.size)}</p>
                {item.status === "error" && item.error && (
                  <p className="flex items-center gap-1 text-[11px] text-danger">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    {item.error} — tap retry
                  </p>
                )}
              </div>
              {item.status === "uploading" && (
                <div className="flex w-16 items-center gap-1">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${item.progress}%` }} />
                  </div>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" aria-hidden />
                </div>
              )}
              {item.status === "done" && <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" aria-hidden />}
              {item.status === "error" && (
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => runUpload(item.id)} aria-label="Retry upload">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              )}
              <button type="button" onClick={() => remove(item.id)} className="shrink-0 rounded p-1 text-ink-faint hover:text-ink" aria-label={`Remove ${item.file.name}`}>
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {allDone && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-success">
          <Camera className="h-3.5 w-3.5" aria-hidden />
          Upload complete
        </p>
      )}
    </div>
  );
}
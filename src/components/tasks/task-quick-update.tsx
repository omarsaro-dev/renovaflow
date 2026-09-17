"use client";

import * as React from "react";
import { TASK_STATUS } from "@/lib/constants";
import { CheckCircle2 } from "lucide-react";
import type { BoardTask } from "./task-board";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/shared/file-uploader";

const FAST_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"];

export function TaskQuickUpdate({
  task,
  canEdit,
  onSaved,
}: {
  task: BoardTask;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [status, setStatus] = React.useState(task.status);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    const body: Record<string, unknown> = { status };
    if (note.trim()) body.note = note.trim();
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Could not update the task.");
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("Network error. Your changes weren't saved yet.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.03em] text-ink-muted">
          Status — tap to change
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FAST_STATUSES.map((s) => {
            const meta = TASK_STATUS[s as keyof typeof TASK_STATUS];
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-[44px] items-center justify-center gap-2 rounded-control border px-3 py-2.5 text-[13px] font-medium transition-all",
                  active
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-border bg-surface text-ink-muted hover:border-brand/40 hover:bg-elevated"
                )}
              >
                {s === "DONE" && active && <CheckCircle2 className="h-4 w-4" aria-hidden />}
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.03em] text-ink-muted">
          Short note <span className="normal-case text-ink-faint">(optional)</span>
        </p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`e.g. "Countertops delivered, dry fit tomorrow"`}
          className="min-h-[72px]"
          maxLength={600}
        />
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.03em] text-ink-muted">
          Progress photo <span className="normal-case text-ink-faint">(optional)</span>
        </p>
        <FileUploader
          endpoint="/api/files"
          metadata={{ taskId: task.id, projectId: task.projectId, visibility: "CUSTOMER_VISIBLE" }}
          maxFiles={4}
          description="JPG or PNG, up to 25 MB. Photos are shared with the customer."
        />
      </div>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={save} className="flex-1 min-h-[44px]" loading={saving}>
          {saving ? "Saving…" : "Save update"}
        </Button>
        {canEdit && (
          <Button variant="outline" className="min-h-[44px]" onClick={() => onSaved()}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
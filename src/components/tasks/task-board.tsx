"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus, GripVertical, Camera, MessageSquareText, CalendarClock } from "lucide-react";
import { TASK_STATUS, TASK_STATUS_ORDER, TASK_PRIORITY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatDate, relativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/shared/status-badges";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogBody, DialogTrigger } from "@/components/ui/dialog";
import { TaskQuickUpdate } from "./task-quick-update";
import { TaskEditForm } from "./task-edit-form";
import { EmptyState } from "@/components/ui/empty-state";

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
  projectId: string;
  projectName: string;
  noteCount: number;
  photoCount: number;
}

export function TaskBoard({
  tasks,
  projectId,
  projectName,
  canEdit,
  isWorker,
  teamMembers,
  showCreate = true,
}: {
  tasks: BoardTask[];
  projectId: string;
  projectName: string;
  canEdit: boolean;
  isWorker: boolean;
  teamMembers: { id: string; name: string }[];
  showCreate?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = React.useState<"list" | "kanban">("list");
  const [filterAssignee, setFilterAssignee] = React.useState("ALL");
  const [filterPriority, setFilterPriority] = React.useState("ALL");
  const [quickTask, setQuickTask] = React.useState<BoardTask | null>(null);
  const [editTask, setEditTask] = React.useState<BoardTask | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const filtered = tasks.filter(
    (t) =>
      (filterAssignee === "ALL" || t.assignee?.id === filterAssignee) &&
      (filterPriority === "ALL" || t.priority === filterPriority)
  );

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) router.refresh();
  }

  async function handleDrop(taskId: string, status: string) {
    await patch(taskId, { status });
  }

  const memberOptions = (
    <>
      <option value="">Unassigned</option>
      {teamMembers.map((m) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </>
  );

  function renderCard(t: BoardTask) {
    return (
      <div
        key={t.id}
        draggable={canEdit}
        onDragStart={(e) => e.dataTransfer.setData("taskId", t.id)}
        onClick={() => (isWorker ? setQuickTask(t) : canEdit ? setEditTask(t) : setQuickTask(t))}
        className={cn(
          "group cursor-pointer rounded-card border border-border bg-surface p-3 shadow-card transition-all hover:border-brand/40 hover:shadow-elevated",
          canEdit && "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium leading-snug text-ink">{t.title}</p>
          {canEdit && <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-faint opacity-60" aria-hidden />}
        </div>
        {t.description && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-muted">{t.description}</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <TaskStatusBadge status={t.status} />
          <TaskPriorityBadge priority={t.priority} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
          <span className="flex items-center gap-1">
            {t.assignee ? (
              <>
                <Avatar name={t.assignee.name} size="xs" />
                {t.assignee.name.split(" ")[0]}
              </>
            ) : (
              <span className="italic">Unassigned</span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {t.noteCount > 0 && (
              <span className="flex items-center gap-0.5"><MessageSquareText className="h-3 w-3" aria-hidden />{t.noteCount}</span>
            )}
            {t.photoCount > 0 && (
              <span className="flex items-center gap-0.5"><Camera className="h-3 w-3" aria-hidden />{t.photoCount}</span>
            )}
            {t.dueDate && (
              <span className="flex items-center gap-0.5"><CalendarClock className="h-3 w-3" aria-hidden />{formatDate(t.dueDate, "MMM d")}</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  function columnStatuses() {
    return TASK_STATUS_ORDER;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} aria-label="Filter by assignee" className="w-44">
            <option value="ALL">All assignees</option>
            {memberOptions}
          </Select>
          <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} aria-label="Filter by priority" className="w-36">
            <option value="ALL">All priorities</option>
            {Object.entries(TASK_PRIORITY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-control border border-border bg-surface p-0.5" role="tablist" aria-label="Task view">
            <button
              role="tab"
              aria-selected={view === "list"}
              onClick={() => setView("list")}
              className={cn("inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium", view === "list" ? "bg-brand text-white" : "text-ink-muted hover:text-ink")}
            >
              <List className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              role="tab"
              aria-selected={view === "kanban"}
              onClick={() => setView("kanban")}
              className={cn("inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium", view === "kanban" ? "bg-brand text-white" : "text-ink-muted hover:text-ink")}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>
          {canEdit && showCreate && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" aria-hidden />
                  New task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>New task</DialogHeader>
                <DialogDescription>Add work to {projectName}.</DialogDescription>
                <DialogBody>
                  <TaskEditForm projectId={projectId} teamMembers={teamMembers} onSaved={() => { setCreateOpen(false); router.refresh(); }} />
                </DialogBody>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No tasks here"
          description={canEdit ? "Create a task to start planning this project's work." : "Tasks assigned to this project will appear here."}
          action={
            canEdit && showCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                New task
              </Button>
            ) : undefined
          }
        />
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="cursor-pointer transition-colors hover:border-brand/40">
              <div className="flex flex-wrap items-center gap-3 p-3.5 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{t.title}</p>
                  <p className="truncate text-[12px] text-ink-muted">{t.projectName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.assignee && <Avatar name={t.assignee.name} size="sm" />}
                  <TaskPriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                  <button type="button" onClick={() => (isWorker ? setQuickTask(t) : canEdit ? setEditTask(t) : setQuickTask(t))} className="rounded-control border border-border px-2.5 py-1.5 text-[12px] font-medium text-ink-muted hover:bg-elevated hover:text-ink">
                    Open
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columnStatuses().map((status) => {
            const colTasks = filtered.filter((t) => t.status === status);
            const meta = TASK_STATUS[status];
            return (
              <div key={status} className="w-[260px] shrink-0">
                <div className="rounded-t-card border border-b-0 border-border bg-elevated px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                      {meta.icon && <meta.icon className="h-3.5 w-3.5 text-ink-faint" aria-hidden />}
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-border/70 px-1.5 text-[11px] font-semibold tabular-nums text-ink-muted">{colTasks.length}</span>
                  </div>
                </div>
                <div
                  className="min-h-[160px] space-y-2 rounded-b-card border border-border bg-elevated/50 p-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const taskId = e.dataTransfer.getData("taskId");
                    if (taskId) handleDrop(taskId, status);
                  }}
                >
                  {colTasks.map(renderCard)}
                  {colTasks.length === 0 && (
                    <p className="py-6 text-center text-[12px] text-ink-faint">Drop tasks here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!quickTask} onOpenChange={(o) => !o && setQuickTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>{quickTask?.title}</DialogHeader>
          <DialogDescription>{quickTask ? relativeTime(quickTask.dueDate) : ""}</DialogDescription>
          <DialogBody>
            {quickTask && (
              <TaskQuickUpdate
                task={quickTask}
                canEdit={canEdit}
                onSaved={() => {
                  setQuickTask(null);
                  router.refresh();
                }}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>Edit task</DialogHeader>
          <DialogDescription>{editTask?.projectName}</DialogDescription>
          <DialogBody>
            {editTask && (
              <TaskEditForm
                projectId={editTask.projectId}
                teamMembers={teamMembers}
                task={{ id: editTask.id, title: editTask.title, description: editTask.description, priority: editTask.priority, status: editTask.status, dueDate: editTask.dueDate, assigneeId: editTask.assignee?.id ?? null }}
                onSaved={() => {
                  setEditTask(null);
                  router.refresh();
                }}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
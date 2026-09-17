"use client";

import * as React from "react";
import { z } from "zod";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().optional(),
  assigneeId: z.string(),
  priority: z.string(),
  status: z.string(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export function TaskEditForm({
  projectId,
  teamMembers,
  task,
  onSaved,
}: {
  projectId: string;
  teamMembers: { id: string; name: string }[];
  task?: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    dueDate: string | null;
    assigneeId: string | null;
  };
  onSaved: () => void;
}) {
  const isEdit = !!task;
  const [values, setValues] = React.useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assigneeId ?? "",
    priority: task?.priority ?? "MEDIUM",
    status: task?.status ?? "TODO",
    startDate: "",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const result = schema.safeParse(values);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const err of result.error.issues) {
        if (err.path[0]) next[String(err.path[0])] = err.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    const payload = {
      ...result.data,
      assigneeId: result.data.assigneeId || null,
      startDate: result.data.startDate || null,
      dueDate: result.data.dueDate || null,
    };
    try {
      const url = isEdit
        ? `/api/tasks/${task!.id}`
        : `/api/projects/${projectId}/tasks`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, projectId: undefined } : { ...payload, projectId }),
      });
      const json = await res.json();
      setSaving(false);
      if (!res.ok) {
        setFormError(json.error?.message ?? "Could not save the task.");
        return;
      }
      onSaved();
    } catch {
      setSaving(false);
      setFormError("Could not save the task. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormMessage error={formError} />
      <Field label="Title" htmlFor="t-title" required error={errors.title}>
        <Input id="t-title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Install kitchen countertops" aria-invalid={!!errors.title} />
      </Field>
      <Field label="Description" htmlFor="t-desc">
        <Textarea id="t-desc" value={values.description} onChange={(e) => set("description", e.target.value)} placeholder="What needs to happen, any instructions…" className="min-h-[72px]" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assign to" htmlFor="t-assignee">
          <Select id="t-assignee" value={values.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="t-priority">
          <Select id="t-priority" value={values.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </Field>
        <Field label="Status" htmlFor="t-status">
          <Select id="t-status" value={values.status} onChange={(e) => set("status", e.target.value)}>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_REVIEW">In review</option>
            <option value="DONE">Done</option>
          </Select>
        </Field>
        <Field label="Due date" htmlFor="t-due">
          <Input id="t-due" type="date" value={values.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <Button type="submit" loading={saving}>
          {isEdit ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
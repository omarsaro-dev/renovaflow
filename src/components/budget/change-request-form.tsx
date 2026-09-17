"use client";

import * as React from "react";
import { z } from "zod";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  reason: z.string().trim().min(4, "Explain the reason for this change"),
  costImpact: z.coerce.number().default(0),
  scheduleImpactDays: z.coerce.number().int().default(0),
  scheduleImpactNote: z.string().trim().optional(),
  budgetCategoryId: z.string(),
});

export function ChangeRequestForm({
  projectId,
  categories,
  onSaved,
}: {
  projectId: string;
  categories: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState({
    title: "",
    reason: "",
    costImpact: "",
    scheduleImpactDays: "",
    scheduleImpactNote: "",
    budgetCategoryId: "",
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
    const result = schema.safeParse({
      ...values,
      costImpact: values.costImpact || "0",
      scheduleImpactDays: values.scheduleImpactDays || "0",
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const err of result.error.issues) {
        if (err.path[0]) next[String(err.path[0])] = err.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          budgetCategoryId: result.data.budgetCategoryId || null,
          scheduleImpactNote: result.data.scheduleImpactNote || null,
          projectId,
        }),
      });
      const json = await res.json();
      setSaving(false);
      if (!res.ok) {
        setFormError(json.error?.message ?? "Could not create the change request.");
        return;
      }
      onSaved();
    } catch {
      setSaving(false);
      setFormError("Could not create the change request. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormMessage error={formError} />
      <Field label="Title" htmlFor="cr-title" required error={errors.title}>
        <Input id="cr-title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Upgrade to premium quartz countertops" aria-invalid={!!errors.title} />
      </Field>
      <Field label="Reason" htmlFor="cr-reason" required error={errors.reason}>
        <Textarea id="cr-reason" value={values.reason} onChange={(e) => set("reason", e.target.value)} className="min-h-[72px]" placeholder="Why this change is needed, customer request details…" aria-invalid={!!errors.reason} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cost impact" htmlFor="cr-cost">
          <Input id="cr-cost" type="number" step="0.01" inputMode="decimal" value={values.costImpact} onChange={(e) => set("costImpact", e.target.value)} placeholder="$" />
        </Field>
        <Field label="Category" htmlFor="cr-cat">
          <Select id="cr-cat" value={values.budgetCategoryId} onChange={(e) => set("budgetCategoryId", e.target.value)}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Schedule impact (days)" htmlFor="cr-days">
          <Input id="cr-days" type="number" step="1" min="0" value={values.scheduleImpactDays} onChange={(e) => set("scheduleImpactDays", e.target.value)} />
        </Field>
        <Field label="Impact note" htmlFor="cr-impactnote">
          <Input id="cr-impactnote" value={values.scheduleImpactNote} onChange={(e) => set("scheduleImpactNote", e.target.value)} placeholder="e.g. Tile delivery delayed 3 days" />
        </Field>
      </div>
      <p className="text-[13px] text-ink-muted">
        This change request will be sent to the customer for approval.
      </p>
      <div className="flex justify-end gap-3">
        <Button type="submit" loading={saving}>
          Create change request
        </Button>
      </div>
    </form>
  );
}
"use client";

import * as React from "react";
import { z } from "zod";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  description: z.string().trim().min(2, "Description is required"),
  actualAmount: z.coerce.number().min(0, "Amount cannot be negative"),
  estimatedAmount: z.coerce.number().min(0).optional(),
  vendor: z.string().trim().optional(),
  date: z.string().optional(),
  notes: z.string().trim().optional(),
  categoryId: z.string(),
});

export function ExpenseForm({
  projectId,
  categories,
  expense,
  onSaved,
}: {
  projectId: string;
  categories: { id: string; name: string }[];
  expense?: {
    id: string;
    description: string;
    actualAmount: number;
    estimatedAmount: number | null;
    vendor: string | null;
    date: string;
    notes: string | null;
    categoryId: string | null;
  };
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [values, setValues] = React.useState({
    description: expense?.description ?? "",
    actualAmount: expense ? String(expense.actualAmount) : "",
    estimatedAmount: expense?.estimatedAmount != null ? String(expense.estimatedAmount) : "",
    vendor: expense?.vendor ?? "",
    date: expense?.date ?? new Date().toISOString().slice(0, 10),
    notes: expense?.notes ?? "",
    categoryId: expense?.categoryId ?? "",
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
    try {
      const url = isEdit ? `/api/expenses/${expense!.id}` : `/api/projects/${projectId}/expenses`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          categoryId: result.data.categoryId || null,
          estimatedAmount: result.data.estimatedAmount || null,
          vendor: result.data.vendor || null,
          notes: result.data.notes || null,
          date: result.data.date || null,
          projectId,
        }),
      });
      const json = await res.json();
      setSaving(false);
      if (!res.ok) {
        setFormError(json.error?.message ?? "Could not save the expense.");
        return;
      }
      onSaved();
    } catch {
      setSaving(false);
      setFormError("Could not save the expense. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormMessage error={formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What is this?" htmlFor="e-desc" required className="sm:col-span-2" error={errors.description}>
          <Input id="e-desc" value={values.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Marble tiles — kitchen backsplash" aria-invalid={!!errors.description} />
        </Field>
        <Field label="Amount (actual)" htmlFor="e-amount" required error={errors.actualAmount}>
          <Input id="e-amount" type="number" min="0" step="0.01" inputMode="decimal" value={values.actualAmount} onChange={(e) => set("actualAmount", e.target.value)} placeholder="0.00" aria-invalid={!!errors.actualAmount} />
        </Field>
        <Field label="Estimate" htmlFor="e-est">
          <Input id="e-est" type="number" min="0" step="0.01" inputMode="decimal" value={values.estimatedAmount} onChange={(e) => set("estimatedAmount", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Category" htmlFor="e-cat">
          <Select id="e-cat" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Vendor" htmlFor="e-vendor">
          <Input id="e-vendor" value={values.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="Supplier or store" />
        </Field>
        <Field label="Date" htmlFor="e-date">
          <Input id="e-date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Notes" htmlFor="e-notes" className="sm:col-span-2">
          <Textarea id="e-notes" value={values.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[64px]" placeholder="Receipt number, warranty info…" />
        </Field>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" loading={saving}>
          {isEdit ? "Save expense" : "Log expense"}
        </Button>
      </div>
    </form>
  );
}
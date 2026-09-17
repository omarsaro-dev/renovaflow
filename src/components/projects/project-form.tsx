"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/input";

const schema = z.object({
  name: z.string().trim().min(2, "Project name is required"),
  customerId: z.string(),
  managerId: z.string(),
  address: z.string().trim().max(240).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.string(),
  startDate: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
  initialBudget: z.coerce.number().min(0, "Budget cannot be negative").default(0),
});

export type ProjectFormValues = z.infer<typeof schema>;

export function ProjectForm({
  customers,
  managers,
  endpoint,
  method = "POST",
  submitLabel = "Create project",
  initial,
  isEdit,
  redirectBase = "/app/projects",
}: {
  customers: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  endpoint: string;
  method?: "POST" | "PATCH";
  submitLabel?: string;
  initial?: Partial<ProjectFormValues>;
  isEdit?: boolean;
  redirectBase?: string;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<ProjectFormValues>({
    name: initial?.name ?? "",
    customerId: initial?.customerId ?? "",
    managerId: initial?.managerId ?? "",
    address: initial?.address ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "PLANNING",
    startDate: initial?.startDate ?? "",
    expectedCompletionDate: initial?.expectedCompletionDate ?? "",
    initialBudget: initial?.initialBudget ?? 0,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const result = schema.safeParse(values);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const err of result.error.issues) {
        if (err.path[0]) next[String(err.path[0])] = err.message;
      }
      setErrors(next);
      setSubmitting(false);
      return;
    }
    setErrors({});
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const json = await res.json();
      setSubmitting(false);
      if (!res.ok) {
        setFormError(json.error?.message ?? "Could not save the project.");
        return;
      }
      const projectId = json.data?.project?.id;
      if (projectId) router.push(`${redirectBase}/${projectId}`);
      else router.push(redirectBase);
    } catch {
      setSubmitting(false);
      setFormError("Could not save the project. Please check your details and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5" noValidate>
      <FormMessage error={formError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" htmlFor="name" required error={errors.name} className="sm:col-span-2">
          <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Modern Kitchen Renovation" aria-invalid={!!errors.name} />
        </Field>

        <Field label="Customer" htmlFor="customer">
          <Select
            id="customer"
            value={values.customerId}
            onChange={(e) => set("customerId", e.target.value)}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Project manager" htmlFor="manager">
          <Select id="manager" value={values.managerId} onChange={(e) => set("managerId", e.target.value)}>
            <option value="">Unassigned</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" className="sm:col-span-2">
          <Select id="status" value={values.status} onChange={(e) => set("status", e.target.value)}>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On hold</option>
            <option value="READY_FOR_REVIEW">Ready for review</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </Field>

        <Field label="Property address" htmlFor="address" className="sm:col-span-2">
          <Input
            id="address"
            value={values.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Street, city, zip"
          />
        </Field>

        <Field label="Start date" htmlFor="start">
          <Input id="start" type="date" value={values.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
        </Field>

        <Field label="Expected completion" htmlFor="end">
          <Input id="end" type="date" value={values.expectedCompletionDate ?? ""} onChange={(e) => set("expectedCompletionDate", e.target.value)} />
        </Field>

        <Field
          label="Initial budget"
          htmlFor="budget"
          error={errors.initialBudget}
          hint={isEdit ? "Changing this shifts the approved budget by the same amount." : "You can refine this later in the budget tab."}
          className="sm:col-span-2"
        >
          <Input
            id="budget"
            type="number"
            min="0"
            step="0.01"
            value={values.initialBudget === 0 ? "" : String(values.initialBudget)}
            placeholder="0.00"
            onChange={(e) => set("initialBudget", e.target.value === "" ? 0 : Number(e.target.value))}
            aria-invalid={!!errors.initialBudget}
          />
        </Field>

        <Field label="Description" htmlFor="desc" className="sm:col-span-2">
          <Textarea
            id="desc"
            value={values.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Scope, finishes, key details…"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" loading={submitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, FormMessage } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { ConfirmDialog, ConfirmDialogContent } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";

export type CustomerItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  userId: string | null;
  _count?: { projects: number };
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createLogin: boolean;
  password: string;
};

const empty: FormState = { name: "", email: "", phone: "", address: "", notes: "", createLogin: false, password: "" };

export function CustomersList({ customers }: { customers: CustomerItem[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CustomerItem | null>(null);
  const [deleting, setDeleting] = useState<CustomerItem | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm(empty);
    setError(null);
    setCreating(true);
  };

  const openEdit = (c: CustomerItem) => {
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
      createLogin: false,
      password: "",
    });
    setError(null);
    setEditing(c);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const id = editing?.id;
    const res = await fetch(id ? `/api/customers/${id}` : "/api/customers", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        notes: form.notes || null,
        createLogin: !id && form.createLogin,
        password: !id && form.createLogin ? form.password : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitting(false);
      setError(data?.error ?? "Could not save the customer.");
      return;
    }
    setSubmitting(false);
    setCreating(false);
    setEditing(null);
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    const res = await fetch(`/api/customers/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Customers</h1>
          <p className="mt-1 text-[14px] text-ink-muted">People and companies you build for.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Add customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No customers yet"
          description="Add a customer to attach projects and share updates with."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="md" />
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{c.name}</p>
                    {c.userId ? (
                      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-success">Has login</p>
                    ) : (
                      <p className="text-[12px] text-ink-faint">No portal login</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              <div className="space-y-1.5 text-[13px] text-ink-muted">
                {c.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    {c.phone}
                  </p>
                )}
                {c.address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {c.address}
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <span className="text-[13px] text-ink-muted">
                  {c._count?.projects ?? 0} project{c._count?.projects === 1 ? "" : "s"}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} className="text-danger hover:text-danger">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={creating || !!editing} onOpenChange={(open) => {
        if (!open) {
          setCreating(false);
          setEditing(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>{editing ? "Edit customer" : "Add customer"}</DialogHeader>
          <DialogDescription>
            {editing
              ? "Update this customer's contact details."
              : "Choose a display name — uploads and updates can be shared with them."}
          </DialogDescription>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name" required htmlFor="cust-name">
              <Input id="cust-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="cust-email">
                <Input id="cust-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone" htmlFor="cust-phone">
                <Input id="cust-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Address" htmlFor="cust-address">
              <Input id="cust-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Notes" htmlFor="cust-notes">
              <Textarea id="cust-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            {!editing && (
              <div className="space-y-3 rounded-control border border-border bg-elevated p-4">
                <label className="flex items-start gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    checked={form.createLogin}
                    onChange={(e) => setForm({ ...form, createLogin: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-brand"
                  />
                  <span>
                    Create a portal login
                    <span className="block text-[12px] text-ink-muted">They can sign in to view projects, updates, and approve changes.</span>
                  </span>
                </label>
                {form.createLogin && (
                  <Field label="Temporary password" required htmlFor="cust-password" hint="At least 8 characters. They can change it later.">
                    <Input id="cust-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  </Field>
                )}
              </div>
            )}

            <FormMessage error={error} />
            <div className="flex items-center justify-end gap-2">
              {editing && (
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={submitting} loading={submitting}>
                {editing ? "Save changes" : "Add customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <ConfirmDialogContent
          title={`Delete ${deleting?.name}?`}
          description="Their projects stay open but will no longer appear under a customer."
          confirmLabel="Delete"
          tone="danger"
          onConfirm={remove}
        />
      </ConfirmDialog>
    </>
  );
}
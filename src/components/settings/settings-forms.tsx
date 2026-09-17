"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field, FormMessage } from "@/components/ui/input";

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not save your profile.");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <Field label="Full name" required htmlFor="profile-name">
        <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email" hint="Your email is used to sign in and receive notifications.">
        <Input value={initial.email} disabled />
      </Field>
      <Field label="Phone">
        <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
      </Field>
      <FormMessage error={error} />
      <Button type="submit" disabled={submitting} loading={submitting}>
        Save profile
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setDone(false);
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not change your password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <Field label="Current password" required htmlFor="pw-current">
        <Input id="pw-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" required htmlFor="pw-new" hint="At least 8 characters.">
          <Input id="pw-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" required htmlFor="pw-confirm">
          <Input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </Field>
      </div>
      <FormMessage error={error} />
      {done && (
        <div role="status" className="rounded-control border border-success/30 bg-successTint px-3 py-2.5 text-sm text-success">
          Password updated.
        </div>
      )}
      <Button type="submit" disabled={submitting || !currentPassword || !newPassword || !confirm} loading={submitting}>
        Change password
      </Button>
    </form>
  );
}

export function OrgSettingsForm({
  initial,
}: {
  initial: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    budgetWarningThreshold: number;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [threshold, setThreshold] = useState(String(initial.budgetWarningThreshold));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        budgetWarningThreshold: Number(threshold),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not update organization settings.");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <Field label="Company name" required htmlFor="org-name">
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact email" htmlFor="org-email">
          <Input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="org-phone">
          <Input id="org-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="Address" htmlFor="org-address">
        <Input id="org-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website" htmlFor="org-website">
          <Input id="org-website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </Field>
        <Field label="Budget warning threshold (%)" htmlFor="org-threshold" hint="Notify when any budget is at least this percent spent.">
          <Input id="org-threshold" type="number" min={1} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </Field>
      </div>
      <FormMessage error={error} />
      <Button type="submit" disabled={submitting} loading={submitting}>
        Save settings
      </Button>
    </form>
  );
}
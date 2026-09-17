"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Field, Input, FormMessage } from "@/components/ui/input";

export default function RegisterPage() {
  const [form, setForm] = React.useState({ name: "", companyName: "", email: "", password: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Could not create your account.");
        setLoading(false);
        return;
      }
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      window.location.assign("/app");
    } catch {
      setError("Could not create your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Start your renovation company</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Set up your workspace, invite your team, and get customers in the loop.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormMessage error={error} />

        <Field label="Your name" htmlFor="name" required>
          <Input id="name" required placeholder="Alex Carter" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
        </Field>

        <Field label="Company name" htmlFor="company" required>
          <Input id="company" required placeholder="Carter Build Co." value={form.companyName} onChange={(e) => set("companyName", e.target.value)} autoComplete="organization" />
        </Field>

        <Field label="Work email" htmlFor="email" required>
          <Input id="email" type="email" required placeholder="you@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </Field>

        <Field label="Password" htmlFor="password" required hint="At least 8 characters.">
          <Input id="password" type="password" required minLength={8} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Creating workspace…" : "Create workspace"}
        </Button>

        <p className="pt-2 text-center text-[13px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
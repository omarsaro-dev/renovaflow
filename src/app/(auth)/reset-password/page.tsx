"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, FormMessage } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "This link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => window.location.assign("/login"), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-success/25 bg-successTint p-5 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-success" aria-hidden />
        <p className="text-[15px] font-semibold text-ink">Password updated</p>
        <p className="mt-1 text-[13px] text-ink-muted">Taking you to the sign-in page…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Choose a new password</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Make it at least 8 characters.</p>
      </div>
      {!token ? (
        <FormMessage error="This reset link is missing its token. Request a new one." />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormMessage error={error} />
          <Field label="New password" htmlFor="password">
            <Input id="password" type="password" required minLength={8} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm">
            <Input id="confirm" type="password" required minLength={8} placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
          <p className="pt-1 text-center text-[13px] text-ink-muted">
            <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      }
    >
      <ResetPasswordPageInner />
    </Suspense>
  );
}
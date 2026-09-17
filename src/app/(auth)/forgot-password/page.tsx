"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, FormMessage } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [devLink, setDevLink] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Could not send a reset email.");
        setLoading(false);
        return;
      }
      setSent(true);
      setDevLink(json.data.devResetUrl ?? null);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Reset your password</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Enter the email you use to sign in and we&apos;ll send you a reset link.
        </p>
      </div>

      {sent ? (
        <div className="rounded-card border border-success/25 bg-successTint p-5">
          <p className="text-[14px] font-medium text-success">Reset link sent</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            If an account exists for <span className="font-medium text-ink">{email}</span>, you&apos;ll receive an email with a link to set a new password.
          </p>
          {devLink && (
            <p className="mt-3 rounded-control border border-warning/30 bg-warningTint px-3 py-2 text-[13px] text-[#7A5C14]">
              <span className="font-semibold">Demo mode:</span> no email server is configured, so here is your link —{" "}
              <Link href={devLink} className="font-medium underline underline-offset-2 hover:text-warning">
                {devLink}
              </Link>
            </p>
          )}
          <Link href="/login" className="mt-4 inline-block text-[13px] font-medium text-brand hover:text-brand-hover">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormMessage error={error} />
          <Field label="Email address" htmlFor="email">
            <Input id="email" type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <p className="pt-2 text-center text-[13px] text-ink-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
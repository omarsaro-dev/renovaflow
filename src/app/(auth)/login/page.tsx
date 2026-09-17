"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, FormMessage } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("The email or password is incorrect.");
        setLoading(false);
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      setError("Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Welcome back</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Sign in to your team workspace or customer portal.
        </p>
      </div>

      <FormMessage error={error} />

      <Field label="Email address" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <div className="flex items-center justify-between text-[13px]">
        <label className="flex items-center gap-2 text-ink-muted">
          <input type="checkbox" className="h-4 w-4 rounded border-border accent-brand" />
          Remember me
        </label>
        <Link href="/forgot-password" className="font-medium text-brand hover:text-brand-hover">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="pt-2 text-center text-[13px] text-ink-muted">
        New to RenovaFlow?{" "}
        <Link href="/register" className="font-medium text-brand hover:text-brand-hover">
          Start your company
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
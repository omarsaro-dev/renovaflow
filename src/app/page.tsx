import Link from "next/link";
import {
  Ruler,
  CheckCircle2,
  Ban,
  Camera,
  ListTodo,
  Wallet,
  MessagesSquare,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ListTodo,
    title: "Tasks your crew actually follow",
    body: "Drag-and-drop task boards, quick field updates, and progress photos keep everyone working from the same plan.",
  },
  {
    icon: Wallet,
    title: "Budgets that never sneak up",
    body: "Categories, approved change requests, and automatic budget warnings mean the numbers are clear before they hurt.",
  },
  {
    icon: MessagesSquare,
    title: "Customers always in the loop",
    body: "Photo updates and change-order approvals flow to a simple customer portal — no more status-call roulette.",
  },
  {
    icon: ShieldCheck,
    title: "Clean approvals, zero surprises",
    body: "Change orders go out for approval and come back documented, so scope and price stay agreed at every step.",
  },
];

const STEPS = [
  { n: "01", title: "Set up your studio", body: "Invite your team, add customers, and start your first project in under a minute." },
  { n: "02", title: "Run the job", body: "Assign tasks, log expenses, and push photo updates from the field as work happens." },
  { n: "03", title: "Keep customers close", body: "They approve change orders and follow progress through their own portal." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="RenovaFlow home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <Link href="/login" className="rounded-control px-3 py-2 text-[14px] font-medium text-ink-muted transition-colors hover:bg-elevated hover:text-ink">
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "ml-2")}
            >
              Get started
            </Link>
          </nav>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "md:hidden")}
          >
            Get started
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                "linear-gradient(115deg, rgba(32,91,74,0.05) 1px, transparent 1px), linear-gradient(25deg, rgba(32,91,74,0.05) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brandTint px-3 py-1 text-[13px] font-medium text-brand">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Built for small renovation teams
              </p>
              <h1 className="mt-5 text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[56px]">
                Renovation projects that run{" "}
                <span className="text-brand">calmly</span>, start to finish.
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-muted">
                RenovaFlow keeps tasks, budgets, approvals, and customer updates in one quiet workspace — so your team
                builds and your customers trust.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
                  Start a free workspace
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-4 text-[13px] text-ink-muted">
                No credit card. Demo data included so you can explore instantly.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border/70 bg-elevated">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {[
              { value: "One workspace", label: "team, budget, and customers together" },
              { value: "Field-first", label: "photo updates from the job site" },
              { value: "Approved change orders", label: "documented, never surprised" },
              { value: "Customer portal", label: "progress they can see anytime" },
            ].map((stat) => (
              <div key={stat.value} className="bg-elevated p-6">
                <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{stat.value}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <h2 className="text-balance text-[30px] font-semibold tracking-[-0.02em] text-ink sm:text-[38px]">
                Everything a small renovation studio needs to stay calm.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                No spreadsheets stitched together, no overnight status emails. RenovaFlow gives your crew one place to
                work and your customers one place to watch.
              </p>
              <Link
                href="/register"
                className={cn("mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand hover:text-brand-hover")}
              >
                Create your workspace
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-card border border-border bg-surface p-6 transition-shadow hover:shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brandTint text-brand" aria-hidden>
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[16px] font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <h2 className="text-balance text-[30px] font-semibold tracking-[-0.02em] text-ink sm:text-[38px]">
              From kickoff to handover, in three steps.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="relative border-l border-border pl-6">
                  <span className="absolute -left-[3px] top-0 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  <p className="text-[13px] font-semibold tracking-[0.08em] text-accent">{step.n}</p>
                  <h3 className="mt-2 text-[17px] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:py-20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-white/10" aria-hidden>
              <Ruler className="h-6 w-6 text-white" />
            </div>
            <h2 className="mx-auto mt-6 max-w-2xl text-balance text-[30px] font-semibold tracking-[-0.02em] text-white sm:text-[38px]">
              Start your first project today — demo data is ready.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
              A seeded workspace waits for you with a team, a customer, and a real project to explore.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "accent", size: "lg" }))}
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white")}
              >
                Explore the demo
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: "Approvals",
                body: "Change orders approved on the customer portal with a clean paper trail.",
              },
              {
                icon: Camera,
                title: "Field updates",
                body: "Progress photos from the job site become updates customers see in real time.",
              },
              {
                icon: Ban,
                title: "Warnings",
                body: "Budget thresholds flag overruns early, before they become arguments.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-card border border-border bg-elevated p-6 text-center">
                <item.icon className="mx-auto h-6 w-6 text-brand" aria-hidden />
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo />
          </div>
          <p className="text-[13px] text-ink-muted">
            Renovation project management for small teams &copy; {new Date().getFullYear()}
          </p>
          <nav className="flex items-center gap-5 text-[13px] font-medium text-ink-muted" aria-label="Footer">
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/register" className="hover:text-ink">Get started</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
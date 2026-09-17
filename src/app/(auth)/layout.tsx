import { Logo } from "@/components/shared/logo";
import { Ban, Ruler, CheckCircle2, Phone } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[46%] overflow-hidden bg-brand lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[0.5]" style={{
          backgroundImage: `linear-gradient(115deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(25deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }} aria-hidden />
        <div className="relative z-10 px-12 py-10">
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/15 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-brand">
                <Ruler className="h-5 w-5" aria-hidden />
              </span>
            </span>
            <span className="text-[20px] font-semibold tracking-[-0.02em] text-white">
              Renova<span className="text-accent">Flow</span>
            </span>
          </span>

          <div className="mt-auto pb-6">
            <blockquote className="text-[28px] font-medium leading-snug tracking-[-0.02em] text-white">
              {`"Everyone on the crew knew exactly what to do next. The customer never had to ask."`}
            </blockquote>
            <p className="mt-4 text-[14px] text-white/70">
              Project manager, residential renovation studio
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { icon: CheckCircle2, label: "Clear task updates" },
                { icon: Ban, label: "Approved change orders" },
                { icon: Phone, label: "Field-first mobile" },
              ].map((f) => (
                <div key={f.label} className="rounded-card border border-white/15 bg-white/[0.07] p-3.5 backdrop-blur">
                  <f.icon className="mb-2 h-5 w-5 text-accent" aria-hidden />
                  <p className="text-[12px] leading-snug text-white/85">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-10 px-12 pb-10 text-[12px] text-white/50">
          © {new Date().getFullYear()} RenovaFlow · Know what is happening. Know what it costs. Keep the customer informed.
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Logo className="mx-auto" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
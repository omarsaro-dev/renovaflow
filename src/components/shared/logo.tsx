import { cn } from "@/lib/utils";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[9px] bg-brand text-white", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 4 5.2v6.6c0 4.6 3.3 8.1 8 10.2 4.7-2.1 8-5.6 8-10.2V5.2L12 2Z"
          fill="currentColor"
          opacity="1"
        />
        <path d="M9.5 16.5v-9m5 9v-9M9.5 12h5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={34} />
      <span className={cn("text-[17px] font-semibold tracking-[-0.02em]", light ? "text-white" : "text-ink")}>
        Renova<span className={light ? "text-accent" : "text-brand"}>Flow</span>
      </span>
    </span>
  );
}
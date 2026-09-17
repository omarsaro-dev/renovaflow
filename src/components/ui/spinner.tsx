import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" }[size];
  return <Loader2 className={cn("animate-spin text-brand", s, className)} />;
}

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-ink-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
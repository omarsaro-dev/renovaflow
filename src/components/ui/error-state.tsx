import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem persists, contact support.",
  icon: Icon,
  action,
  actionLabel = "Try again",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  actionLabel?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const IconEl = Icon ?? AlertTriangle;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-danger/20 bg-dangerTint/50 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-dangerTint">
        <IconEl className="h-6 w-6 text-danger" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">
        {description}
      </p>
      {(action || onRetry) && (
        <div className="mt-5">
          {action ?? (
            <Button variant="outline" onClick={onRetry}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function PermissionDenied({
  description = "You don't have permission to view this content.",
  className,
}: {
  description?: string;
  className?: string;
}) {
  return (
    <ErrorState
      icon={AlertTriangle}
      title="Access restricted"
      description={description}
      className={className}
    />
  );
}
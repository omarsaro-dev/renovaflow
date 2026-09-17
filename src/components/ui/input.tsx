import * as React from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink shadow-[0_1px_2px_rgba(37,48,44,0.03)] transition-colors placeholder:text-ink-faint hover:border-[#C7CDC4] focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/25 disabled:cursor-not-allowed disabled:bg-elevated disabled:text-ink-muted aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputBase, "min-h-[96px] resize-y leading-relaxed", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputBase, "cursor-pointer appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-medium text-ink", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden> *</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormMessage({ error, className }: { error?: string | null; className?: string }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-control border border-danger/30 bg-dangerTint px-3 py-2.5 text-sm text-danger",
        className
      )}
    >
      {error}
    </div>
  );
}
import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-[13px]",
    lg: "h-14 w-14 text-[15px]",
  }[size];

  const initialsText = initials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", dim, className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  const hue = Math.abs(hashString(name)) % 360;
  const bg = `hsl(${hue}, 22%, 78%)`;
  const fg = `hsl(${hue}, 20%, 36%)`;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        dim,
        className
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initialsText}
    </span>
  );
}

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
}
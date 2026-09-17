"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabBar({
  tabs,
  basePath,
}: {
  tabs: { slug: string; label: string }[];
  basePath: string;
}) {
  const pathname = usePathname();

  function isActive(slug: string) {
    if (slug === "") return pathname === basePath || pathname === `${basePath}/`;
    return pathname === `${basePath}/${slug}`;
  }

  return (
    <div className="flex gap-1 overflow-x-auto py-0" role="tablist">
      {tabs.map((tab) => (
        <Link
          key={tab.slug}
          href={tab.slug === "" ? basePath : `${basePath}/${tab.slug}`}
          role="tab"
          aria-selected={isActive(tab.slug)}
          className={cn(
            "relative whitespace-nowrap px-2.5 py-3 text-[13px] font-medium transition-colors",
            isActive(tab.slug) ? "text-brand" : "text-ink-muted hover:text-ink"
          )}
        >
          {tab.label}
          {isActive(tab.slug) && (
            <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-brand" aria-hidden />
          )}
        </Link>
      ))}
    </div>
  );
}
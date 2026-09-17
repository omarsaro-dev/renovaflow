import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoMark } from "../shared/logo";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarNav({
  items,
  onNavigate,
  active,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  active?: string;
}) {
  const hookPathname = usePathname();
  const pathname = active ?? hookPathname ?? "";

  return (
    <nav aria-label="Main navigation">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/app" && pathname?.startsWith(`${item.href}/`)) || (item.href === "/app" && pathname?.startsWith("/app/dashboard"));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-control px-3 py-2 text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-brandTint text-brand"
                    : "text-ink-muted hover:bg-elevated hover:text-ink"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-brand" : "text-ink-faint group-hover:text-ink-muted")} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function OrgBadge({ orgName }: { orgName: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-control border border-border bg-elevated px-2.5 py-2">
      <LogoMark size={26} className="opacity-90" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-ink">{orgName}</p>
        <p className="text-[11px] text-ink-faint capitalize">Team workspace</p>
      </div>
    </div>
  );
}
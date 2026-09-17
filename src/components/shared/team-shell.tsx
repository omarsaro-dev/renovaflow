"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, Settings, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "../shared/logo";
import { SidebarNav, OrgBadge } from "../shared/sidebar-nav";
import { NotificationBell } from "../shared/notification-bell";
import { Avatar } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export function TeamShell({
  user,
  organizationName,
  navItems,
  children,
  roleLabel,
}: {
  user: ShellUser;
  organizationName: string;
  navItems: { href: string; label: string; icon: LucideIcon }[];
  children: React.ReactNode;
  roleLabel: string;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="px-5 py-5">
          <Link href="/app" aria-label="RenovaFlow home">
            <Logo />
          </Link>
        </div>
        <div className="px-4 pb-3">
          <OrgBadge orgName={organizationName} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <SidebarNav items={navItems} />
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-ink-muted">{roleLabel}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="rounded-control p-1.5 text-ink-muted transition-colors hover:bg-elevated hover:text-ink"
                >
                  <Settings className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/app/settings">
                    <UserRound className="h-4 w-4" aria-hidden />
                    Profile & settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-danger hover:bg-dangerTint">
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-control border border-border p-2 text-ink-muted hover:bg-elevated"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Logo />
        <NotificationBell />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#22291f]/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-elevated animate-slide-up">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-control p-2 text-ink-muted hover:bg-elevated"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="px-4 pb-3">
              <OrgBadge orgName={organizationName} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} src={user.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-[12px] text-ink-muted">{roleLabel}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="rounded-control p-2 text-ink-muted hover:bg-dangerTint hover:text-danger"
                  aria-label="Sign out"
                >
                  <LogOut className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
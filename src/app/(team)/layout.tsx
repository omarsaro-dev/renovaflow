import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Wallet,
  Files,
  Bell,
  Settings,
} from "lucide-react";
import { requireTeam } from "@/lib/permissions";
import { TeamShell } from "@/components/shared/team-shell";
import { ROLES } from "@/lib/constants";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireTeam();

  const base = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/projects", label: "Projects", icon: FolderKanban },
    { href: "/app/tasks", label: "Tasks", icon: ListTodo },
    { href: "/app/files", label: "Files", icon: Files },
    { href: "/app/notifications", label: "Notifications", icon: Bell },
    { href: "/app/settings", label: "Settings", icon: Settings },
  ];

  const nav = [...base];

  if (ctx.teamRole === "ADMIN" || ctx.teamRole === "MANAGER") {
    nav.splice(3, 0, { href: "/app/customers", label: "Customers", icon: Users });
    nav.splice(4, 0, { href: "/app/budget", label: "Budget & expenses", icon: Wallet });
  }

  const roleLabel = ctx.teamRole ? (ROLES[ctx.teamRole as keyof typeof ROLES]?.label ?? "Team member") : "Team member";

  return (
    <TeamShell
      user={{
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        role: ctx.user.role,
        avatarUrl: ctx.user.avatarUrl,
      }}
      organizationName={ctx.organization.name}
      roleLabel={roleLabel}
      navItems={nav}
    >
      {children}
    </TeamShell>
  );
}
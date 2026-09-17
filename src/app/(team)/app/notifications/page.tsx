import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { NotificationsList, type NotificationItem } from "@/components/notifications/notifications-list";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await requireTeam();

  const notifications = await prisma.notification.findMany({
    where: { userId: ctx.user.id },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const items: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NotificationsList notifications={items} />;
}
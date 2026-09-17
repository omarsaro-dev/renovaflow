import { prisma } from "@/lib/db";
import { apiError, ok } from "@/lib/api";
import { getServerAuthContext, forbidden } from "@/lib/permissions";

export async function PATCH(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const body = (await request.json().catch(() => ({}))) as { ids?: string[] };

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const owned = await prisma.notification.findMany({
        where: { id: { in: body.ids }, userId: ctx.user.id, readAt: null },
        select: { id: true },
      });
      await prisma.notification.updateMany({
        where: { id: { in: owned.map((n) => n.id) } },
        data: { readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: ctx.user.id, readAt: null },
        data: { readAt: new Date() },
      });
    }

    return ok({ updated: true });
  } catch (error) {
    return apiError(error);
  }
}
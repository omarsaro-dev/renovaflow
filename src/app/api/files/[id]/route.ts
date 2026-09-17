import { prisma } from "@/lib/db";
import { apiError, ok } from "@/lib/api";
import { getServerAuthContext, forbidden } from "@/lib/permissions";
import { deleteStoredFile } from "@/lib/files";
import { recordActivity } from "@/lib/activity";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.isCustomer) forbidden();

    const file = await prisma.file.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!file) forbidden();

    if (ctx.teamRole === "WORKER" && file.uploaderId !== ctx.user.id) {
      forbidden();
    }

    const name = file.originalName;
    await deleteStoredFile(file);

    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: file.projectId ?? undefined,
      actorId: ctx.user.id,
      type: "FILE_DELETED",
      title: `Deleted ${name}`,
    });

    return ok({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
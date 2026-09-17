import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden } from "@/lib/permissions";
import { orgSettingsSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.teamRole !== "ADMIN") forbidden();

    const body = await parseBody(request, orgSettingsSchema);

    const org = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        website: body.website ?? null,
        budgetWarningThreshold: body.budgetWarningThreshold,
      },
    });

    return ok({ organization: org });
  } catch (error) {
    return apiError(error);
  }
}
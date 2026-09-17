import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden, notFound } from "@/lib/permissions";
import { customerCreateSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.teamRole === "WORKER") forbidden();

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!customer) notFound();

    const body = await parseBody(request, customerCreateSchema.omit({ createLogin: true, password: true }));

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        notes: body.notes ?? null,
      },
    });

    return ok({ customer: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.teamRole === "WORKER") forbidden();

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!customer) notFound();

    await prisma.$transaction(async (tx) => {
      await tx.project.updateMany({
        where: { customerId: customer.id },
        data: { customerId: null },
      });
      await tx.customer.delete({ where: { id: customer.id } });
    });

    return ok({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
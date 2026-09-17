import { prisma } from "@/lib/db";
import { apiError, ok, created, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden, invalidInput } from "@/lib/permissions";
import { customerCreateSchema } from "@/lib/validation";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.teamRole === "WORKER") forbidden();

    const customers = await prisma.customer.findMany({
      where: { organizationId: ctx.organizationId },
      include: { _count: { select: { projects: true } } },
      orderBy: { name: "asc" },
    });

    return ok({ customers });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx || ctx.teamRole === "WORKER") forbidden();

    const body = await parseBody(request, customerCreateSchema);

    let userId: string | null = null;

    if (body.createLogin) {
      if (!body.password) invalidInput("A password is required to create a login.");
      const email = (body.email ?? "").trim().toLowerCase();
      if (!email) invalidInput("An email is required to create a login.");
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) invalidInput("A user with that email already exists.");

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hash(body.password, 12),
          name: body.name,
          role: "CUSTOMER",
        },
      });
      userId = user.id;
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: ctx.organizationId,
        userId,
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        notes: body.notes ?? null,
      },
    });

    return created({ customer });
  } catch (error) {
    return apiError(error);
  }
}
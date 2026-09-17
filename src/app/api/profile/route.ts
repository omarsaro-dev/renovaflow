import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden, invalidInput } from "@/lib/permissions";
import { profileSchema, changePasswordSchema } from "@/lib/validation";
import { hash, compare } from "bcryptjs";

export async function PATCH(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const body = await parseBody(request, profileSchema);

    const user = await prisma.user.update({
      where: { id: ctx.user.id },
      data: { name: body.name, phone: body.phone ?? null },
    });

    return ok({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const body = await parseBody(request, changePasswordSchema);

    const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
    if (!user) forbidden();

    const valid = await compare(body.currentPassword, user.passwordHash);
    if (!valid) invalidInput("Your current password is incorrect.");

    const passwordHash = await hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return ok({ changed: true });
  } catch (error) {
    return apiError(error);
  }
}
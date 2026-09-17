import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiError, ok } from "@/lib/api";
import { invalidInput } from "@/lib/permissions";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = resetPasswordSchema.safeParse(raw);
    if (!body.success) throw invalidInput("This reset link is invalid or has expired.");

    const tokenHash = createHash("sha256").update(body.data.token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw invalidInput("This reset link is invalid or has expired. Request a new one.");
    }

    const passwordHash = await hash(body.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return ok({ message: "Password updated. You can now sign in." });
  } catch (error) {
    return apiError(error);
  }
}
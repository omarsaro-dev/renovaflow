import { createHash, randomBytes } from "crypto";
import { forgotPasswordSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { apiError, ok } from "@/lib/api";
import { invalidInput } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = forgotPasswordSchema.safeParse(raw);
    if (!body.success) throw invalidInput("Enter a valid email address.");

    const email = body.data.email;
    const user = await prisma.user.findUnique({ where: { email } });

    const genericOk = ok({
      message: "If an account exists for that email, a reset link has been sent.",
      devResetUrl: null,
    });

    // Don't reveal whether the account exists.
    if (!user) return genericOk;

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    // In production an email would be queued here. For the demo/development
    // environment we return the link directly so the reset flow is testable.
    const isDev = process.env.NODE_ENV !== "production";
    const devUrl = isDev
      ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`
      : null;

    console.info(`[auth] password reset requested for ${email}`);
    if (devUrl) console.info(`[auth] dev reset url: ${devUrl}`);

    return ok({
      message: "If an account exists for that email, a reset link has been sent.",
      devResetUrl: devUrl,
    });
  } catch (error) {
    return apiError(error);
  }
}
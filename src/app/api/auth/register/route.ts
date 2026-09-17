import { hash } from "bcryptjs";
import { registerSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { apiError, ok } from "@/lib/api";
import { invalidInput } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = registerSchema.safeParse(raw);
    if (!body.success) {
      throw invalidInput(body.error.issues[0]?.message ?? "Invalid registration details.");
    }

    const email = body.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw invalidInput("An account with this email already exists. Try signing in.");
    }

    const passwordHash = await hash(body.data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          name: body.data.name,
          passwordHash,
          role: "ADMIN",
        },
      });

      const org = await tx.organization.create({
        data: {
          name: body.data.companyName,
          email,
          plan: "Starter",
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: u.id,
          role: "ADMIN",
        },
      });

      await tx.activityEvent.create({
        data: {
          organizationId: org.id,
          actorId: u.id,
          type: "PROJECT_CREATED",
          title: `${u.name} started RenovaFlow for ${org.name}`,
        },
      });

      return { user: u, org };
    });

    return ok({
      user: { id: user.user.id, email, name: user.user.name, role: user.user.role },
      organization: { id: user.org.id, name: user.org.name },
    });
  } catch (error) {
    return apiError(error);
  }
}
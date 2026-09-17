import { requireCustomer } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, PasswordForm } from "@/components/settings/settings-forms";

export const metadata = { title: "Profile" };

export default async function PortalProfilePage() {
  const ctx = await requireCustomer();

  const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Profile</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">Your name is shown to the contractor on comments and approvals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Keep your contact details up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              name: user?.name ?? "",
              email: user?.email ?? "",
              phone: user?.phone ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change the password used to sign in to the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
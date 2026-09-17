import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, PasswordForm, OrgSettingsForm } from "@/components/settings/settings-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireTeam();
  const isAdmin = ctx.teamRole === "ADMIN";

  const [user, org] = await Promise.all([
    prisma.user.findUnique({ where: { id: ctx.user.id } }),
    prisma.organization.findUnique({ where: { id: ctx.organizationId } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Settings</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Manage your profile and organization.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name, email, and contact details.</CardDescription>
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
          <CardDescription>Change the password used to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {isAdmin && org && (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Company details and budgets shown across projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrgSettingsForm
              initial={{
                name: org.name,
                email: org.email,
                phone: org.phone,
                address: org.address,
                website: org.website,
                budgetWarningThreshold: org.budgetWarningThreshold,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
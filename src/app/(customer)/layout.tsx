import { requireCustomer } from "@/lib/permissions";
import { CustomerShell } from "@/components/shared/customer-shell";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireCustomer();

  return (
    <CustomerShell
      user={{
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        avatarUrl: ctx.user.avatarUrl,
      }}
      organizationName={ctx.organization.name}
    >
      {children}
    </CustomerShell>
  );
}
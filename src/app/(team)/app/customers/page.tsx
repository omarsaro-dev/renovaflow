import { redirect } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { CustomersList, type CustomerItem } from "@/components/customers/customers-list";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const ctx = await requireTeam();
  if (ctx.teamRole === "WORKER") redirect("/app/projects");

  const customers = await prisma.customer.findMany({
    where: { organizationId: ctx.organizationId },
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  });

  const items: CustomerItem[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
    userId: c.userId,
    _count: c._count,
  }));

  return <CustomersList customers={items} />;
}
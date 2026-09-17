import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./db";
import type {
  Organization,
  OrganizationMember,
  User,
  Project,
  Customer,
} from "@prisma/client";

export type TeamRole = "ADMIN" | "MANAGER" | "WORKER";

export interface AuthContext {
  user: User;
  isCustomer: boolean;
  teamRole: TeamRole | null;
  organization: Organization;
  organizationId: string;
  membership: OrganizationMember | null;
  customerRecord: Customer | null;
  /** Projects a worker is explicitly a member of. Empty for admins/managers. */
  projectIds: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function forbidden(message = "You do not have permission to access this resource."): never {
  throw new ApiError(403, "FORBIDDEN", message);
}

export function notFound(message = "The requested resource was not found."): never {
  throw new ApiError(404, "NOT_FOUND", message);
}

export function unauthorized(message = "You must be signed in to access this resource."): never {
  throw new ApiError(401, "UNAUTHORIZED", message);
}

export function invalidInput(message: string, details?: unknown): never {
  throw new ApiError(422, "VALIDATION_ERROR", message, details);
}

export async function getServerAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.role === "CUSTOMER") {
    const customerRecord = await prisma.customer.findUnique({
      where: { userId: user.id },
      include: { organization: true },
    });
    if (!customerRecord) {
      return {
        user,
        isCustomer: true,
        teamRole: null,
        organization: null as unknown as Organization,
        organizationId: "",
        membership: null,
        customerRecord: null,
        projectIds: [],
      };
    }
    return {
      user,
      isCustomer: true,
      teamRole: null,
      organization: customerRecord.organization,
      organizationId: customerRecord.organizationId,
      membership: null,
      customerRecord,
      projectIds: [],
    };
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId, isActive: true },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return {
      user,
      isCustomer: false,
      teamRole: null,
      organization: null as unknown as Organization,
      organizationId: "",
      membership: null,
      customerRecord: null,
      projectIds: [],
    };
  }

  const projectIds = user.role === "WORKER"
    ? (await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } })).map((p) => p.projectId)
    : [];

  return {
    user,
    isCustomer: false,
    teamRole: membership.role as TeamRole,
    organization: membership.organization,
    organizationId: membership.organizationId,
    membership,
    customerRecord: null,
    projectIds,
  };
}

/**
 * Server-side guard for team pages. Redirects customers to the portal
 * and anonymous users to the login screen.
 */
export async function requireTeam(): Promise<NonNullable<AuthContext>> {
  const ctx = await getServerAuthContext();
  if (!ctx?.organizationId) redirect("/login");
  if (ctx.isCustomer) redirect("/portal");
  if (!ctx.teamRole) redirect("/login");
  return ctx;
}

/** Server-side guard for customer portal pages. */
export async function requireCustomer(): Promise<NonNullable<AuthContext>> {
  const ctx = await getServerAuthContext();
  if (!ctx?.organizationId) redirect("/login");
  if (!ctx.isCustomer) redirect("/app");
  if (!ctx.customerRecord) redirect("/login");
  return ctx;
}

const READ_ROLES: TeamRole[] = ["ADMIN", "MANAGER", "WORKER"];
const WRITE_ROLES: TeamRole[] = ["ADMIN", "MANAGER"];
const FINANCE_ROLES: TeamRole[] = ["ADMIN", "MANAGER"];

/**
 * Verifies the authenticated team user may read/write a project.
 * Admin & Manager: any project in their organization.
 * Worker: only projects they are a member of.
 */
export async function requireProject(
  ctx: NonNullable<AuthContext>,
  projectId: string,
  mode: "read" | "write" = "read",
  opts: { finance?: boolean } = {}
) {
  if (ctx.isCustomer) forbidden();

  if (!READ_ROLES.includes(ctx.teamRole!)) forbidden();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organizationId },
  });
  if (!project) notFound("This project does not exist in your organization.");

  if (ctx.teamRole === "WORKER") {
    if (!ctx.projectIds.includes(projectId)) forbidden();
    if (mode === "write") forbidden();
    if (opts.finance) forbidden();
    return project;
  }

  if (mode === "write" && !WRITE_ROLES.includes(ctx.teamRole!)) forbidden();
  if (opts.finance && !FINANCE_ROLES.includes(ctx.teamRole!)) forbidden();
  return project;
}

export function canAccessTeam(ctx: AuthContext | null): boolean {
  return !!ctx && !ctx.isCustomer && !!ctx.teamRole;
}

export function isFinanciallyCleared(ctx: AuthContext | null): boolean {
  return canAccessTeam(ctx) && (ctx!.teamRole === "ADMIN" || ctx!.teamRole === "MANAGER");
}

/** For customers: the project must be one of their own. */
export async function requireCustomerProject(ctx: NonNullable<AuthContext>, projectId: string): Promise<Project> {
  if (!ctx.customerRecord) forbidden();
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organizationId, customerId: ctx.customerRecord.id },
  });
  if (!project) forbidden("This project is not available to your account.");
  return project;
}

export async function canReadProject(ctx: AuthContext | null | undefined, project: Project): Promise<boolean> {
  if (!ctx) return false;
  if (!ctx.organizationId || ctx.organizationId !== project.organizationId) return false;
  if (ctx.isCustomer) {
    return !!ctx.customerRecord && project.customerId === ctx.customerRecord.id;
  }
  if (ctx.teamRole === "ADMIN" || ctx.teamRole === "MANAGER") return true;
  if (ctx.teamRole === "WORKER") return ctx.projectIds.includes(project.id);
  return false;
}
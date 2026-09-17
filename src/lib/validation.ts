import { z } from "zod";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  FileVisibility,
  UpdateVisibility,
  OrgRole,
} from "@prisma/client";

const isoDate = z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" });

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  companyName: z.string().trim().min(2, "Enter your company name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(8),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name is required").max(120),
  customerId: z.string().min(1).nullable().optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  status: z.enum(Object.values(ProjectStatus) as [string, ...string[]]).default(ProjectStatus.PLANNING),
  startDate: isoDate.optional().nullable(),
  expectedCompletionDate: isoDate.optional().nullable(),
  managerId: z.string().min(1).optional().nullable(),
  initialBudget: z.coerce.number().min(0, "Budget cannot be negative").default(0),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required").max(160),
  description: z.string().trim().max(4000).optional().nullable(),
  projectId: z.string().min(1),
  assigneeId: z.string().min(1).optional().nullable(),
  priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).default(TaskPriority.MEDIUM),
  status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).default(TaskStatus.TODO),
  startDate: isoDate.optional().nullable(),
  dueDate: isoDate.optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
  priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).optional(),
  startDate: isoDate.optional().nullable(),
  dueDate: isoDate.optional().nullable(),
});

export const workerTaskUpdateSchema = z.object({
  status: z.enum(Object.values(TaskStatus) as [string, ...string[]]),
  note: z.string().trim().max(600).optional().nullable(),
});

export const expenseSchema = z.object({
  projectId: z.string().min(1),
  categoryId: z.string().min(1).optional().nullable(),
  description: z.string().trim().min(2, "Description is required").max(240),
  actualAmount: z.coerce.number().min(0, "Amount cannot be negative"),
  estimatedAmount: z.coerce.number().min(0).optional().nullable(),
  vendor: z.string().trim().max(160).optional().nullable(),
  date: isoDate.optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const budgetSchema = z.object({
  initialBudget: z.coerce.number().min(0).optional(),
  currentApprovedBudget: z.coerce.number().min(0).optional(),
  budgetWarningThreshold: z.coerce.number().min(1).max(100).optional(),
  categories: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(2).max(80),
        type: z.enum(["MATERIALS", "LABOR", "PERMITS", "SUBCONTRACTORS", "OTHER"]),
        estimatedAmount: z.coerce.number().min(0).default(0),
      })
    )
    .optional(),
});

export const updateExpenseSchema = expenseSchema
  .partial()
  .extend({ projectId: z.string().min(1).optional() });

export const changeRequestSchema = z.object({
  projectId: z.string().min(1),
  budgetCategoryId: z.string().min(1).optional().nullable(),
  title: z.string().trim().min(3, "Title is required").max(160),
  reason: z.string().trim().min(4, "Explain the reason for this change").max(4000),
  costImpact: z.coerce.number().default(0),
  scheduleImpactDays: z.coerce.number().int().default(0),
  scheduleImpactNote: z.string().trim().max(800).optional().nullable(),
});

export const changeRequestDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export const updateSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  body: z.string().trim().min(2, "Update content is required").max(10000),
  visibility: z.enum(Object.values(UpdateVisibility) as [string, ...string[]]).default(UpdateVisibility.CUSTOMER_VISIBLE),
  publish: z.boolean().default(false),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

export const fileMetaSchema = z.object({
  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
  expenseId: z.string().min(1).optional().nullable(),
  changeRequestId: z.string().min(1).optional().nullable(),
  updateId: z.string().min(1).optional().nullable(),
  visibility: z.enum(Object.values(FileVisibility) as [string, ...string[]]).default(FileVisibility.INTERNAL),
  description: z.string().trim().max(500).optional().nullable(),
});

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  website: z.string().trim().max(160).optional().nullable(),
  budgetWarningThreshold: z.coerce.number().min(1).max(100).optional(),
});

export const addTeamMemberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(Object.values(OrgRole) as [string, ...string[]]),
  temporaryPassword: z.string().min(8).max(200),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(Object.values(OrgRole) as [string, ...string[]]),
});

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  createLogin: z.boolean().default(false),
  password: z.string().min(8).optional().or(z.literal("")).optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(40).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});
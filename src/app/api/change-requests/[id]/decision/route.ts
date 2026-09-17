import { prisma } from "@/lib/db";
import { apiError, ok, parseBody } from "@/lib/api";
import { getServerAuthContext, forbidden, requireProject } from "@/lib/permissions";
import { changeRequestDecisionSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/activity";
import { notifyProjectTeamApproval, notifyTeam } from "@/lib/notifications";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const changeRequest = await prisma.changeRequest.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      include: {
        project: { select: { id: true, name: true, customerId: true, currentApprovedBudget: true } },
        budgetCategory: { select: { id: true, approvedAmount: true } },
      },
    });
    if (!changeRequest) forbidden("This change request does not exist in your organization.");
    if (changeRequest.status !== "PENDING_APPROVAL") {
      forbidden("This change request has already been decided.");
    }

    const body = await parseBody(request, changeRequestDecisionSchema);

    let isCustomerApproval = false;

    if (ctx.isCustomer) {
      if (!ctx.customerRecord || changeRequest.project.customerId !== ctx.customerRecord.id) {
        forbidden("This project is not available to your account.");
      }
      isCustomerApproval = true;
    } else {
      await requireProject(ctx, changeRequest.projectId, "write", { finance: true });
    }

    const approved = body.decision === "APPROVED";

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.changeRequest.update({
        where: { id: changeRequest.id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          decisionAt: new Date(),
          customerComment: isCustomerApproval ? (body.comment ?? null) : (changeRequest.customerComment ?? null),
        },
      });

      if (approved) {
        await tx.project.update({
          where: { id: changeRequest.projectId },
          data: { currentApprovedBudget: { increment: changeRequest.costImpact } },
        });
        if (changeRequest.budgetCategory) {
          await tx.budgetCategory.update({
            where: { id: changeRequest.budgetCategory.id },
            data: { approvedAmount: { increment: changeRequest.costImpact } },
          });
        }
      }
      return row;
    });

    // History
    await recordActivity({
      organizationId: ctx.organizationId,
      projectId: changeRequest.projectId,
      actorId: ctx.isCustomer ? ctx.user.id : ctx.user.id,
      type: approved ? "DECISION_SUBMITTED" : "DECISION_REJECTED",
      title: approved
        ? `${ctx.user.name} approved change "${changeRequest.title}" (+$${changeRequest.costImpact.toFixed(2)})`
        : `${ctx.user.name} rejected change "${changeRequest.title}"`,
    });
    if (approved) {
      await recordActivity({
        organizationId: ctx.organizationId,
        projectId: changeRequest.projectId,
        actorId: ctx.user.id,
        type: "BUDGET_CHANGED",
        title: `Approved budget increased by $${changeRequest.costImpact.toFixed(2)} (${changeRequest.title})`,
      });
    }

    if (isCustomerApproval) {
      await notifyProjectTeamApproval({
        projectId: changeRequest.projectId,
        organizationId: ctx.organizationId,
        type: approved ? "DECISION_SUBMITTED" : "DECISION_REJECTED",
        title: approved
          ? `${ctx.user.name} approved "${changeRequest.title}"`
          : `${ctx.user.name} rejected "${changeRequest.title}"`,
        body: approved
          ? `Budget increased by $${changeRequest.costImpact.toFixed(2)}.`
          : changeRequest.customerComment ?? "No comment provided.",
        link: `/app/projects/${changeRequest.projectId}/budget`,
      });
    } else {
      await notifyTeam({
        organizationId: ctx.organizationId,
        exceptUserId: ctx.user.id,
        projectId: changeRequest.projectId,
        type: approved ? "DECISION_SUBMITTED" : "DECISION_REJECTED",
        title: approved
          ? `"${changeRequest.title}" was approved`
          : `"${changeRequest.title}" was rejected`,
        body: changeRequest.project.name,
        link: `/app/projects/${changeRequest.projectId}/budget`,
      });
    }

    return ok({ changeRequest: updated });
  } catch (error) {
    return apiError(error);
  }
}
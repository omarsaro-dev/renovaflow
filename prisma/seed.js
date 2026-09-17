const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

const BUDGET_CATEGORIES = [
  { key: "MATERIALS", label: "Materials", sort: 10 },
  { key: "LABOR", label: "Labor", sort: 20 },
  { key: "PERMITS", label: "Permits", sort: 30 },
  { key: "SUBCONTRACTORS", label: "Subcontractors", sort: 40 },
  { key: "OTHER", label: "Other", sort: 50 },
];

async function main() {
  console.log("Seeding RenovaFlow demo data…");

  await prisma.activityEvent.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.update.deleteMany();
  await prisma.file.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.taskNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("demo1234", 12);

  const org = await prisma.organization.create({
    data: {
      name: "Lakeside Renovations",
      email: "office@lakesiderenovations.example",
      phone: "+1 (555) 010-2200",
      address: "48 Harbor Dr, Lakeside, OR 97491",
      website: "https://lakesiderenovations.example",
      plan: "Pro",
      budgetWarningThreshold: 80,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@lakeside.example",
      passwordHash,
      name: "Dana Whitfield",
      role: "ADMIN",
      phone: "+1 (555) 010-2201",
    },
  });
  const manager = await prisma.user.create({
    data: {
      email: "marcus@lakeside.example",
      passwordHash,
      name: "Marcus Reed",
      role: "MANAGER",
      phone: "+1 (555) 010-2202",
    },
  });
  const workerA = await prisma.user.create({
    data: {
      email: "sofi@lakeside.example",
      passwordHash,
      name: "Sofía Ramírez",
      role: "WORKER",
    },
  });
  const workerB = await prisma.user.create({
    data: {
      email: "gabe@lakeside.example",
      passwordHash,
      name: "Gabe Okafor",
      role: "WORKER",
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: org.id, userId: admin.id, role: "ADMIN", isActive: true },
      { organizationId: org.id, userId: manager.id, role: "MANAGER", isActive: true },
      { organizationId: org.id, userId: workerA.id, role: "WORKER", isActive: true },
      { organizationId: org.id, userId: workerB.id, role: "WORKER", isActive: true },
    ],
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "ben.foster@example.com",
      passwordHash,
      name: "Ben Foster",
      role: "CUSTOMER",
      phone: "+1 (555) 010-3344",
    },
  });
  const customerRecord = await prisma.customer.create({
    data: {
      organizationId: org.id,
      userId: customerUser.id,
      name: "Ben Foster",
      email: "ben.foster@example.com",
      phone: "+1 (555) 010-3344",
      address: "210 Alder Creek Rd, Lakeside, OR 97491",
    },
  });

  const projectKitchen = await prisma.project.create({
    data: {
      organizationId: org.id,
      customerId: customerRecord.id,
      managerId: manager.id,
      createdById: admin.id,
      name: "Alder Creek Kitchen Remodel",
      address: "210 Alder Creek Rd, Lakeside, OR 97491",
      description:
        "Full kitchen remodel — demo, new cabinetry, quartz counters, tile backsplash, and refreshed electrical.",
      status: "ACTIVE",
      progress: 45,
      initialBudget: 42000,
      currentApprovedBudget: 44800,
      startDate: new Date("2026-03-02"),
      expectedCompletionDate: new Date("2026-06-20"),
    },
  });

  const projectDeck = await prisma.project.create({
    data: {
      organizationId: org.id,
      customerId: customerRecord.id,
      managerId: manager.id,
      createdById: admin.id,
      name: "Riverside Deck Replacement",
      address: "88 Riverside Ave, Lakeside, OR 97491",
      description:
        "Replace aging deck with composite decking, new railings, and stair lighting.",
      status: "PLANNING",
      progress: 10,
      initialBudget: 18500,
      currentApprovedBudget: 18500,
      startDate: new Date("2026-07-06"),
      expectedCompletionDate: new Date("2026-08-15"),
    },
  });

  const [projId, deckId] = [projectKitchen.id, projectDeck.id];

  const addCategories = async (projectId, estimated) => {
    const rows = [];
    for (const c of BUDGET_CATEGORIES) {
      rows.push(
        await prisma.budgetCategory.create({
          data: {
            organizationId: org.id,
            projectId,
            name: c.label,
            type: c.key,
            sortOrder: c.sort,
            estimatedAmount: estimated[c.key] ?? 0,
            approvedAmount: 0,
          },
        })
      );
    }
    return rows;
  };

  const kitchenCats = await addCategories(projId, {
    MATERIALS: 14000,
    LABOR: 18000,
    PERMITS: 900,
    SUBCONTRACTORS: 6500,
    OTHER: 2600,
  });
  const deckCats = await addCategories(deckId, {
    MATERIALS: 7600,
    LABOR: 5400,
    PERMITS: 400,
    SUBCONTRACTORS: 3800,
    OTHER: 1300,
  });

  const taskKitchenPool = await prisma.task.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      creatorId: manager.id,
      assigneeId: workerA.id,
      title: "Kitchen pool & drainage rough-in",
      description: "Plumbing rough-in for sink and dishwasher before counters land.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      startDate: new Date("2026-03-23"),
      dueDate: new Date("2026-04-05"),
    },
  });
  const taskDemolition = await prisma.task.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      creatorId: manager.id,
      assigneeId: workerB.id,
      title: "Demo existing kitchen",
      description: "Remove old cabinets, countertops and flooring. Haul away debris.",
      priority: "MEDIUM",
      status: "DONE",
      startDate: new Date("2026-03-02"),
      dueDate: new Date("2026-03-06"),
      completedAt: new Date("2026-03-05"),
    },
  });
  const taskTrim = await prisma.task.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      creatorId: manager.id,
      assigneeId: workerA.id,
      title: "Cabinets & hardware install",
      description: "Install all new cabinetry, drawer slides, and handles.",
      priority: "HIGH",
      status: "TODO",
      startDate: new Date("2026-04-12"),
      dueDate: new Date("2026-04-18"),
    },
  });
  const taskPermits = await prisma.task.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      creatorId: manager.id,
      assigneeId: workerB.id,
      title: "Pull electrical permit",
      description: "Submit permit for updated kitchen circuit.",
      priority: "URGENT",
      status: "BLOCKED",
      startDate: new Date("2026-03-09"),
      dueDate: new Date("2026-03-13"),
    },
  });
  const taskDeckEng = await prisma.task.create({
    data: {
      organizationId: org.id,
      projectId: deckId,
      creatorId: manager.id,
      assigneeId: workerA.id,
      title: "Deck structural assessment",
      description: "Verify joist spacing and footings support composite decking.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      startDate: new Date("2026-07-06"),
      dueDate: new Date("2026-07-10"),
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { organizationId: org.id, projectId: projId, userId: workerA.id, role: "WORKER" },
      { organizationId: org.id, projectId: projId, userId: workerB.id, role: "WORKER" },
      { organizationId: org.id, projectId: deckId, userId: workerA.id, role: "WORKER" },
    ],
  });

  await prisma.taskNote.createMany({
    data: [
      { taskId: taskDemolition.id, authorId: workerB.id, body: "House cleared, disposal pickup scheduled for Friday." },
      { taskId: taskKitchenPool.id, authorId: workerA.id, body: "Lines dropped for the island; waiting on fixture delivery." },
      { taskId: taskPermits.id, authorId: workerB.id, body: "City inspector flagged the panel upsize. Resubmitting drawings." },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { organizationId: org.id, projectId: projId, categoryId: kitchenCats[0].id, createdById: manager.id, description: "Cabinetry deposit (maple, soft-close)", actualAmount: 6800, estimatedAmount: 7200, vendor: "Lakeside Cabinet Co.", date: new Date("2026-03-10"), notes: "50% deposit on final cabinet order" },
      { organizationId: org.id, projectId: projId, categoryId: kitchenCats[3].id, createdById: manager.id, description: "Electrician — run 3 new circuits", actualAmount: 1950, estimatedAmount: 1800, vendor: "Reed Electrical", date: new Date("2026-03-25") },
      { organizationId: org.id, projectId: projId, categoryId: kitchenCats[2].id, createdById: admin.id, description: "Kitchen remodel permit", actualAmount: 320, estimatedAmount: 350, vendor: "City of Lakeside", date: new Date("2026-03-04") },
      { organizationId: org.id, projectId: deckId, categoryId: deckCats[3].id, createdById: manager.id, description: "Structural engineer consult", actualAmount: 850, estimatedAmount: 800, vendor: "Northwest Structural", date: new Date("2026-07-08") },
    ],
  });

  const crPending = await prisma.changeRequest.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      budgetCategoryId: kitchenCats[0].id,
      title: "Upgrade to quartz countertop",
      reason:
        "After reviewing the sample, the island countertop was upgraded to quartz. Slightly higher material cost for a long-wearing surface.",
      costImpact: 2800,
      scheduleImpactDays: 3,
      scheduleImpactNote: "Fabricator lead time +3 days before backsplash install.",
      status: "PENDING_APPROVAL",
      requesterId: manager.id,
      submittedAt: new Date("2026-04-02"),
    },
  });
  await prisma.changeRequest.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      budgetCategoryId: kitchenCats[3].id,
      title: "Additional canned lights in pantry",
      reason:
        "Extra recessed lighting requested for the walk-in pantry. Two additional fixtures plus wiring.",
      costImpact: 0,
      scheduleImpactDays: 0,
      status: "APPROVED",
      requesterId: manager.id,
      submittedAt: new Date("2026-03-18"),
      decisionAt: new Date("2026-03-20"),
      customerComment: "Looks good, go ahead.",
    },
  });
  await prisma.changeRequest.create({
    data: {
      organizationId: org.id,
      projectId: deckId,
      budgetCategoryId: deckCats[0].id,
      title: "GripStep railing upgrade",
      reason: "Customer requested upgraded tubular railings matching the house trim.",
      costImpact: 1400,
      scheduleImpactDays: 2,
      status: "PENDING_APPROVAL",
      requesterId: manager.id,
      submittedAt: new Date("2026-07-11"),
    },
  });

  const updateFoundation = await prisma.update.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      authorId: manager.id,
      title: "Week 5 — demo complete, framing checked",
      body:
        "Demolition is done and the walls are prepped. The city signed off on the electrical plan and we pulled the permit. Countertop fabricator confirmed the quartz upgrade is on file — week 6 kicks off with rough plumbing.",
      visibility: "CUSTOMER_VISIBLE",
      isPublished: true,
      publishedAt: new Date("2026-04-01T17:30:00Z"),
    },
  });
  const updateCabinets = await prisma.update.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      authorId: manager.id,
      title: "Cabinets arrived — install starts Monday",
      body:
        "The maple cabinets landed at the shop this week. Install begins Monday and should take about six days. After that we move to countertops and backsplash.",
      visibility: "CUSTOMER_VISIBLE",
      isPublished: true,
      publishedAt: new Date("2026-04-08T16:00:00Z"),
    },
  });
  await prisma.update.create({
    data: {
      organizationId: org.id,
      projectId: deckId,
      authorId: manager.id,
      title: "Deck project kicked off",
      body:
        "Structural assessment is underway. We'll lock the material order once the engineer's report is back, then submit the deck permit.",
      visibility: "CUSTOMER_VISIBLE",
      isPublished: true,
      publishedAt: new Date("2026-07-08T15:00:00Z"),
    },
  });
  await prisma.update.create({
    data: {
      organizationId: org.id,
      projectId: projId,
      authorId: manager.id,
      title: "Internal — appliance scheduling",
      body: "Coordinate appliance delivery with the customer before cabinet install week.",
      visibility: "INTERNAL",
      isPublished: false,
    },
  });

  const commenter = await prisma.comment.create({
    data: {
      organizationId: org.id,
      updateId: updateFoundation.id,
      authorId: customerUser.id,
      body: "Thanks for the update — the place is looking great so far!",
    },
  });
  await prisma.comment.create({
    data: {
      organizationId: org.id,
      updateId: updateCabinets.id,
      authorId: customerUser.id,
      body: "Excited to see the cabinets in!",
    },
  });

  await prisma.notificationPreference.createMany({
    data: [
      { userId: admin.id, type: "TASK_ASSIGNED", enabled: true },
      { userId: admin.id, type: "DECISION_SUBMITTED", enabled: true },
      { userId: manager.id, type: "TASK_STATUS_CHANGED", enabled: true },
      { userId: manager.id, type: "UPDATE_PUBLISHED", enabled: true },
      { userId: workerA.id, type: "TASK_ASSIGNED", enabled: true },
      { userId: customerUser.id, type: "UPDATE_PUBLISHED", enabled: true },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { organizationId: org.id, projectId: projId, userId: admin.id, type: "DECISION_SUBMITTED", title: "Ben Foster approved \"Additional canned lights in pantry\"", body: `Budget increased by $0.00.`, link: `/app/projects/${projId}/budget` },
      { organizationId: org.id, projectId: deckId, userId: admin.id, type: "DECISION_SUBMITTED", title: "Ben Foster is reviewing 1 change request", body: `GripStep railing upgrade (+$1,400.00)`, link: `/app/projects/${deckId}/budget` },
      { organizationId: org.id, projectId: projId, userId: customerUser.id, type: "UPDATE_PUBLISHED", title: "Cabinets arrived — install starts Monday", body: projectKitchen.name, link: `/portal/projects/${projId}/updates` },
      { organizationId: org.id, projectId: projId, userId: workerA.id, type: "TASK_STATUS_CHANGED", title: "Task status changed", body: `"Kitchen pool & drainage rough-in" → in progress`, link: `/app/projects/${projId}/tasks` },
    ],
  });

  await prisma.activityEvent.createMany({
    data: [
      { organizationId: org.id, projectId: projId, actorId: manager.id, type: "PROJECT_CREATED", title: `Project "${projectKitchen.name}" created` },
      { organizationId: org.id, projectId: projId, actorId: manager.id, type: "TASK_CREATED", title: "Created task \"Kitchen pool & drainage rough-in\"" },
      { organizationId: org.id, projectId: projId, actorId: workerB.id, type: "TASK_COMPLETED", title: "Completed task \"Demo existing kitchen\"" },
      { organizationId: org.id, projectId: projId, actorId: manager.id, type: "CHANGE_REQUEST_CREATED", title: "Change request \"Upgrade to quartz countertop\" submitted", metadata: { impact: crPending.costImpact } },
      { organizationId: org.id, projectId: projId, actorId: customerUser.id, type: "DECISION_SUBMITTED", title: "Ben Foster approved \"Additional canned lights in pantry\"" },
      { organizationId: org.id, projectId: projId, actorId: manager.id, type: "UPDATE_PUBLISHED", title: "Published update \"Week 5 — demo complete, framing checked\"" },
      { organizationId: org.id, projectId: projId, actorId: customerUser.id, type: "CUSTOMER_COMMENTED", title: "Ben Foster commented on \"Week 5 — demo complete, framing checked\"" },
      { organizationId: org.id, projectId: deckId, actorId: admin.id, type: "PROJECT_CREATED", title: `Project "${projectDeck.name}" created` },
    ],
  });

  console.log("Done. Demo credentials:");
  console.log("  Admin    → admin@lakeside.example   / demo1234");
  console.log("  Manager  → marcus@lakeside.example  / demo1234");
  console.log("  Worker   → sofi@lakeside.example    / demo1234");
  console.log("  Worker   → gabe@lakeside.example    / demo1234");
  console.log("  Customer → ben.foster@example.com   / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
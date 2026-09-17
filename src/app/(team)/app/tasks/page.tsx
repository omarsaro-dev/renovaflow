import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { TaskBoard } from "@/components/tasks/task-board";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectTasksFilter } from "@/components/tasks/project-tasks-filter";

export const metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";
  const { organizationId } = ctx;

  const projectFilter = searchParams.project;

  const whereTasks: Prisma.TaskWhereInput = isWorker ? { assigneeId: ctx.user.id } : { organizationId };
  if (projectFilter && projectFilter !== "ALL") {
    whereTasks.projectId = projectFilter;
  }

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: whereTasks,
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { notes: true, files: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: isWorker ? { in: ctx.projectIds } : organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const teamMembers = isWorker
    ? []
    : (
        await prisma.organizationMember.findMany({
          where: { organizationId, isActive: true },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { user: { name: "asc" } },
        })
      ).map((m) => ({ id: m.userId, name: m.user.name }));

  const boardTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignee: t.assignee,
    projectId: t.projectId,
    projectName: t.project.name,
    noteCount: t._count.notes,
    photoCount: t._count.files,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
            {isWorker ? "My work" : "Tasks"}
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {isWorker
              ? `${tasks.filter((t) => t.status !== "DONE").length} open task${tasks.filter((t) => t.status !== "DONE").length !== 1 ? "s" : ""} assigned to you.`
              : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} across ${projects.length} project${projects.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <ProjectTasksFilter projects={projects} isWorker={isWorker} />
          <div className="mt-4">
            <TaskBoard
              tasks={boardTasks}
              projectId={projects[0]?.id ?? ""}
              projectName="All tasks"
              canEdit={!isWorker}
              isWorker={isWorker}
              teamMembers={teamMembers}
              showCreate={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
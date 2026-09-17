import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { TaskBoard } from "@/components/tasks/task-board";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Tasks" };

export default async function ProjectTasksPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!project) notFound();
  if (isWorker && !ctx.projectIds.includes(project.id)) notFound();

  const [tasks, teamMembers] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: project.id },
      include: {
        assignee: { select: { id: true, name: true } },
        _count: { select: { notes: true, files: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const boardTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignee: t.assignee,
    projectId: project.id,
    projectName: project.name,
    noteCount: t._count.notes,
    photoCount: t._count.files,
  }));

  const done = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div>
      <Card className="border-transparent bg-transparent shadow-none">
        <CardContent className="p-0">
          <p className="mb-4 text-[14px] text-ink-muted">
            {done} of {tasks.length} task{tasks.length !== 1 ? "s" : ""} completed
            {tasks.length > 0 && ` (${Math.round((done / tasks.length) * 100)}%)`}
          </p>
          <TaskBoard
            tasks={boardTasks}
            projectId={project.id}
            projectName={project.name}
            canEdit={!isWorker}
            isWorker={isWorker}
            teamMembers={teamMembers.map((m) => ({ id: m.userId, name: m.user.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
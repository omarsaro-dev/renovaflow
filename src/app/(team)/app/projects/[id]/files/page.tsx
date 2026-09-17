import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { FilesGrid } from "@/components/files/files-grid";

export const metadata = { title: "Files" };

export default async function ProjectFilesPage({ params }: { params: { id: string } }) {
  const ctx = await requireTeam();
  const isWorker = ctx.teamRole === "WORKER";

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!project) notFound();
  if (isWorker && !ctx.projectIds.includes(project.id)) notFound();

  const files = await prisma.file.findMany({
    where: { projectId: project.id },
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <FilesGrid
      files={files.map((f) => ({
        id: f.id,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        isImage: f.isImage,
        url: f.url,
        thumbnailUrl: f.thumbnailUrl,
        visibility: f.visibility,
        description: f.description,
        createdAt: f.createdAt.toISOString(),
        uploader: f.uploader ? { id: f.uploader.id, name: f.uploader.name } : null,
      }))}
      projectId={project.id}
      projectName={project.name}
      canUpload={!isWorker}
      isWorker={isWorker}
      currentUserId={ctx.user.id}
    />
  );
}
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";
import { getServerAuthContext, forbidden, notFound } from "@/lib/permissions";
import { canAccessFile, streamFile } from "@/lib/files";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getServerAuthContext();
    if (!ctx) forbidden();

    const file = await prisma.file.findFirst({ where: { storedName: params.id } });
    if (!file) notFound();
    if (!(await canAccessFile(ctx, file))) forbidden();

    const response = await streamFile(file, "original");
    if (!response) notFound();
    return response;
  } catch (error) {
    return apiError(error);
  }
}
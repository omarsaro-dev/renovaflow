import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { prisma } from "./db";
import { invalidInput } from "./permissions";
import type { AuthContext } from "./permissions";
import type { File as FileRow, FileVisibility } from "@prisma/client";

const ALLOWED_MIME: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "text/csv": ["csv"],
  "text/plain": ["txt"],
  "application/json": ["json"],
};

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 25) * 1024 * 1024;
const THUMBNAIL_MAX_DIMENSION = 640;

function dirs() {
  const root = process.cwd();
  return {
    uploads: path.resolve(root, process.env.UPLOAD_DIR || "./data/uploads"),
    thumbnails: path.resolve(root, process.env.THUMB_DIR || "./data/thumbnails"),
  };
}

export async function ensureStorageDirs() {
  const { uploads, thumbnails } = dirs();
  await fs.mkdir(uploads, { recursive: true });
  await fs.mkdir(thumbnails, { recursive: true });
}

function extensionFor(mime: string) {
  return ALLOWED_MIME[mime]?.[0] ?? "bin";
}

export function validateUpload(file: { type: string; size: number }) {
  if (!ALLOWED_MIME[file.type]) {
    invalidInput("This file type is not supported.", { mime: file.type });
  }
  if (file.size > MAX_FILE_SIZE) {
    invalidInput("The file is too large.", {
      max: Math.round(MAX_FILE_SIZE / (1024 * 1024)),
      unit: "MB",
    });
  }
  if (file.size <= 0) {
    invalidInput("The file is empty.");
  }
}

/**
 * Writes an uploaded File to protected storage and returns the file row.
 * Storage lives outside `public/` so URLs can never be guessed — every
 * request is served through an authenticated route handler.
 */
export async function saveUploadedFile(input: {
  uploaderId: string;
  organizationId: string;
  file: File;
  projectId?: string;
  taskId?: string;
  expenseId?: string;
  changeRequestId?: string;
  updateId?: string;
  visibility?: FileVisibility;
  description?: string;
}): Promise<FileRow> {
  validateUpload(input.file);
  await ensureStorageDirs();

  const ext = extensionFor(input.file.type);
  const storedName = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { uploads, thumbnails } = dirs();

  const filePath = path.join(uploads, storedName);
  await fs.writeFile(filePath, buffer);

  const isImage = IMAGE_MIME.has(input.file.type);
  let thumbnailUrl: string | null = null;

  if (isImage) {
    const thumbName = `${randomUUID()}.jpg`;
    const thumbPath = path.join(thumbnails, thumbName);
    try {
      await sharp(buffer)
        .rotate()
        .resize({
          width: THUMBNAIL_MAX_DIMENSION,
          height: Math.round(THUMBNAIL_MAX_DIMENSION * 0.72),
          fit: "cover",
        })
        .jpeg({ quality: 82 })
        .toFile(thumbPath);
      thumbnailUrl = `/api/files/${thumbName}/thumb`;
    } catch {
      thumbnailUrl = null;
    }
  }

  return prisma.file.create({
    data: {
      organizationId: input.organizationId,
      uploaderId: input.uploaderId,
      projectId: input.projectId,
      taskId: input.taskId,
      expenseId: input.expenseId,
      changeRequestId: input.changeRequestId,
      updateId: input.updateId,
      originalName: input.file.name.replace(/[/\\]/g, "-"),
      storedName,
      mimeType: input.file.type,
      size: buffer.length,
      url: `/api/files/${storedName}/content`,
      thumbnailUrl,
      visibility: input.visibility ?? "INTERNAL",
      isImage,
      description: input.description ?? null,
    },
  });
}

export function getStoredPath(file: FileRow, variant: "original" | "thumb") {  const { uploads, thumbnails } = dirs();
  if (variant === "thumb") {
    const name = file.thumbnailUrl?.split("/").pop();
    return name ? path.join(thumbnails, name) : null;
  }
  return path.join(uploads, file.storedName);
}

/**
 * Authorization for file downloads. Enforces organization isolation plus
 * worker (project membership) and customer (explicit customer-visible) rules.
 */
export async function canAccessFile(ctx: AuthContext, file: FileRow): Promise<boolean> {
  if (ctx.organizationId !== file.organizationId) return false;
  if (!file.projectId) {
    if (ctx.isCustomer) return false;
  }

  if (ctx.isCustomer) {
    if (file.visibility !== "CUSTOMER_VISIBLE") return false;
    if (!ctx.customerRecord) return false;
    if (!file.projectId) return false;
    const project = await prisma.project.findFirst({
      where: { id: file.projectId, customerId: ctx.customerRecord.id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    return !!project;
  }

  if (ctx.teamRole === "ADMIN" || ctx.teamRole === "MANAGER") return true;

  if (ctx.teamRole === "WORKER") {
    if (file.projectId && ctx.projectIds.includes(file.projectId)) return true;
    return false;
  }

  return false;
}

export async function streamFile(file: FileRow, variant: "original" | "thumb") {
  const p = getStoredPath(file, variant);
  if (!p) return null;
  const buffer = await fs.readFile(p);

  const headers = new Headers();
  headers.set("Content-Type", variant === "thumb" ? "image/jpeg" : file.mimeType);
  headers.set("Content-Length", String(buffer.length));
  headers.set("Cache-Control", "private, max-age=31536000");
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`);
  return new Response(buffer, { headers });
}

export async function deleteStoredFile(file: FileRow) {
  const original = getStoredPath(file, "original");
  if (original) await fs.unlink(original).catch(() => {});
  if (file.thumbnailUrl) {
    const thumb = getStoredPath(file, "thumb");
    if (thumb) await fs.unlink(thumb).catch(() => {});
  }
  await prisma.file.delete({ where: { id: file.id } }).catch(() => {});
}

export async function canAccessFileRecord(ctx: AuthContext, fileId: string): Promise<FileRow | null> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return null;
  if (!(await canAccessFile(ctx, file))) return null;
  return file as FileRow;
}

export type { FileRow };
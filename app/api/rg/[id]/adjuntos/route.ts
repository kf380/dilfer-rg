import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: rgId } = await params;

  const adjuntos = await prisma.rGAdjunto.findMany({
    where: { rgId },
    select: { id: true, nombre: true, mimeType: true, tamano: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(adjuntos);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const { id: rgId } = await params;

  const rg = await prisma.rG.findUnique({ where: { id: rgId }, select: { estado: true, responsableId: true } });
  if (!rg) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (user.rol !== "Admin" && rg.responsableId !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Formato inválido" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Archivo muy grande (máx 10MB)" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Solo PDF, JPG, PNG o WEBP" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const adjunto = await prisma.rGAdjunto.create({
    data: { rgId, nombre: file.name, mimeType: file.type, tamano: file.size, contenido: buffer },
    select: { id: true, nombre: true, mimeType: true, tamano: true, createdAt: true },
  });

  return NextResponse.json(adjunto, { status: 201 });
}

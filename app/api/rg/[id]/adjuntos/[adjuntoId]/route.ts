import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; adjuntoId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { adjuntoId } = await params;

  const adjunto = await prisma.rGAdjunto.findUnique({ where: { id: adjuntoId } });
  if (!adjunto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return new NextResponse(adjunto.contenido as unknown as BodyInit, {
    headers: {
      "Content-Type": adjunto.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(adjunto.nombre)}"`,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; adjuntoId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const { id: rgId, adjuntoId } = await params;

  const rg = await prisma.rG.findUnique({ where: { id: rgId }, select: { responsableId: true } });
  if (!rg) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (user.rol !== "Admin" && rg.responsableId !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await prisma.rGAdjunto.delete({ where: { id: adjuntoId } });
  return NextResponse.json({ ok: true });
}

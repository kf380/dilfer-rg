import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TRANSICIONES: Record<string, string[]> = {
  Borrador: ["Enviado"],
  Enviado: ["Aprobado", "Rechazado"],
  Aprobado: ["Pagado"],
  Rechazado: [],
  Pagado: [],
};

const ACCIONES: Record<string, string> = {
  Enviado: "envió",
  Aprobado: "aprobó",
  Rechazado: "rechazó",
  Pagado: "marcó como pagada",
};

const EstadoSchema = z.object({
  estado: z.enum(["Enviado", "Aprobado", "Rechazado", "Pagado"]),
  comentario: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const { id } = await params;

  const parsed = EstadoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  const { estado: nuevoEstado, comentario } = parsed.data;

  const rg = await prisma.rG.findUnique({ where: { id }, select: { estado: true, responsableId: true } });
  if (!rg) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const validas = TRANSICIONES[rg.estado] ?? [];
  if (!validas.includes(nuevoEstado)) {
    return NextResponse.json({ error: `No se puede pasar de ${rg.estado} a ${nuevoEstado}` }, { status: 400 });
  }

  if (nuevoEstado === "Enviado" && user.rol !== "Admin" && rg.responsableId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (["Aprobado", "Rechazado", "Pagado"].includes(nuevoEstado) && user.rol !== "Admin") {
    return NextResponse.json({ error: "Solo administradores pueden aprobar, rechazar o marcar como pagada" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.rG.update({ where: { id }, data: { estado: nuevoEstado } }),
    prisma.rGHistorial.create({
      data: {
        rgId: id,
        usuarioId: user.id,
        accion: ACCIONES[nuevoEstado],
        estadoAnterior: rg.estado,
        estadoNuevo: nuevoEstado,
        comentario: comentario || null,
      },
    }),
  ]);

  return NextResponse.json({ estado: nuevoEstado });
}

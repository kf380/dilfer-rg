import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TRANSICIONES: Record<string, string[]> = {
  Borrador:      ["Creado"],
  Creado:        ["Autorizado", "En Revisión"],
  Autorizado:    ["Aprobado", "En Revisión"],
  Aprobado:      ["Procesado"],
  Procesado:     ["Pagado"],
  "En Revisión": ["Creado"],
  // backward compat con RGs viejos
  Enviado:       ["Autorizado", "En Revisión"],
  Rechazado:     [],
  Pagado:        [],
};

const ACCIONES: Record<string, string> = {
  Creado:        "creó",
  Autorizado:    "autorizó",
  Aprobado:      "aprobó",
  "En Revisión": "puso en revisión",
  Procesado:     "procesó",
  Pagado:        "marcó como pagada",
  Enviado:       "envió",
  Rechazado:     "rechazó",
};

const EstadoSchema = z.object({
  estado: z.enum(["Creado", "Autorizado", "Aprobado", "Procesado", "Pagado", "En Revisión", "Enviado"]),
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

  const isAdmin = user.rol === "Admin";
  const isTesoreria = user.rol === "Tesorería";
  const isOwner = rg.responsableId === user.id;

  if (nuevoEstado === "Creado" && !isAdmin && !isOwner) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (nuevoEstado === "Pagado" && !isAdmin && !isTesoreria) {
    return NextResponse.json({ error: "Solo Tesorería o administradores pueden marcar como pagada" }, { status: 403 });
  }
  if (!["Creado", "Pagado"].includes(nuevoEstado) && !isAdmin) {
    return NextResponse.json({ error: "Solo administradores pueden avanzar el estado" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.rG.update({ where: { id }, data: { estado: nuevoEstado } }),
    prisma.rGHistorial.create({
      data: {
        rgId: id,
        usuarioId: user.id,
        accion: ACCIONES[nuevoEstado] ?? nuevoEstado,
        estadoAnterior: rg.estado,
        estadoNuevo: nuevoEstado,
        comentario: comentario || null,
      },
    }),
  ]);

  return NextResponse.json({ estado: nuevoEstado });
}

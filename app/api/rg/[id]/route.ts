import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CCDistribucionSchema = z.object({
  centroId: z.string(),
  nombre: z.string(),
  porcentaje: z.string(),
});

const LineaEditSchema = z.object({
  proveedorId: z.string().optional(),
  proveedorTexto: z.string().optional(),
  comprobante: z.string().optional(),
  fechaComprobante: z.string().optional(),
  detalleGasto: z.string().min(1, "Detalle requerido"),
  cuentaId: z.string().optional(),
  cuentaTexto: z.string().optional(),
  centrosCostoDistribucion: z.array(CCDistribucionSchema).optional(),
  monto: z.number().positive("Monto debe ser positivo"),
  formaPago: z.enum(["Efectivo", "Transferencia", "E-cheq", "Débito automático"]),
  cbu: z.string().optional(),
  alias: z.string().optional(),
  titular: z.string().optional(),
  mail: z.string().optional(),
  whatsapp: z.string().optional(),
  compraMercaderia: z.boolean().optional(),
  fechaPagoSolicitada: z.string().optional(),
  notas: z.string().optional(),
});

const RGPutSchema = z.object({
  fecha: z.string().min(1),
  area: z.string().optional(),
  lineas: z.array(LineaEditSchema).min(1),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const { id } = await params;

  const rg = await prisma.rG.findUnique({ where: { id }, select: { responsableId: true, estado: true } });
  if (!rg) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (rg.estado !== "Borrador") return NextResponse.json({ error: "Solo se puede editar en estado Borrador" }, { status: 400 });
  if (user.rol !== "Admin" && rg.responsableId !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = RGPutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { fecha, area, lineas } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.rGLinea.deleteMany({ where: { rgId: id } });

    const result = await tx.rG.update({
      where: { id },
      data: {
        fecha: new Date(fecha),
        area: area || undefined,
        lineas: {
          create: lineas.map((l, i) => ({
            linea: i + 1,
            proveedorId: l.proveedorId || null,
            proveedorTexto: l.proveedorTexto || null,
            comprobante: l.comprobante || null,
            fechaComprobante: l.fechaComprobante ? new Date(l.fechaComprobante) : null,
            detalleGasto: l.detalleGasto,
            cuentaId: l.cuentaId || null,
            cuentaTexto: l.cuentaTexto || null,
            centroCostoId: l.centrosCostoDistribucion?.[0]?.centroId || null,
            centroCostoTexto: l.centrosCostoDistribucion?.[0]?.nombre || null,
            centrosCostoDistribucion: l.centrosCostoDistribucion?.length ? l.centrosCostoDistribucion : undefined,
            monto: l.monto,
            formaPago: l.formaPago,
            cbu: l.cbu || null,
            alias: l.alias || null,
            titular: l.titular || null,
            mail: l.mail || null,
            whatsapp: l.whatsapp || null,
            compraMercaderia: l.compraMercaderia ?? false,
            fechaPagoSolicitada: l.fechaPagoSolicitada ? new Date(l.fechaPagoSolicitada) : null,
            notas: l.notas || null,
          })),
        },
      },
      include: { empresa: true, lineas: true },
    });

    await tx.rGHistorial.create({
      data: { rgId: id, usuarioId: user.id, accion: "editó", estadoAnterior: "Borrador", estadoNuevo: "Borrador" },
    });

    return result;
  });

  return NextResponse.json({ rg: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.rol !== "Admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  const { id } = await params;

  await prisma.rG.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

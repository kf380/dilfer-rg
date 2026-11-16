import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildNroRG } from "@/lib/utils";

const CCDistribucionSchema = z.object({
  centroId: z.string(),
  nombre: z.string(),
  porcentaje: z.string(),
});

const LineaSchema = z.object({
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

const RGPostSchema = z.object({
  empresaId: z.string().min(1),
  fecha: z.string().min(1),
  area: z.string().optional(),
  lineas: z.array(LineaSchema).min(1, "Al menos una línea requerida"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = req.nextUrl;
  const empresaId = searchParams.get("empresaId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const estado = searchParams.get("estado");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  const where: any = user.rol === "Admin"
    ? empresaId ? { empresaId } : {}
    : { responsableId: user.id };

  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}),
    };
  }

  const [rgs, total] = await Promise.all([
    prisma.rG.findMany({
      where,
      include: { empresa: true, responsable: true, lineas: true },
      orderBy: { fechaRegistro: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rG.count({ where }),
  ]);

  return NextResponse.json({ rgs, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const raw = await req.json();
  const parsed = RGPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { empresaId, fecha, area, lineas } = parsed.data;

  // Non-admin users can only create RGs for their own company
  if (user.rol !== "Admin" && user.empresaId && user.empresaId !== empresaId) {
    return NextResponse.json({ error: "No autorizado para esta empresa" }, { status: 403 });
  }

  // Atomic: increment counter + create RG in one transaction
  const rg = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.update({
      where: { id: empresaId },
      data: { ultimoNumero: { increment: 1 } },
    });

    const nroRG = buildNroRG(empresa.razonSocial, empresa.ultimoNumero);

    const rg = await tx.rG.create({
      data: {
        nroRG,
        empresaId,
        fecha: new Date(fecha),
        responsableId: user.id,
        area: area || user.area,
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
      data: { rgId: rg.id, usuarioId: user.id, accion: "creó", estadoAnterior: null, estadoNuevo: "Borrador" },
    });

    return rg;
  });

  return NextResponse.json({ rg });
}

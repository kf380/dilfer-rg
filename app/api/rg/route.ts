import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildNroRG } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = req.nextUrl;
  const empresaId = searchParams.get("empresaId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where = user.rol === "Admin"
    ? empresaId ? { empresaId } : {}
    : { responsableId: user.id };

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

  const body = await req.json();
  const { empresaId, fecha, area, lineas } = body;

  if (!empresaId || !fecha || !lineas?.length) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Auto-number: increment per empresa
  const empresa = await prisma.empresa.update({
    where: { id: empresaId },
    data: { ultimoNumero: { increment: 1 } },
  });

  const nroRG = buildNroRG(empresa.razonSocial, empresa.ultimoNumero);

  const rg = await prisma.rG.create({
    data: {
      nroRG,
      empresaId,
      fecha: new Date(fecha),
      responsableId: user.id,
      area: area || user.area,
      lineas: {
        create: lineas.map((l: any, i: number) => ({
          linea: i + 1,
          proveedorId: l.proveedorId || null,
          proveedorTexto: l.proveedorTexto || null,
          comprobante: l.comprobante || null,
          fechaComprobante: l.fechaComprobante ? new Date(l.fechaComprobante) : null,
          detalleGasto: l.detalleGasto,
          cuentaId: l.cuentaId || null,
          cuentaTexto: l.cuentaTexto || null,
          centroCostoId: l.centroCostoId || null,
          centroCostoTexto: l.centroCostoTexto || null,
          monto: parseFloat(l.monto),
          formaPago: l.formaPago,
          cbu: l.cbu || null,
          alias: l.alias || null,
          titular: l.titular || null,
          mail: l.mail || null,
          whatsapp: l.whatsapp || null,
          compraMercaderia: l.compraMercaderia ?? false,
          fechaPagoSolicitada: l.fechaPagoSolicitada ? new Date(l.fechaPagoSolicitada) : null,
          notas: l.notas || null,
          fechaEstimadaPago: l.fechaEstimadaPago ? new Date(l.fechaEstimadaPago) : null,
        })),
      },
    },
    include: { empresa: true, lineas: true },
  });

  return NextResponse.json({ rg });
}

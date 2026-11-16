import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function esc(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = req.nextUrl;
  const empresaId = searchParams.get("empresaId") ?? undefined;

  const where = user.rol === "Admin"
    ? empresaId ? { empresaId } : {}
    : { responsableId: user.id };

  const rgs = await prisma.rG.findMany({
    where,
    include: {
      empresa: true,
      responsable: true,
      lineas: {
        orderBy: { linea: "asc" },
        include: { cuenta: true, centroCosto: true, proveedor: true },
      },
    },
    orderBy: { fechaRegistro: "desc" },
  });

  const headers = [
    "N° RG", "Empresa", "Fecha", "Responsable", "Área",
    "Línea", "Proveedor", "Comprobante", "Fecha Comprobante",
    "Detalle", "Cuenta Código", "Cuenta Nombre", "Centro de Costo",
    "Forma Pago", "Monto", "Fecha Vencimiento", "Notas",
  ];

  const rows: string[][] = [headers];

  for (const rg of rgs) {
    for (const l of rg.lineas) {
      const ccDistrib = Array.isArray((l as any).centrosCostoDistribucion) && (l as any).centrosCostoDistribucion.length > 0
        ? (l as any).centrosCostoDistribucion.map((d: any) => `${d.nombre} ${d.porcentaje}%`).join(" / ")
        : l.centroCosto?.nombre ?? l.centroCostoTexto ?? "";

      rows.push([
        rg.nroRG,
        rg.empresa.razonSocial,
        rg.fecha.toISOString().split("T")[0],
        rg.responsable.nombreCompleto,
        rg.area ?? "",
        String(l.linea),
        l.proveedor?.razonSocial ?? l.proveedorTexto ?? "",
        l.comprobante ?? "",
        l.fechaComprobante ? l.fechaComprobante.toISOString().split("T")[0] : "",
        l.detalleGasto,
        l.cuenta?.codigo ?? l.cuentaTexto ?? "",
        l.cuenta?.nombre ?? "",
        ccDistrib,
        l.formaPago,
        l.monto.toFixed(2),
        l.fechaPagoSolicitada ? l.fechaPagoSolicitada.toISOString().split("T")[0] : "",
        l.notas ?? "",
      ]);
    }
  }

  const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const filename = `rendiciones_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

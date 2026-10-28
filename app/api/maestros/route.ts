import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = req.nextUrl;
  const tipo = searchParams.get("tipo");
  const empresaId = searchParams.get("empresaId");

  switch (tipo) {
    case "empresas":
      const empresas = await prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } });
      return NextResponse.json(empresas);

    case "proveedores":
      const proveedores = await prisma.proveedor.findMany({ where: { activo: true }, orderBy: { razonSocial: "asc" } });
      return NextResponse.json(proveedores);

    case "cuentas":
      if (!empresaId) return NextResponse.json([]);
      const area = searchParams.get("area");
      const cuentas = await prisma.cuentaContable.findMany({
        where: { empresaId },
        orderBy: { codigo: "asc" },
      });
      const filtered = area
        ? cuentas.filter((c) => {
            if (!c.areasHabilitadas) return true;
            return c.areasHabilitadas.split(",").map((a) => a.trim()).some((a) =>
              a.toLowerCase() === area.toLowerCase()
            );
          })
        : cuentas;
      return NextResponse.json(filtered);

    case "centros":
      if (!empresaId) return NextResponse.json([]);
      const centros = await prisma.centroCosto.findMany({
        where: { OR: [{ empresaId }, { empresaId: null }] },
        orderBy: { nombre: "asc" },
      });
      return NextResponse.json(centros);

    case "areas":
      const areas = await prisma.area.findMany({ orderBy: { nombre: "asc" } });
      return NextResponse.json(areas);

    default:
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
}

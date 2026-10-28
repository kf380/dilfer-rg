import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaestroTable from "@/components/MaestroTable";

export default async function CuentasPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const cuentas = await prisma.cuentaContable.findMany({
    include: { empresa: true },
    orderBy: [{ empresa: { razonSocial: "asc" } }, { codigo: "asc" }],
  });

  const rows = cuentas.map((c) => ({
    id: c.id,
    fields: [c.empresa.razonSocial, c.codigo, c.nombre, c.areasHabilitadas ?? "Todas las áreas"],
  }));

  return (
    <MaestroTable
      title="Plan de Cuentas"
      headers={["Empresa", "Código", "Cuenta", "Áreas habilitadas"]}
      rows={rows}
      addHref="/maestros/cuentas/nueva"
    />
  );
}

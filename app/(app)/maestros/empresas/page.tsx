import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaestroTable from "@/components/MaestroTable";

export default async function EmpresasPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const empresas = await prisma.empresa.findMany({ orderBy: { razonSocial: "asc" } });

  const rows = empresas.map((e) => ({
    id: e.id,
    fields: [e.codigo, e.razonSocial, e.cuit ?? "-", e.activa ? "Activa" : "Inactiva"],
  }));

  return (
    <MaestroTable
      title="Empresas"
      headers={["Código", "Razón Social", "CUIT", "Estado"]}
      rows={rows}
      addHref="/maestros/empresas/nueva"
    />
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaestroTable from "@/components/MaestroTable";

export default async function ProveedoresPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const proveedores = await prisma.proveedor.findMany({ orderBy: { razonSocial: "asc" } });

  const rows = proveedores.map((p) => ({
    id: p.id,
    fields: [p.codigo, p.razonSocial, p.cuit ?? "-", p.alias ?? "-", p.activo ? "Activo" : "Inactivo"],
  }));

  return (
    <MaestroTable
      title="Proveedores"
      headers={["Código", "Razón Social", "CUIT", "Alias CBU", "Estado"]}
      rows={rows}
      addHref="/maestros/proveedores/nueva"
    />
  );
}

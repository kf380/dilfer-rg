import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaestroTable from "@/components/MaestroTable";

export default async function CentrosCostoPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const centros = await prisma.centroCosto.findMany({
    include: { empresa: true },
    orderBy: { nombre: "asc" },
  });

  const rows = centros.map((c) => ({
    id: c.id,
    fields: [c.empresa?.razonSocial ?? "TODAS", c.nombre, c.descripcion ?? "-"],
  }));

  return (
    <MaestroTable
      title="Centros de Costo"
      headers={["Empresa", "Nombre", "Descripción"]}
      rows={rows}
      addHref="/maestros/centros-costo/nueva"
    />
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaestroTable from "@/components/MaestroTable";

export default async function AreasPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const areas = await prisma.area.findMany({ orderBy: { nombre: "asc" } });

  const rows = areas.map((a) => ({ id: a.id, fields: [a.nombre] }));

  return (
    <MaestroTable
      title="Áreas"
      headers={["Nombre"]}
      rows={rows}
      addHref="/maestros/areas/nueva"
    />
  );
}

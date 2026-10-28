import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaestroTable from "@/components/MaestroTable";

export default async function UsuariosPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const usuarios = await prisma.usuario.findMany({ orderBy: { username: "asc" } });

  const rows = usuarios.map((u) => ({
    id: u.id,
    fields: [u.username, u.nombreCompleto, u.rol, u.area, u.activo ? "Activo" : "Inactivo"],
  }));

  return (
    <MaestroTable
      title="Usuarios"
      headers={["Usuario", "Nombre", "Rol", "Área", "Estado"]}
      rows={rows}
      addHref="/maestros/usuarios/nueva"
    />
  );
}

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateUsuario } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const { id } = await params;
  const [usuario, areas] = await Promise.all([
    prisma.usuario.findUnique({ where: { id } }),
    prisma.area.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!usuario) notFound();

  const action = updateUsuario.bind(null, id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
        <p className="text-sm text-gray-500 mt-0.5">{usuario.username}</p>
      </div>
      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Usuario" name="username" defaultValue={usuario.username} disabled />
          <FormField label="Nombre completo" name="nombreCompleto" defaultValue={usuario.nombreCompleto} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nueva contraseña" name="password" type="password" placeholder="Dejar vacío para no cambiar" />
          <FormField label="Rol" name="rol" as="select" defaultValue={usuario.rol}>
            <option value="Usuario">Usuario</option>
            <option value="Tesorería">Tesorería</option>
            <option value="Admin">Admin</option>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Área" name="area" as="select" defaultValue={usuario.area} required>
            <option value="">Seleccionar área...</option>
            {areas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
          </FormField>
          <FormField label="Estado" name="activo" as="select" defaultValue={usuario.activo ? "true" : "false"}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </FormField>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/usuarios" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUsuario } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function NuevoUsuarioPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");
  const areas = await prisma.area.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Usuario</h1>
      </div>
      <form action={createUsuario} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Usuario" name="username" required placeholder="ej: jperez" />
          <FormField label="Nombre completo" name="nombreCompleto" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Contraseña" name="password" type="password" required />
          <FormField label="Rol" name="rol" as="select" defaultValue="Usuario">
            <option value="Usuario">Usuario</option>
            <option value="Admin">Admin</option>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Área" name="area" as="select" required>
            <option value="">Seleccionar área...</option>
            {areas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
          </FormField>
          <FormField label="Estado" name="activo" as="select" defaultValue="true">
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

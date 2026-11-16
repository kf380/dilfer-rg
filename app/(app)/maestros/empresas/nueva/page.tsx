import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createEmpresa } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function NuevaEmpresaPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Empresa</h1>
      </div>
      <form action={createEmpresa} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Código" name="codigo" required placeholder="ej: EMP005" />
          <FormField label="Razón Social" name="razonSocial" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="CUIT" name="cuit" placeholder="30-12345678-9" />
          <FormField label="Teléfono" name="telefono" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" name="email" type="email" />
          <FormField label="Estado" name="activa" as="select" defaultValue="true">
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </FormField>
        </div>
        <FormField label="Dirección" name="direccion" />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/empresas" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

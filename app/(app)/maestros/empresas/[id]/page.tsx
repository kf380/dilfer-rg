import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateEmpresa } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function EditarEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const { id } = await params;
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) notFound();

  const action = updateEmpresa.bind(null, id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Empresa</h1>
        <p className="text-sm text-gray-500 mt-0.5">{empresa.codigo}</p>
      </div>
      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Código" name="codigo" defaultValue={empresa.codigo} disabled />
          <FormField label="Razón Social" name="razonSocial" defaultValue={empresa.razonSocial} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="CUIT" name="cuit" defaultValue={empresa.cuit ?? ""} />
          <FormField label="Teléfono" name="telefono" defaultValue={empresa.telefono ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" name="email" type="email" defaultValue={empresa.email ?? ""} />
          <FormField label="Estado" name="activa" as="select" defaultValue={empresa.activa ? "true" : "false"}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </FormField>
        </div>
        <FormField label="Dirección" name="direccion" defaultValue={empresa.direccion ?? ""} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/empresas" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCentroCosto } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function NuevoCentroCostoPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");
  const empresas = await prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Centro de Costo</h1>
      </div>
      <form action={createCentroCosto} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <FormField label="Nombre" name="nombre" required />
        <FormField label="Empresa" name="empresaId" as="select" defaultValue="">
          <option value="">Todas las empresas</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
        </FormField>
        <FormField label="Descripción" name="descripcion" as="textarea" />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/centros-costo" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

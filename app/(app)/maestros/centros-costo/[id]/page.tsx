import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCentroCosto } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function EditarCentroCostoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const { id } = await params;
  const [centro, empresas] = await Promise.all([
    prisma.centroCosto.findUnique({ where: { id } }),
    prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } }),
  ]);
  if (!centro) notFound();

  const action = updateCentroCosto.bind(null, id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Centro de Costo</h1>
        <p className="text-sm text-gray-500 mt-0.5">{centro.nombre}</p>
      </div>
      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <FormField label="Nombre" name="nombre" defaultValue={centro.nombre} required />
        <FormField label="Empresa" name="empresaId" as="select" defaultValue={centro.empresaId ?? ""}>
          <option value="">Todas las empresas</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
        </FormField>
        <FormField label="Descripción" name="descripcion" as="textarea" defaultValue={centro.descripcion ?? ""} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/centros-costo" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

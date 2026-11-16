import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArea } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function EditarAreaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const { id } = await params;
  const area = await prisma.area.findUnique({ where: { id } });
  if (!area) notFound();

  const action = updateArea.bind(null, id);

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Área</h1>
      </div>
      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <FormField label="Nombre" name="nombre" defaultValue={area.nombre} required />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/areas" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

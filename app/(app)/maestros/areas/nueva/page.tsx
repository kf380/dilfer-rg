import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createArea } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function NuevaAreaPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Área</h1>
      </div>
      <form action={createArea} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <FormField label="Nombre" name="nombre" required placeholder="ej: Administración" />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/areas" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

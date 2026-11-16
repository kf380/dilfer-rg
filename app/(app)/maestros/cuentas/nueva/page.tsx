import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCuenta } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function NuevaCuentaPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");
  const empresas = await prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cuenta Contable</h1>
      </div>
      <form action={createCuenta} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <FormField label="Empresa" name="empresaId" as="select" required>
          <option value="">Seleccionar empresa...</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Código" name="codigo" required placeholder="ej: 6266" />
          <FormField label="Nombre" name="nombre" required />
        </div>
        <FormField label="Descripción" name="descripcion" as="textarea" />
        <FormField label="Áreas habilitadas" name="areasHabilitadas" placeholder="Ej: Administración, Contable (vacío = todas)" />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/cuentas" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

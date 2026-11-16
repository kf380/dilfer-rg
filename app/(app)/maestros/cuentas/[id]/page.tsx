import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCuenta } from "../actions";
import FormField from "@/components/FormField";
import Link from "next/link";

export default async function EditarCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const { id } = await params;
  const cuenta = await prisma.cuentaContable.findUnique({ where: { id }, include: { empresa: true } });
  if (!cuenta) notFound();

  const action = updateCuenta.bind(null, id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Cuenta Contable</h1>
        <p className="text-sm text-gray-500 mt-0.5">{cuenta.empresa.razonSocial} · {cuenta.codigo}</p>
      </div>
      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Empresa" name="empresa" defaultValue={cuenta.empresa.razonSocial} disabled />
          <FormField label="Código" name="codigo" defaultValue={cuenta.codigo} disabled />
        </div>
        <FormField label="Nombre" name="nombre" defaultValue={cuenta.nombre} required />
        <FormField label="Descripción" name="descripcion" as="textarea" defaultValue={cuenta.descripcion ?? ""} />
        <FormField label="Áreas habilitadas" name="areasHabilitadas" defaultValue={cuenta.areasHabilitadas ?? ""} placeholder="Vacío = todas las áreas" />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">Guardar</button>
          <Link href="/maestros/cuentas" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

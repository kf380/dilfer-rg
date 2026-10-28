import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NuevaRGForm from "./NuevaRGForm";

export default async function NuevaRGPage() {
  const session = await auth();
  const user = session!.user as any;

  const empresas = await prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Rendición de Gastos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Completá los datos y agregá las líneas de gasto</p>
      </div>
      <NuevaRGForm empresas={empresas} user={user} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProveedor } from "../actions";
import ProveedorForm from "../ProveedorForm";

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  const { id } = await params;
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) notFound();

  const action = updateProveedor.bind(null, id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Proveedor</h1>
        <p className="text-sm text-gray-500 mt-0.5">{proveedor.razonSocial}</p>
      </div>
      <ProveedorForm action={action} proveedor={proveedor} />
    </div>
  );
}

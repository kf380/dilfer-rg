import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createProveedor } from "../actions";
import ProveedorForm from "../ProveedorForm";

export default async function NuevoProveedorPage() {
  const session = await auth();
  if ((session!.user as any).rol !== "Admin") redirect("/dashboard");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Proveedor</h1>
      </div>
      <ProveedorForm action={createProveedor} />
    </div>
  );
}

import FormField from "@/components/FormField";
import Link from "next/link";
import type { Proveedor } from "@prisma/client";

interface Props {
  action: (formData: FormData) => Promise<void>;
  proveedor?: Proveedor;
}

export default function ProveedorForm({ action, proveedor }: Props) {
  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Código" name="codigo" defaultValue={proveedor?.codigo} required disabled={!!proveedor} />
        <FormField label="Razón Social" name="razonSocial" defaultValue={proveedor?.razonSocial} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="CUIT" name="cuit" defaultValue={proveedor?.cuit ?? ""} placeholder="30-12345678-9" />
        <FormField label="Teléfono" name="telefono" defaultValue={proveedor?.telefono ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email" name="email" type="email" defaultValue={proveedor?.email ?? ""} />
        <FormField label="WhatsApp" name="whatsapp" defaultValue={proveedor?.whatsapp ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="CBU" name="cbu" defaultValue={proveedor?.cbu ?? ""} />
        <FormField label="Alias CBU" name="alias" defaultValue={proveedor?.alias ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Titular de cuenta" name="titularCuenta" defaultValue={proveedor?.titularCuenta ?? ""} />
        <FormField label="Mail de contacto" name="mailContacto" type="email" defaultValue={proveedor?.mailContacto ?? ""} />
      </div>
      <FormField label="Estado" name="activo" as="select" defaultValue={proveedor?.activo !== false ? "true" : "false"}>
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </FormField>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">
          Guardar
        </button>
        <Link href="/maestros/proveedores" className="px-5 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "Admin") throw new Error("Unauthorized");
}

export async function createProveedor(formData: FormData) {
  await requireAdmin();
  const codigo = (formData.get("codigo") as string).trim();
  const razonSocial = (formData.get("razonSocial") as string).trim();
  if (!codigo || !razonSocial) throw new Error("Código y Razón Social son requeridos");

  await prisma.proveedor.create({
    data: {
      codigo,
      razonSocial,
      cuit: (formData.get("cuit") as string) || null,
      telefono: (formData.get("telefono") as string) || null,
      email: (formData.get("email") as string) || null,
      cbu: (formData.get("cbu") as string) || null,
      alias: (formData.get("alias") as string) || null,
      titularCuenta: (formData.get("titularCuenta") as string) || null,
      mailContacto: (formData.get("mailContacto") as string) || null,
      whatsapp: (formData.get("whatsapp") as string) || null,
      activo: formData.get("activo") === "true",
    },
  });

  revalidatePath("/maestros/proveedores");
  redirect("/maestros/proveedores");
}

export async function updateProveedor(id: string, formData: FormData) {
  await requireAdmin();
  const razonSocial = (formData.get("razonSocial") as string).trim();
  if (!razonSocial) throw new Error("Razón Social es requerida");

  await prisma.proveedor.update({
    where: { id },
    data: {
      razonSocial,
      cuit: (formData.get("cuit") as string) || null,
      telefono: (formData.get("telefono") as string) || null,
      email: (formData.get("email") as string) || null,
      cbu: (formData.get("cbu") as string) || null,
      alias: (formData.get("alias") as string) || null,
      titularCuenta: (formData.get("titularCuenta") as string) || null,
      mailContacto: (formData.get("mailContacto") as string) || null,
      whatsapp: (formData.get("whatsapp") as string) || null,
      activo: formData.get("activo") === "true",
    },
  });

  revalidatePath("/maestros/proveedores");
  redirect("/maestros/proveedores");
}

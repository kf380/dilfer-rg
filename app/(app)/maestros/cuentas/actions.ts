"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "Admin") throw new Error("Unauthorized");
}

export async function createCuenta(formData: FormData) {
  await requireAdmin();
  const empresaId = formData.get("empresaId") as string;
  const codigo = (formData.get("codigo") as string).trim();
  const nombre = (formData.get("nombre") as string).trim();
  if (!empresaId || !codigo || !nombre) throw new Error("Empresa, código y nombre son requeridos");

  await prisma.cuentaContable.create({
    data: {
      empresaId,
      codigo,
      nombre,
      descripcion: (formData.get("descripcion") as string) || null,
      areasHabilitadas: (formData.get("areasHabilitadas") as string) || null,
    },
  });

  revalidatePath("/maestros/cuentas");
  redirect("/maestros/cuentas");
}

export async function updateCuenta(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.cuentaContable.update({
    where: { id },
    data: {
      nombre: (formData.get("nombre") as string).trim(),
      descripcion: (formData.get("descripcion") as string) || null,
      areasHabilitadas: (formData.get("areasHabilitadas") as string) || null,
    },
  });

  revalidatePath("/maestros/cuentas");
  redirect("/maestros/cuentas");
}

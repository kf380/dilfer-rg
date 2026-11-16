"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "Admin") throw new Error("Unauthorized");
}

export async function createCentroCosto(formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string).trim();
  if (!nombre) throw new Error("Nombre es requerido");
  const empresaId = (formData.get("empresaId") as string) || null;

  await prisma.centroCosto.create({
    data: {
      nombre,
      descripcion: (formData.get("descripcion") as string) || null,
      empresaId: empresaId || null,
    },
  });

  revalidatePath("/maestros/centros-costo");
  redirect("/maestros/centros-costo");
}

export async function updateCentroCosto(id: string, formData: FormData) {
  await requireAdmin();
  const empresaId = (formData.get("empresaId") as string) || null;

  await prisma.centroCosto.update({
    where: { id },
    data: {
      nombre: (formData.get("nombre") as string).trim(),
      descripcion: (formData.get("descripcion") as string) || null,
      empresaId: empresaId || null,
    },
  });

  revalidatePath("/maestros/centros-costo");
  redirect("/maestros/centros-costo");
}

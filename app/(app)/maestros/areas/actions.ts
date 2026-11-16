"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "Admin") throw new Error("Unauthorized");
}

export async function createArea(formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string).trim();
  if (!nombre) throw new Error("Nombre es requerido");
  await prisma.area.create({ data: { nombre } });
  revalidatePath("/maestros/areas");
  redirect("/maestros/areas");
}

export async function updateArea(id: string, formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string).trim();
  if (!nombre) throw new Error("Nombre es requerido");
  await prisma.area.update({ where: { id }, data: { nombre } });
  revalidatePath("/maestros/areas");
  redirect("/maestros/areas");
}

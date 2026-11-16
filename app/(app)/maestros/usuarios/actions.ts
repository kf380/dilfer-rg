"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "Admin") throw new Error("Unauthorized");
}

export async function createUsuario(formData: FormData) {
  await requireAdmin();
  const username = (formData.get("username") as string).trim();
  const password = (formData.get("password") as string).trim();
  if (!username || !password) throw new Error("Usuario y contraseña son requeridos");

  await prisma.usuario.create({
    data: {
      username,
      nombreCompleto: (formData.get("nombreCompleto") as string).trim(),
      passwordHash: await bcrypt.hash(password, 10),
      rol: (formData.get("rol") as string) || "Usuario",
      area: (formData.get("area") as string).trim(),
      activo: formData.get("activo") === "true",
    },
  });

  revalidatePath("/maestros/usuarios");
  redirect("/maestros/usuarios");
}

export async function updateUsuario(id: string, formData: FormData) {
  await requireAdmin();
  const password = (formData.get("password") as string).trim();

  const data: any = {
    nombreCompleto: (formData.get("nombreCompleto") as string).trim(),
    rol: (formData.get("rol") as string) || "Usuario",
    area: (formData.get("area") as string).trim(),
    activo: formData.get("activo") === "true",
  };

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.usuario.update({ where: { id }, data });
  revalidatePath("/maestros/usuarios");
  redirect("/maestros/usuarios");
}

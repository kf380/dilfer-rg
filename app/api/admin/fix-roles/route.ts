import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.$executeRaw`UPDATE "Usuario" SET rol = 'Tesorería' WHERE username = 'tesoreria'`;

  const user = await prisma.usuario.findUnique({
    where: { username: "tesoreria" },
    select: { username: true, rol: true },
  });

  return NextResponse.json({ updated: result, user });
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.usuario.findUnique({
          where: { username: credentials.username as string },
          include: { empresa: true },
        });
        if (!user || !user.activo) return null;
        const ok = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.nombreCompleto,
          email: user.username,
          rol: user.rol,
          area: user.area,
          empresaId: user.empresaId,
          empresaNombre: user.empresa?.razonSocial ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
        token.area = (user as any).area;
        token.empresaId = (user as any).empresaId;
        token.empresaNombre = (user as any).empresaNombre;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as string;
      session.user.area = token.area as string;
      session.user.empresaId = token.empresaId as string | null;
      session.user.empresaNombre = token.empresaNombre as string | null;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});

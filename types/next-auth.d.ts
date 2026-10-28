import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    rol: string;
    area: string;
    empresaId: string | null;
    empresaNombre: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      rol: string;
      area: string;
      empresaId: string | null;
      empresaNombre: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    area: string;
    empresaId: string | null;
    empresaNombre: string | null;
  }
}

"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function loginAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return null;
  } catch (e) {
    if (isRedirectError(e)) throw e; // re-throw NEXT_REDIRECT so Next.js navigates
    if (e instanceof AuthError) return "Usuario o contraseña incorrectos";
    return "Error inesperado";
  }
}

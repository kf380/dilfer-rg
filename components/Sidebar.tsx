"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  user: {
    name: string;
    rol: string;
    area: string;
    empresaNombre: string | null;
  };
}

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: "🏠", roles: ["Admin", "Usuario"] },
  { href: "/rg/nueva", label: "Nueva Rendición", icon: "🆕", roles: ["Admin", "Usuario"] },
  { href: "/rg", label: "Registro de RG", icon: "📋", roles: ["Admin", "Usuario"] },
  { section: "Administración", roles: ["Admin"] },
  { href: "/maestros/empresas", label: "Empresas", icon: "🏢", roles: ["Admin"] },
  { href: "/maestros/proveedores", label: "Proveedores", icon: "🚚", roles: ["Admin"] },
  { href: "/maestros/usuarios", label: "Usuarios", icon: "👤", roles: ["Admin"] },
  { href: "/maestros/cuentas", label: "Plan de Cuentas", icon: "📊", roles: ["Admin"] },
  { href: "/maestros/centros-costo", label: "Centros de Costo", icon: "📍", roles: ["Admin"] },
  { href: "/maestros/areas", label: "Áreas", icon: "🗂️", roles: ["Admin"] },
];

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">D</div>
          <div>
            <p className="font-semibold text-sm leading-tight">Grupo Dilfer</p>
            <p className="text-xs text-slate-400">Rendición de Gastos</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (!item.roles.includes(user.rol)) return null;

          if ("section" in item) {
            return (
              <p key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">
                {item.section}
              </p>
            );
          }

          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href!));

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{user.area}</p>
          {user.empresaNombre && (
            <p className="text-xs text-blue-400 truncate mt-0.5">{user.empresaNombre}</p>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-xs text-slate-400 hover:text-white transition-colors"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}

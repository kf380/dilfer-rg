import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import FechaFiltros from "@/components/FechaFiltros";

const BADGE: Record<string, { bg: string; text: string }> = {
  Borrador:      { bg: "bg-gray-100",   text: "text-gray-600"   },
  Creado:        { bg: "bg-amber-50",   text: "text-amber-700"  },
  Autorizado:    { bg: "bg-purple-50",  text: "text-purple-700" },
  Aprobado:      { bg: "bg-green-50",   text: "text-green-700"  },
  Procesado:     { bg: "bg-teal-50",    text: "text-teal-700"   },
  Pagado:        { bg: "bg-blue-50",    text: "text-blue-700"   },
  "En Revisión": { bg: "bg-orange-50",  text: "text-orange-700" },
  // backward compat
  Enviado:       { bg: "bg-amber-50",   text: "text-amber-700"  },
  Rechazado:     { bg: "bg-red-50",     text: "text-red-600"    },
};

const ESTADOS = ["Borrador", "Creado", "Autorizado", "Aprobado", "Procesado", "Pagado", "En Revisión"];

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; page?: string; estado?: string; desde?: string; hasta?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  const isAdmin = user.rol === "Admin";
  const sp = await searchParams;
  const empresaId = sp.empresaId;
  const estado = sp.estado;
  const desde = sp.desde;
  const hasta = sp.hasta;
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const empresas = isAdmin
    ? await prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } })
    : [];

  const baseWhere: any = isAdmin
    ? empresaId ? { empresaId } : {}
    : { responsableId: user.id };

  if (estado) baseWhere.estado = estado;
  if (desde || hasta) {
    baseWhere.fecha = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}),
    };
  }

  const [rgs, total] = await Promise.all([
    prisma.rG.findMany({
      where: baseWhere,
      include: { empresa: true, responsable: true, lineas: true },
      orderBy: { fechaRegistro: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rG.count({ where: baseWhere }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const vals = { empresaId, estado, desde, hasta, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.delete("page");
    return `/rg${p.toString() ? `?${p}` : ""}`;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Rendiciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} rendición{total !== 1 ? "es" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/rg/export${empresaId ? `?empresaId=${empresaId}` : ""}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Exportar CSV
          </Link>
          <Link
            href="/rg/nueva"
            className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            + Nueva Rendición
          </Link>
        </div>
      </div>

      {/* Filtros empresa (admin) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Empresa:</span>
          <div className="flex gap-2 flex-wrap">
            <FilterPill href={buildHref({ empresaId: undefined })} active={!empresaId}>Todas</FilterPill>
            {empresas.map((e) => (
              <FilterPill key={e.id} href={buildHref({ empresaId: e.id })} active={empresaId === e.id}>
                {e.razonSocial}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {/* Filtros estado + fecha */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Estado:</span>
          <FilterPill href={buildHref({ estado: undefined })} active={!estado}>Todos</FilterPill>
          {ESTADOS.map((e) => (
            <FilterPill key={e} href={buildHref({ estado: e })} active={estado === e}>{e}</FilterPill>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200 hidden md:block" />
        <Suspense fallback={null}>
          <FechaFiltros />
        </Suspense>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rgs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No hay rendiciones</p>
            <p className="text-sm mt-1">
              <Link href="/rg/nueva" className="text-blue-600 hover:underline">Crear la primera →</Link>
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N° RG</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Empresa</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Responsable</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Comprobantes</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rgs.map((rg) => {
                const total = rg.lineas.reduce((s, l) => s + l.monto, 0);
                const badge = BADGE[rg.estado] ?? BADGE.Borrador;
                return (
                  <tr key={rg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{rg.nroRG}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{rg.empresa.razonSocial}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(rg.fecha)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{rg.responsable.nombreCompleto}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                        {rg.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{rg.lineas.length}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(total)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/rg/${rg.id}`} className="text-xs text-blue-600 hover:underline">Ver →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref({ page: String(p) } as any)}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                p === page ? "bg-blue-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}

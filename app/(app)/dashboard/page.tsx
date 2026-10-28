import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as any;

  const isAdmin = user.rol === "Admin";

  const rgWhere = isAdmin ? undefined : { responsableId: user.id };

  const [totalRGs, totalMonto, ultimasRGs] = await Promise.all([
    prisma.rG.count({ where: rgWhere }),
    prisma.rGLinea.aggregate({
      _sum: { monto: true },
      where: isAdmin ? undefined : { rg: { responsableId: user.id } },
    }),
    prisma.rG.findMany({
      take: 5,
      orderBy: { fechaRegistro: "desc" },
      include: { empresa: true, responsable: true, lineas: true },
      where: rgWhere,
    }),
  ]);

  const totalMontoVal = totalMonto._sum.monto ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{user.area} · {user.rol}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total rendiciones" value={String(totalRGs)} icon="📋" />
        <StatCard label="Monto total rendido" value={formatCurrency(totalMontoVal)} icon="💰" />
        <StatCard label="Empresas activas" value={isAdmin ? "4" : "1"} icon="🏢" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/rg/nueva"
          className="flex items-center gap-4 bg-blue-900 text-white rounded-xl p-5 hover:bg-blue-800 transition-colors"
        >
          <span className="text-3xl">🆕</span>
          <div>
            <p className="font-semibold">Nueva Rendición de Gastos</p>
            <p className="text-blue-200 text-sm">Cargar un nuevo formulario</p>
          </div>
        </Link>
        <Link
          href="/rg"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors"
        >
          <span className="text-3xl">📋</span>
          <div>
            <p className="font-semibold text-gray-900">Ver Registro</p>
            <p className="text-gray-500 text-sm">Historial de rendiciones</p>
          </div>
        </Link>
      </div>

      {/* Últimas RGs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Últimas rendiciones</h2>
          <Link href="/rg" className="text-sm text-blue-600 hover:underline">Ver todas →</Link>
        </div>
        {ultimasRGs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay rendiciones aún</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ultimasRGs.map((rg) => {
              const total = rg.lineas.reduce((s, l) => s + l.monto, 0);
              return (
                <Link
                  key={rg.id}
                  href={`/rg/${rg.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {rg.nroRG}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{rg.empresa.razonSocial}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(rg.fecha)} · {rg.lineas.length} línea{rg.lineas.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</p>
                    <p className="text-xs text-gray-400">{rg.responsable.nombreCompleto}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

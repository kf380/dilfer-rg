import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function RGDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const rg = await prisma.rG.findUnique({
    where: { id },
    include: {
      empresa: true,
      responsable: true,
      lineas: {
        orderBy: { linea: "asc" },
        include: { cuenta: true, centroCosto: true, proveedor: true },
      },
    },
  });

  if (!rg) notFound();

  const total = rg.lineas.reduce((s, l) => s + l.monto, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/rg" className="text-sm text-gray-500 hover:text-gray-700">← Volver al registro</Link>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">{rg.nroRG}</span>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors no-print"
        >
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* Documento imprimible */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-none print:p-0 print:rounded-none">
        {/* Header doc */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">RENDICIÓN DE GASTOS</h1>
            <p className="text-slate-500 text-sm mt-1">{rg.empresa.razonSocial}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-900">{rg.nroRG}</p>
            <p className="text-sm text-gray-500">{formatDate(rg.fecha)}</p>
          </div>
        </div>

        {/* Datos cabecera */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <InfoCell label="Responsable" value={rg.responsable.nombreCompleto} />
          <InfoCell label="Área" value={rg.area ?? "-"} />
          <InfoCell label="Empresa" value={rg.empresa.razonSocial} />
          <InfoCell label="Fecha registro" value={formatDate(rg.fechaRegistro)} />
        </div>

        {/* Tabla de líneas */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-left">
                <th className="px-3 py-2 font-medium w-8">#</th>
                <th className="px-3 py-2 font-medium">Proveedor</th>
                <th className="px-3 py-2 font-medium">Comprobante</th>
                <th className="px-3 py-2 font-medium">Detalle</th>
                <th className="px-3 py-2 font-medium">Cuenta</th>
                <th className="px-3 py-2 font-medium">Centro costo</th>
                <th className="px-3 py-2 font-medium">Forma pago</th>
                <th className="px-3 py-2 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rg.lineas.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-400">{l.linea}</td>
                  <td className="px-3 py-3 text-gray-700">
                    {l.proveedor?.razonSocial ?? l.proveedorTexto ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">
                    <div>{l.comprobante ?? "-"}</div>
                    {l.fechaComprobante && <div className="text-gray-400">{formatDate(l.fechaComprobante)}</div>}
                  </td>
                  <td className="px-3 py-3 text-gray-700 max-w-[200px]">
                    <p>{l.detalleGasto}</p>
                    {l.notas && <p className="text-xs text-orange-600 mt-0.5">⚠ {l.notas}</p>}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">
                    {l.cuenta ? `${l.cuenta.codigo} - ${l.cuenta.nombre}` : l.cuentaTexto ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">
                    {l.centroCosto?.nombre ?? l.centroCostoTexto ?? "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-gray-700">{l.formaPago}</div>
                    {l.formaPago === "Transferencia" && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {l.alias && <span>Alias: {l.alias}</span>}
                        {l.cbu && <div className="font-mono">{l.cbu}</div>}
                        {l.titular && <div>{l.titular}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(l.monto)}
                    {l.fechaPagoSolicitada && (
                      <div className="text-xs text-gray-400 font-normal">Pago: {formatDate(l.fechaPagoSolicitada)}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white">
                <td colSpan={7} className="px-3 py-3 font-semibold text-right">
                  TOTAL RENDIDO ({rg.lineas.length} comprobante{rg.lineas.length !== 1 ? "s" : ""})
                </td>
                <td className="px-3 py-3 text-right font-bold text-lg">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pie */}
        <div className="flex items-end justify-between mt-8 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Generó: <span className="font-medium text-gray-700">{rg.responsable.nombreCompleto}</span></p>
            <p className="text-xs text-gray-400 mt-0.5">Sistema de Rendición de Gastos · Grupo Dilfer</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-gray-400 pt-1 text-xs text-gray-500">Firma</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

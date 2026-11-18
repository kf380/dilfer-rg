import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import EstadoActions from "@/components/EstadoActions";
import AdjuntosPanel from "@/components/AdjuntosPanel";

export default async function RGDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as any;

  const rg = await prisma.rG.findUnique({
    where: { id },
    include: {
      empresa: true,
      responsable: true,
      lineas: {
        orderBy: { linea: "asc" },
        include: { cuenta: true, centroCosto: true, proveedor: true },
      },
      historial: {
        include: { usuario: { select: { id: true, nombreCompleto: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!rg) notFound();

  const total = rg.lineas.reduce((s, l) => s + l.monto, 0);
  const canEdit = (rg.estado === "Borrador" || rg.estado === "En Revisión") && (user.rol === "Admin" || rg.responsableId === user.id);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <Link href="/rg" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← Volver
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md font-semibold">
            {rg.nroRG}
          </span>
          {canEdit && (
            <Link
              href={`/rg/${id}/editar`}
              className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </Link>
          )}
        </div>
        <PrintButton />
      </div>

      {/* Estado + acciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 no-print">
        <EstadoActions
          rgId={id}
          estado={rg.estado}
          userRol={user.rol}
          userId={user.id}
          responsableId={rg.responsableId}
        />
      </div>

      {/* Documento */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border-none">
        <div className="h-1.5 bg-blue-900 print:h-1" />

        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-7 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold text-blue-900 tracking-widest uppercase mb-1">Grupo Dilfer</p>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rendición de Gastos</h1>
              <p className="text-gray-400 text-sm mt-1">{rg.empresa.razonSocial}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900 font-mono">{rg.nroRG}</p>
              <p className="text-sm text-gray-400 mt-0.5">{formatDate(rg.fecha)}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-4 mb-7 rounded-xl overflow-hidden border border-gray-100">
            <MetaCell label="Responsable" value={rg.responsable.nombreCompleto} first />
            <MetaCell label="Área" value={rg.area ?? "-"} />
            <MetaCell label="Empresa" value={rg.empresa.razonSocial} />
            <MetaCell label="Fecha registro" value={formatDateTime(rg.fechaRegistro)} />
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto mb-7 rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800 text-white text-left">
                  <th className="px-3 py-2.5 font-semibold text-center w-7">#</th>
                  <th className="px-3 py-2.5 font-semibold">Proveedor</th>
                  <th className="px-3 py-2.5 font-semibold">Comprobante</th>
                  <th className="px-3 py-2.5 font-semibold">Detalle</th>
                  <th className="px-3 py-2.5 font-semibold">Cuenta</th>
                  <th className="px-3 py-2.5 font-semibold">Centro de costo</th>
                  <th className="px-3 py-2.5 font-semibold">Forma pago</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {rg.lineas.map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="px-3 py-3 text-gray-400 text-center font-medium">{l.linea}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium">
                      {l.proveedor?.razonSocial ?? l.proveedorTexto ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      <div>{l.comprobante ?? "-"}</div>
                      {l.fechaComprobante && (
                        <div className="text-gray-400 mt-0.5">{formatDate(l.fechaComprobante)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div>{l.detalleGasto}</div>
                      {l.notas && (
                        <div className="text-orange-500 mt-0.5 flex items-center gap-1">
                          <span>⚠</span><span>{l.notas}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {l.cuenta ? (
                        <>
                          <span className="font-mono text-gray-400">{l.cuenta.codigo}</span>
                          <div className="text-gray-600 mt-0.5">{l.cuenta.nombre}</div>
                        </>
                      ) : l.cuentaTexto ?? "-"}
                    </td>
                    <td className="px-3 py-3">
                      {Array.isArray((l as any).centrosCostoDistribucion) && (l as any).centrosCostoDistribucion.length > 0
                        ? (
                          <div className="space-y-1.5">
                            {(l as any).centrosCostoDistribucion.map((d: any, di: number) => {
                              const mCC = (parseFloat(d.porcentaje) / 100) * l.monto;
                              return (
                                <div key={di} className="flex items-center gap-1.5">
                                  <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                    {d.porcentaje}%
                                  </span>
                                  <span className="text-gray-600 flex-1">{d.nombre}</span>
                                  <span className="text-gray-800 font-semibold shrink-0">{formatCurrency(mCC)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )
                        : <span className="text-gray-500">{l.centroCosto?.nombre ?? l.centroCostoTexto ?? "-"}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-gray-700 font-medium">{l.formaPago}</div>
                      {l.formaPago === "Transferencia" && (
                        <div className="text-gray-400 mt-0.5 space-y-0.5">
                          {l.alias && <div>Alias: {l.alias}</div>}
                          {l.cbu && <div className="font-mono">{l.cbu}</div>}
                          {l.titular && <div>{l.titular}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-bold text-gray-900 text-sm">{formatCurrency(l.monto)}</div>
                      {l.fechaPagoSolicitada && (
                        <div className="text-gray-400 mt-0.5">Vcto: {formatDate(l.fechaPagoSolicitada)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-900 text-white">
                  <td colSpan={7} className="px-4 py-3 font-semibold text-right text-sm tracking-wide">
                    IMPORTE TOTAL — {rg.lineas.length} comprobante{rg.lineas.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-base">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pie */}
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">
                Generó: <span className="font-semibold text-gray-600">{rg.responsable.nombreCompleto}</span>
              </p>
              <p className="text-xs text-gray-300 mt-0.5">Sistema de Rendición de Gastos · Grupo Dilfer</p>
            </div>
            <div className="text-center">
              <div className="w-52 border-t-2 border-gray-300 pt-1.5 text-xs text-gray-400 tracking-wide">FIRMA Y SELLO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjuntos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4 no-print">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Adjuntos</h3>
        <AdjuntosPanel rgId={id} estado={rg.estado} />
      </div>

      {/* Historial */}
      {rg.historial.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4 no-print">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Historial</h3>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {rg.historial.map((h) => (
              <li key={h.id} className="pl-5 relative">
                <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-400" />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{h.usuario.nombreCompleto}</span>
                  <span className="text-sm text-gray-500">{h.accion} esta rendición</span>
                  {h.estadoAnterior && h.estadoNuevo && h.estadoAnterior !== h.estadoNuevo && (
                    <span className="text-xs text-gray-400">
                      {h.estadoAnterior} → {h.estadoNuevo}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{formatDateTime(h.createdAt)}</span>
                </div>
                {h.comentario && (
                  <p className="text-sm text-gray-500 mt-0.5 italic">"{h.comentario}"</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div className={`bg-gray-50 px-4 py-3 ${!first ? "border-l border-gray-100" : ""}`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

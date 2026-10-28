"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface Empresa { id: string; razonSocial: string }
interface Proveedor { id: string; razonSocial: string; cbu?: string | null; alias?: string | null; titularCuenta?: string | null; mailContacto?: string | null; whatsapp?: string | null }
interface Cuenta { id: string; codigo: string; nombre: string; descripcion?: string | null }
interface Centro { id: string; nombre: string; descripcion?: string | null }

interface Linea {
  proveedorId: string; proveedorTexto: string; comprobante: string; fechaComprobante: string;
  detalleGasto: string; cuentaId: string; cuentaTexto: string; centroCostoId: string;
  centroCostoTexto: string; monto: string; formaPago: string; cbu: string; alias: string;
  titular: string; mail: string; whatsapp: string; compraMercaderia: boolean;
  fechaPagoSolicitada: string; notas: string; fechaEstimadaPago: string;
}

const lineaVacia = (): Linea => ({
  proveedorId: "", proveedorTexto: "", comprobante: "", fechaComprobante: "",
  detalleGasto: "", cuentaId: "", cuentaTexto: "", centroCostoId: "", centroCostoTexto: "",
  monto: "", formaPago: "Efectivo", cbu: "", alias: "", titular: "", mail: "", whatsapp: "",
  compraMercaderia: false, fechaPagoSolicitada: "", notas: "", fechaEstimadaPago: "",
});

export default function NuevaRGForm({ empresas, user }: { empresas: Empresa[]; user: any }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [fecha, setFecha] = useState(today);
  const [area, setArea] = useState(user.area ?? "");
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [expandida, setExpandida] = useState<number>(0);
  const [bankHighlight, setBankHighlight] = useState<Set<number>>(new Set());

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/maestros?tipo=proveedores").then((r) => r.json()).then(setProveedores);
  }, []);

  useEffect(() => {
    if (!empresaId) return;
    fetch(`/api/maestros?tipo=cuentas&empresaId=${empresaId}&area=${encodeURIComponent(area)}`).then((r) => r.json()).then(setCuentas);
    fetch(`/api/maestros?tipo=centros&empresaId=${empresaId}`).then((r) => r.json()).then(setCentros);
  }, [empresaId, area]);

  function updateLinea(i: number, field: keyof Linea, value: any) {
    setLineas((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  function handleProveedorSelect(i: number, provId: string) {
    const prov = proveedores.find((p) => p.id === provId);
    if (!prov) {
      updateLinea(i, "proveedorId", "");
      return;
    }
    const hasBankData = prov.cbu || prov.alias || prov.titularCuenta;
    setLineas((prev) =>
      prev.map((l, idx) =>
        idx !== i ? l : {
          ...l,
          proveedorId: prov.id,
          proveedorTexto: prov.razonSocial,
          cbu: prov.cbu ?? "",
          alias: prov.alias ?? "",
          titular: prov.titularCuenta ?? "",
          mail: prov.mailContacto ?? "",
          whatsapp: prov.whatsapp ?? "",
          formaPago: hasBankData ? "Transferencia" : l.formaPago,
        }
      )
    );
    if (hasBankData) {
      setBankHighlight((prev) => new Set(prev).add(i));
      setTimeout(() => {
        setBankHighlight((prev) => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        });
      }, 1500);
    }
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
    setExpandida(lineas.length);
  }

  function eliminarLinea(i: number) {
    if (lineas.length === 1) return;
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
    setExpandida((prev) => Math.max(0, prev > i ? prev - 1 : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    for (let i = 0; i < lineas.length; i++) {
      if (!lineas[i].detalleGasto || !lineas[i].monto || !lineas[i].formaPago) {
        setError(`Línea ${i + 1}: completá Detalle, Monto y Forma de pago`);
        setExpandida(i);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/rg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId, fecha, area,
          lineas: lineas.map((l) => ({ ...l, monto: parseFloat(l.monto) || 0 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      router.push(`/rg/${data.rg.id}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  const total = lineas.reduce((s, l) => s + (parseFloat(l.monto) || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Datos generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Empresa</label>
            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="input">
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Área</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} className="input" placeholder="Área del responsable" />
          </div>
          <div>
            <label className="label">Responsable</label>
            <input value={user.name} disabled className="input bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">N° de RG</label>
            <input value="(se asigna al guardar)" disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed text-sm italic" />
          </div>
        </div>
      </div>

      {/* Líneas */}
      <div className="space-y-3">
        {lineas.map((linea, i) => (
          <LineaCard
            key={i}
            index={i}
            linea={linea}
            expanded={expandida === i}
            bankHighlighted={bankHighlight.has(i)}
            onToggle={() => setExpandida(expandida === i ? -1 : i)}
            onUpdate={(field, val) => updateLinea(i, field, val)}
            onProveedorSelect={(id) => handleProveedorSelect(i, id)}
            onDelete={() => eliminarLinea(i)}
            proveedores={proveedores}
            cuentas={cuentas}
            centros={centros}
            canDelete={lineas.length > 1}
          />
        ))}

        <button
          type="button"
          onClick={agregarLinea}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Agregar línea
        </button>
      </div>

      {/* Total + submit */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total rendido ({lineas.length} línea{lineas.length !== 1 ? "s" : ""})</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
        <div className="flex gap-3 items-center">
          {error && <p className="text-sm text-red-600 max-w-xs">{error}</p>}
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Guardando..." : "Guardar Rendición"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Combobox buscable para cuentas contables ───────────────────────────────
function CuentaCombobox({
  cuentas, value, onChange,
}: {
  cuentas: Cuenta[];
  value: string;
  onChange: (id: string, texto: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = cuentas.find((c) => c.id === value);

  const filtered = query.trim()
    ? cuentas.filter((c) =>
        `${c.codigo} ${c.nombre}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : cuentas.slice(0, 30);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(c: Cuenta) {
    onChange(c.id, `${c.codigo} - ${c.nombre}`);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange("", "");
    setQuery("");
    setOpen(true);
  }

  return (
    <div ref={ref} className="relative">
      <div
        className={`input flex items-center justify-between cursor-pointer ${open ? "border-blue-500 ring-2 ring-blue-100" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="text-gray-800 truncate">{selected.codigo} — {selected.nombre}</span>
        ) : (
          <span className="text-gray-400">Buscar cuenta...</span>
        )}
        {selected ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-2 text-gray-400 hover:text-gray-600 shrink-0"
          >
            ×
          </button>
        ) : (
          <span className="text-gray-400 text-xs shrink-0">▼</span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400"
              placeholder="Escribí código o nombre..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c.id}
                  onMouseDown={() => select(c)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${c.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                >
                  <span className="font-mono text-xs text-gray-400 mr-2">{c.codigo}</span>
                  {c.nombre}
                </li>
              ))
            )}
          </ul>
          {!query && cuentas.length > 30 && (
            <p className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100">
              Mostrando 30 de {cuentas.length}. Escribí para filtrar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de línea ────────────────────────────────────────────────────────
function LineaCard({
  index, linea, expanded, bankHighlighted, onToggle, onUpdate, onProveedorSelect, onDelete, canDelete,
  proveedores, cuentas, centros,
}: {
  index: number; linea: Linea; expanded: boolean; bankHighlighted: boolean;
  onToggle: () => void; onUpdate: (f: keyof Linea, v: any) => void;
  onProveedorSelect: (id: string) => void; onDelete: () => void; canDelete: boolean;
  proveedores: Proveedor[]; cuentas: Cuenta[]; centros: Centro[];
}) {
  const monto = parseFloat(linea.monto) || 0;
  const tieneProveedor = linea.proveedorTexto || linea.proveedorId;
  const selectedCuenta = cuentas.find((c) => c.id === linea.cuentaId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {linea.detalleGasto || "Nueva línea"}
              {tieneProveedor && <span className="text-gray-400 font-normal"> · {linea.proveedorTexto}</span>}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {linea.cuentaTexto || "Sin cuenta"} · {linea.formaPago}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-sm font-semibold text-gray-700">{monto > 0 ? formatCurrency(monto) : "—"}</span>
          {canDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600 text-xs transition-colors">
              Eliminar
            </button>
          )}
          <span className="text-gray-400 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Cuerpo */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Proveedor */}
            <div>
              <label className="label">Proveedor</label>
              <select
                value={linea.proveedorId}
                onChange={(e) => e.target.value ? onProveedorSelect(e.target.value) : onUpdate("proveedorId", "")}
                className="input"
              >
                <option value="">Texto libre</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
              </select>
              {!linea.proveedorId && (
                <input
                  value={linea.proveedorTexto}
                  onChange={(e) => onUpdate("proveedorTexto", e.target.value)}
                  className="input mt-2"
                  placeholder="Nombre del proveedor"
                />
              )}
            </div>

            {/* Comprobante */}
            <div>
              <label className="label">N° Comprobante</label>
              <input value={linea.comprobante} onChange={(e) => onUpdate("comprobante", e.target.value)} className="input" placeholder="Ej: FA-0001-00123" />
            </div>

            {/* Fecha comprobante */}
            <div>
              <label className="label">Fecha comprobante</label>
              <input type="date" value={linea.fechaComprobante} onChange={(e) => onUpdate("fechaComprobante", e.target.value)} className="input" />
            </div>

            {/* Detalle */}
            <div className="md:col-span-2">
              <label className="label">Detalle del gasto *</label>
              <input value={linea.detalleGasto} onChange={(e) => onUpdate("detalleGasto", e.target.value)} className="input" placeholder="Descripción del gasto" required />
            </div>

            {/* Monto */}
            <div>
              <label className="label">Monto ($) *</label>
              <input type="number" step="0.01" min="0" value={linea.monto} onChange={(e) => onUpdate("monto", e.target.value)} className="input" placeholder="0.00" required />
            </div>

            {/* Cuenta contable — combobox buscable */}
            <div className="md:col-span-2">
              <label className="label">Cuenta contable</label>
              <CuentaCombobox
                cuentas={cuentas}
                value={linea.cuentaId}
                onChange={(id, texto) => { onUpdate("cuentaId", id); onUpdate("cuentaTexto", texto); }}
              />
              {selectedCuenta?.descripcion && (
                <p className="text-xs text-gray-400 mt-1 italic">{selectedCuenta.descripcion}</p>
              )}
            </div>

            {/* Centro de costo */}
            <div>
              <label className="label">Centro de costos</label>
              <select
                value={linea.centroCostoId}
                onChange={(e) => {
                  const cc = centros.find((x) => x.id === e.target.value);
                  onUpdate("centroCostoId", e.target.value);
                  onUpdate("centroCostoTexto", cc?.nombre ?? "");
                }}
                className="input"
              >
                <option value="">Seleccionar...</option>
                {centros.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {/* Forma de pago */}
            <div>
              <label className="label">Forma de pago *</label>
              <select value={linea.formaPago} onChange={(e) => onUpdate("formaPago", e.target.value)} className="input">
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>E-cheq</option>
              </select>
            </div>

            {/* Fecha pago solicitada */}
            <div>
              <label className="label">Fecha pago solicitada</label>
              <input type="date" value={linea.fechaPagoSolicitada} onChange={(e) => onUpdate("fechaPagoSolicitada", e.target.value)} className="input" />
            </div>

            {/* Fecha estimada pago */}
            <div>
              <label className="label">Fecha estimada pago</label>
              <input type="date" value={linea.fechaEstimadaPago} onChange={(e) => onUpdate("fechaEstimadaPago", e.target.value)} className="input" />
            </div>

            {/* Compra mercadería */}
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id={`cm-${index}`} checked={linea.compraMercaderia} onChange={(e) => onUpdate("compraMercaderia", e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <label htmlFor={`cm-${index}`} className="text-sm text-gray-700">Compra de mercadería</label>
            </div>

            {/* Notas */}
            <div className="md:col-span-3">
              <label className="label">Notas</label>
              <textarea value={linea.notas} onChange={(e) => onUpdate("notas", e.target.value)} className="input resize-none" rows={2} placeholder="Observaciones adicionales..." />
            </div>
          </div>

          {/* Datos bancarios — con highlight al auto-fill */}
          {linea.formaPago === "Transferencia" && (
            <div
              className="border-t border-gray-100 pt-4 rounded-lg transition-all duration-300"
              style={bankHighlighted ? { backgroundColor: "#eff6ff", outline: "2px solid #3b82f6" } : {}}
            >
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos bancarios</p>
                {bankHighlighted && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
                    Auto-completado desde proveedor
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">CBU</label>
                  <input value={linea.cbu} onChange={(e) => onUpdate("cbu", e.target.value)} className="input font-mono text-xs" placeholder="22 dígitos" />
                </div>
                <div>
                  <label className="label">Alias</label>
                  <input value={linea.alias} onChange={(e) => onUpdate("alias", e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Titular</label>
                  <input value={linea.titular} onChange={(e) => onUpdate("titular", e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={linea.mail} onChange={(e) => onUpdate("mail", e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input value={linea.whatsapp} onChange={(e) => onUpdate("whatsapp", e.target.value)} className="input" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

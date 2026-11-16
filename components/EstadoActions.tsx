"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Borrador:  { bg: "bg-gray-100",   text: "text-gray-600",   label: "Borrador"  },
  Enviado:   { bg: "bg-amber-50",   text: "text-amber-700",  label: "Enviado"   },
  Aprobado:  { bg: "bg-green-50",   text: "text-green-700",  label: "Aprobado"  },
  Pagado:    { bg: "bg-blue-50",    text: "text-blue-700",   label: "Pagado"    },
  Rechazado: { bg: "bg-red-50",     text: "text-red-600",    label: "Rechazado" },
};

export default function EstadoActions({
  rgId, estado, userRol, userId, responsableId,
}: {
  rgId: string; estado: string; userRol: string; userId: string; responsableId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRechazo, setShowRechazo] = useState(false);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const isAdmin = userRol === "Admin";
  const isOwner = userId === responsableId;
  const badge = BADGE[estado] ?? BADGE.Borrador;

  async function cambiar(nuevoEstado: string, comentarioParam?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rg/${rgId}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, comentario: comentarioParam }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>

      {estado === "Borrador" && (isOwner || isAdmin) && (
        <button
          onClick={() => cambiar("Enviado")}
          disabled={loading}
          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors"
        >
          Enviar para aprobación
        </button>
      )}

      {estado === "Enviado" && isAdmin && !showRechazo && (
        <>
          <button
            onClick={() => cambiar("Aprobado")}
            disabled={loading}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            Aprobar
          </button>
          <button
            onClick={() => setShowRechazo(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            Rechazar
          </button>
        </>
      )}

      {estado === "Aprobado" && isAdmin && (
        <button
          onClick={() => cambiar("Pagado")}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          Marcar como pagada
        </button>
      )}

      {showRechazo && (
        <div className="w-full flex items-center gap-2 mt-1">
          <input
            autoFocus
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-400"
            placeholder="Motivo del rechazo (opcional)"
          />
          <button
            onClick={() => { cambiar("Rechazado", comentario); setShowRechazo(false); }}
            disabled={loading}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            Confirmar
          </button>
          <button
            onClick={() => setShowRechazo(false)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 w-full">{error}</p>}
    </div>
  );
}

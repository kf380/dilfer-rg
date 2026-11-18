"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Borrador:      { bg: "bg-gray-100",    text: "text-gray-600",    label: "Borrador"      },
  Creado:        { bg: "bg-amber-50",    text: "text-amber-700",   label: "Creado"        },
  Autorizado:    { bg: "bg-purple-50",   text: "text-purple-700",  label: "Autorizado"    },
  Aprobado:      { bg: "bg-green-50",    text: "text-green-700",   label: "Aprobado"      },
  Procesado:     { bg: "bg-teal-50",     text: "text-teal-700",    label: "Procesado"     },
  Pagado:        { bg: "bg-blue-50",     text: "text-blue-700",    label: "Pagado"        },
  "En Revisión": { bg: "bg-orange-50",   text: "text-orange-700",  label: "En Revisión"   },
  // backward compat
  Enviado:       { bg: "bg-amber-50",    text: "text-amber-700",   label: "Enviado"       },
  Rechazado:     { bg: "bg-red-50",      text: "text-red-600",     label: "Rechazado"     },
};

export default function EstadoActions({
  rgId, estado, userRol, userId, responsableId,
}: {
  rgId: string; estado: string; userRol: string; userId: string; responsableId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const isAdmin = userRol === "Admin";
  const isOwner = userId === responsableId;
  const badge = BADGE[estado] ?? { bg: "bg-gray-100", text: "text-gray-600", label: estado };

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

  const isCreado = estado === "Creado" || estado === "Enviado";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>

      {/* Borrador → Creado */}
      {estado === "Borrador" && (isOwner || isAdmin) && (
        <button
          onClick={() => cambiar("Creado")}
          disabled={loading}
          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors"
        >
          Crear
        </button>
      )}

      {/* Creado → Autorizado / En Revisión */}
      {isCreado && isAdmin && !showRevision && (
        <>
          <button
            onClick={() => cambiar("Autorizado")}
            disabled={loading}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            Autorizar
          </button>
          <button
            onClick={() => setShowRevision(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            En Revisión
          </button>
        </>
      )}

      {/* Autorizado → Aprobado / En Revisión */}
      {estado === "Autorizado" && isAdmin && !showRevision && (
        <>
          <button
            onClick={() => cambiar("Aprobado")}
            disabled={loading}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            Aprobar
          </button>
          <button
            onClick={() => setShowRevision(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            En Revisión
          </button>
        </>
      )}

      {/* Aprobado → Procesado */}
      {estado === "Aprobado" && isAdmin && (
        <button
          onClick={() => cambiar("Procesado")}
          disabled={loading}
          className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          Procesar
        </button>
      )}

      {/* Procesado → Pagado */}
      {estado === "Procesado" && isAdmin && (
        <button
          onClick={() => cambiar("Pagado")}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          Pagar
        </button>
      )}

      {/* En Revisión → Creado */}
      {estado === "En Revisión" && (isOwner || isAdmin) && (
        <button
          onClick={() => cambiar("Creado")}
          disabled={loading}
          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors"
        >
          Volver a enviar
        </button>
      )}

      {/* Panel de revisión con comentario */}
      {showRevision && (
        <div className="w-full flex items-center gap-2 mt-1">
          <input
            autoFocus
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
            placeholder="Motivo de la revisión (opcional)"
          />
          <button
            onClick={() => { cambiar("En Revisión", comentario); setShowRevision(false); }}
            disabled={loading}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            Confirmar
          </button>
          <button
            onClick={() => setShowRevision(false)}
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

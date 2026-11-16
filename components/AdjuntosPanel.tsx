"use client";
import { useState, useEffect, useRef } from "react";

interface Adjunto {
  id: string;
  nombre: string;
  mimeType: string;
  tamano: number;
  createdAt: string;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdjuntosPanel({ rgId, estado }: { rgId: string; estado: string }) {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canEdit = ["Borrador", "Enviado"].includes(estado);

  async function load() {
    const res = await fetch(`/api/rg/${rgId}/adjuntos`);
    if (res.ok) setAdjuntos(await res.json());
  }

  useEffect(() => { load(); }, [rgId]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/rg/${rgId}/adjuntos`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Error al subir");
    else await load();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function eliminar(adjuntoId: string) {
    if (!confirm("¿Eliminar adjunto?")) return;
    await fetch(`/api/rg/${rgId}/adjuntos/${adjuntoId}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      {adjuntos.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">Sin adjuntos</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {adjuntos.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-400 shrink-0">📎</span>
              <a
                href={`/api/rg/${rgId}/adjuntos/${a.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex-1 truncate"
              >
                {a.nombre}
              </a>
              <span className="text-gray-400 text-xs shrink-0">{fmtSize(a.tamano)}</span>
              {canEdit && (
                <button onClick={() => eliminar(a.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            onChange={upload}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-60 transition-colors"
          >
            {uploading ? "Subiendo..." : "+ Adjuntar archivo"}
          </button>
          <span className="text-xs text-gray-400">PDF, JPG, PNG · máx 10MB</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

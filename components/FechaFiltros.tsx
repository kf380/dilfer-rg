"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function FechaFiltros() {
  const sp = useSearchParams();
  const router = useRouter();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/rg?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500 font-medium">Fecha:</span>
      <input
        type="date"
        defaultValue={sp.get("desde") ?? ""}
        onChange={(e) => update("desde", e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
      />
      <span className="text-sm text-gray-400">→</span>
      <input
        type="date"
        defaultValue={sp.get("hasta") ?? ""}
        onChange={(e) => update("hasta", e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
      />
    </div>
  );
}

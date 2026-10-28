import Link from "next/link";

interface Props {
  title: string;
  headers: string[];
  rows: { id: string; fields: string[] }[];
  addHref: string;
}

export default function MaestroTable({ title, headers, rows, addHref }: Props) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} registro{rows.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href={addHref}
          className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
        >
          + Agregar
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No hay registros</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.fields.map((f, i) => (
                    <td key={i} className="px-5 py-3 text-gray-700 max-w-xs truncate">{f}</td>
                  ))}
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">Editar</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

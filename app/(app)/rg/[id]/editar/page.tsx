import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import NuevaRGForm from "../../nueva/NuevaRGForm";
import Link from "next/link";

function parseComprobante(raw: string | null) {
  if (!raw) return { tipo: "", letra: "", nro: "" };
  const tipos = ["Nota débito", "Nota crédito", "Factura", "Recibo", "Ticket", "Remito", "Otro"];
  const letras = ["A", "B", "C", "X", "E", "M"];
  for (const tipo of tipos) {
    if (raw.startsWith(tipo)) {
      const rest = raw.slice(tipo.length).trimStart();
      if (letras.includes(rest[0]) && rest[1] === " ") return { tipo, letra: rest[0], nro: rest.slice(2) };
      return { tipo, letra: "", nro: rest };
    }
  }
  return { tipo: "", letra: "", nro: raw };
}

export default async function EditarRGPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as any;

  const rg = await prisma.rG.findUnique({
    where: { id },
    include: { empresa: true, lineas: { orderBy: { linea: "asc" } } },
  });

  if (!rg) notFound();
  if (rg.estado !== "Borrador") redirect(`/rg/${id}`);
  if (user.rol !== "Admin" && rg.responsableId !== user.id) redirect(`/rg/${id}`);

  const empresas = await prisma.empresa.findMany({ where: { activa: true }, orderBy: { razonSocial: "asc" } });

  const initialRG = {
    id: rg.id,
    nroRG: rg.nroRG,
    fecha: rg.fecha.toISOString().split("T")[0],
    area: rg.area ?? "",
    empresaId: rg.empresaId,
    lineas: rg.lineas.map((l) => {
      const { tipo, letra, nro } = parseComprobante(l.comprobante);
      return {
        proveedorId: l.proveedorId ?? "",
        proveedorTexto: l.proveedorTexto ?? "",
        tipoComprobante: tipo,
        letraComprobante: letra,
        nroComprobante: nro,
        fechaComprobante: l.fechaComprobante?.toISOString().split("T")[0] ?? "",
        motivoAtraso: "",
        detalleGasto: l.detalleGasto,
        cuentaId: l.cuentaId ?? "",
        cuentaTexto: l.cuentaTexto ?? "",
        centrosCostoDistribucion: (l.centrosCostoDistribucion as any) ?? [],
        monto: String(l.monto),
        formaPago: l.formaPago,
        cbu: l.cbu ?? "",
        alias: l.alias ?? "",
        titular: l.titular ?? "",
        mail: l.mail ?? "",
        whatsapp: l.whatsapp ?? "",
        compraMercaderia: l.compraMercaderia,
        fechaPagoSolicitada: l.fechaPagoSolicitada?.toISOString().split("T")[0] ?? "",
        notas: l.notas ?? "",
      };
    }),
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/rg/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <span className="text-gray-200">|</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Editar Rendición</h1>
          <p className="text-xs font-mono text-gray-400">{rg.nroRG}</p>
        </div>
      </div>
      <NuevaRGForm
        empresas={empresas}
        user={user}
        mode="editar"
        rgId={id}
        initialRG={initialRG}
      />
    </div>
  );
}

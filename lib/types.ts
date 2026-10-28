export type Rol = "Admin" | "Usuario";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  rol: Rol;
  area: string;
  empresaId: string | null;
  empresaNombre: string | null;
}

export interface RGLineaForm {
  proveedorId?: string;
  proveedorTexto?: string;
  comprobante?: string;
  fechaComprobante?: string;
  detalleGasto: string;
  cuentaId?: string;
  cuentaTexto?: string;
  centroCostoId?: string;
  centroCostoTexto?: string;
  monto: number;
  formaPago: string;
  cbu?: string;
  alias?: string;
  titular?: string;
  mail?: string;
  whatsapp?: string;
  compraMercaderia: boolean;
  fechaPagoSolicitada?: string;
  notas?: string;
  fechaEstimadaPago?: string;
}

export interface RGForm {
  empresaId: string;
  fecha: string;
  area: string;
  lineas: RGLineaForm[];
}

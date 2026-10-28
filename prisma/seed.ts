import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] || "").trim().replace(/^"|"$/g, "");
    });
    return row;
  });
}

const CSV_DIR = "/Users/kevinlfavrejarupkin/Downloads/OC_GrupoDilfer_CSVs";

async function main() {
  console.log("Seeding...");

  // Areas
  const areas = [
    "Administración", "Recursos Humanos", "Contable", "Compras",
    "Operaciones", "Tecnología", "Marketing", "Tesorería",
    "Directorio", "Auditoría", "Mantenimiento", "Logística",
    "Comercial y Compras", "Tecnología e Infraestructura",
    "Complejo Externo Atlas", "Infraestructura",
  ];
  for (const nombre of areas) {
    await prisma.area.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log("✓ Areas");

  // Empresas
  const empresasData = [
    { codigo: "EMP001", razonSocial: "NEXON SA" },
    { codigo: "EMP002", razonSocial: "RIZZI HOGAR SA" },
    { codigo: "EMP003", razonSocial: "DILFER SA" },
    { codigo: "EMP004", razonSocial: "CIERTO ARGENTINA SA" },
  ];
  const empresaMap: Record<string, string> = {};
  for (const e of empresasData) {
    const emp = await prisma.empresa.upsert({
      where: { codigo: e.codigo },
      update: {},
      create: e,
    });
    empresaMap[e.razonSocial] = emp.id;
    empresaMap[e.codigo] = emp.id;
  }
  console.log("✓ Empresas");

  // Usuarios
  const usuariosData = [
    { username: "admin", nombreCompleto: "Administrador", password: "Manu1234", rol: "Admin", area: "Administración" },
    { username: "rrhh", nombreCompleto: "Recursos Humanos", password: "rrhh1234", rol: "Usuario", area: "Recursos Humanos" },
    { username: "contable", nombreCompleto: "Contable", password: "conta1234", rol: "Usuario", area: "Contable" },
    { username: "compras", nombreCompleto: "Comercial", password: "compras1234", rol: "Usuario", area: "Comercial y Compras" },
    { username: "operaciones", nombreCompleto: "Operaciones", password: "opera1234", rol: "Usuario", area: "Operaciones" },
    { username: "tecnologia", nombreCompleto: "Tecnología e Infraestructura", password: "tecno1234", rol: "Usuario", area: "Tecnología e Infraestructura" },
    { username: "marketing", nombreCompleto: "Marketing", password: "marke1234", rol: "Usuario", area: "Marketing" },
    { username: "tesoreria", nombreCompleto: "Tesorería", password: "teso1234", rol: "Usuario", area: "Tesorería" },
    { username: "directorio", nombreCompleto: "Directorio", password: "dire1234", rol: "Usuario", area: "Directorio" },
    { username: "auditoria", nombreCompleto: "Auditoría", password: "audi1234", rol: "Usuario", area: "Auditoría" },
    { username: "mantenimiento", nombreCompleto: "Mantenimiento", password: "mante1234", rol: "Usuario", area: "Mantenimiento" },
    { username: "logistica", nombreCompleto: "Logística", password: "logi1234", rol: "Usuario", area: "Logística" },
    { username: "complejoexterno", nombreCompleto: "Complejo Externo Atlas", password: "atlas1234", rol: "Usuario", area: "Complejo Externo Atlas" },
  ];
  for (const u of usuariosData) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.usuario.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, nombreCompleto: u.nombreCompleto, passwordHash: hash, rol: u.rol, area: u.area },
    });
  }
  console.log("✓ Usuarios");

  // Proveedores (from CSV, first 50 real ones)
  try {
    const provCSV = parseCSV(path.join(CSV_DIR, "Proveedores.csv"));
    let count = 0;
    for (const row of provCSV) {
      if (!row["ID_Proveedor"] || !row["Razon_Social"] || row["Razon_Social"].startsWith("ID_")) continue;
      if (count >= 50) break;
      await prisma.proveedor.upsert({
        where: { codigo: row["ID_Proveedor"] },
        update: {},
        create: {
          codigo: row["ID_Proveedor"],
          razonSocial: row["Razon_Social"],
          cuit: row["CUIT"] || null,
          telefono: row["Telefono"] || null,
          email: row["Email"] || null,
          activo: row["Activo"] !== "NO",
          cbu: row["CBU"] || null,
          alias: row["Alias"] || null,
          titularCuenta: row["Titular_Cuenta"] || null,
          mailContacto: row["Mail_Contacto"] || null,
          whatsapp: row["WhatsApp"] || null,
        },
      });
      count++;
    }
    console.log(`✓ Proveedores (${count})`);
  } catch (e) {
    console.log("⚠ Proveedores CSV not found, skipping");
  }

  // Plan de Cuentas
  try {
    const cuentasCSV = parseCSV(path.join(CSV_DIR, "PlanCuentas.csv"));
    let count = 0;
    for (const row of cuentasCSV) {
      const emp = row["Empresa"];
      if (!emp || !row["Codigo"] || !row["Cuenta"] || emp === "Empresa") continue;
      const empresaId = empresaMap[emp];
      if (!empresaId) continue;
      await prisma.cuentaContable.upsert({
        where: { empresaId_codigo: { empresaId, codigo: row["Codigo"] } },
        update: {},
        create: {
          empresaId,
          codigo: row["Codigo"],
          nombre: row["Cuenta"],
          descripcion: row["Descripcion"] || null,
          areasHabilitadas: row["Areas_Habilitadas"] || null,
        },
      });
      count++;
    }
    console.log(`✓ CuentasContables (${count})`);
  } catch (e) {
    console.log("⚠ PlanCuentas CSV error:", e);
  }

  // Centros de Costo
  try {
    const ccCSV = parseCSV(path.join(CSV_DIR, "CentrosCosto.csv"));
    let count = 0;
    for (const row of ccCSV) {
      const emp = row["Empresa"];
      if (!emp || !row["Centro_Costos"] || emp === "Empresa") continue;
      const empresaId = emp === "TODAS" ? null : empresaMap[emp];
      if (emp !== "TODAS" && !empresaId) continue;
      await prisma.centroCosto.create({
        data: {
          empresaId: empresaId || null,
          nombre: row["Centro_Costos"],
          descripcion: row["Descripcion"] || null,
        },
      }).catch(() => {});
      count++;
    }
    console.log(`✓ CentrosCosto (${count})`);
  } catch (e) {
    console.log("⚠ CentrosCosto CSV error:", e);
  }

  console.log("✓ Seed completo");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

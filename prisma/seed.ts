import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const pool = new Pool({ 
  connectionString,
  options: '-c search_path=app'
});
const adapter = new PrismaPg(pool, { schema: 'app' });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Limpiando base de datos...');
  await prisma.movement.deleteMany({});
  await prisma.baja.deleteMany({});
  await prisma.transfer.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.asset.deleteMany({});

  console.log('Sembrando usuarios...');
  const user1 = await prisma.user.create({
    data: {
      fullName: 'Ramiro Mendoza Gonzales',
      ci: '4567890-CB',
      phone: '71234567',
      role: 'Administrador',
      username: 'admin',
      cargo: 'Jefe de Activos Fijos',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      fullName: 'Maria Elena Prado',
      ci: '7891230-LP',
      phone: '60123456',
      role: 'Supervisor',
      username: 'mprado',
      cargo: 'Encargada de Inventario',
    },
  });

  console.log('Sembrando activos fijos...');
  // 1. Servidor Rack Dell
  const asset1 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-001',
      name: 'Servidor Rack Dell PowerEdge R750 Xeon 32GB',
      status: 'Asignado',
      location: 'Centro de Cómputo - Facultad de Tecnología',
      category: 'Sistemas/TI',
      usefulLife: 5,
      origin: 'Compra',
      purchaseDate: new Date('2024-03-15T08:00:00Z'),
      entryDate: new Date('2024-03-20T08:00:00Z'),
      purchaseValue: 28500.0,
      warrantyMonths: 36,
      providerName: 'Dell Bolivia SRL',
      providerNit: '1020304025',
      providerPhone: '22446688',
    },
  });

  // 2. Proyector Epson
  const asset2 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-002',
      name: 'Proyector Epson PowerLite L520U Láser WUXGA',
      status: 'Nuevo',
      location: 'Aula Magna - Facultad de Medicina',
      category: 'Equipos de Oficina',
      usefulLife: 4,
      origin: 'Compra',
      purchaseDate: new Date('2025-06-10T08:00:00Z'),
      entryDate: new Date('2025-06-15T08:00:00Z'),
      purchaseValue: 9800.0,
      warrantyMonths: 24,
      providerName: 'Importadora Electrónica S.A.',
      providerNit: '1020498711',
      providerPhone: '44252525',
    },
  });

  // 3. Escritorio Ejecutivo
  const asset3 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-003',
      name: 'Escritorio Ejecutivo en L de Madera Roble con Cajonera',
      status: 'Asignado',
      location: 'Decanato - Facultad de Ciencias Económicas',
      category: 'Muebles y Enseres',
      usefulLife: 10,
      origin: 'Compra',
      purchaseDate: new Date('2022-01-10T08:00:00Z'),
      entryDate: new Date('2022-01-15T08:00:00Z'),
      purchaseValue: 3500.0,
      warrantyMonths: 12,
      providerName: 'Muebles Finos El Arce',
      providerNit: '150493022',
      providerPhone: '44521234',
    },
  });

  // 4. Camioneta Toyota Hilux
  const asset4 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-004',
      name: 'Camioneta Toyota Hilux Double Cab 4x4 Modelo 2023',
      status: 'Asignado',
      location: 'Departamento de Mantenimiento y Servicios',
      category: 'Vehículos',
      usefulLife: 5,
      origin: 'Compra',
      purchaseDate: new Date('2023-08-20T08:00:00Z'),
      entryDate: new Date('2023-08-25T08:00:00Z'),
      purchaseValue: 245000.0,
      warrantyMonths: 60,
      providerName: 'Toyosa S.A.',
      providerNit: '101230492',
      providerPhone: '44919000',
    },
  });

  // 5. Fotocopiadora Industrial
  const asset5 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-005',
      name: 'Fotocopiadora Industrial Ricoh Pro C5300s Color',
      status: 'Dañado',
      location: 'Imprenta Universitaria - Campus Central',
      category: 'Equipos de Oficina',
      usefulLife: 5,
      origin: 'Compra',
      purchaseDate: new Date('2023-02-12T08:00:00Z'),
      entryDate: new Date('2023-02-18T08:00:00Z'),
      purchaseValue: 68000.0,
      warrantyMonths: 12,
      providerName: 'Ricoh Bolivia Distribuidores',
      providerNit: '120938401',
      providerPhone: '22149500',
    },
  });

  // 6. Laptop Lenovo ThinkPad
  const asset6 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-006',
      name: 'Laptop Lenovo ThinkPad L14 Gen 4 Ryzen 7 16GB',
      status: 'Asignado',
      location: 'Dirección de Planificación - Rectorado',
      category: 'Sistemas/TI',
      usefulLife: 4,
      origin: 'Compra',
      purchaseDate: new Date('2025-01-20T08:00:00Z'),
      entryDate: new Date('2025-01-22T08:00:00Z'),
      purchaseValue: 7200.0,
      warrantyMonths: 12,
      providerName: 'Sisteco S.A.',
      providerNit: '102049021',
      providerPhone: '44589000',
    },
  });

  // 7. Impresora HP Laserjet (Obsoleta/Para dar de baja)
  const asset7 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-007',
      name: 'Impresora Multifuncional HP LaserJet Pro M428dw',
      status: 'Obsoleto',
      location: 'Secretaría General - Facultad de Humanidades',
      category: 'Equipos de Oficina',
      usefulLife: 3,
      origin: 'Compra',
      purchaseDate: new Date('2021-05-14T08:00:00Z'),
      entryDate: new Date('2021-05-18T08:00:00Z'),
      purchaseValue: 2500.0,
      warrantyMonths: 12,
      providerName: 'HP Store Bolivia',
      providerNit: '109823471',
      providerPhone: '33498000',
    },
  });

  // 8. Microscopio Óptico Binocular (Donación)
  const asset8 = await prisma.asset.create({
    data: {
      qrCode: 'ACT-2026-008',
      name: 'Microscopio Óptico Binocular Zeiss Primo Star 3',
      status: 'Asignado',
      location: 'Laboratorio de Microbiología - Bioquímica',
      category: 'Maquinaria',
      usefulLife: 8,
      origin: 'Donación',
      purchaseDate: new Date('2024-11-05T08:00:00Z'),
      entryDate: new Date('2024-11-10T08:00:00Z'),
      purchaseValue: 14500.0,
      warrantyMonths: 24,
      providerName: 'Embajada de Alemania (Donación)',
      providerNit: 'N/A',
      providerPhone: 'N/A',
    },
  });

  console.log('Sembrando transferencias...');
  await prisma.transfer.create({
    data: {
      assetId: asset6.id,
      fromUnit: 'Facultad de Tecnología',
      fromResponsible: 'Ing. Carlos Mendez',
      toUnit: 'Rectorado',
      toResponsible: 'Lic. Laura Terán',
      status: 'Aprobada',
      reason: 'Requerido para el plan de infraestructura y acreditación institucional.',
      date: new Date('2026-02-10T14:30:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      assetId: asset2.id,
      fromUnit: 'Almacén Central',
      fromResponsible: 'Ramiro Mendoza Gonzales',
      toUnit: 'Facultad de Medicina',
      toResponsible: 'Dra. Patricia Solares',
      status: 'Pendiente',
      reason: 'Solicitud formal para equipamiento de aula de posgrados.',
      date: new Date('2026-07-01T09:15:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      assetId: asset3.id,
      fromUnit: 'Facultad de Humanidades',
      fromResponsible: 'Lic. Andrés Torrico',
      toUnit: 'Facultad de Ciencias Económicas',
      toResponsible: 'Dr. Hugo Zeballos',
      status: 'Rechazada',
      reason: 'El activo se encuentra catalogado como de uso exclusivo y crítico para el área de acreditación actual.',
      date: new Date('2026-05-15T11:00:00Z'),
    },
  });

  console.log('Sembrando bajas SABS...');
  await prisma.baja.create({
    data: {
      assetId: asset7.id,
      jefeId: user1.id,
      justification: 'Obsolescencia tecnológica y costo de reparación elevado por desgaste de componentes internos principales.',
      evidence: 'informe_tecnico_hp428.pdf',
      status: 'Iniciada',
      initiatedAt: new Date('2026-06-25T16:00:00Z'),
    },
  });

  await prisma.baja.create({
    data: {
      assetId: asset5.id,
      jefeId: user1.id,
      justification: 'Inutilidad por daño irreparable en la placa principal tras corte eléctrico en el predio universitario.',
      evidence: 'acta_siniestro_ricoh.pdf',
      status: 'Aprobada',
      initiatedAt: new Date('2026-05-10T10:00:00Z'),
    },
  });

  console.log('Sembrando asignaciones...');
  await prisma.assignment.create({
    data: {
      assetId: asset1.id,
      responsible: 'Ing. Fernando Siles (Director TI)',
      destination: 'Servidores centralizados de la Facultad de Tecnología',
      observations: 'Requiere monitoreo continuo de temperatura.',
    },
  });

  await prisma.assignment.create({
    data: {
      assetId: asset4.id,
      responsible: 'Sr. Mario Rojas (Chofer Mantenimiento)',
      destination: 'Predios universitarios y facultades desconcentradas',
      observations: 'Uso exclusivo para traslado de personal técnico y herramientas.',
    },
  });

  console.log('Sembrado finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

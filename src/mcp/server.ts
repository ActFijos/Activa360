import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const server = new Server(
  {
    name: 'activa360-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Registrar herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_assets',
        description: 'Buscar activos registrados en el sistema por filtros.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nombre o descripción a buscar' },
            category: { type: 'string', description: 'Categoría (ej: Sistemas/TI, Vehículos, Muebles)' },
            status: { type: 'string', description: 'Estado (ej: Asignado, Nuevo, Dañado)' },
            location: { type: 'string', description: 'Ubicación física' },
          },
        },
      },
      {
        name: 'get_asset',
        description: 'Obtener información detallada de un activo específico por su ID o QR.',
        inputSchema: {
          type: 'object',
          properties: {
            assetId: { type: 'string', description: 'ID o código QR del activo (ej: ACT-2026-001)' },
          },
          required: ['assetId'],
        },
      },
      {
        name: 'get_user_assets',
        description: 'Obtener la lista de activos actualmente asignados a un responsable por su nombre.',
        inputSchema: {
          type: 'object',
          properties: {
            responsibleName: { type: 'string', description: 'Nombre completo del responsable' },
          },
          required: ['responsibleName'],
        },
      },
      {
        name: 'get_asset_history',
        description: 'Consultar el historial completo de transferencias, asignaciones, geolocalización e inspecciones de un activo.',
        inputSchema: {
          type: 'object',
          properties: {
            assetId: { type: 'string', description: 'ID o código QR del activo' },
          },
          required: ['assetId'],
        },
      },
      {
        name: 'get_asset_statistics',
        description: 'Obtener estadísticas consolidadas del inventario (total, categorías y estados).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Manejador para ejecutar las herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_assets': {
        const { query, category, status, location } = (args || {}) as any;
        const where: any = {};

        if (query) {
          where.name = { contains: query, mode: 'insensitive' };
        }
        if (category) {
          where.category = { contains: category, mode: 'insensitive' };
        }
        if (status) {
          where.status = { contains: status, mode: 'insensitive' };
        }
        if (location) {
          where.location = { contains: location, mode: 'insensitive' };
        }

        const assets = await prisma.asset.findMany({
          where,
          take: 15,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: assets.length,
                assets: assets.map(a => ({
                  id: a.id,
                  qrCode: a.qrCode,
                  name: a.name,
                  status: a.status,
                  category: a.category,
                  location: a.location,
                  purchaseValue: a.purchaseValue,
                })),
              }),
            },
          ],
        };
      }

      case 'get_asset': {
        const { assetId } = (args || {}) as any;
        const asset = await prisma.asset.findFirst({
          where: {
            OR: [
              { id: assetId },
              { qrCode: { equals: assetId, mode: 'insensitive' } },
              { qrCode: { contains: assetId, mode: 'insensitive' } },
            ],
          },
        });

        if (!asset) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Activo no encontrado' }) }],
          };
        }

        // Obtener asignación actual
        const currentAssignment = await prisma.assignment.findFirst({
          where: { assetId: asset.id },
          orderBy: { date: 'desc' },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                asset: {
                  ...asset,
                  responsable: currentAssignment ? currentAssignment.responsible : 'No asignado',
                },
              }),
            },
          ],
        };
      }

      case 'get_user_assets': {
        const { responsibleName } = (args || {}) as any;
        const assignments = await prisma.assignment.findMany({
          where: {
            responsible: { contains: responsibleName, mode: 'insensitive' },
          },
        });

        const assetIds = assignments.map(a => a.assetId);
        const assets = await prisma.asset.findMany({
          where: { id: { in: assetIds } },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                responsibleName,
                count: assets.length,
                assets: assets.map(a => ({
                  id: a.id,
                  qrCode: a.qrCode,
                  name: a.name,
                  status: a.status,
                  location: a.location,
                })),
              }),
            },
          ],
        };
      }

      case 'get_asset_history': {
        const { assetId } = (args || {}) as any;
        const asset = await prisma.asset.findFirst({
          where: {
            OR: [
              { id: assetId },
              { qrCode: { equals: assetId, mode: 'insensitive' } },
            ],
          },
        });

        if (!asset) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Activo no encontrado' }) }],
          };
        }

        const transfers = await prisma.transfer.findMany({ where: { assetId: asset.id } });
        const assignments = await prisma.assignment.findMany({ where: { assetId: asset.id } });
        const maintenances = await prisma.maintenanceReport.findMany({ where: { assetId: asset.id } });
        const movements = await prisma.movement.findMany({ where: { assetId: asset.id } });

        const history: any[] = [];
        history.push({
          date: asset.purchaseDate || asset.entryDate,
          type: 'Ingreso',
          detail: `Ingreso del activo al sistema. Valor: $us ${asset.purchaseValue}.`,
        });

        assignments.forEach(a => {
          history.push({
            date: a.date,
            type: 'Asignación',
            detail: `Asignado a ${a.responsible} en ${a.destination}. Obs: ${a.observations || 'Ninguna'}`,
          });
        });

        transfers.forEach(t => {
          history.push({
            date: t.date,
            type: 'Transferencia',
            detail: `Transferido de ${t.fromUnit} (${t.fromResponsible}) a ${t.toUnit} (${t.toResponsible}). Estado: ${t.status}. Motivo: ${t.reason}`,
          });
        });

        maintenances.forEach(m => {
          history.push({
            date: m.inspectedAt,
            type: 'Mantenimiento/Inspección',
            detail: `Diagnóstico: ${m.diagnosis}. Acción: ${m.action}. Costo est.: $us ${m.estimatedCost}`,
          });
        });

        movements.forEach(mov => {
          history.push({
            date: mov.scannedAt,
            type: 'Escaneo QR',
            detail: `Escaneado en coordenadas (${mov.latitude}, ${mov.longitude})`,
          });
        });

        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                asset: { qrCode: asset.qrCode, name: asset.name },
                history,
              }),
            },
          ],
        };
      }

      case 'get_asset_statistics': {
        const total = await prisma.asset.count();
        const assets = await prisma.asset.findMany();

        const categoryCounts: Record<string, number> = {};
        const statusCounts: Record<string, number> = {};

        assets.forEach(a => {
          categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                total,
                categories: categoryCounts,
                statuses: statusCounts,
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Herramienta no encontrada: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: error.message }),
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server de Activa360 corriendo vía stdio');
}

main().catch((error) => {
  console.error('Error fatal en MCP Server:', error);
  process.exit(1);
});

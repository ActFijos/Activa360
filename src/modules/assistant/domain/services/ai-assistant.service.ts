import { Injectable } from '@nestjs/common';
import {
  AiAssistantUseCase,
  AskQuestionDto,
  AskQuestionResponse,
} from '../ports/in/ai-assistant.use-case.js';
import { AiConversationRepositoryPort } from '../ports/out/ai-conversation-repository.port.js';
import { PrismaService } from '../../../compliance/adapters/out/db/prisma.service.js';

@Injectable()
export class AiAssistantService implements AiAssistantUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationRepo: AiConversationRepositoryPort,
  ) {}

  async preguntar(dto: AskQuestionDto): Promise<AskQuestionResponse> {
    const startTime = Date.now();
    let responseText = '';
    let toolUtilizada: string | undefined;
    let parametrosTool: any;

    try {
      // 1. Obtener detalles del usuario para validación de seguridad
      const user = await this.prisma.user.findUnique({
        where: { username: dto.usuarioId },
      });

      const userRole = user?.role || dto.rol || 'Inventariador';
      const userFullName = user?.fullName || 'Usuario';
      const userCargo = user?.cargo || '';

      // 2. Comunicar con Gemini o Fallback para determinar qué tool llamar
      const apiKey = process.env.GEMINI_API_KEY;
      let decidedToolCall: { name: string; args: any } | null = null;

      if (apiKey) {
        decidedToolCall = await this.callGeminiForToolSelection(
          dto.pregunta,
          apiKey,
        );
      }

      // Si no hay API key o no se seleccionó una tool vía API, usar el Router de Fallback offline
      if (!decidedToolCall) {
        decidedToolCall = this.fallbackToolRouter(dto.pregunta);
      }

      // 3. Ejecutar la tool seleccionada aplicando las reglas de seguridad
      toolUtilizada = decidedToolCall.name;
      parametrosTool = decidedToolCall.args;
      let toolResult: any;

      if (decidedToolCall.name === 'consultar_activos') {
        toolResult = await this.toolConsultarActivos(
          decidedToolCall.args,
          userRole,
          userFullName,
          userCargo,
        );
      } else if (decidedToolCall.name === 'buscar_activo_qr') {
        toolResult = await this.toolBuscarActivoQr(
          decidedToolCall.args,
          userRole,
          userFullName,
          userCargo,
        );
      } else if (decidedToolCall.name === 'obtener_historial_activo') {
        toolResult = await this.toolObtenerHistorialActivo(
          decidedToolCall.args,
          userRole,
          userFullName,
          userCargo,
        );
      } else {
        toolResult = { error: 'Herramienta no reconocida' };
      }

      // 4. Generar la respuesta en lenguaje natural (con Gemini o Fallback offline)
      if (apiKey && !toolResult.error) {
        responseText = await this.callGeminiForResponseGeneration(
          dto.pregunta,
          decidedToolCall.name,
          decidedToolCall.args,
          toolResult,
          apiKey,
        );
      } else {
        responseText = this.generateFallbackNaturalResponse(
          decidedToolCall.name,
          decidedToolCall.args,
          toolResult,
        );
      }
    } catch (error: any) {
      console.error('Error en Asistente IA:', error);
      responseText = `Lo siento, ocurrió un error interno al procesar tu consulta: ${error.message}`;
    } finally {
      // 5. Registrar en la tabla de auditoría (AI_CONVERSATIONS)
      const duration = Date.now() - startTime;
      await this.conversationRepo.save({
        usuarioId: dto.usuarioId,
        pregunta: dto.pregunta,
        respuesta: responseText,
        toolUtilizada: toolUtilizada || null,
        parametrosTool: parametrosTool ? JSON.stringify(parametrosTool) : null,
        duracion: duration,
      });
    }

    return {
      respuesta: responseText,
      toolUtilizada,
      parametrosTool,
    };
  }

  // --- MÉTODOS DE LAS HERRAMIENTAS (TOOLS) CON SEGURIDAD INTEGRADA ---

  private async toolConsultarActivos(
    args: any,
    role: string,
    fullName: string,
    cargo: string,
  ): Promise<any> {
    const where: any = {};

    // Regla de seguridad según Rol
    if (role === 'Administrador') {
      // Sin restricciones por defecto, pero aplica filtros si se especifican
      if (args.area) {
        where.OR = [
          { location: { contains: args.area, mode: 'insensitive' } },
          { category: { contains: args.area, mode: 'insensitive' } }
        ];
      }
    } else if (role === 'Supervisor') {
      // Puede ver activos de su departamento/área.
      // Determinamos su departamento basándonos en su cargo o en args.area
      const dept = this.extractDepartment(cargo);
      where.location = { contains: dept, mode: 'insensitive' };
    } else {
      // Usuario estándar: Solo puede consultar sus activos asignados
      // Buscamos las asignaciones donde él es responsable
      const assignments = await this.prisma.assignment.findMany({
        where: { responsible: { contains: fullName, mode: 'insensitive' } },
      });
      const assetIds = assignments.map((a) => a.assetId);
      where.id = { in: assetIds };
    }

    // Filtros opcionales adicionales
    if (args.tipoActivo) {
      where.category = { contains: args.tipoActivo, mode: 'insensitive' };
    }
    if (args.estado) {
      where.status = { contains: args.estado, mode: 'insensitive' };
    }
    if (args.responsable && role !== 'Inventariador') {
      // Filtro de responsable solo permitido para Admin/Supervisor
      const assignments = await this.prisma.assignment.findMany({
        where: {
          responsible: { contains: args.responsable, mode: 'insensitive' },
        },
      });
      const assetIds = assignments.map((a) => a.assetId);
      where.id = { in: assetIds };
    }

    const assets = await this.prisma.asset.findMany({
      where,
      take: 20, // Limitar a los primeros 20 para evitar saturar el modelo
    });

    const totalCount = await this.prisma.asset.count({ where });

    // Agrupación para el desglose
    const categoryCounts: Record<string, number> = {};
    assets.forEach((a) => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });

    return {
      total: totalCount,
      filteredCount: assets.length,
      categoriaDesglose: categoryCounts,
      activos: assets.map((a) => ({
        id: a.id,
        qrCode: a.qrCode,
        name: a.name,
        status: a.status,
        location: a.location,
        category: a.category,
        purchaseValue: a.purchaseValue,
      })),
    };
  }

  private async toolBuscarActivoQr(
    args: any,
    role: string,
    fullName: string,
    cargo: string,
  ): Promise<any> {
    const code = args.codigo;
    if (!code) return { error: 'Código no proveído' };

    // Buscar activo por QR o ID
    const asset = await this.prisma.asset.findFirst({
      where: {
        OR: [
          { qrCode: { equals: code, mode: 'insensitive' } },
          { qrCode: { contains: code, mode: 'insensitive' } },
          { id: code }
        ],
      },
    });

    if (!asset) {
      return { error: `No se encontró ningún activo con el código ${code}` };
    }

    // Validar permisos sobre este activo específico
    if (role === 'Administrador') {
      // Acceso total
    } else if (role === 'Supervisor') {
      // Validar si pertenece a su departamento
      const dept = this.extractDepartment(cargo);
      if (!asset.location.toLowerCase().includes(dept.toLowerCase())) {
        return {
          error:
            'No tiene permisos para ver este activo, pertenece a otro departamento.',
        };
      }
    } else {
      // Usuario estándar: Verificar que esté asignado a él
      const isAssigned = await this.prisma.assignment.findFirst({
        where: {
          assetId: asset.id,
          responsible: { contains: fullName, mode: 'insensitive' },
        },
      });
      if (!isAssigned) {
        return {
          error:
            'No tiene permisos para ver este activo. Solo puede consultar activos asignados a su persona.',
        };
      }
    }

    // Obtener responsable actual
    const currentAssignment = await this.prisma.assignment.findFirst({
      where: { assetId: asset.id },
      orderBy: { date: 'desc' },
    });

    return {
      activo: {
        id: asset.id,
        qrCode: asset.qrCode,
        name: asset.name,
        status: asset.status,
        location: asset.location,
        category: asset.category,
        purchaseValue: asset.purchaseValue,
        responsable: currentAssignment
          ? currentAssignment.responsible
          : 'No asignado',
      },
    };
  }

  private async toolObtenerHistorialActivo(
    args: any,
    role: string,
    fullName: string,
    cargo: string,
  ): Promise<any> {
    const codeOrId = args.activoId;
    if (!codeOrId) return { error: 'ID de activo no proveído' };

    // Buscar el activo primero para validar seguridad
    const asset = await this.prisma.asset.findFirst({
      where: {
        OR: [
          { id: codeOrId },
          { qrCode: { equals: codeOrId, mode: 'insensitive' } },
          { qrCode: { contains: codeOrId, mode: 'insensitive' } }
        ],
      },
    });

    if (!asset) {
      return { error: `No se encontró ningún activo con ID o QR ${codeOrId}` };
    }

    // Validar seguridad (mismas reglas que buscar_activo_qr)
    if (role === 'Administrador') {
      // Acceso total
    } else if (role === 'Supervisor') {
      const dept = this.extractDepartment(cargo);
      if (!asset.location.toLowerCase().includes(dept.toLowerCase())) {
        return {
          error:
            'No tiene permisos para consultar el historial de este activo.',
        };
      }
    } else {
      const isAssigned = await this.prisma.assignment.findFirst({
        where: {
          assetId: asset.id,
          responsible: { contains: fullName, mode: 'insensitive' },
        },
      });
      if (!isAssigned) {
        return {
          error:
            'No tiene permisos para consultar el historial de este activo.',
        };
      }
    }

    // Recopilar historial
    const transfers = await this.prisma.transfer.findMany({
      where: { assetId: asset.id },
    });
    const assignments = await this.prisma.assignment.findMany({
      where: { assetId: asset.id },
    });
    const maintenances = await this.prisma.maintenanceReport.findMany({
      where: { assetId: asset.id },
    });
    const movements = await this.prisma.movement.findMany({
      where: { assetId: asset.id },
    });

    // Formatear y consolidar eventos
    const events: any[] = [];

    // Agregar evento de ingreso/compra
    events.push({
      fecha: asset.purchaseDate || asset.entryDate,
      tipo: 'Ingreso',
      detalle: `Ingreso del activo al sistema por ${asset.origin}. Valor: $us ${asset.purchaseValue}.`,
    });

    assignments.forEach((a) => {
      events.push({
        fecha: a.date,
        tipo: 'Asignación',
        detalle: `Asignado a ${a.responsible} en ubicación ${a.destination}. Obs: ${a.observations || 'Ninguna'}`,
      });
    });

    transfers.forEach((t) => {
      events.push({
        fecha: t.date,
        tipo: 'Transferencia',
        detalle: `Transferido de ${t.fromUnit} (${t.fromResponsible}) a ${t.toUnit} (${t.toResponsible}). Estado: ${t.status}. Motivo: ${t.reason}`,
      });
    });

    maintenances.forEach((m) => {
      events.push({
        fecha: m.inspectedAt,
        tipo: 'Mantenimiento/Inspección',
        detalle: `Inspección técnica. Diagnóstico: ${m.diagnosis}. Acción recomendada: ${m.action}. Costo est.: $us ${m.estimatedCost}`,
      });
    });

    movements.forEach((mov) => {
      events.push({
        fecha: mov.scannedAt,
        tipo: 'Escaneo QR / Geolocalización',
        detalle: `Escaneado en coordenadas (${mov.latitude}, ${mov.longitude})`,
      });
    });

    // Ordenar de más reciente a más antiguo
    events.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    return {
      activo: {
        qrCode: asset.qrCode,
        name: asset.name,
      },
      historial: events,
    };
  }

  // --- INTEGRACIÓN DE GEMINI API ---

  private async callGeminiForToolSelection(
    pregunta: string,
    apiKey: string,
  ): Promise<{ name: string; args: any } | null> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Determina cuál herramienta llamar según la pregunta del usuario: "${pregunta}"`,
              },
            ],
          },
        ],
        tools: [
          {
            functionDeclarations: [
              {
                name: 'consultar_activos',
                description: 'Consultar activos registrados en el sistema.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    area: {
                      type: 'STRING',
                      description:
                        'Área, departamento o facultad (ej: Sistemas, Medicina, Decanato)',
                    },
                    tipoActivo: {
                      type: 'STRING',
                      description:
                        'Categoría o tipo (ej: Sistemas/TI, Vehículos, Muebles y Enseres, Equipos de Oficina)',
                    },
                    estado: {
                      type: 'STRING',
                      description:
                        'Estado físico o de asignación (ej: Asignado, Nuevo, Dañado, Obsoleto)',
                    },
                    responsable: {
                      type: 'STRING',
                      description: 'Nombre del responsable del activo',
                    },
                  },
                },
              },
              {
                name: 'buscar_activo_qr',
                description:
                  'Encontrar un activo específico mediante su código QR, código patrimonial o ID.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    codigo: {
                      type: 'STRING',
                      description: 'El código QR del activo (ej: ACT-2026-001)',
                    },
                  },
                  required: ['codigo'],
                },
              },
              {
                name: 'obtener_historial_activo',
                description:
                  'Consultar movimientos históricos, transferencias, asignaciones o inspecciones de un activo.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    activoId: {
                      type: 'STRING',
                      description:
                        'ID o código QR del activo (ej: ACT-2026-001 o UUID)',
                    },
                  },
                  required: ['activoId'],
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts;
      const functionCall = parts?.[0]?.functionCall;

      if (functionCall) {
        return {
          name: functionCall.name,
          args: functionCall.args || {},
        };
      }
    } catch (e) {
      console.warn('Error al llamar a Gemini para seleccionar tool:', e);
    }
    return null;
  }

  private async callGeminiForResponseGeneration(
    pregunta: string,
    toolName: string,
    toolArgs: any,
    toolResult: any,
    apiKey: string,
  ): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `
Actúas como un asistente inteligente de activos fijos (Activa360).
El usuario te preguntó: "${pregunta}"
Ejecutaste la herramienta "${toolName}" con los argumentos: ${JSON.stringify(toolArgs)}.
El resultado obtenido del sistema fue: ${JSON.stringify(toolResult)}.

Redacta una respuesta natural, clara y profesional en base a estos datos.
Evita formatear como JSON plano en tu respuesta. Si hay listas de activos, ordénalas de forma legible y amigable en Markdown.
Si la herramienta retornó un error, explícaselo al usuario de forma educada y directa.
`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return (
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No pude procesar la respuesta.'
        );
      }
    } catch (e) {
      console.warn(
        'Error al generar respuesta en lenguaje natural con Gemini:',
        e,
      );
    }
    return this.generateFallbackNaturalResponse(toolName, toolArgs, toolResult);
  }

  // --- LOGICA DE FALLBACK Y UTILERÍAS ---

  private fallbackToolRouter(pregunta: string): { name: string; args: any } {
    const q = pregunta.toLowerCase();

    // 1. Historial o movimientos
    if (
      q.includes('historial') ||
      q.includes('movimiento') ||
      q.includes('mantenimiento') ||
      q.includes('traslado')
    ) {
      const match = pregunta.match(/(ACT-\d+-\d+|\d+)/i);
      return {
        name: 'obtener_historial_activo',
        args: { activoId: match ? match[1].toUpperCase() : 'ACT-2026-006' },
      };
    }

    // 2. Buscar activo QR
    if (
      q.includes('busca') ||
      q.includes('qr') ||
      (q.includes('activo') &&
        (q.includes('código') || q.includes('code') || q.includes('num')))
    ) {
      const match = pregunta.match(/(ACT-\d+-\d+|\d+)/i);
      return {
        name: 'buscar_activo_qr',
        args: { codigo: match ? match[1].toUpperCase() : 'ACT-2026-001' },
      };
    }

    // 3. Consultar activos (Por defecto)
    let area = '';
    if (q.includes('sistemas') || q.includes('ti')) area = 'Sistemas/TI';
    else if (q.includes('medicina')) area = 'Medicina';
    else if (q.includes('econom')) area = 'Ciencias Económicas';
    else if (q.includes('humanidades')) area = 'Humanidades';

    let tipoActivo = '';
    if (
      q.includes('computadora') ||
      q.includes('laptop') ||
      q.includes('servidor')
    )
      tipoActivo = 'Sistemas/TI';
    else if (q.includes('escritorio') || q.includes('mueble'))
      tipoActivo = 'Muebles y Enseres';
    else if (q.includes('camioneta') || q.includes('vehiculo'))
      tipoActivo = 'Vehículos';

    let estado = '';
    if (q.includes('dañado') || q.includes('mal')) estado = 'Dañado';
    else if (q.includes('nuevo')) estado = 'Nuevo';
    else if (q.includes('asignado')) estado = 'Asignado';
    else if (q.includes('obsoleto')) estado = 'Obsoleto';

    return {
      name: 'consultar_activos',
      args: { area, tipoActivo, estado },
    };
  }

  private generateFallbackNaturalResponse(
    toolName: string,
    args: any,
    result: any,
  ): string {
    if (result.error) {
      return `⚠️ **Error de validación:** ${result.error}`;
    }

    if (toolName === 'consultar_activos') {
      let msg = `Encontré **${result.total} activos** registrados en el sistema. Desglose:\n\n`;
      Object.entries(result.categoriaDesglose).forEach(([cat, val]) => {
        msg += `- **${cat}:** ${val} unidades\n`;
      });
      msg += `\n**Últimos activos listados:**\n`;
      result.activos.forEach((a: any) => {
        msg += `- **${a.qrCode}:** ${a.name} (Estado: *${a.status}*, Ubicación: *${a.location}*)\n`;
      });
      return msg;
    }

    if (toolName === 'buscar_activo_qr') {
      const a = result.activo;
      return `🔍 **Activo encontrado:**
- **Código:** ${a.qrCode}
- **Descripción:** ${a.name}
- **Categoría:** ${a.category}
- **Responsable:** ${a.responsable}
- **Ubicación:** ${a.location}
- **Estado:** ${a.status}
- **Valor de Compra:** $us ${a.purchaseValue}`;
    }

    if (toolName === 'obtener_historial_activo') {
      let msg = `📋 **Historial de movimientos para el activo ${result.activo.qrCode} (${result.activo.name}):**\n\n`;
      result.historial.forEach((ev: any) => {
        const fechaStr = new Date(ev.fecha).toISOString().split('T')[0];
        msg += `📅 **${fechaStr}** - *${ev.tipo}*\n  ${ev.detalle}\n\n`;
      });
      return msg;
    }

    return 'Procesado correctamente.';
  }

  private extractDepartment(cargo: string): string {
    // Extraer palabras clave del cargo
    const c = cargo.toLowerCase();
    if (
      c.includes('sistemas') ||
      c.includes('computo') ||
      c.includes('tecnología')
    )
      return 'Tecnología';
    if (c.includes('medicina')) return 'Medicina';
    if (c.includes('económic') || c.includes('econom')) return 'Económicas';
    if (c.includes('humanidades')) return 'Humanidades';
    return '';
  }
}

import { Injectable } from '@nestjs/common';
import {
  AiAssistantMcpUseCase,
  AskQuestionMcpDto,
  AskQuestionMcpResponse,
} from '../ports/in/ai-assistant-mcp.use-case.js';
import { AiConversationRepositoryPort } from '../ports/out/ai-conversation-repository.port.js';
import { PrismaService } from '../../../compliance/adapters/out/db/prisma.service.js';
import { ChromaRagService } from './chroma-rag.service.js';

@Injectable()
export class AiAssistantMcpService implements AiAssistantMcpUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationRepo: AiConversationRepositoryPort,
    private readonly chromaRagService: ChromaRagService,
  ) {}

  async preguntar(dto: AskQuestionMcpDto): Promise<AskQuestionMcpResponse> {
    const startTime = Date.now();
    let responseText = '';
    let toolUtilizada: string | undefined;
    let parametrosTool: any;
    let sourceUsed = 'Generación Directa';

    try {
      // 1. Obtener detalles del usuario para validación de seguridad (Keycloak/Prisma integration)
      const user = await this.prisma.user.findUnique({
        where: { username: dto.usuarioId },
      });

      const userRole = user?.role || dto.rol || 'Inventariador';
      const userFullName = user?.fullName || 'Usuario';
      const userCargo = user?.cargo || '';

      // 2. Determinar la herramienta a invocar usando Gemini Function Calling
      const apiKey = process.env.GEMINI_API_KEY;
      let decidedToolCall: { name: string; args: any } | null = null;

      if (apiKey) {
        decidedToolCall = await this.callGeminiForToolSelection(dto.pregunta, apiKey);
      }

      // Fallback offline básico si no se detecta tool vía API o no hay API key
      if (!decidedToolCall) {
        decidedToolCall = this.fallbackToolRouter(dto.pregunta);
      }

      toolUtilizada = decidedToolCall.name;
      parametrosTool = decidedToolCall.args;
      let toolResult: any;

      // 3. Ejecutar la tool aplicando reglas de negocio y seguridad por rol
      if (decidedToolCall.name === 'search_knowledge_base') {
        sourceUsed = 'Manual de Usuario (Chroma Vector RAG)';
        toolResult = await this.chromaRagService.buscarEnBaseConocimiento(
          decidedToolCall.args.query,
          2
        );
      } else if (decidedToolCall.name === 'search_assets') {
        sourceUsed = 'Base de datos Activa360 (Vía MCP Tool)';
        toolResult = await this.executeMcpSearchAssets(
          decidedToolCall.args,
          userRole,
          userFullName,
          userCargo
        );
      } else if (decidedToolCall.name === 'get_asset') {
        sourceUsed = 'Base de datos Activa360 (Vía MCP Tool)';
        toolResult = await this.executeMcpGetAsset(
          decidedToolCall.args,
          userRole,
          userFullName,
          userCargo
        );
      } else if (decidedToolCall.name === 'get_user_assets') {
        sourceUsed = 'Base de datos Activa360 (Vía MCP Tool)';
        toolResult = await this.executeMcpGetUserAssets(
          decidedToolCall.args,
          userRole,
          userFullName
        );
      } else if (decidedToolCall.name === 'get_asset_history') {
        sourceUsed = 'Base de datos Activa360 (Vía MCP Tool)';
        toolResult = await this.executeMcpGetAssetHistory(
          decidedToolCall.args,
          userRole,
          userFullName,
          userCargo
        );
      } else if (decidedToolCall.name === 'get_asset_statistics') {
        sourceUsed = 'Base de datos Activa360 (Vía MCP Tool)';
        toolResult = await this.executeMcpGetAssetStatistics(userRole);
      } else {
        toolResult = { error: 'Herramienta no reconocida' };
      }

      // 4. Formatear respuesta final en lenguaje natural
      if (apiKey && !toolResult.error) {
        responseText = await this.callGeminiForResponseGeneration(
          dto.pregunta,
          decidedToolCall.name,
          decidedToolCall.args,
          toolResult,
          apiKey
        );
      } else {
        responseText = this.generateFallbackNaturalResponse(
          decidedToolCall.name,
          decidedToolCall.args,
          toolResult
        );
      }

    } catch (error: any) {
      console.error('Error en Agente IA MCP:', error);
      responseText = `Ocurrió un error en el Agente MCP: ${error.message}`;
    } finally {
      // 5. Registro de Auditoría
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
      fuente: sourceUsed,
    };
  }

  // --- EJECUCIÓN INTERNA DE MCP TOOLS APLICANDO GUARDRAILS ---

  private async executeMcpSearchAssets(args: any, role: string, fullName: string, cargo: string) {
    const where: any = {};
    
    // Guardrail de seguridad por rol
    if (role === 'Supervisor') {
      const dept = this.extractDepartment(cargo);
      where.location = { contains: dept, mode: 'insensitive' };
    } else if (role !== 'Administrador' && role !== 'Inventariador') {
      // Usuario estándar: solo ve sus propios activos
      const assignments = await this.prisma.assignment.findMany({
        where: { responsible: { contains: fullName, mode: 'insensitive' } },
      });
      const assetIds = assignments.map(a => a.assetId);
      where.id = { in: assetIds };
    }

    if (args.query) {
      where.name = { contains: args.query, mode: 'insensitive' };
    }
    if (args.category) {
      where.category = { contains: args.category, mode: 'insensitive' };
    }
    if (args.status) {
      where.status = { contains: args.status, mode: 'insensitive' };
    }
    if (args.location) {
      where.location = { contains: args.location, mode: 'insensitive' };
    }

    const assets = await this.prisma.asset.findMany({ where, take: 10 });
    return { success: true, assets };
  }

  private async executeMcpGetAsset(args: any, role: string, fullName: string, cargo: string) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        OR: [
          { id: args.assetId },
          { qrCode: { equals: args.assetId, mode: 'insensitive' } },
          { qrCode: { contains: args.assetId, mode: 'insensitive' } },
        ],
      },
    });

    if (!asset) return { error: 'Activo no encontrado' };

    // Guardrail
    if (role === 'Supervisor') {
      const dept = this.extractDepartment(cargo);
      if (!asset.location.toLowerCase().includes(dept.toLowerCase())) {
        return { error: 'Acceso no autorizado para este departamento.' };
      }
    } else if (role !== 'Administrador' && role !== 'Inventariador') {
      const isAssigned = await this.prisma.assignment.findFirst({
        where: { assetId: asset.id, responsible: { contains: fullName, mode: 'insensitive' } },
      });
      if (!isAssigned) return { error: 'No autorizado. Solo puede ver activos asignados a su persona.' };
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: { assetId: asset.id },
      orderBy: { date: 'desc' },
    });

    return { success: true, asset: { ...asset, responsable: assignment?.responsible || 'No asignado' } };
  }

  private async executeMcpGetUserAssets(args: any, role: string, fullName: string) {
    // Si no es admin o supervisor, forzar a consultar solo sí mismo
    let searchName = args.responsibleName;
    if (role !== 'Administrador' && role !== 'Supervisor') {
      searchName = fullName;
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { responsible: { contains: searchName, mode: 'insensitive' } },
    });

    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assignments.map(a => a.assetId) } },
    });

    return { success: true, responsibleName: searchName, assets };
  }

  private async executeMcpGetAssetHistory(args: any, role: string, fullName: string, cargo: string) {
    // Reutilizar validación de get_asset
    const accessCheck = await this.executeMcpGetAsset(args, role, fullName, cargo);
    if (accessCheck.error || !accessCheck.asset) return accessCheck;

    const assetId = accessCheck.asset.id;
    const transfers = await this.prisma.transfer.findMany({ where: { assetId } });
    const assignments = await this.prisma.assignment.findMany({ where: { assetId } });
    const maintenances = await this.prisma.maintenanceReport.findMany({ where: { assetId } });
    
    const history: any[] = [];
    assignments.forEach(a => {
      history.push({ date: a.date, type: 'Asignación', detail: `Asignado a ${a.responsible} en ${a.destination}` });
    });
    transfers.forEach(t => {
      history.push({ date: t.date, type: 'Transferencia', detail: `De ${t.fromResponsible} a ${t.toResponsible}. Motivo: ${t.reason}` });
    });
    maintenances.forEach(m => {
      history.push({ date: m.inspectedAt, type: 'Mantenimiento', detail: `Diagnóstico: ${m.diagnosis}. Acción: ${m.action}` });
    });

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { success: true, asset: accessCheck.asset, history };
  }

  private async executeMcpGetAssetStatistics(role: string) {
    if (role !== 'Administrador' && role !== 'Supervisor') {
      return { error: 'No autorizado para ver estadísticas globales.' };
    }
    const total = await this.prisma.asset.count();
    const assets = await this.prisma.asset.findMany({ select: { category: true, status: true } });

    const categories: Record<string, number> = {};
    assets.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1;
    });

    return { success: true, total, categories };
  }

  // --- GEMINI INTEGRATION ---

  private async callGeminiForToolSelection(pregunta: string, apiKey: string): Promise<{ name: string; args: any } | null> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: `Analiza la consulta del usuario y determina qué herramienta ejecutar: "${pregunta}"` }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: 'search_knowledge_base',
                description: 'Buscar en el manual de usuario y documentación del SCAF (RAG) sobre procesos, roles, conceptos o preguntas frecuentes.',
                parameters: {
                  type: 'OBJECT',
                  properties: { query: { type: 'STRING', description: 'Términos de búsqueda semántica' } },
                  required: ['query'],
                },
              },
              {
                name: 'search_assets',
                description: 'Buscar activos en la base de datos de Activa360 aplicando filtros.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    query: { type: 'STRING' },
                    category: { type: 'STRING' },
                    status: { type: 'STRING' },
                    location: { type: 'STRING' },
                  },
                },
              },
              {
                name: 'get_asset',
                description: 'Obtener detalles de un activo por ID o QR.',
                parameters: {
                  type: 'OBJECT',
                  properties: { assetId: { type: 'STRING' } },
                  required: ['assetId'],
                },
              },
              {
                name: 'get_user_assets',
                description: 'Listar activos asignados a un responsable.',
                parameters: {
                  type: 'OBJECT',
                  properties: { responsibleName: { type: 'STRING' } },
                  required: ['responsibleName'],
                },
              },
              {
                name: 'get_asset_history',
                description: 'Ver historial de movimientos e inspecciones de un activo.',
                parameters: {
                  type: 'OBJECT',
                  properties: { assetId: { type: 'STRING' } },
                  required: ['assetId'],
                },
              },
              {
                name: 'get_asset_statistics',
                description: 'Ver estadísticas globales del inventario.',
                parameters: { type: 'OBJECT', properties: {} },
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
      const functionCall = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      if (functionCall) {
        return { name: functionCall.name, args: functionCall.args || {} };
      }
    } catch (e) {
      console.warn('Error al seleccionar tool en agente MCP:', e);
    }
    return null;
  }

  private async callGeminiForResponseGeneration(
    pregunta: string,
    toolName: string,
    toolArgs: any,
    toolResult: any,
    apiKey: string
  ): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      let prompt = '';

      if (toolName === 'search_knowledge_base') {
        const docsContext = toolResult.map((r: any) => `[Sección: ${r.metadata.section}]\n${r.contenido}`).join('\n\n');
        prompt = `
Actúas como un Agente de Asistencia Avanzada para Activa360.
El usuario preguntó: "${pregunta}"
Buscaste en el Manual del Usuario de Activa360 (RAG) y encontraste estas secciones:
${docsContext}

Responde de forma clara, educada y profesional en base únicamente a las secciones encontradas.
Indica siempre en qué sección del manual se encuentra la información al responder.
`;
      } else {
        prompt = `
Actúas como un Agente de Asistencia Avanzada de Activa360 (MCP).
El usuario preguntó: "${pregunta}"
Ejecutaste la herramienta MCP "${toolName}" con argumentos: ${JSON.stringify(toolArgs)}.
Resultado de la base de datos: ${JSON.stringify(toolResult)}.

Redacta una respuesta amigable, legible, profesional y estructurada en Markdown.
Si la herramienta retornó un error, explícalo cortésmente.
`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude procesar la respuesta.';
      }
    } catch (e) {
      console.warn('Error al generar respuesta en lenguaje natural:', e);
    }
    return this.generateFallbackNaturalResponse(toolName, toolArgs, toolResult);
  }

  private fallbackToolRouter(pregunta: string): { name: string; args: any } {
    const q = pregunta.toLowerCase();
    
    // 1. Estadísticas
    if (q.includes('estadística') || q.includes('resumen') || q.includes('total') || q.includes('cantidad') || q.includes('cuanto')) {
      return { name: 'get_asset_statistics', args: {} };
    }

    // 2. Manual / RAG
    if (
      q.includes('manual') || 
      q.includes('como') || 
      q.includes('cómo') || 
      q.includes('registrar') || 
      q.includes('registro') || 
      q.includes('procedimiento') || 
      q.includes('objetivo') || 
      q.includes('rol') ||
      q.includes('baja sabs') ||
      q.includes('scaf') ||
      q.includes('introducción') ||
      q.includes('faq') ||
      q.includes('preguntas')
    ) {
      return { name: 'search_knowledge_base', args: { query: pregunta } };
    }

    // 3. Historial de activo
    if (
      q.includes('historial') || 
      q.includes('movimiento') || 
      q.includes('trazabilidad') ||
      q.includes('tuvo') || 
      q.includes('anterior') ||
      q.includes('propietario') ||
      q.includes('antes')
    ) {
      const match = pregunta.match(/(UMSS-SCAF-\d+|ACT-\d+-\d+|ACT-[A-Z0-9-]+|UMSS-[A-Z0-9-]+|\d+)/i);
      return {
        name: 'get_asset_history',
        args: { assetId: match ? match[1].toUpperCase() : 'ACT-2026-001' }
      };
    }

    // 4. Buscar por código específico (Get asset)
    if (q.includes('activo') && (q.includes('código') || q.includes('qr') || q.includes('id') || /(UMSS-SCAF-\d+|ACT-\d+-\d+|ACT-[A-Z0-9-]+|UMSS-[A-Z0-9-]+)/i.test(pregunta))) {
      const match = pregunta.match(/(UMSS-SCAF-\d+|ACT-\d+-\d+|ACT-[A-Z0-9-]+|UMSS-[A-Z0-9-]+)/i);
      if (match) {
        return { name: 'get_asset', args: { assetId: match[1].toUpperCase() } };
      }
    }

    // 5. Activos de un usuario
    if (q.includes('usuario') || q.includes('tiene') || q.includes('responsable') || q.includes('asignado a')) {
      let name = 'Ramiro';
      if (q.includes('maria') || q.includes('elena') || q.includes('prado')) {
        name = 'Maria Elena Prado';
      } else if (q.includes('ramiro') || q.includes('mendoza')) {
        name = 'Ramiro Mendoza Gonzales';
      }
      return { name: 'get_user_assets', args: { responsibleName: name } };
    }
 
    // Por defecto, buscar activos
    let category: string | undefined;
    if (q.includes('sistemas') || q.includes('ti') || q.includes('computadora') || q.includes('servidor')) {
      category = 'Sistemas/TI';
    } else if (q.includes('mueble') || q.includes('enseres') || q.includes('escritorio') || q.includes('silla')) {
      category = 'Muebles y Enseres';
    } else if (q.includes('oficina') || q.includes('proyector')) {
      category = 'Equipos de Oficina';
    } else if (q.includes('vehículo') || q.includes('camioneta') || q.includes('auto')) {
      category = 'Vehículos';
    }

    let location: string | undefined;
    if (q.includes('tecnología') || q.includes('cómputo')) {
      location = 'Tecnología';
    } else if (q.includes('medicina')) {
      location = 'Medicina';
    } else if (q.includes('económica') || q.includes('decanato')) {
      location = 'Económicas';
    }

    let status: string | undefined;
    if (q.includes('asignado')) {
      status = 'Asignado';
    } else if (q.includes('nuevo')) {
      status = 'Nuevo';
    } else if (q.includes('dañado')) {
      status = 'Dañado';
    } else if (q.includes('obsoleto')) {
      status = 'Obsoleto';
    }

    // Limpiar el query quitando palabras comunes de filtrado para que no interfieran en la descripción
    const cleanQuery = pregunta
      .replace(/(buscar|busca|activos|activo|dame|muestrame|los|las|de|en|un|una|la|categoría|categoria|ubicación|ubicacion|estado|sistemas|ti|muebles|enseres|equipos|oficina|vehículos|vehiculo|tecnología|computo|medicina|económicas|economicas)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      name: 'search_assets',
      args: {
        query: cleanQuery.length > 1 ? cleanQuery : undefined,
        category,
        location,
        status
      }
    };
  }

  private generateFallbackNaturalResponse(toolName: string, args: any, result: any): string {
    if (result.error) return `⚠️ **Error:** ${result.error}`;

    if (toolName === 'search_knowledge_base') {
      return `📚 **Resultados de la documentación (RAG):**\n\n` + 
        result.map((r: any) => `📌 **Sección: ${r.metadata.section}**\n${r.contenido}`).join('\n\n');
    }

    if (toolName === 'get_asset_statistics') {
      let response = `📊 **Estadísticas Generales del Inventario:**\n\n`;
      response += `- **Total de Activos:** ${result.total}\n\n`;
      response += `**Desglose por Categorías:**\n`;
      for (const [cat, count] of Object.entries(result.categories || {})) {
        response += `- **${cat}:** ${count} unidades\n`;
      }
      return response;
    }

    if (toolName === 'search_assets') {
      if (!result.assets || result.assets.length === 0) {
        return `🔍 No se encontraron activos que coincidan con la búsqueda "${args.query || ''}".`;
      }
      let response = `🔍 **Activos encontrados en el sistema (MCP):**\n\n`;
      result.assets.forEach((a: any) => {
        response += `- **${a.qrCode}**: ${a.name} (Estado: *${a.status}*, Ubicación: *${a.location}*)\n`;
      });
      return response;
    }

    if (toolName === 'get_asset') {
      const a = result.asset;
      return `🔍 **Detalle del Activo (MCP):**\n\n` +
        `- **Código QR**: ${a.qrCode}\n` +
        `- **Nombre**: ${a.name}\n` +
        `- **Categoría**: ${a.category}\n` +
        `- **Ubicación**: ${a.location}\n` +
        `- **Estado**: ${a.status}\n` +
        `- **Responsable**: ${a.responsable}\n` +
        `- **Valor**: $us ${a.purchaseValue}`;
    }

    if (toolName === 'get_user_assets') {
      if (!result.assets || result.assets.length === 0) {
        return `👤 El usuario **${result.responsibleName}** no tiene activos asignados actualmente.`;
      }
      let response = `👤 **Activos asignados a ${result.responsibleName}:**\n\n`;
      result.assets.forEach((a: any) => {
        response += `- **${a.qrCode}**: ${a.name} (Ubicación: *${a.location}*)\n`;
      });
      return response;
    }

    if (toolName === 'get_asset_history') {
      let response = `📋 **Historial para el activo ${result.asset.qrCode} (${result.asset.name}):**\n\n`;
      result.history.forEach((h: any) => {
        const dateStr = new Date(h.date).toISOString().split('T')[0];
        response += `📅 **${dateStr}** - *${h.type}*\n  ${h.detail}\n\n`;
      });
      return response;
    }

    return `Resultado de la herramienta ${toolName}: ${JSON.stringify(result)}`;
  }

  private extractDepartment(cargo: string): string {
    const c = cargo.toLowerCase();
    if (c.includes('sistemas') || c.includes('tecnolog')) return 'Sistemas';
    return '';
  }
}

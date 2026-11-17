import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAssistantMcpUseCase } from '../../../domain/ports/in/ai-assistant-mcp.use-case.js';

@ApiTags('asistente')
@Controller('asistente-ia-mcp')
export class AiAssistantMcpController {
  constructor(private readonly useCase: AiAssistantMcpUseCase) {}

  @Post('preguntar')
  @ApiOperation({
    summary: 'Consultar al Asistente IA con herramientas MCP',
    description: 'Envía una consulta asistida por herramientas de contexto Model Context Protocol para activos fijos.',
  })
  @ApiResponse({ status: 200, description: 'Respuesta generada vía protocolo MCP' })
  async preguntar(
    @Body() body: { pregunta: string; modulo?: string; pantalla?: string },
    @Headers('x-user-username') usernameHeader?: string,
  ) {
    const username = usernameHeader || 'admin';
    return this.useCase.preguntar({
      pregunta: body.pregunta,
      usuarioId: username,
      rol: 'Administrador',
      modulo: body.modulo,
      pantalla: body.pantalla,
    });
  }
}

import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AiAssistantMcpUseCase } from '../../../domain/ports/in/ai-assistant-mcp.use-case.js';

@Controller('asistente-ia-mcp')
export class AiAssistantMcpController {
  constructor(private readonly useCase: AiAssistantMcpUseCase) {}

  @Post('preguntar')
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

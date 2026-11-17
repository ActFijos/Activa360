import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAssistantUseCase } from '../../../domain/ports/in/ai-assistant.use-case.js';

@ApiTags('asistente')
@Controller('asistente-ia')
export class AiAssistantController {
  constructor(private readonly useCase: AiAssistantUseCase) {}

  @Post('preguntar')
  @ApiOperation({
    summary: 'Consultar al Asistente Inteligente de Activos Fijos',
    description: 'Envía una consulta en lenguaje natural sobre activos patrimoniales, normativas o procedimientos.',
  })
  @ApiResponse({ status: 200, description: 'Respuesta generada por el asistente inteligente' })
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

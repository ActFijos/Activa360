import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AiAssistantUseCase } from '../../../domain/ports/in/ai-assistant.use-case.js';

@Controller('asistente-ia')
export class AiAssistantController {
  constructor(private readonly useCase: AiAssistantUseCase) {}

  @Post('preguntar')
  async preguntar(
    @Body() body: { pregunta: string; modulo?: string; pantalla?: string },
    @Headers('x-user-username') usernameHeader?: string,
  ) {
    const username = usernameHeader || 'admin'; // Fallback a admin para testing fácil

    // Asumimos un rol predeterminado si no se encuentra (el servicio lo validará en la DB)
    return this.useCase.preguntar({
      pregunta: body.pregunta,
      usuarioId: username,
      rol: 'Administrador', // Rol por defecto, el servicio buscará el rol real en la DB
      modulo: body.modulo,
      pantalla: body.pantalla,
    });
  }
}

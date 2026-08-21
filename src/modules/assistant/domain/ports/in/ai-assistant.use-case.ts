export interface AskQuestionDto {
  pregunta: string;
  usuarioId: string;
  rol: string;
  area?: string;
  modulo?: string;
  pantalla?: string;
}

export interface AskQuestionResponse {
  respuesta: string;
  toolUtilizada?: string;
  parametrosTool?: any;
}

export abstract class AiAssistantUseCase {
  abstract preguntar(dto: AskQuestionDto): Promise<AskQuestionResponse>;
}

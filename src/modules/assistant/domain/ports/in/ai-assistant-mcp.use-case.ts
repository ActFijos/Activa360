export interface AskQuestionMcpDto {
  pregunta: string;
  usuarioId: string;
  rol: string;
  modulo?: string;
  pantalla?: string;
}

export interface AskQuestionMcpResponse {
  respuesta: string;
  fuente?: string;
  pasos?: string[];
}

export abstract class AiAssistantMcpUseCase {
  abstract preguntar(dto: AskQuestionMcpDto): Promise<AskQuestionMcpResponse>;
}

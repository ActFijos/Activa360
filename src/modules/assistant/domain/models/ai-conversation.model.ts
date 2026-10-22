export class AiConversation {
  constructor(
    public readonly id: string,
    public readonly usuarioId: string,
    public readonly pregunta: string,
    public readonly respuesta: string,
    public readonly toolUtilizada: string | null,
    public readonly parametrosTool: string | null,
    public readonly fecha: Date,
    public readonly duracion: number,
  ) {}
}

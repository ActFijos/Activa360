import { Injectable } from '@nestjs/common';
import { AiConversationRepositoryPort } from '../../../domain/ports/out/ai-conversation-repository.port.js';
import { AiConversation } from '../../../domain/models/ai-conversation.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Injectable()
export class PrismaAiConversationRepository implements AiConversationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    conversation: Omit<AiConversation, 'id' | 'fecha'>,
  ): Promise<AiConversation> {
    const record = await this.prisma.aiConversation.create({
      data: {
        usuarioId: conversation.usuarioId,
        pregunta: conversation.pregunta,
        respuesta: conversation.respuesta,
        toolUtilizada: conversation.toolUtilizada,
        parametrosTool: conversation.parametrosTool,
        duracion: conversation.duracion,
      },
    });

    return new AiConversation(
      record.id,
      record.usuarioId,
      record.pregunta,
      record.respuesta,
      record.toolUtilizada,
      record.parametrosTool,
      record.fecha,
      record.duracion,
    );
  }
}

import { Module } from '@nestjs/common';
import { AiAssistantUseCase } from './domain/ports/in/ai-assistant.use-case.js';
import { AiAssistantService } from './domain/services/ai-assistant.service.js';
import { AiConversationRepositoryPort } from './domain/ports/out/ai-conversation-repository.port.js';
import { PrismaAiConversationRepository } from './adapters/out/persistence/prisma-ai-conversation.repository.js';
import { AiAssistantController } from './adapters/in/web/ai-assistant.controller.js';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service.js';

@Module({
  controllers: [AiAssistantController],
  providers: [
    PrismaService,
    {
      provide: AiAssistantUseCase,
      useClass: AiAssistantService,
    },
    {
      provide: AiConversationRepositoryPort,
      useClass: PrismaAiConversationRepository,
    },
  ],
  exports: [AiAssistantUseCase],
})
export class AssistantModule {}

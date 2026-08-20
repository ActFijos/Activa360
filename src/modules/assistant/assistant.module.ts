import { Module } from '@nestjs/common';
import { AiAssistantUseCase } from './domain/ports/in/ai-assistant.use-case.js';
import { AiAssistantService } from './domain/services/ai-assistant.service.js';
import { AiConversationRepositoryPort } from './domain/ports/out/ai-conversation-repository.port.js';
import { PrismaAiConversationRepository } from './adapters/out/persistence/prisma-ai-conversation.repository.js';
import { AiAssistantController } from './adapters/in/web/ai-assistant.controller.js';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service.js';

// Nuevas dependencias de Agente MCP + Chroma
import { ChromaRagService } from './domain/services/chroma-rag.service.js';
import { AiAssistantMcpUseCase } from './domain/ports/in/ai-assistant-mcp.use-case.js';
import { AiAssistantMcpService } from './domain/services/ai-assistant-mcp.service.js';
import { AiAssistantMcpController } from './adapters/in/web/ai-assistant-mcp.controller.js';

@Module({
  controllers: [AiAssistantController, AiAssistantMcpController],
  providers: [
    PrismaService,
    ChromaRagService,
    {
      provide: AiAssistantUseCase,
      useClass: AiAssistantService,
    },
    {
      provide: AiAssistantMcpUseCase,
      useClass: AiAssistantMcpService,
    },
    {
      provide: AiConversationRepositoryPort,
      useClass: PrismaAiConversationRepository,
    },
  ],
  exports: [AiAssistantUseCase, AiAssistantMcpUseCase],
})
export class AssistantModule {}

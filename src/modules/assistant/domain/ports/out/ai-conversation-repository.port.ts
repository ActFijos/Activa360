import { AiConversation } from '../../models/ai-conversation.model.js';

export abstract class AiConversationRepositoryPort {
  abstract save(
    conversation: Omit<AiConversation, 'id' | 'fecha'>,
  ): Promise<AiConversation>;
}

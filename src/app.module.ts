import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AssistantModule } from './modules/assistant/assistant.module.js';

@Module({
  imports: [InventoryModule, ComplianceModule, AssistantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

@Module({
  imports: [InventoryModule, ComplianceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

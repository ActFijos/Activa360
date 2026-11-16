import { Module } from '@nestjs/common';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service';
import { ReportsServiceController } from './reports-service.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsServiceController],
  providers: [PrismaService, ReportsService],
})
export class ReportsServicioModule {}


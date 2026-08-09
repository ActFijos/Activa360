import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AssignAssetUseCase } from '../../../domain/ports/in/assign-asset.use-case.js';
import { AssignmentRepositoryPort } from '../../../domain/ports/out/assignment-repository.port.js';
import { AssignAssetDto } from './dto/assign-asset.dto.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Controller('activos')
export class AssignAssetController {
  constructor(
    private readonly assignAssetUseCase: AssignAssetUseCase,
    private readonly assignmentRepository: AssignmentRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  @Post('asignar')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async assignAsset(@Body() dto: AssignAssetDto) {
    return this.assignAssetUseCase.execute({
      assetId: dto.assetId,
      responsible: dto.responsible,
      date: new Date(dto.date),
      destination: dto.destination,
      observations: dto.observations,
    });
  }

  @Get('asignaciones')
  async getAssignments() {
    return this.assignmentRepository.findAll();
  }

  @Get('empleados')
  async getEmployees() {
    const users = await this.prisma.user.findMany({
      orderBy: { fullName: 'asc' },
    });
    if (users.length === 0) {
      // Fallback a personal UMSS realista si no hay cargados en la tabla
      return [
        {
          id: 'u1',
          fullName: 'Ing. Carlos Pérez (Director TI)',
          role: 'Supervisor',
        },
        {
          id: 'u2',
          fullName: 'Dra. Ana María Gómez (Decana)',
          role: 'Supervisor',
        },
        {
          id: 'u3',
          fullName: 'Lic. Ramiro Mendoza (Encargado Almacén)',
          role: 'Supervisor',
        },
        {
          id: 'u4',
          fullName: 'Ing. Sonia Rojas (Jefe Administrativo)',
          role: 'Supervisor',
        },
      ];
    }
    return users;
  }
}

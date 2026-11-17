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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssignAssetUseCase } from '../../../domain/ports/in/assign-asset.use-case.js';
import { AssignmentRepositoryPort } from '../../../domain/ports/out/assignment-repository.port.js';
import { AssignAssetDto } from './dto/assign-asset.dto.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@ApiTags('activos')
@Controller('activos')
export class AssignAssetController {
  constructor(
    private readonly assignAssetUseCase: AssignAssetUseCase,
    private readonly assignmentRepository: AssignmentRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  @Post('asignar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar activo a un custodio o funcionario',
    description: 'Establece la responsabilidad de custodia física de un activo patrimonial a un funcionario.',
  })
  @ApiResponse({ status: 200, description: 'Asignación realizada exitosamente' })
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
  @ApiOperation({
    summary: 'Listar historial de asignaciones de custodia',
    description: 'Obtiene la lista de todas las asignaciones históricas y vigentes de activos a custodios.',
  })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones obtenida exitosamente' })
  async getAssignments() {
    return this.assignmentRepository.findAll();
  }

  @Get('empleados')
  @ApiOperation({
    summary: 'Listar empleados y custodios habilitados',
    description: 'Obtiene la nómina de empleados habilitados para recibir la custodia de bienes patrimoniales.',
  })
  @ApiResponse({ status: 200, description: 'Lista de empleados obtenida' })
  async getEmployees() {
    const users = await this.prisma.user.findMany({
      orderBy: { fullName: 'asc' },
    });
    if (users.length === 0) {
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

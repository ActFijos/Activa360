import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { RegisterInventoryScanUseCase } from '../../../domain/ports/in/register-inventory-scan.use-case.js';

class RegisterInventoryScanDto {
  @ApiProperty({ description: 'ID de la campaña de inventario', example: 'camp-2026-q4' })
  campaignId: string;

  @ApiProperty({ description: 'ID del activo escaneado (QR)', example: 'asset-abc-123' })
  assetId: string;

  @ApiProperty({ description: 'ID del usuario que realiza el escaneo', example: 'user-xyz-789' })
  userId: string;
}

/**
 * POST /inventory/scan
 *
 * Registra el escaneo QR de un activo dentro de una campaña de inventario.
 * Respuestas:
 *   201 Created  — registro creado correctamente.
 *   409 Conflict — el activo ya fue registrado en esta campaña (duplicado).
 *   404 Not Found — el activo no existe.
 */
@ApiTags('inventario')
@Controller('inventory')
export class InventoryScanController {
  constructor(
    private readonly registerInventoryScan: RegisterInventoryScanUseCase,
  ) {}

  @Post('scan')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar escaneo QR de activo en campaña de inventario',
    description:
      'Persiste el registro de un activo escaneado dentro de una campaña. ' +
      'Garantiza que dos escaneos concurrentes del mismo activo en la misma campaña ' +
      'no generan duplicados (restricción UNIQUE en PostgreSQL). ' +
      'Caso de uso FSD: UC-INV-001.',
  })
  @ApiBody({ type: RegisterInventoryScanDto })
  @ApiResponse({
    status: 201,
    description: 'Activo registrado correctamente en el inventario de la campaña.',
    schema: {
      example: {
        message: 'Activo registrado en el inventario correctamente.',
        record: {
          id: 'uuid-v4',
          campaignId: 'camp-2026-q4',
          assetId: 'asset-abc-123',
          userId: 'user-xyz-789',
          createdAt: '2026-10-22T20:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto — el activo ya fue registrado en esta campaña (duplicado rechazado).',
    schema: {
      example: {
        statusCode: 409,
        message: 'El activo asset-abc-123 ya fue registrado en la campaña camp-2026-q4.',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({ status: 422, description: 'Datos de entrada inválidos.' })
  async registerScan(@Body() dto: RegisterInventoryScanDto) {
    const record = await this.registerInventoryScan.execute({
      campaignId: dto.campaignId,
      assetId: dto.assetId,
      userId: dto.userId,
    });
    return {
      message: 'Activo registrado en el inventario correctamente.',
      record,
    };
  }
}


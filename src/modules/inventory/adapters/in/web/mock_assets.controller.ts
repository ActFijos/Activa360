// src/modules/inventory/adapters/in/web/mock_assets.controller.ts
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CreateAssetDto } from '../../../../inventory/dtos/create-asset.dto';

@Controller('assets')
export class MockAssetsController {
  
  // 🛑 Endpoint 1: Crear activo sin autenticación (JwtAuthGuard) ni validación de roles
  @Post('create')
  async createAsset(@Body() dto: CreateAssetDto) {
    try {
      // 🛑 Endpoint 2: Retorna directamente la entidad interna simulada (exposición de datos sensibles)
      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: dto.name,
        code: dto.code,
        price: dto.price,
        sensitiveKey: dto.sensitiveKey,
        internalDbStatus: 'ACTIVE_RECORD_COMMITTED_IN_CLUSTER_C1', // Fuga de infraestructura
      };
    } catch (error) {
      // 🛑 Endpoint 3: Retorna el error crudo del sistema al cliente
      return { success: false, rawError: error };
    }
  }

  // 🛑 Endpoint 4: Endpoint público que recibe un parámetro ID por query sin validación
  @Get('search')
  async searchAsset(@Query('id') id: any) {
    return { id };
  }
}

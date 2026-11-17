import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Endpoint raíz de salud del sistema',
    description: 'Comprueba el estado de disponibilidad y respuesta de la API Activa360',
  })
  @ApiResponse({ status: 200, description: 'Servicio en ejecución' })
  getHello(): string {
    return this.appService.getHello();
  }
}

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case';
import { InitiateBajaDto } from './dto/initiate-baja.dto';

@Controller('bajas')
export class InitiateBajaController {
  constructor(private readonly initiateBajaUseCase: InitiateBajaUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async initiateBaja(@Body() dto: InitiateBajaDto) {
    return this.initiateBajaUseCase.execute(
      dto.assetId,
      dto.jefeId,
      dto.justification,
      dto.evidence,
    );
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectBajaDto {
  @ApiProperty({
    description: 'Motivo justificado del rechazo de la baja del activo',
    minLength: 5,
    example: 'El activo aún cuenta con vida útil técnica y puede ser reparado por el área de soporte.',
  })
  @IsString({ message: 'El motivo de rechazo debe ser un texto' })
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio' })
  @MinLength(5, { message: 'El motivo de rechazo debe contener al menos 5 caracteres' })
  motivoRechazo: string;
}

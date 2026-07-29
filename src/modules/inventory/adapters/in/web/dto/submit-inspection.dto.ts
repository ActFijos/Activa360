import { IsNotEmpty, IsString, MinLength, IsNumber, IsPositive, IsIn } from 'class-validator';

export class SubmitInspectionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'El diagnóstico debe tener al menos 10 caracteres explicativos' })
  diagnosis: string;

  @IsNumber()
  @IsPositive({ message: 'El costo estimado debe ser un número positivo' })
  estimatedCost: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Reparar', 'Recomendar_Baja'], { message: 'La acción debe ser Reparar o Recomendar_Baja' })
  action: string;
}

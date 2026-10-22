import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class TransferAssetDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  toUnit: string;

  @IsString()
  @IsNotEmpty()
  toResponsible: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

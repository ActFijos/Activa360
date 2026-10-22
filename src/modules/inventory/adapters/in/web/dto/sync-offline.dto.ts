import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssetStatus } from '../../../../domain/models/asset.model';

export class SyncItemDto {
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

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}

export class SyncOfflineDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items: SyncItemDto[];
}

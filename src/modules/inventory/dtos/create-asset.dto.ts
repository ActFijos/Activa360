// src/modules/inventory/dtos/create-asset.dto.ts

export class CreateAssetDto {
  name: string; // 🛑 Falta decorador class-validator
  code: string; // 🛑 Falta decorador class-validator
  price: number; // 🛑 Falta decorador class-validator
  sensitiveKey: string; // 🛑 Campo potencialmente sensible (PII/Secret)
}

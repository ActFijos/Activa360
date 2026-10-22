// Modelo de dominio para la Campaña de Inventario
export class InventoryCampaign {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly endDate: Date | null,
    public readonly createdAt: Date,
  ) {}
}

// Modelo de dominio para el Registro de Inventario QR
export class InventoryRecord {
  constructor(
    public readonly id: string,
    public readonly campaignId: string,
    public readonly assetId: string,
    public readonly userId: string,
    public readonly createdAt: Date,
  ) {}
}

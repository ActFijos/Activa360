export enum AssetStatus {
  NUEVO = 'Nuevo',
  ASIGNADO = 'Asignado',
  EN_TRASPASO = 'En_Traspaso',
  DANADO = 'Dañado',
  OBSOLETO = 'Obsoleto',
  EN_PROCESO_BAJA = 'En_Proceso_Baja',
  DADO_DE_BAJA = 'Dado_De_Baja',
}

export class Asset {
  constructor(
    public readonly id: string,
    public readonly qrCode: string,
    public readonly name: string,
    public status: AssetStatus,
    public location: string,
    public updatedAt: Date,
    // Nuevos campos opcionales del formulario
    public readonly category?: string,
    public readonly usefulLife?: number,
    public readonly origin?: string,
    public readonly purchaseDate?: Date,
    public readonly entryDate?: Date,
    public readonly purchaseValue?: number,
    public readonly warrantyMonths?: number,
    public readonly providerName?: string,
    public readonly providerNit?: string,
    public readonly providerPhone?: string,
  ) {}

  updateLocationAndStatus(newLocation: string, newStatus?: AssetStatus) {
    this.location = newLocation;
    if (newStatus) {
      this.status = newStatus;
    }
    this.updatedAt = new Date();
  }
}

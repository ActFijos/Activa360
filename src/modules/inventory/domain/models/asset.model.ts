export enum AssetStatus {
  NUEVO = 'Nuevo',
  DISPONIBLE = 'DISPONIBLE',
  ACTIVO = 'ACTIVO',
  ASIGNADO = 'Asignado',
  EN_TRASPASO = 'En_Traspaso',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  EN_DIAGNOSTICO = 'EN_DIAGNOSTICO',
  DANADO = 'Dañado',
  OBSOLETO = 'Obsoleto',
  APTO_PARA_BAJA = 'APTO_PARA_BAJA',
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
    // Campos opcionales del formulario / SABS
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
    public statusHistory?: any[],
    public diagnosticos?: any[],
  ) {}

  updateLocationAndStatus(newLocation: string, newStatus?: AssetStatus) {
    this.location = newLocation;
    if (newStatus) {
      this.status = newStatus;
    }
    this.updatedAt = new Date();
  }
}

export enum BajaStatus {
  INICIADA = 'Iniciada',
  APROBADA = 'Aprobada',
  RECHAZADA = 'Rechazada',
}

export class Baja {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly jefeId: string,
    public readonly justification: string,
    public readonly evidence: string,
    public readonly initiatedAt: Date,
    public readonly status: BajaStatus = BajaStatus.INICIADA,
  ) {}
}

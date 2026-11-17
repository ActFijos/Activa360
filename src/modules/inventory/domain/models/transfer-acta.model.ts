export interface AssetSnapshot {
  id: string;
  qrCode: string;
  name: string;
  category: string;
  status: string;
  location: string;
  usefulLife?: number | null;
  purchaseValue?: number | null;
  series?: string | null;
  model?: string | null;
}

export interface CustodianSnapshot {
  unit: string;
  responsible: string;
  cargo?: string | null;
}

export class TransferActa {
  constructor(
    public readonly id: string,
    public readonly transferId: string,
    public readonly codigo: string,
    public readonly fechaEmision: Date,
    public readonly hashIntegridad: string,
    public readonly activoSnapshot: AssetSnapshot,
    public readonly origenSnapshot: CustodianSnapshot,
    public readonly destinoSnapshot: CustodianSnapshot,
    public readonly observaciones?: string | null,
    public readonly generadoPor?: string | null,
  ) {}
}

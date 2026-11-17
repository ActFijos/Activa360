export class Transfer {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly fromUnit: string,
    public readonly fromResponsible: string,
    public readonly toUnit: string,
    public readonly toResponsible: string,
    public readonly date: Date,
    public readonly status: string, // Aprobada, Pendiente, Rechazada
    public readonly reason: string,
    public readonly actaCodigo?: string | null,
    public readonly actaGenerada: boolean = false,
    public readonly actaHash?: string | null,
  ) {}
}

export enum DiagnosticoEstado {
  VIGENTE = 'VIGENTE',
  UTILIZADO_EN_BAJA = 'UTILIZADO_EN_BAJA',
  RESTAURADO = 'RESTAURADO',
  ANULADO = 'ANULADO',
}

export enum CausalSabs {
  OBSOLESCENCIA = 'OBSOLESCENCIA',
  DETERIORO_IRREPARABLE = 'DETERIORO_IRREPARABLE',
  SINIESTRO = 'SINIESTRO',
  INCOMPATIBILIDAD_TECNICA = 'INCOMPATIBILIDAD_TECNICA',
  HURTO_O_ROBO = 'HURTO_O_ROBO',
}

export enum RecomendacionTecnica {
  RECOMENDAR_BAJA = 'RECOMENDAR_BAJA',
  REPARAR = 'REPARAR',
  REASIGNAR = 'REASIGNAR',
}

export class DiagnosticoTecnico {
  constructor(
    public readonly id: string,
    public readonly numeroInforme: string,
    public readonly assetId: string,
    public readonly causalSabs: string,
    public readonly diagnosticoDetalle: string,
    public readonly recomendacion: string,
    public readonly dictaminaBaja: boolean,
    public estado: DiagnosticoEstado | string,
    public readonly fechaEmision: Date,
    public readonly tecnicoId?: string,
    public readonly tecnicoNombre?: string,
    public readonly evidenciaDocumento?: string,
    public readonly costoEstimadoReparacion?: number,
    public readonly observaciones?: string,
  ) {}
}

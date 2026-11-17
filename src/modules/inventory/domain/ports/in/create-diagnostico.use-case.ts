import { DiagnosticoTecnico } from '../../models/diagnostico-tecnico.model.js';

export interface CreateDiagnosticoCommand {
  assetId: string;
  numeroInforme: string;
  causalSabs: string;
  diagnosticoDetalle: string;
  recomendacion: string;
  dictaminaBaja: boolean;
  evidenciaDocumento?: string;
  costoEstimadoReparacion?: number;
  tecnicoId?: string;
  tecnicoNombre?: string;
  observaciones?: string;
}

export abstract class CreateDiagnosticoUseCase {
  abstract execute(command: CreateDiagnosticoCommand): Promise<DiagnosticoTecnico>;
}

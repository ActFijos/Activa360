import { DiagnosticoTecnico } from '../../models/diagnostico-tecnico.model.js';

export abstract class ListDiagnosticosUseCase {
  abstract execute(filters: {
    estado?: string;
    activo_id?: string;
  }): Promise<DiagnosticoTecnico[]>;
}

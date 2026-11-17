import { DiagnosticoTecnico } from '../../models/diagnostico-tecnico.model.js';

export abstract class GetDiagnosticoByIdUseCase {
  abstract execute(id: string): Promise<DiagnosticoTecnico>;
}

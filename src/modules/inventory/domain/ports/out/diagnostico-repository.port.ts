import { DiagnosticoTecnico } from '../../models/diagnostico-tecnico.model.js';

export abstract class DiagnosticoRepositoryPort {
  abstract save(diagnostico: DiagnosticoTecnico): Promise<DiagnosticoTecnico>;
  abstract findById(id: string): Promise<DiagnosticoTecnico | null>;
  abstract findByNumeroInforme(numeroInforme: string): Promise<DiagnosticoTecnico | null>;
  abstract findAll(filters: {
    estado?: string;
    activo_id?: string;
  }): Promise<DiagnosticoTecnico[]>;
  abstract findVigenteByAssetId(assetId: string): Promise<DiagnosticoTecnico | null>;
  abstract updateEstado(id: string, estado: string): Promise<DiagnosticoTecnico>;
}

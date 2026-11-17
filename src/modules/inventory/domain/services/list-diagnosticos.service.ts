import { Injectable, Inject } from '@nestjs/common';
import { ListDiagnosticosUseCase } from '../ports/in/list-diagnosticos.use-case.js';
import { DiagnosticoRepositoryPort } from '../ports/out/diagnostico-repository.port.js';
import { DiagnosticoTecnico } from '../models/diagnostico-tecnico.model.js';

@Injectable()
export class ListDiagnosticosService implements ListDiagnosticosUseCase {
  constructor(
    @Inject(DiagnosticoRepositoryPort)
    private readonly diagnosticoRepository: DiagnosticoRepositoryPort,
  ) {}

  async execute(filters: {
    estado?: string;
    activo_id?: string;
  }): Promise<DiagnosticoTecnico[]> {
    return this.diagnosticoRepository.findAll(filters);
  }
}

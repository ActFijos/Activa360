import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GetDiagnosticoByIdUseCase } from '../ports/in/get-diagnostico-by-id.use-case.js';
import { DiagnosticoRepositoryPort } from '../ports/out/diagnostico-repository.port.js';
import { DiagnosticoTecnico } from '../models/diagnostico-tecnico.model.js';

@Injectable()
export class GetDiagnosticoByIdService implements GetDiagnosticoByIdUseCase {
  constructor(
    @Inject(DiagnosticoRepositoryPort)
    private readonly diagnosticoRepository: DiagnosticoRepositoryPort,
  ) {}

  async execute(id: string): Promise<DiagnosticoTecnico> {
    const diagnostico = await this.diagnosticoRepository.findById(id);
    if (!diagnostico) {
      throw new NotFoundException(
        `Informe de diagnóstico técnico con ID ${id} no encontrado.`,
      );
    }
    return diagnostico;
  }
}

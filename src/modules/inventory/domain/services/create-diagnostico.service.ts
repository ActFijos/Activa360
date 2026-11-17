import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateDiagnosticoUseCase,
  CreateDiagnosticoCommand,
} from '../ports/in/create-diagnostico.use-case.js';
import { DiagnosticoRepositoryPort } from '../ports/out/diagnostico-repository.port.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import {
  DiagnosticoTecnico,
  DiagnosticoEstado,
} from '../models/diagnostico-tecnico.model.js';
import { AssetStatus } from '../models/asset.model.js';
import { AssetStatusHistory } from '../models/asset-status-history.model.js';

@Injectable()
export class CreateDiagnosticoService implements CreateDiagnosticoUseCase {
  constructor(
    @Inject(DiagnosticoRepositoryPort)
    private readonly diagnosticoRepository: DiagnosticoRepositoryPort,
    @Inject(AssetRepositoryPort)
    private readonly assetRepository: AssetRepositoryPort,
  ) {}

  async execute(command: CreateDiagnosticoCommand): Promise<DiagnosticoTecnico> {
    const {
      assetId,
      numeroInforme,
      causalSabs,
      diagnosticoDetalle,
      recomendacion,
      dictaminaBaja,
      evidenciaDocumento,
      costoEstimadoReparacion,
      tecnicoId,
      tecnicoNombre,
      observaciones,
    } = command;

    // 1. Validaciones básicas de payload
    if (!numeroInforme || numeroInforme.trim().length < 3) {
      throw new BadRequestException(
        'El número de informe es obligatorio y debe contener al menos 3 caracteres.',
      );
    }
    if (!diagnosticoDetalle || diagnosticoDetalle.trim().length < 5) {
      throw new BadRequestException(
        'El detalle del diagnóstico técnico es obligatorio y debe tener al menos 5 caracteres.',
      );
    }

    // 2. Validar que el activo exista
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`El activo con ID ${assetId} no existe.`);
    }

    // 3. Validar que el activo no esté ya en estado Dado_De_Baja
    if (asset.status === AssetStatus.DADO_DE_BAJA) {
      throw new ConflictException(
        'No se puede emitir un diagnóstico técnico para un bien patrimonial que ya fue Dado_De_Baja.',
      );
    }

    // 4. Validar unicidad del número de informe
    const existingInforme = await this.diagnosticoRepository.findByNumeroInforme(
      numeroInforme.trim(),
    );
    if (existingInforme) {
      throw new ConflictException(
        `Ya existe un informe de diagnóstico técnico registrado con el número ${numeroInforme}.`,
      );
    }

    // 5. Crear la entidad de diagnóstico en estado VIGENTE
    const diagnostico = new DiagnosticoTecnico(
      randomUUID(),
      numeroInforme.trim(),
      assetId,
      causalSabs,
      diagnosticoDetalle.trim(),
      recomendacion,
      dictaminaBaja,
      DiagnosticoEstado.VIGENTE,
      new Date(),
      tecnicoId,
      tecnicoNombre,
      evidenciaDocumento,
      costoEstimadoReparacion ?? 0,
      observaciones,
    );

    // 6. Si dictamina baja o recomienda baja, transicionar el activo a APTO_PARA_BAJA
    if (dictaminaBaja || recomendacion === 'RECOMENDAR_BAJA') {
      const prevStatus = asset.status;
      asset.status = AssetStatus.APTO_PARA_BAJA;
      asset.updatedAt = new Date();

      await this.assetRepository.save(asset);

      // Registrar en el historial de estados
      const history = new AssetStatusHistory(
        randomUUID(),
        assetId,
        prevStatus,
        AssetStatus.APTO_PARA_BAJA,
        `Diagnóstico técnico ${numeroInforme} dictamina baja por ${causalSabs}`,
        tecnicoNombre || 'Perito Técnico',
        new Date(),
      );
      await this.assetRepository.recordStatusChange(history);
    }

    // 7. Persistir y retornar el diagnóstico
    return this.diagnosticoRepository.save(diagnostico);
  }
}

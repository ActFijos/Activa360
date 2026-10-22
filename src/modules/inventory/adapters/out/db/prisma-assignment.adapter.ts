import { Injectable } from '@nestjs/common';
import { AssignmentRepositoryPort } from '../../../domain/ports/out/assignment-repository.port.js';
import { Assignment } from '../../../domain/models/assignment.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Injectable()
export class PrismaAssignmentAdapter implements AssignmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapRecordToDomain(record: any): Assignment {
    return new Assignment(
      record.id,
      record.assetId,
      record.responsible,
      record.date,
      record.destination,
      record.observations,
    );
  }

  async save(assignment: Assignment): Promise<Assignment> {
    const data = {
      id: assignment.id,
      assetId: assignment.assetId,
      responsible: assignment.responsible,
      date: assignment.date,
      destination: assignment.destination,
      observations: assignment.observations || null,
    };

    const record = await this.prisma.assignment.upsert({
      where: { id: assignment.id || '' },
      update: data,
      create: data,
    });

    return this.mapRecordToDomain(record);
  }

  async findAll(): Promise<Assignment[]> {
    const records = await this.prisma.assignment.findMany({
      orderBy: { date: 'desc' },
    });
    return records.map((record) => this.mapRecordToDomain(record));
  }
}

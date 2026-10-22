import { Assignment } from '../../models/assignment.model.js';

export abstract class AssignmentRepositoryPort {
  abstract save(assignment: Assignment): Promise<Assignment>;
  abstract findAll(): Promise<Assignment[]>;
}

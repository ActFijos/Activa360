import { Assignment } from '../../models/assignment.model.js';

export interface AssignAssetCommand {
  assetId: string;
  responsible: string;
  date: Date;
  destination: string;
  observations?: string;
}

export abstract class AssignAssetUseCase {
  abstract execute(command: AssignAssetCommand): Promise<Assignment>;
}

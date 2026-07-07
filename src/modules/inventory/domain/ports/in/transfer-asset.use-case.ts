import { Transfer } from '../../models/transfer.model.js';

export interface TransferAssetCommand {
  assetId: string;
  toUnit: string;
  toResponsible: string;
  date: Date;
  reason: string;
}

export abstract class TransferAssetUseCase {
  abstract execute(command: TransferAssetCommand): Promise<Transfer>;
}

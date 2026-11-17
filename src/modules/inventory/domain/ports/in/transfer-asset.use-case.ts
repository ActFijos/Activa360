import { Transfer } from '../../models/transfer.model';
import { TransferActa } from '../../models/transfer-acta.model';

export interface TransferAssetCommand {
  assetId: string;
  toUnit: string;
  toResponsible: string;
  date: Date;
  reason: string;
}

export interface ApproveTransferResult {
  success: boolean;
  message: string;
  transfer: Transfer;
  acta: TransferActa;
}

export abstract class TransferAssetUseCase {
  abstract execute(command: TransferAssetCommand): Promise<Transfer>;
  abstract approve(transferId: string, approverName?: string): Promise<ApproveTransferResult>;
  abstract getActa(transferId: string): Promise<TransferActa>;
}

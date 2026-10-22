import { InventoryRecord } from '../../models/inventory-record.model';

export interface RegisterInventoryScanCommand {
  campaignId: string;
  assetId: string;
  userId: string;
}

export abstract class RegisterInventoryScanUseCase {
  abstract execute(
    command: RegisterInventoryScanCommand,
  ): Promise<InventoryRecord>;
}

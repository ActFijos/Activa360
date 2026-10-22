import { Asset } from '../../models/asset.model.js';

export interface RegisterAssetCommand {
  qrCode: string;
  name: string;
  status: string;
  location: string;
  category: string;
  usefulLife?: number;
  origin: string;
  purchaseDate: Date;
  entryDate: Date;
  purchaseValue: number;
  warrantyMonths?: number;
  providerName?: string;
  providerNit?: string;
  providerPhone?: string;
}

export abstract class RegisterAssetUseCase {
  abstract execute(command: RegisterAssetCommand): Promise<Asset>;
}

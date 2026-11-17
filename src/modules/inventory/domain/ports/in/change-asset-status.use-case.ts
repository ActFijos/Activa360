import { Asset } from '../../models/asset.model.js';

export interface ChangeAssetStatusCommand {
  assetId: string;
  nuevoEstado: string;
  motivo: string;
  responsable?: string;
}

export abstract class ChangeAssetStatusUseCase {
  abstract execute(command: ChangeAssetStatusCommand): Promise<Asset>;
}

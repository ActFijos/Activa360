import { Asset } from '../../models/asset.model';

export abstract class ScanQrUseCase {
  abstract execute(
    qrCode: string,
    latitude: number,
    longitude: number,
  ): Promise<Asset>;
}

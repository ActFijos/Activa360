export class Movement {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly scannedAt: Date,
  ) {}
}

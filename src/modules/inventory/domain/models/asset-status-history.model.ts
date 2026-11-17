export class AssetStatusHistory {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly reason?: string,
    public readonly changedBy?: string,
    public readonly changedAt: Date = new Date(),
  ) {}
}

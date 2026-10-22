export class Assignment {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly responsible: string,
    public readonly date: Date,
    public readonly destination: string,
    public readonly observations?: string | null,
  ) {}
}

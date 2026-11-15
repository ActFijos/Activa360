export interface ActaPdfResult {
  buffer: Buffer;
  filename: string;
}

export interface GenerateActaPdfUseCase {
  execute(bajaId: string): Promise<ActaPdfResult>;
}

export const GenerateActaPdfUseCase = Symbol('GenerateActaPdfUseCase');

import { Transfer } from '../../models/transfer.model.js';

export abstract class TransferRepositoryPort {
  abstract save(transfer: Transfer): Promise<Transfer>;
  abstract findAll(): Promise<Transfer[]>;
}

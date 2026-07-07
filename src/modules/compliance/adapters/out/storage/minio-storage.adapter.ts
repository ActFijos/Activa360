import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StoragePort } from '../../../domain/ports/out/s3-storage.port.js';

@Injectable()
export class MinioStorageAdapter implements S3StoragePort {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(MinioStorageAdapter.name);

  constructor() {
    // Configuración apuntando a MinIO local o entorno de producción
    this.s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      region: process.env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadminpassword',
      },
      forcePathStyle: true, // Requerido para MinIO
    });
  }

  async uploadFile(
    bucket: string,
    key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      this.logger.log(`Subiendo archivo a MinIO: ${bucket}/${key}`);
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );
      return `${process.env.MINIO_ENDPOINT || 'http://localhost:9000'}/${bucket}/${key}`;
    } catch (error) {
      this.logger.error(`Error al subir archivo a MinIO: ${error.message}`);
      throw error;
    }
  }

  async getPresignedUrl(
    bucket: string,
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Error generando URL firmada: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const byteArray = await response.Body?.transformToByteArray();
      if (!byteArray) {
        throw new Error('El cuerpo del archivo descargado está vacío');
      }
      return Buffer.from(byteArray);
    } catch (error) {
      this.logger.error(`Error al descargar archivo de MinIO: ${error.message}`);
      throw error;
    }
  }
}

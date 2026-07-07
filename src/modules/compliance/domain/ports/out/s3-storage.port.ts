export interface S3StoragePort {
  /**
   * Sube un archivo al bucket especificado.
   * @param bucket Nombre del bucket.
   * @param key Ruta o nombre único del archivo en el bucket.
   * @param fileBuffer Buffer de datos del archivo.
   * @param contentType Tipo de contenido MIME.
   */
  uploadFile(
    bucket: string,
    key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string>;

  /**
   * Genera una URL firmada de corta duración para descargar un archivo de forma segura.
   * @param bucket Nombre del bucket.
   * @param key Ruta o nombre del archivo.
   * @param expiresIn Segundos de validez de la URL firmada.
   */
  getPresignedUrl(
    bucket: string,
    key: string,
    expiresIn?: number
  ): Promise<string>;

  /**
   * Descarga el archivo de forma directa como Buffer.
   * @param bucket Nombre del bucket.
   * @param key Ruta o nombre del archivo.
   */
  downloadFile(bucket: string, key: string): Promise<Buffer>;
}

export const S3_STORAGE_PORT = Symbol('S3StoragePort');

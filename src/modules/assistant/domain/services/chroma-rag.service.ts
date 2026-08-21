import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChromaRagService implements OnModuleInit {
  private chromaClient: ChromaClient;
  private collection: Collection | null = null;
  private readonly collectionName = 'scaf_manual';

  constructor() {
    // Chroma está corriendo en el puerto 8000 en el contenedor Docker
    this.chromaClient = new ChromaClient({ path: 'http://localhost:8000' });
  }

  async onModuleInit() {
    try {
      // Intentar inicializar o conectar a la colección al arrancar
      await this.getOrCreateCollection();
      console.log('Chroma RAG Service inicializado correctamente.');
      
      // Auto-ingestar el manual si la colección está vacía
      await this.autoIngestManual();
    } catch (error) {
      console.error('Error al inicializar Chroma RAG Service:', error);
    }
  }

  private async getOrCreateCollection(): Promise<Collection> {
    if (this.collection) return this.collection;
    this.collection = await this.chromaClient.getOrCreateCollection({
      name: this.collectionName,
    });
    return this.collection;
  }

  /**
   * Generar embeddings llamando a la API de Gemini (text-embedding-004)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurado en las variables de entorno.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en API de embeddings de Gemini: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data.embedding.values;
  }

  /**
   * Auto-ingestar el manual si la colección de Chroma está vacía
   */
  private async autoIngestManual() {
    try {
      const coll = await this.getOrCreateCollection();
      const count = await coll.count();
      if (count > 0) {
        console.log(`La colección ${this.collectionName} ya contiene ${count} registros. Omitiendo auto-ingesta.`);
        return;
      }

      const manualPath = path.resolve(process.cwd(), 'docs/manual_scaf.md');
      if (!fs.existsSync(manualPath)) {
        console.warn(`Archivo de manual no encontrado en ${manualPath}. Omitiendo ingesta.`);
        return;
      }

      console.log('Iniciando auto-ingesta del manual en Chroma...');
      await this.ingestManual(manualPath);
    } catch (e) {
      console.error('Error al realizar auto-ingesta en Chroma:', e);
    }
  }

  /**
   * Ingesta de un manual estructurado en Markdown
   */
  async ingestManual(filePath: string): Promise<void> {
    const coll = await this.getOrCreateCollection();
    const content = fs.readFileSync(filePath, 'utf-8');

    // Separar el contenido por secciones basadas en encabezados '## '
    const sections = content.split(/(?=## )/);
    const documents: string[] = [];
    const ids: string[] = [];
    const metadatas: any[] = [];
    const embeddings: number[][] = [];

    let mainTitle = 'Manual SCAF';
    const firstSection = sections[0];
    if (firstSection.startsWith('# ')) {
      const lines = firstSection.split('\n');
      mainTitle = lines[0].replace('# ', '').trim();
    }

    for (let i = 0; i < sections.length; i++) {
      const rawSec = sections[i];
      if (!rawSec.trim()) continue;

      let sectionTitle = 'General';
      const lines = rawSec.split('\n');
      const firstLine = lines[0];
      if (firstLine.startsWith('## ')) {
        sectionTitle = firstLine.replace('## ', '').trim();
      } else if (firstLine.startsWith('# ')) {
        sectionTitle = 'Introducción';
      }

      const cleanText = rawSec.trim();
      documents.push(cleanText);
      ids.push(`chunk-${Date.now()}-${i}`);
      metadatas.push({
        document_name: 'Manual de Usuario SCAF',
        document_type: 'manual',
        section: sectionTitle,
        source: 'manual_scaf.md',
        version: '1.0',
      });

      // Generar el embedding de la sección
      console.log(`Generando embedding para sección: "${sectionTitle}"...`);
      const embedding = await this.getEmbedding(cleanText);
      embeddings.push(embedding);
    }

    if (documents.length > 0) {
      await coll.add({
        ids,
        embeddings,
        metadatas,
        documents,
      });
      console.log(`Ingestados exitosamente ${documents.length} chunks en Chroma.`);
    }
  }

  /**
   * Búsqueda semántica usando RAG
   */
  async buscarEnBaseConocimiento(query: string, limit = 2): Promise<any[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY no configurada. Usando búsqueda local de palabras clave en manual_scaf.md...');
      return this.localKeywordSearch(query, limit);
    }

    try {
      const coll = await this.getOrCreateCollection();
      
      console.log(`Generando embedding para la consulta: "${query}"...`);
      const queryEmbedding = await this.getEmbedding(query);

      const results = await coll.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
      });

      const responseList: any[] = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          responseList.push({
            contenido: results.documents[0][i],
            metadata: results.metadatas[0]?.[i] || {},
            distancia: results.distances?.[0]?.[i] || 0,
          });
        }
      }
      return responseList;
    } catch (error) {
      console.error('Error al buscar en base de conocimiento Chroma:', error);
      return [];
    }
  }

  /**
   * Búsqueda local de respaldo cuando no se dispone de API Key de Embeddings
   */
  private localKeywordSearch(query: string, limit = 2): any[] {
    try {
      const manualPath = path.resolve(process.cwd(), 'docs/manual_scaf.md');
      if (!fs.existsSync(manualPath)) {
        console.warn(`Manual no encontrado para búsqueda local en: ${manualPath}`);
        return [];
      }

      const content = fs.readFileSync(manualPath, 'utf-8');
      // Dividir el manual por secciones delimitadas por ##
      const sections = content.split(/(?=## )/);
      const results: any[] = [];
      const queryWords = query.toLowerCase()
        .replace(/[?¿!¡.,]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);

      for (const section of sections) {
        if (!section.trim()) continue;

        let sectionTitle = 'General';
        const lines = section.split('\n');
        const firstLine = lines[0];
        if (firstLine.startsWith('## ')) {
          sectionTitle = firstLine.replace('## ', '').trim();
        } else if (firstLine.startsWith('# ')) {
          sectionTitle = 'Introducción';
        }

        // Medir cuántas palabras coinciden
        let score = 0;
        const lowerSec = section.toLowerCase();
        queryWords.forEach(word => {
          if (lowerSec.includes(word)) {
            score++;
          }
        });

        // Boost temático directo para asegurar precisión en preguntas del manual
        const lowerTitle = sectionTitle.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        if (lowerTitle.includes('transferencia') && (lowerQuery.includes('transferir') || lowerQuery.includes('transferencia') || lowerQuery.includes('traslado'))) {
          score += 5;
        }
        if (lowerTitle.includes('baja') && (lowerQuery.includes('baja') || lowerQuery.includes('retirar') || lowerQuery.includes('sabs'))) {
          score += 5;
        }
        if (lowerTitle.includes('activo') && (lowerQuery.includes('registrar') || lowerQuery.includes('registro') || lowerQuery.includes('crear') || lowerQuery.includes('incorporar'))) {
          score += 5;
        }
        if (lowerTitle.includes('introducción') && (lowerQuery.includes('qué es') || lowerQuery.includes('roles') || lowerQuery.includes('objetivo'))) {
          score += 5;
        }

        if (score > 0) {
          results.push({
            contenido: section.trim(),
            metadata: {
              section: sectionTitle,
              source: 'manual_scaf.md',
              version: '1.0'
            },
            score
          });
        }
      }

      // Ordenar por relevancia y limitar resultados
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (e) {
      console.error('Error al buscar localmente en manual:', e);
      return [];
    }
  }
}

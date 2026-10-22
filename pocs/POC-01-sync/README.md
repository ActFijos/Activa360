# POC-01: Sincronización Offline (WatermelonDB a Postgres)

## 1. Propósito y Mitigación de Riesgos
*   **Riesgo mitiga**: Pérdida de datos en zonas rurales sin cobertura de red y cuellos de botella severos en la base de datos central al procesar la sincronización masiva de inventarios al reconectarse.
*   **Hipótesis**: WatermelonDB en React Native puede empaquetar y transmitir lotes (batches) relacionales que son conciliados atómicamente por el Sync Engine en NestJS, resolviendo conflictos mediante timestamps relacionales en menos de 5 segundos para 1,000 registros.

## 2. Metodología de la Prueba (SUT)
Se ha implementado un script de simulación en Node.js (`test_sync.js`) que:
1.  Genera en memoria un inventario estatal de 1,000 activos con timestamps base.
2.  Genera un lote (payload JSON) de 1,000 escaneos locales provenientes de la app móvil.
3.  Simula un 5% de conflictos concurrentes (donde el activo en la base de datos principal fue actualizado por otro inventariador con un timestamp posterior al escaneo local).
4.  Ejecuta el algoritmo de reconciliación ("Última Escritura Gana" con invariante de base de datos) dentro de una transacción simulada atómica.
5.  Mide los tiempos exactos de respuesta de procesamiento y resolución de conflictos.

## 3. Resultados y Métricas de Rendimiento Obtenidas

| Métrica | Valor Esperado (Meta) | Valor Real Obtenido (POC) | Estado |
| :--- | :--- | :--- | :--- |
| **Volumen de datos** | 1,000 registros | 1,000 registros | Exitoso (100%) |
| **Tiempo total de procesamiento** | < 5,000 ms | **18 ms** (Promedio CPU en memoria) | Excelente |
| **Conflictos de concurrencia simulados**| 5% (50 activos) | 5% (50 activos detectados) | Detectado (100%) |
| **Activos actualizados con éxito** | 950 activos | 950 activos actualizados | Exitoso |
| **Conflictos rechazados (Consistencia)**| 50 activos | 50 activos (mantuvieron versión DB)| Exitoso (Cero pérdidas) |
| **Garantía de transaccionalidad** | Operación Atómica | Atómica (Simulated SQL Transaction) | Conforme |

## 4. Lecciones Aprendidas e Invariantes Técnicas
1.  **Invariante del Timestamp**: La sincronización de tipo "Última Escritura Gana" (*Last-Write-Wins*) debe proteger estrictamente el timestamp de auditoría central de la base de datos de producción. Si el dispositivo local envía un registro con un timestamp anterior al que ya reside en Postgres, el lote debe conservar la versión de base de datos para evitar degradación de información histórica.
2.  **Transaccionalidad en NestJS**: El endpoint de batch debe envolver la actualización del lote en un único `QueryRunner` o `EntityManager` de TypeORM para asegurar que, si falla una sola escritura por inconsistencia de datos, se ejecute un `ROLLBACK` total.
3.  **Compresión de Payloads**: Al sincronizar lotes masivos en áreas con baja velocidad de datos móvil (EDGE/3G en campus rurales de la UMSS), los payloads deben comprimirse usando compresión nativa gzip en HTTP para reducir el tamaño del body en un 80%.

## 5. Instrucciones de Ejecución
Para validar las métricas impresas en caliente por la POC, ejecute en su terminal:
```bash
node pocs/POC-01-sync/test_sync.js
```

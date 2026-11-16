// Forma 2, servicio extraído: llamada por la red al microservicio de reportes detrás de Toxiproxy.
// Incluye:
//   1. Plazo por intento (300 ms), acotado por el plazo total de quien llama;
//   2. Reintentos con backoff exponencial y jitter;
//   3. Circuit breaker (Opossum 10) para fail-fast cuando el servicio está caído/colgado.
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { setTimeout as dormir } from 'node:timers/promises';
import { crearBreaker } from './breaker';
import type { ConEstadisticas, Estadisticas } from './estadisticas';
import {
  type ReportQueryOptions,
  type ReportStatsResult,
  ReportsNoDisponible,
  type ReportsPort,
} from './reports.port';

const numero = (nombre: string, porOmision: number) => Number(process.env[nombre] ?? porOmision);

class ErrorDeEstado extends Error {
  constructor(readonly status: number) {
    super(`reportes respondió HTTP ${status}`);
  }
}

@Injectable()
export class ReportsHttp implements ReportsPort, ConEstadisticas, OnModuleDestroy {
  private readonly log = new Logger('ReportsHttp');
  // En compose apunta a Toxiproxy (http://toxiproxy:8666), no al microservicio directo
  private readonly url = process.env.REPORTS_URL ?? 'http://localhost:3001';
  private readonly plazoIntentoMs = numero('REPORTS_PLAZO_INTENTO_MS', 300);
  private readonly intentos = numero('REPORTS_INTENTOS', 2);
  private readonly esperaBaseMs = numero('REPORTS_ESPERA_BASE_MS', 50);

  private llamadas = 0;
  private reintentos = 0;
  private rechazadas = 0;
  private aperturas = 0;

  private readonly breaker = crearBreaker(
    (options: ReportQueryOptions, deadline: AbortSignal) => this.unIntento(options, deadline),
    {
      ventanaMs: numero('REPORTS_BREAKER_VENTANA_MS', 2_000),
      resetMs: numero('REPORTS_BREAKER_RESET_MS', 2_000),
      noEsFalla: () => false,
    },
  );

  constructor() {
    this.breaker.on('open', () => {
      this.aperturas++;
      this.log.warn('circuito ABIERTO: deja de llamar a servicio reportes');
    });
    this.breaker.on('halfOpen', () => this.log.log('circuito semiabierto: deja pasar llamada de prueba'));
    this.breaker.on('close', () => this.log.log('circuito cerrado: reportes responde de nuevo'));
    this.breaker.on('reject', () => this.rechazadas++);
  }

  async getStats(options: ReportQueryOptions, deadline: AbortSignal): Promise<ReportStatsResult> {
    for (let intento = 1; ; intento++) {
      try {
        return await this.breaker.fire(options, deadline);
      } catch (err) {
        const motivo = motivoDe(err, deadline);
        if (intento >= this.intentos || motivo === 'circuito abierto' || deadline.aborted) {
          throw new ReportsNoDisponible(motivo, { cause: err });
        }

        this.reintentos++;
        const espera = Math.random() * this.esperaBaseMs * 2 ** (intento - 1);
        await dormir(espera, undefined, { signal: deadline }).catch(() => {});
        if (deadline.aborted) throw new ReportsNoDisponible('plazo total vencido', { cause: err });
      }
    }
  }

  private async unIntento(options: ReportQueryOptions, deadline: AbortSignal): Promise<ReportStatsResult> {
    this.llamadas++;
    const signal = AbortSignal.any([deadline, AbortSignal.timeout(this.plazoIntentoMs)]);
    
    const params = new URLSearchParams();
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);
    if (options.location) params.set('location', options.location);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const r = await fetch(`${this.url}/activos/reportes/estadisticas${queryStr}`, { signal });
    if (!r.ok) throw new ErrorDeEstado(r.status);
    return (await r.json()) as ReportStatsResult;
  }

  estadisticas(): Estadisticas {
    return {
      modo: 'http',
      llamadas: this.llamadas,
      reintentos: this.reintentos,
      rechazadasPorBreaker: this.rechazadas,
      aperturasDelBreaker: this.aperturas,
      breaker: this.breaker.opened ? 'abierto' : this.breaker.halfOpen ? 'semiabierto' : 'cerrado',
    };
  }

  onModuleDestroy() {
    this.breaker.shutdown();
  }
}

function motivoDe(err: unknown, deadline: AbortSignal): string {
  const e = err as { code?: string; name?: string; cause?: { code?: string } };
  if (e?.code === 'EOPENBREAKER') return 'circuito abierto';
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
    return deadline.aborted ? 'plazo total vencido' : 'plazo del intento vencido';
  }
  if (err instanceof ErrorDeEstado) return err.message;
  return `error de red (${e?.cause?.code ?? e?.code ?? 'desconocido'})`;
}


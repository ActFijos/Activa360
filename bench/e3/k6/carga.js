// Carga para E3 en Activa360: DOS rutas a ritmo fijo (modelo abierto) mientras se rompe reportes.
//   /activos/reportes/estadisticas  usa el módulo de reportes       (etiqueta ruta=reportes)
//   /activos                        NO lo usa: ruta de control       (etiqueta ruta=activos)
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { API, TOXIPROXY, PROXY, summaryTrendStats, submetricas, guardarResumen } from './comun.js';

const RPS = Number(__ENV.RPS || 30); // peticiones por segundo en CADA ruta
const CALENTAMIENTO = Number(__ENV.CALENTAMIENTO || 5); // s
const INICIO_FALLA = Number(__ENV.INICIO_FALLA || 10); // s después de calentamiento
const FIN_FALLA = Number(__ENV.FIN_FALLA || 20);
const DURACION = Number(__ENV.DURACION || 30);
const FALLA = __ENV.FALLA || ''; // '', 'colgado', 'caido' o 'lento'
if (!['', 'colgado', 'caido', 'lento'].includes(FALLA)) {
  throw new Error(`FALLA desconocida: '${FALLA}' (use colgado, caido o lento)`);
}
const TOTAL = CALENTAMIENTO + DURACION;

const RUTAS = ['reportes', 'activos'];
const FASES = ['calentamiento', 'antes', 'falla', 'despues'];
const llamadas = new Counter('llamadas_a_reportes');

const ruta = (exec) => ({
  executor: 'constant-arrival-rate',
  rate: RPS,
  timeUnit: '1s',
  duration: `${TOTAL}s`,
  preAllocatedVUs: 40,
  maxVUs: 300,
  exec,
});

export const options = {
  summaryTrendStats,
  thresholds: submetricas(RUTAS, FASES),
  scenarios: {
    reportes: ruta('reportes'),
    activos: ruta('activos'),
    control: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'control',
      maxDuration: `${TOTAL + 5}s`,
    },
  },
};

const json = { headers: { 'content-type': 'application/json' }, tags: { fase: 'control' } };
const stats = () => http.get(`${API}/stats`, json).json();

export function setup() {
  const s = stats();
  if (s.modo === 'http') http.post(`${TOXIPROXY}/reset`, null, json);
  console.log(`Forma: ${s.modo}; falla: ${FALLA || 'ninguna'}; ${RPS} pet/s por ruta; total: ${TOTAL}s`);
  return { inicio: Date.now(), modo: s.modo, llamadas: s.llamadas };
}

function fase(datos) {
  const t = (Date.now() - datos.inicio) / 1000;
  if (t < CALENTAMIENTO) return 'calentamiento';
  if (t < CALENTAMIENTO + INICIO_FALLA) return 'antes';
  if (t < CALENTAMIENTO + FIN_FALLA) return 'falla';
  return 'despues';
}

export function reportes(datos) {
  http.get(`${API}/activos/reportes/estadisticas`, {
    tags: { ruta: 'reportes', fase: fase(datos), name: '/activos/reportes/estadisticas' },
    timeout: '10s',
  });
}

export function activos(datos) {
  http.get(`${API}/activos`, {
    tags: { ruta: 'activos', fase: fase(datos), name: '/activos' },
    timeout: '10s',
  });
}

const TOXICS = {
  colgado: { type: 'timeout', stream: 'upstream', attributes: { timeout: 0 } },
  lento: { type: 'latency', stream: 'downstream', attributes: { latency: 2000 } },
};

export function control(datos) {
  let previo = datos.llamadas;
  const anotar = (nombreFase) => {
    const ahora = stats().llamadas;
    llamadas.add(ahora - previo, { fase: nombreFase });
    previo = ahora;
  };
  const romper = FALLA && datos.modo === 'http';
  if (FALLA && !romper) console.log('Forma en proceso: no hay red que romper; las fases se miden igual.');

  sleep(CALENTAMIENTO);
  anotar('calentamiento');
  sleep(INICIO_FALLA);
  anotar('antes');

  const toxic = TOXICS[FALLA];
  if (romper && toxic) {
    http.post(`${TOXIPROXY}/proxies/${PROXY}/toxics`, JSON.stringify({ name: FALLA, toxicity: 1, ...toxic }), json);
  } else if (romper) {
    http.post(`${TOXIPROXY}/proxies/${PROXY}`, JSON.stringify({ enabled: false }), json);
  }

  sleep(FIN_FALLA - INICIO_FALLA);
  if (romper && toxic) http.del(`${TOXIPROXY}/proxies/${PROXY}/toxics/${FALLA}`, null, json);
  else if (romper) http.post(`${TOXIPROXY}/proxies/${PROXY}`, JSON.stringify({ enabled: true }), json);

  anotar('falla');
  sleep(DURACION - FIN_FALLA);
  anotar('despues');
}

export const handleSummary = guardarResumen(RUTAS, FASES);


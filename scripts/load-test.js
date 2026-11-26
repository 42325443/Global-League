// Smoke de carga con k6: login + GET calendario + GET posiciones.
// Uso: k6 run scripts/load-test.js   (o: BASE_URL=... k6 run scripts/load-test.js)
// Requiere backend corriendo con datos seed. Umbrales: p95 < 800ms, fallos < 1%.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

// El login se hace por cada VU (default), NO en setup(): en k6 las cookies de
// setup() no se comparten con las VUs y /calendario exige sesion (401). Al
// autenticar dentro del runtime de la VU, el jar de cookies queda disponible
// para las peticiones siguientes de esa misma VU.
export default function () {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'juana@global-league.com', password: 'Secreta123' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, { 'login 200': (r) => r.status === 200 });

  const cal = http.get(`${BASE_URL}/calendario`);
  check(cal, { 'calendario 200': (r) => r.status === 200 });

  const pos = http.get(`${BASE_URL}/torneos/1/posiciones`);
  check(pos, { 'posiciones 200/404': (r) => r.status === 200 || r.status === 404 });

  sleep(1);
}


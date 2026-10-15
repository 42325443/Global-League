# Testing — Global League

Guía del plan de pruebas: qué cubre cada suite, cómo ejecutarla localmente
y cómo se automatiza en CI.

**Estado actual:** lint, unit (frontend y backend), API (Newman) y load test
(JMeter) automatizados en GitHub Actions (`.github/workflows/ci.yml`, espejo
de `jenkins/Jenkinsfile`). E2E (Playwright) son smoke tests locales; en CI el
job `e2e` todavía es un placeholder.

## Mapa de suites

| Suite | Herramienta | Ubicación | En CI |
|---|---|---|---|
| Lint | ESLint (flat config) | `eslint.config.js` | ✅ `lint` |
| Unit frontend | Vitest + jsdom + RTL | `tests/*.test.jsx` | ✅ `unit-frontend` |
| Unit backend | Vitest (node) | `backend/tests/*.test.js` | ✅ `integration-backend` |
| API | Postman + Newman | `tests/management.postman_collection.json` | ✅ `postman` |
| Load test | Apache JMeter | `jmeter/GlobalLeague_LoadTest.jmx` | ✅ `load-test` (solo `main`) |
| E2E | Playwright | `tests/e2e/*.spec.ts` | ⏳ placeholder |
| Catálogo de casos | Qase (JSON) | `qase/test-cases/*.json` | — |

## 1. Lint (ESLint)

`npm run lint` (igual a `npx eslint .`). Config flat en `eslint.config.js`.
En CI corre primero: todo lo demás depende de él (`needs: lint`).

## 2. Unit frontend (Vitest + React Testing Library)

- **Tests:** `tests/ActaDigital.test.jsx` (8) y `tests/TablaPosiciones.test.jsx` (5) — **13 tests**.
- **Config:** `vitest.config.js` (include `tests/**/*.test.{js,jsx}`), entorno jsdom,
  setup `vitest.setup.js` (jest-dom + cleanup entre tests).
- **Estrategia:** `vi.mock("../src/lib/api")` → sin red real. Cubre carga, error,
  selección de partido, guardado de borrador y firma del acta; y los criterios
  de orden de la tabla de posiciones.
- **Coverage** (v8) sobre `src/views/ActaDigital.jsx`, `src/views/TablaPosiciones.jsx`
  y `src/lib/api.js` — umbrales: lines ≥60, functions ≥50, branches ≥50.
- **Run:** `npx vitest run --coverage`

## 3. Unit backend (Vitest)

- **Tests:** `backend/tests/actaService.test.js` (28) y
  `backend/tests/posicionesService.test.js` (18) — **46 tests**.
- **Config:** `backend/vitest.config.js` (entorno `node`).
- **Estrategia:** mock del pool de BD (`vi.mock("../src/config/db.js")`) con una
  conexión fake (`crearConnection`) → se ejercitan los servicios sin MySQL real.
- **Coverage** sobre `src/services/actaService.js` y `src/services/posicionesService.js`
  — umbrales: lines ≥70, functions ≥65, branches ≥60.
- **Run:**
  ```bash
  npm ci --prefix backend
  (cd backend && npx vitest run --coverage)
  ```
- ⚠️ `npm test` en `backend/` es el placeholder `exit 1` del template — no usar.

## 4. API (Postman + Newman)

- **Colección:** `tests/management.postman_collection.json` — 7 carpetas y
  **22 requests**: Auth, Catálogos (públicos), Equipos, Árbitros,
  Torneos y fixture, Calendario y Casos negativos (idempotentes).
- **Environment:** `tests/management.postman_environment.json` (variable `baseUrl`).
- **Runner:** `scripts/run-newman.sh` → genera `test-reports/newman.xml` (JUnit) y
  `test-reports/newman.html`.
- **Prerequisitos:** MySQL con esquema + datos y el backend levantado.
- **Run local:**
  ```bash
  mysql -h127.0.0.1 -uroot -p < database/schema.sql
  mysql -h127.0.0.1 -uroot -p global_league < database/seed.sql
  mysql -h127.0.0.1 -uroot -p global_league < tests/test-db-seed.sql
  (cd backend && npm start) &
  BASE_URL=http://localhost:3000/api bash scripts/run-newman.sh
  ```

## 5. Load test (JMeter)

- **Plan:** `jmeter/GlobalLeague_LoadTest.jmx` — **10 VUs, ramp-up 10 s, 5 loops**.
  Flujo por VU: `POST /api/auth/login` → `GET /api/calendario` →
  `GET /api/torneos/1/posiciones`, con `ResponseAssertion` de status 200 y un
  `CookieManager` que mantiene la sesión del login.
- **Parámetros:** `-Jhost` y `-Jport` (por defecto `localhost:3000`).
- **Requisitos:** Java 17 y Apache JMeter 5.6.3 (en CI se instalan en el job).
- **Run:**
  ```bash
  jmeter -n -t jmeter/GlobalLeague_LoadTest.jmx -Jhost=localhost -Jport=3000 \
    -l test-reports/jmeter-results.jtl -e -o test-reports/jmeter-report
  ```
- En CI solo corre en `push` a `main` (por eso aparece `skipping` en los PRs) y
  sube el artifact `jmeter-report` (JTL crudo + dashboard HTML).


## 6. E2E (Playwright) — smoke

- **Specs:** `tests/e2e/auth.spec.ts` (login → dashboard),
  `tests/e2e/tabla-posiciones.spec.ts` (tabla visible) y
  `tests/e2e/acta-digital.spec.ts` (título de la vista).
- **Config:** `playwright.config.ts` (solo Chromium, `trace: on-first-retry`).
- **Run local:** con la app levantada (`npm run dev` en frontend + backend):
  ```bash
  npx playwright install chromium
  npx playwright test
  ```
- ⚠️ Deuda: la config todavía no define `baseURL` ni `webServer`, y el job
  `e2e` de CI es un placeholder (`echo ...`) — los specs corren solo en local.

## 7. Catálogo de casos (Qase)

`qase/test-cases/*.json` — **33 casos** con `id/title/priority/type`:
ACTA-001…015 (15), AUTH-001…006 (6), POS-001…012 (12).
Es un catálogo importable a Qase; no se ejecuta automáticamente en CI.

## Pipeline de CI

```text
lint
├─ unit-frontend        (vitest + coverage → artifact vitest-frontend.xml)
└─ integration-backend  (vitest + coverage → artifact vitest-backend.xml)
   ├─ e2e               (placeholder)
   ├─ postman           (MySQL 8 + seeds + newman → newman-reports)
   └─ load-test         (solo main; MySQL 8 + seeds + JMeter → jmeter-report)
```

- Node 20, `actions/checkout@v7`, `actions/setup-node@v7`,
  `actions/upload-artifact@v7`, `actions/setup-java@v6`.
- Cada job sube sus reportes como **artifacts** de Actions.
- `jenkins/Jenkinsfile` es el espejo declarativo del mismo pipeline.

## Reportes locales

Todo cae en `test-reports/` (commiteado con `.gitkeep`):
`vitest-frontend.xml`, `vitest-backend.xml`, `newman.xml` / `newman.html`,
`jmeter-results.jtl` + `jmeter-report/` (dashboard HTML).

## Notas / deuda conocida

1. `npm test` en `backend/` es el placeholder `exit 1` del template — usar
   `npx vitest run` dentro de `backend/`.
2. `frontend/tests/unit/views/*.test.jsx` (3 tests) **no están en el include
   de Vitest** → no se ejecutan; los tests canónicos son los de `tests/`.
3. Playwright sin `baseURL`/`webServer`; job `e2e` en CI es placeholder.
4. Los umbrales de coverage son los de cada config (frontend 60/50/50,
   backend 70/65/60), no un 80% genérico.


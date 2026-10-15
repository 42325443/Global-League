# Testing Plan - Global League

## Postman
- Collection: `management.postman_collection.json`
- Endpoints: auth, acta, posiciones, torneos, equipos, arbitros

## Vitest Backend
- `backend/tests/unit/services/actaService.test.js`
- `backend/tests/unit/services/posicionesService.test.js`
- Coverage target: >=80%

## Vitest Frontend
- `frontend/tests/unit/views/ActaDigital.test.jsx`
- `frontend/tests/unit/views/TablaPosiciones.test.jsx`

## Playwright E2E
- `tests/e2e/acta-digital.spec.ts`
- `tests/e2e/tabla-posiciones.spec.ts`
- `tests/e2e/auth.spec.ts`

## Commands
- `npm run test:unit` (backend)
- `npm run test` (frontend)
- `npx playwright test` (e2e)

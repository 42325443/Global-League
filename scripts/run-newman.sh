#!/usr/bin/env bash
# Ejecuta la coleccion Postman con Newman contra el backend en marcha.
# Uso: BASE_URL=http://localhost:3000/api bash scripts/run-newman.sh
# Requiere: backend corriendo (npm run dev/start en backend/) + newman instalado.
# Salida: test-reports/newman.xml (JUnit) + test-reports/newman.html
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COLLECTION="$ROOT/tests/management.postman_collection.json"
ENVIRONMENT="$ROOT/tests/management.postman_environment.json"
REPORTS="$ROOT/test-reports"
BASE_URL="${BASE_URL:-http://localhost:3000/api}"

mkdir -p "$REPORTS"

if ! command -v newman >/dev/null 2>&1; then
  echo "[newman] newman no instalado. Correr: bash scripts/setup-ci.sh" >&2
  exit 2
fi

# La collection usa {{baseUrl}}; el environment ya trae localhost:3000/api,
# pero permitimos override por variable de entorno para CI remota.
EXTRA_ENV=()
if [ "$BASE_URL" != "http://localhost:3000/api" ]; then
  EXTRA_ENV=(--env-var "baseUrl=$BASE_URL")
fi

echo "[newman] corriendo contra $BASE_URL"
newman run "$COLLECTION" \
  -e "$ENVIRONMENT" \
  "${EXTRA_ENV[@]}" \
  --reporters cli,junit,html \
  --reporter-junit-export "$REPORTS/newman.xml" \
  --reporter-html-export "$REPORTS/newman.html"

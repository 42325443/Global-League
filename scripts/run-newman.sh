#!/usr/bin/env bash
# Ejecuta la coleccion Postman con Newman contra el backend en marcha.
# Uso: BASE_URL=http://localhost:3000/api bash scripts/run-newman.sh
# Requiere: backend corriendo (npm run dev/start en backend/) + newman instalado.
# Salida: test-reports/newman.xml (JUnit) + test-reports/newman.html
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COLLECTION="$ROOT/tests/management.postman_collection.json"
ENVIRONMENT="$ROOT/tests/management.postman_environment.json"
REPORTS="$ROOT/test-reports"
BASE_URL="${BASE_URL:-http://localhost:3000/api}"

mkdir -p "$REPORTS"

# Se usa npx para verificar o ejecutar newman si no está global
if ! command -v newman >/dev/null 2>&1; then
  echo "[newman] newman no detectado globalmente, se intentará usar mediante npx."
fi

EXTRA_ENV=()
if [ "$BASE_URL" != "http://localhost:3000/api" ]; then
  EXTRA_ENV=(--env-var "baseUrl=$BASE_URL")
fi

echo "[newman] corriendo contra $BASE_URL"

# Ejecutamos con npx para garantizar que funcione exista o no globalmente
npx newman run "$COLLECTION" \
  -e "$ENVIRONMENT" \
  "${EXTRA_ENV[@]}" \
  --reporters cli,junit,html \
  --reporter-junit-export "$REPORTS/newman.xml" \
  --reporter-html-export "$REPORTS/newman.html"

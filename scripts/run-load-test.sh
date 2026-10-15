#!/usr/bin/env bash
# Wrapper del smoke de carga k6. Acepta BASE_URL y guarda el resumen JSON.
# Uso: BASE_URL=http://localhost:3000/api bash scripts/run-load-test.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORTS="$ROOT/test-reports"
BASE_URL="${BASE_URL:-http://localhost:3000/api}"

mkdir -p "$REPORTS"

if ! command -v k6 >/dev/null 2>&1; then
  echo "[load-test] k6 no instalado. Correr: bash scripts/setup-ci.sh" >&2
  exit 2
fi

echo "[load-test] 10 VUs x 30s contra $BASE_URL"
BASE_URL="$BASE_URL" k6 run --summary-export="$REPORTS/k6-summary.json" "$ROOT/scripts/load-test.js"
echo "[load-test] resumen en $REPORTS/k6-summary.json"

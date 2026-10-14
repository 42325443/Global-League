#!/usr/bin/env bash
# Instala las dependencias de ejecucion CI que no vienen en package.json:
# Newman (Postman CLI) y k6 (load test). Idempotente.
set -euo pipefail

if ! command -v newman >/dev/null 2>&1; then
  echo "[setup-ci] instalando newman..."
  npm install -g newman
else
  echo "[setup-ci] newman OK: $(newman --version)"
fi

if ! command -v k6 >/dev/null 2>&1; then
  echo "[setup-ci] k6 no encontrado. Instalar manualmente:"
  echo "  Windows (choco): choco install k6"
  echo "  Debian/Ubuntu:   sudo apt-get install k6  (tras agregar repo oficial)"
  echo "  macOS:           brew install k6"
else
  echo "[setup-ci] k6 OK: $(k6 version 2>/dev/null | head -n 1)"
fi

mkdir -p test-reports
echo "[setup-ci] listo. Reportes en test-reports/"

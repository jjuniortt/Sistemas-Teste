#!/usr/bin/env bash
set -euo pipefail

# Deploy direto na Vercel via CLI (alternativa quando não há repositório GitHub).
# Pré-requisito: token da Vercel em VERCEL_TOKEN ou autenticação prévia do CLI.

if ! command -v vercel &> /dev/null && ! command -v bunx &> /dev/null; then
  echo "Vercel CLI não encontrado. Instale com: bun add -g vercel"
  exit 1
fi

VERCEL_CMD="vercel"
if ! command -v vercel &> /dev/null; then
  VERCEL_CMD="bunx vercel"
fi

# Força o preset correto para a Vercel
export NITRO_PRESET=vercel

# Faz login se houver token (útil em CI/CD)
if [ -n "${VERCEL_TOKEN:-}" ]; then
  $VERCEL_CMD login --token "$VERCEL_TOKEN" --yes || true
fi

# Deploy (produção com --prod)
$VERCEL_CMD --prod "$@"

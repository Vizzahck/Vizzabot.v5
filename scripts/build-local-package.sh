#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
version="$(node -p "require('./package.json').version")"
archive="dist/vizzabot-v5-local-${version}.tar.gz"
items=(src scripts termux assets docs package.json README.md)
for item in package-lock.json LICENSE .env.example config.local.example.json; do
  if [[ -e "$item" ]]; then items+=("$item"); fi
done
# Explicit allowlist: never bundle sessions, customer data, local config or tokens.
tar -czf "$archive" \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='config.local.json' \
  --exclude='sessions' \
  --exclude='data' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='*.key' \
  --exclude='*.pem' \
  --exclude='*.sqlite' \
  --exclude='*.db' \
  "${items[@]}"
echo "Pacote criado: $archive"
echo 'Verifique os arquivos do pacote antes de enviar ao cliente:'
tar -tzf "$archive" | head -40
echo 'Atenção: inspecione scripts, documentação e assets para não incluir segredos manualmente.'

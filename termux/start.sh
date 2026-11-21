#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
cd "$HOME/Vizzabot.v5"
if [[ ! -f .env ]]; then echo "Execute o instalador primeiro."; exit 1; fi
if [[ ! -f config.local.json ]]; then
  cp config.local.example.json config.local.json
  echo "Configure o dono e administradores: nano ~/Vizzabot.v5/config.local.json"
  exit 1
fi
if [[ ! -d node_modules ]]; then echo "Dependências ausentes. Execute npm install."; exit 1; fi
echo "Iniciando Vizzabot V5. Pareamento por número se necessário."
exec npm start

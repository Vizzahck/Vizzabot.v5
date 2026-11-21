#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
cd "$HOME/Vizzabot.v5"
if [[ ! -f .env ]]; then
  echo "Configuração ausente. Execute primeiro: bash termux/install.sh"
  exit 1
fi
if [[ ! -d node_modules ]]; then
  echo "Dependências ausentes. Execute: npm install"
  exit 1
fi
echo "Iniciando Vizzabot V5. Mantenha o Termux aberto."
echo "No WhatsApp, acesse Aparelhos conectados para escanear o QR."
exec npm start

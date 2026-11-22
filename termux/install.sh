#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
export PATH="$PREFIX/bin:$PATH"
echo "== Vizzabot V5 | Instalador Termux =="
if [[ -z "${PREFIX:-}" || "$PREFIX" != *com.termux* ]]; then echo "Execute dentro do Termux."; exit 1; fi
pkg update -y
pkg install -y nodejs-lts git python make clang pkg-config ffmpeg tesseract
DEST="$HOME/Vizzabot.v5"
if [[ ! -d "$DEST/.git" ]]; then
  if [[ -e "$DEST" ]]; then echo "Pasta já existe e não é repositório Git."; exit 1; fi
  git clone https://github.com/Vizzahck/Vizzabot.v5.git "$DEST"
fi
cd "$DEST"
if [[ ! -f .env ]]; then cp .env.example .env; fi
if [[ ! -f config.local.json ]]; then cp config.local.example.json config.local.json; fi
npm install --no-audit --no-fund
npm run check
npm test
echo "Edite seu nome, número e admins: nano ~/Vizzabot.v5/config.local.json"
echo "Inicie: bash ~/Vizzabot.v5/termux/start.sh"

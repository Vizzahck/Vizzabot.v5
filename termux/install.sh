#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
export PATH="$PREFIX/bin:$PATH"
echo "== Vizzabot V5 | Instalador Termux =="
if [[ -z "${PREFIX:-}" || "$PREFIX" != *com.termux* ]]; then
  echo "Execute este instalador dentro do Termux." >&2
  exit 1
fi
pkg update -y
pkg install -y nodejs-lts git python make clang pkg-config
if ! command -v npm >/dev/null; then echo "npm não encontrado"; exit 1; fi
echo "Node: $(node --version) | npm: $(npm --version)"
REPO="https://github.com/Vizzahck/Vizzabot.v5.git"
DEST="$HOME/Vizzabot.v5"
if [[ ! -d "$DEST/.git" ]]; then
  if [[ -e "$DEST" ]]; then echo "A pasta $DEST já existe e não é um repositório Git. Não vou sobrescrevê-la."; exit 1; fi
  git clone "$REPO" "$DEST"
fi
cd "$DEST"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Arquivo .env criado. Configure OWNER_NUMBERS antes de iniciar."
else
  echo "Configuração .env existente preservada."
fi
npm install --no-audit --no-fund
npm run check
npm test
echo
echo "Instalação finalizada. Edite ~/Vizzabot.v5/.env e execute:"
echo "bash ~/Vizzabot.v5/termux/start.sh"

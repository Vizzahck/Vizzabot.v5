#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
cd "$HOME/Vizzabot.v5"
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Existem alterações locais no código. Atualização cancelada para evitar perda de dados."
  exit 1
fi
echo "Buscando atualizações..."
git fetch origin main
git merge --ff-only origin/main
echo "Atualizando dependências..."
npm install --no-audit --no-fund
npm run check
npm test
echo "Atualização concluída. Sua pasta sessions/, data/ e arquivo .env foram preservados."

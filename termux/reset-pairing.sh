#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
cd "$HOME/Vizzabot.v5"
if pgrep -f 'node src/index.js' >/dev/null; then
  echo "Pare o Vizzabot com Ctrl+C antes de reiniciar o pareamento."
  exit 1
fi
if [[ -d sessions/whatsapp ]]; then
  backup="sessions/whatsapp.failed.$(date +%Y%m%d-%H%M%S)"
  mv sessions/whatsapp "$backup"
  echo "Sessão anterior guardada em $backup (privada, não compartilhe)."
fi
echo "Iniciando novo pareamento..."
exec bash termux/start.sh

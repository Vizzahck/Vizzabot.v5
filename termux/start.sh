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
if ! node --input-type=module -e "import {createRequire} from 'node:module'; const r=createRequire(process.cwd()+'/package.json'); const fs=await import('node:fs'); const p=JSON.parse(fs.readFileSync('node_modules/@whiskeysockets/baileys/package.json','utf8')); if(p.version!=='7.0.0-rc14')process.exit(1);" ; then
  echo "Atualize dependências: npm install"
  exit 1
fi
echo "Iniciando Vizzabot V5. Pareamento por número se necessário."
exec npm start

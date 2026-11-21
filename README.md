# 🤖 Vizzabot V5

Bot WhatsApp modular, reescrito de forma independente em Node.js.

**Versão:** 5.2.0-alpha.1. Ainda não testado com uma conexão real ao WhatsApp.

## Instalação
Requer Node.js 20+ e npm. No Android, consulte [o guia Termux](termux/README.md).

```bash
git clone https://github.com/Vizzahck/Vizzabot.v5.git
cd Vizzabot.v5
cp .env.example .env
npm install
npm run check
npm test
npm start
```

**Pareamento por número, sem QR:** ao iniciar sem sessão, informe seu número com DDI e DDD no terminal. O bot solicitará um código de vinculação. No WhatsApp, abra Aparelhos conectados > Conectar aparelho > Conectar com número de telefone e digite o código. Alternativamente, configure `PAIRING_NUMBER` no `.env`. Não compartilhe esse código.

## Comandos
- Gerais: `!menu`, `!comandos`, `!ping`, `!sobre`, `!perfil`
- Figurinhas: `!sticker`, `!s`
- Grupos: `!antilink on/off`, `!boasvindas on/off`, `!ban @usuario`, `!avisos`
- Economia: `!saldo`, `!diario`, `!ranking`
- Proprietário: `!status`

Consulte [funcionalidades](docs/FEATURES.md) e [segurança](docs/SECURITY.md).

## Limitações
Baileys é não oficial. A conexão e as permissões de grupo precisam de testes reais. Nunca publique `.env`, `sessions/`, `data/` ou logs.

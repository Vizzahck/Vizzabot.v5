# 🤖 Vizzabot V5

Base nova, independente e modular para WhatsApp, construída em Node.js.

**Status:** alpha inicial. Conexão real com WhatsApp ainda não testada.

## Instalação

Requer Node.js 20+ e npm.

```bash
cp .env.example .env
# Configure OWNER_NUMBERS com DDI e apenas dígitos
npm install
npm test
npm start
```

Escaneie o QR Code em WhatsApp > Aparelhos conectados. Comandos: `!menu`, `!ping`, `!sobre`, `!status` (proprietário).

## Estrutura

- `src/index.js`: conexão Baileys
- `src/core/`: parser, permissões, registro e tratamento
- `src/commands/`: comandos modulares
- `tests/`: testes unitários
- `docs/`: segurança e roteiro

## Segurança

Não publique `.env`, `sessions/`, tokens, dados pessoais ou logs. Baileys é uma integração não oficial e pode deixar de funcionar com mudanças do WhatsApp. O armazenamento de sessão é apenas para prototipagem.

## Origem

Reescrita limpa, sem copiar o código V4. Antes de portar trechos do V4, revise os direitos e avisos de licença aplicáveis.

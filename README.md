# 🤖 Vizzabot V5

Bot WhatsApp modular, reescrito de forma independente em Node.js.

**Versão:** 5.1.0-alpha.1. Ainda não testado com uma conexão real ao WhatsApp.

## Requisitos e instalação
Node.js 20+ e npm. A dependência SQLite nativa pode exigir ferramentas de compilação em algumas plataformas.

```bash
git clone https://github.com/Vizzahck/Vizzabot.v5.git
cd Vizzabot.v5
cp .env.example .env
# Edite .env: configure OWNER_NUMBERS com DDI e só dígitos
npm install
npm test
npm start
```

Escaneie o QR Code em WhatsApp > Aparelhos conectados.

## Comandos
- `!menu`, `!ping`, `!sobre`, `!perfil`
- `!sticker` (ou `!s`) — imagem enviada ou citada
- `!antilink on/off` — administradores de grupo
- `!boasvindas on/off` — administradores de grupo
- `!ban @usuario` — administradores; bot também deve ser admin
- `!status` — proprietário

Detalhes em [docs/FEATURES.md](docs/FEATURES.md).

## Organização
- `src/core/` — processamento e moderação
- `src/commands/` — comandos por categoria
- `src/database/` — SQLite local
- `tests/` — testes unitários
- `docs/` — documentação

## Segurança e limites
- Nunca publique `.env`, `sessions/`, `data/` ou logs.
- Antilink é desativado por padrão e depende de permissões de administrador.
- Baileys é não oficial; mudanças do WhatsApp podem interromper a conexão.
- Para produção: revisar compatibilidade LID, validar a sessão, implementar backups, testes de integração e observabilidade.
- Não copie código do V4 sem revisar os direitos e avisos de licença aplicáveis.

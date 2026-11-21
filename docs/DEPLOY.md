# Execução e implantação

## Local
1. Instale Node.js 22 LTS e Git.
2. Clone o repositório e execute `npm install`.
3. Copie `.env.example` para `.env`, configure o número do proprietário.
4. Execute `npm test` e `npm start`.
5. Escaneie o QR no WhatsApp > Aparelhos conectados.

## Execução contínua
O processo precisa ficar ligado em um computador ou servidor. Não é possível hospedar o bot apenas no GitHub Pages. Para manter online, configure um serviço de processo na máquina escolhida. A pasta `sessions/` contém credenciais privadas e precisa de proteção e backup seguro.

## GitHub Actions
O workflow CI valida instalação, sintaxe e testes a cada push ou pull request. Ele **não** faz login no WhatsApp, não inicia o bot em produção e não acessa suas sessões.

## Limites
Baileys é uma API não oficial. Evite disparos em massa e automações não consentidas. Nunca envie credenciais ou dados de mensagens para o GitHub.

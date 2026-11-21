# Segurança

- Nunca versionar `.env`, sessões, tokens, bancos de dados ou logs com mensagens.
- Configurar `OWNER_NUMBERS` com DDI, sem sinal de +.
- Revisar permissões dos grupos antes de ações administrativas.
- Não importar automaticamente scripts ou credenciais do V4.
- Não usar `eval` nem execução de shell a partir de mensagens.
- Revogar credenciais antigas eventualmente expostas.
- Baileys não é API oficial do WhatsApp.

# Configuração local (Termux)

O Vizzabot baixa atualizações do GitHub, mas lê as permissões de `config.local.json` na pasta do projeto. Esse arquivo é ignorado pelo Git, portanto **não é substituído ao atualizar**.

## Primeira configuração
```bash
cd ~/Vizzabot.v5
cp config.local.example.json config.local.json
nano config.local.json
```

Exemplo:
```json
{
  "owner": { "name": "Seu nome", "numbers": ["5598999999999"] },
  "botAdmins": ["5598888888888"],
  "bot": { "name": "Vizzabot V5", "prefix": "!" }
}
```

- `owner.name`: nome do dono, apenas informativo.
- `owner.numbers`: números com acesso aos comandos exclusivos do proprietário.
- `botAdmins`: números com acesso aos comandos de administração do bot e moderação de grupos (quando o bot possui permissões necessárias). **Não recebem comandos exclusivos do dono.**
- `bot.name` e `bot.prefix`: nome e prefixo dos comandos.
- Use números com DDI e DDD, somente dígitos, sem `+`.

O arquivo local tem prioridade sobre os valores correspondentes do `.env`. Se não existir, o bot usa as variáveis do `.env`. As alterações passam a valer após reiniciar o bot.

**Segurança:** não compartilhe `config.local.json`, `.env` ou `sessions/`. A identificação de números em grupos que usam JIDs LID pode exigir compatibilidade adicional; valide as permissões em seu WhatsApp.

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

## Simi (0/1)
No arquivo `config.local.json`, adicione o campo `"features": { "simi": 0 }` no nível principal do JSON. `0` desliga, `1` liga. O modo atual responde apenas a frases reconhecidas em conversas privadas recebidas de outras pessoas, sem responder às próprias mensagens do bot. Reinicie após alterar.

## Figurinhas no Termux
Instale `pkg install ffmpeg -y` e use `!s` respondendo a uma foto ou como legenda da imagem. O V5 tenta Sharp e usa FFmpeg se Sharp não funcionar. Não é necessário reinstalar o bot.

## Arquivos locais e atualizações
`config.local.json` é ignorado pelo Git e preservado ao executar `bash termux/update.sh`. O repositório mantém um modelo `config.local.example.json`; ele não substitui seu arquivo pessoal. O bot precisa continuar instalado na pasta `~/Vizzabot.v5` para executar os scripts do Termux. O GitHub é usado para obter atualizações, não para armazenar seus dados locais.

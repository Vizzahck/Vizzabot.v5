# Instalação local e distribuição para clientes

O Vizzabot V5 executa localmente em um dispositivo com Node.js 22.13+ (incluindo Termux). GitHub é usado para obter código e atualizações; não é um servidor obrigatório para o bot em execução. A conexão com o WhatsApp, downloads e APIs externas ainda exigem internet.

## Nova instalação de cliente

1. Crie uma cópia **separada** do projeto para o cliente (não compartilhe a pasta `sessions` ou `data` de outra instalação).
2. Instale as dependências com `npm ci` se existir lockfile, caso contrário `npm install`.
3. Execute `npm run setup` e informe nome, número com DDI/DDD, nome do bot e prefixo.
4. Execute `npm run check && npm test && npm start`, então vincule o WhatsApp do cliente pelo código de pareamento.
5. Em Termux, use `bash termux/start.sh` após a configuração.

O assistente de instalação não sobrescreve `config.local.json` existente. As configurações são criadas com permissões restritas e as opções de envio público de imagens permanecem desligadas.

## Segurança e separação

- **Nunca** copie `sessions/`, `config.local.json`, `data/`, `.env`, backups de sessão, tokens ou logs pessoais para um pacote de cliente.
- Não coloque sessões e credenciais em repositórios GitHub, especialmente públicos.
- Cada cliente precisa ter seu próprio número e sua própria sessão. Não execute dois processos sobre a mesma pasta de autenticação.
- As pastas locais de configuração e sessão estão no `.gitignore`. Verifique o pacote antes de distribuí-lo.
- Um bot instalado no celular do cliente depende de ele manter o Termux ativo e conectado. Para oferecer disponibilidade 24/7, avalie hospedagem separada com isolamento de dados, backups e monitoramento.
- A comercialização exige verificar licenças das dependências e dos conteúdos do V4, direitos sobre assets, políticas do WhatsApp e regras de proteção de dados. Não prometa serviço oficial do WhatsApp: Baileys é uma integração não oficial.
- O projeto ainda é uma versão alpha; não há licença por cliente, cobrança automática, painel SaaS, atualização remota autenticada ou garantia de 100% de paridade com o V4.

## Próximos módulos de produto

Inventário funcional e testes de equivalência V4/V5; recursos de aluguel/expiração; suporte por cliente; instalador/atualizador com rollback; proteção de dados e backup; gerenciamento seguro de múltiplas instâncias; licenciamento e termos de uso.

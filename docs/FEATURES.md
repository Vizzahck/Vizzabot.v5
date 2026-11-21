# Funcionalidades do Vizzabot V5 (5.2 alpha)

## Comandos
- Gerais: `!menu`, `!comandos`, `!ping`, `!sobre`, `!perfil`
- Figurinhas: `!sticker`, `!s`, `!figurinha` (imagem estática)
- Grupos: `!antilink on/off`, `!boasvindas on/off`, `!ban @usuario`, `!avisos @usuario`
- Economia: `!saldo`, `!diario` (100 moedas a cada 24h), `!ranking`
- Proprietário: `!status`

## Infraestrutura
- Banco SQLite local com migração de coluna para economia
- Reconexão com backoff e tratamento de erros
- Limite básico de quatro comandos por cinco segundos por remetente
- CI no GitHub Actions com testes automatizados

## Limitações
- Nenhuma sessão WhatsApp real foi testada aqui.
- Administração exige permissões e pode requerer ajustes para identificadores LID.
- Figurinhas animadas, IA, dashboard e RPG de combate não estão implementados.
- O GitHub Actions executa testes, mas não hospeda o bot.

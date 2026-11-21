# Auditoria inicial: Vizzabot V4 → V5

Fonte: arquivo Vizzabot-V4.zip fornecido pelo proprietário, especialmente `index.js`, `config/infobot.json`, `config/logos.json` e `config/menu.jpg`.

## Identidade visual encontrada no V4
- Menus com imagem e legenda, molduras `╭━─━─━─≪✠≫─━─━─━╮`, caracteres decorativos, títulos de categorias e ícones.
- Informações do bot: nome, usuário, dono, versão, data, hora, prefixo, ping e premium.
- Menu interativo com seleção de categorias (dependente de compatibilidade do WhatsApp/Baileys).
- Logo referenciada em `config/logos.json` e imagem de menu em `config/menu.jpg`.

## Funcionalidades encontradas no V4
O arquivo `index.js` contém centenas de ramificações `case`, incluindo aliases, com recursos de:
- Administração de grupos: ban, promover/rebaixar, abertura/fechamento, boas-vindas, antialink, antiaudio, antisticker, antifake, antipalavrão, moderação e advertências.
- Menus: principal, administrador, dono, logos, figurinhas, download, anime, jogos, RPG, filmes, brincadeiras, premium e conteúdo adulto.
- Utilitários: cálculo, tradução, Wikipedia, previsão do tempo, IA, respostas automáticas, texto para voz.
- Mídia: downloads, conversão de áudio, stickers, imagens e logos.
- Jogos/RPG: quiz, jogo da velha, moedas, mineração, pesca, tesouros, loja e rankings.
- Configurações de dono, prefixo, identidade e respostas por JSON.

**Importante:** ramificações e aliases não equivalem a funcionalidades independentes e não comprovam que cada recurso do V4 ainda funciona. Serviços externos, licenças, URLs e bibliotecas antigas precisam de avaliação antes de migrar.

## Estado do V5
- Visual do menu: primeira adaptação publicada com imagem de logo V4, molduras, informações e categorias reais.
- Comandos do V5: apenas os efetivamente registrados aparecem no menu; comandos do V4 não são anunciados como funcionais antes da implementação.
- Menus interativos e paridade de comandos: **pendentes**.
- Identidade visual: a URL original da logo pode deixar de funcionar; recomenda-se guardar uma imagem local no Termux e suportar `MENU_LOGO_URL` no `.env`.

## Prioridades sugeridas
1. Restaurar identidade, imagem e menus por categoria sem quebrar compatibilidade Android.
2. Revisar os comandos do V4 por módulos, implementando primeiro administração e utilitários.
3. Adicionar mídia/figurinhas com alternativas compatíveis com Termux.
4. Migrar jogos/RPG com dados persistentes.
5. Integrar recursos externos opcionais somente com APIs e autorização apropriadas.
6. Testar comandos, permissões e pareamento no WhatsApp real.

## Lote de migração — 21/11/2026
- Implementados controles de grupo: `linkgp`, `grupoinfo`, `fechargp`, `abrirgp`, `novolink`, `nomegp`, `descgp`, `promover`, `rebaixar`, `tagall` (com aliases).
- Implementadas brincadeiras: `gado`, `corno`, `gay`, `lindo`, `feio`, `bebado`, `gostoso`, `vesgo`, `calvo`, `chance`, `sorte`, `sorteio` (com aliases).
- Os medidores são sorteios recreativos, não cópias exatas das respostas do V4.
- Ainda falta testar estes comandos no Termux e no WhatsApp real. `novolink` revoga o convite anterior. Permissões de administração são verificadas.
- Paridade total com V4 **não alcançada**. Recursos com serviços externos, packs, jogos, banco de dados e integração de mídia continuam pendentes.

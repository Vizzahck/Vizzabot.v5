# Operação local e controle remoto
O Vizzabot V5 roda no Termux e mantém a sessão e configurações no celular. O GitHub serve para baixar e atualizar o código; **GitHub sozinho não controla nem desliga processos em execução no telefone**.

O proprietário pode enviar `!desligar` pelo WhatsApp, de qualquer lugar, desde que o bot esteja conectado e o número seja reconhecido como dono. O comando solicita encerramento do processo por SIGTERM, que aciona a rotina de fechamento do socket e banco de dados.

**Atenção:** desligar remotamente não significa que seja possível ligar remotamente. Depois de desligado, o bot não pode receber comandos de WhatsApp. Para religar sem acesso ao aparelho, é preciso um supervisor/agente residente com autenticação própria, ainda não implementado.

Configuração pessoal: `config.local.json` no Termux, ignorado pelo Git. Alterações de configuração requerem reinício. Nunca publique sessões, tokens ou dados locais no repositório.

## Migração V4
O V4 original possui aproximadamente 978 rótulos `case` no arquivo `index.js`, incluindo muitos aliases. O V5 ainda não oferece paridade funcional. Menus com categorias sem comandos retornam aviso de migração pendente, em vez de anunciar funções inexistentes.

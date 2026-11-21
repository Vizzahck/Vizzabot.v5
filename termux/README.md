# Vizzabot V5 no Termux (Android)

O Vizzabot é um projeto Node.js; não é necessário gerar APK.

## Primeira instalação
Abra o Termux e execute:
```bash
pkg update -y
pkg install -y git
git clone https://github.com/Vizzahck/Vizzabot.v5.git
bash Vizzabot.v5/termux/install.sh
```

O instalador instala Node.js LTS, Python, make, clang e pkg-config, além das dependências npm. Em seguida, verifica a sintaxe e executa os testes.

## Configuração
```bash
nano ~/Vizzabot.v5/.env
```
Substitua `OWNER_NUMBERS` pelo seu número com DDI e DDD, somente dígitos. Não compartilhe esse arquivo.

## Iniciar
```bash
bash ~/Vizzabot.v5/termux/start.sh
```

## Atualizar
Pare o bot com Ctrl+C e execute:
```bash
bash ~/Vizzabot.v5/termux/update.sh
```

## Observações
- A sessão fica em `~/Vizzabot.v5/sessions/`; o banco SQLite fica em `data/`. Não envie essas pastas ao GitHub.
- O instalador não executa automaticamente o pareamento com WhatsApp.
- Compilar `better-sqlite3` e `sharp` no Android pode falhar em algumas versões do Termux. A instalação ainda precisa ser validada em um aparelho real.
- Evite encerrar o Termux durante a execução. O Android pode suspender processos em segundo plano.
- Não execute scripts baixados de fontes desconhecidas. Confira o conteúdo antes de rodar.

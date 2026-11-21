# Vizzabot V5 no Termux (Android)

O Vizzabot roda em Node.js no Termux, sem APK.

## Instalação
```bash
pkg update -y
pkg install -y git
git clone https://github.com/Vizzahck/Vizzabot.v5.git
bash Vizzabot.v5/termux/install.sh
```

## Configurar
```bash
nano ~/Vizzabot.v5/.env
```
Defina `OWNER_NUMBERS` com seu número (DDI + DDD + número, somente dígitos). Opcionalmente, defina `PAIRING_NUMBER` para não precisar digitá-lo no terminal.

## Conectar pelo número (sem QR)
```bash
bash ~/Vizzabot.v5/termux/start.sh
```
Quando solicitado, digite o número do WhatsApp com DDI e DDD. O Termux mostrará um **código de vinculação**.

No WhatsApp do mesmo celular, abra **Aparelhos conectados > Conectar aparelho > Conectar com número de telefone** e digite o código. Os nomes das opções podem variar conforme a versão do aplicativo.

Depois do primeiro vínculo, a sessão será salva em `sessions/` e o bot tentará reutilizá-la automaticamente. Não compartilhe o código de vinculação.

## Atualizar uma instalação existente
Pare o bot com Ctrl+C:
```bash
bash ~/Vizzabot.v5/termux/update.sh
bash ~/Vizzabot.v5/termux/start.sh
```

## Observações
- `sessions/`, `data/` e `.env` são privados e não devem ser enviados ao GitHub.
- O código de pareamento depende da disponibilidade da API Baileys e de uma sessão ainda não registrada.
- Compilar `better-sqlite3` e `sharp` pode falhar em algumas versões do Termux; a instalação ainda precisa ser validada no aparelho.
- O Android pode suspender o Termux em segundo plano.

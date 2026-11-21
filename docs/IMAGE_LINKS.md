# Links de imagens — !linkimg

O comando `!linkimg` ou `!imglink` recebe uma imagem enviada com legenda ou citada em resposta e envia a imagem ao serviço público Catbox (`https://catbox.moe`). Retorna o link HTTPS direto da imagem.

**Privacidade:** o upload é feito para um terceiro, fora do WhatsApp, e o link é público. Não envie fotos privadas, documentos pessoais ou imagens sem autorização. O recurso vem desativado por padrão.

Para habilitar, edite `config.local.json` no Termux e inclua `"features": { "simi": 0, "imageLinks": 1 }`. Reinicie o bot. `0` desativa e `1` ativa.

Limite: 8 MB; formatos JPEG, PNG, WebP, GIF. O serviço externo pode ficar indisponível ou alterar suas regras. A função depende de internet e não foi testada em um WhatsApp real.

## Menus
O menu principal foi reorganizado por categorias e mantém imagem de cabeçalho. Menus sem funcionalidades migradas mostram aviso, em vez de inventar comandos. O trabalho de paridade V4 → V5 ainda está em andamento.

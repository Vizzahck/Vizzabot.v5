# Downloads por nome ou link (V4 → V5)
Comandos: `!play nome da música`, `!play URL`, `!video nome do vídeo`, `!video URL`.
Aliases: `!musica`, `!audio`, `!ytmp3`, `!ytmp4`, `!videoyt`.

O comando de áudio apresenta primeiro capa, título, canal e duração, depois envia MP3. O comando de vídeo envia o vídeo com título e informações na legenda, sem capa separada.

## Dependências externas no Termux
```sh
pkg install python ffmpeg
python -m pip install -U yt-dlp
yt-dlp --version
ffmpeg -version
```
Em alguns ambientes Termux, instalar o yt-dlp via pacote da distribuição pode ser preferível ao pip. O executável `yt-dlp` deve estar no PATH.

## Limites e observações
- Arquivos com mais de 45 MB e vídeos acima de 1 hora são recusados.
- A disponibilidade depende do site, da versão do yt-dlp, das restrições de acesso e dos formatos disponíveis.
- Buscas por nome usam o primeiro resultado retornado pelo yt-dlp (não há seleção interativa ainda).
- Não foram realizados testes de download real nem envio pelo WhatsApp. Os testes automatizados cobrem somente parsing e metadados.
- Baixe somente mídias que você tem direito ou permissão para baixar.
- URLs e nomes são passados como argumentos separados ao processo, sem execução por shell.

import { Blob } from 'node:buffer';
import { downloadImage } from '../../core/media.js';
const MAX_BYTES = 8 * 1024 * 1024;
export default {
  name: 'linkimg', aliases: ['imglink', 'urlimg'], category: 'Pesquisa e Downloads',
  description: 'Hospeda uma imagem e retorna link público (requer ativação local)',
  async execute(ctx) {
    if (!ctx.config.imageLinksEnabled) return ctx.reply('🔒 Hospedagem de imagens desativada. Ative features.imageLinks=1 em config.local.json e reinicie.');
    const image = await downloadImage(ctx.sock, ctx.msg, ctx.logger, MAX_BYTES);
    if (!image) return ctx.reply('📸 Responda a uma imagem com !linkimg ou envie a imagem com !linkimg na legenda. Atenção: a imagem será enviada a um serviço público de hospedagem.');
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(image.mimetype)) return ctx.reply('Formato de imagem não permitido.');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([image.buffer], { type: image.mimetype }), 'vizzabot-image.' + ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[image.mimetype]));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, signal: controller.signal });
      const url = (await response.text()).trim();
      if (!response.ok || !/^https:\/\/files\.catbox\.moe\/[a-zA-Z0-9._-]+$/.test(url)) throw new Error('Hospedagem recusou o envio');
      await ctx.reply('🔗 *Link público da imagem:*\n' + url + '\n⚠️ Qualquer pessoa com o link poderá visualizar a imagem.');
    } catch (err) {
      ctx.logger.warn({ err }, 'Falha no upload da imagem');
      await ctx.reply('⚠️ Não consegui hospedar a imagem. Verifique a conexão e tente novamente.');
    } finally { clearTimeout(timeout); }
  }
};

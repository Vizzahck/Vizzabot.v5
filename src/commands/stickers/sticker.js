import sharp from 'sharp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
const MAX_BYTES = 8 * 1024 * 1024;
export default {
  name: 'sticker', aliases: ['s','figurinha'], category: 'Figurinhas', description: 'Converte foto em figurinha',
  async execute(ctx) {
    const message = ctx.msg.message || {};
    const quoted = message.extendedTextMessage?.contextInfo?.quotedMessage || {};
    const source = message.imageMessage ? ctx.msg : quoted.imageMessage
      ? { key: { remoteJid: ctx.chat, id: message.extendedTextMessage?.contextInfo?.stanzaId, participant: message.extendedTextMessage?.contextInfo?.participant }, message: quoted }
      : null;
    if (!source) return ctx.reply('Envie uma foto com !sticker na legenda ou responda uma foto com !sticker.');
    const image = source.message.imageMessage;
    if (image.fileLength && Number(image.fileLength) > MAX_BYTES) return ctx.reply('Imagem muito grande (máximo 8 MB).');
    const buffer = await downloadMediaMessage(source, 'buffer', {}, { logger: ctx.logger, reuploadRequest: ctx.sock.updateMediaMessage });
    if (buffer.length > MAX_BYTES) return ctx.reply('Imagem muito grande (máximo 8 MB).');
    const webp = await sharp(buffer, { limitInputPixels: 25_000_000 })
      .rotate().resize(512,512,{ fit:'contain',background:{r:0,g:0,b:0,alpha:0} }).webp({ quality: 80 }).toBuffer();
    await ctx.sock.sendMessage(ctx.chat, { sticker: webp }, { quoted: ctx.msg });
  }
};

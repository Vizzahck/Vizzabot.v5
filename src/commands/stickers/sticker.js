import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const MAX_BYTES = 8 * 1024 * 1024;

async function ffmpegWebp(buffer) {
  const dir = await mkdtemp(join(tmpdir(), 'vizzabot-sticker-'));
  const input = join(dir, 'input.jpg'), output = join(dir, 'output.webp');
  try {
    await writeFile(input, buffer);
    await new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i',input,'-frames:v','1','-vf','scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000','-c:v','libwebp','-lossless','0','-q:v','75',output], { stdio: 'ignore' });
      proc.once('error', reject);
      proc.once('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg retornou código '+code)));
    });
    return await readFile(output);
  } finally { await rm(dir, { recursive: true, force: true }); }
}

export default {
  name: 'sticker', aliases: ['s','f','sticker2','figurinha'], category: 'Figurinhas', description: 'Cria figurinha respondendo a uma foto ou com !s na legenda',
  async execute(ctx) {
    const message = ctx.msg.message || {};
    const base = message.ephemeralMessage?.message || message;
    const quoted = base.extendedTextMessage?.contextInfo?.quotedMessage || base.imageMessage?.contextInfo?.quotedMessage || {};
    const source = base.imageMessage ? { ...ctx.msg, message: base } : quoted.imageMessage
      ? { key: { remoteJid: ctx.chat, id: base.extendedTextMessage?.contextInfo?.stanzaId, participant: base.extendedTextMessage?.contextInfo?.participant }, message: quoted }
      : null;
    if (!source) return ctx.reply('📸 Responda a uma foto com !s ou envie uma foto com !s na legenda.');
    if (source.message.imageMessage.fileLength && Number(source.message.imageMessage.fileLength) > MAX_BYTES) return ctx.reply('Imagem muito grande (máximo 8 MB).');
    const buffer = await downloadMediaMessage(source, 'buffer', {}, { logger: ctx.logger, reuploadRequest: ctx.sock.updateMediaMessage });
    if (buffer.length > MAX_BYTES) return ctx.reply('Imagem muito grande (máximo 8 MB).');
    let webp;
    try {
      const { default: sharp } = await import('sharp');
      webp = await sharp(buffer, { limitInputPixels: 25_000_000 }).rotate().resize(512,512,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:80}).toBuffer();
    } catch (err) {
      ctx.logger.info({ err }, 'Sharp indisponível; tentando ffmpeg');
      try { webp = await ffmpegWebp(buffer); }
      catch (error) { ctx.logger.warn({ err: error }, 'Falha ao gerar figurinha'); return ctx.reply('⚠️ Não consegui converter a foto. No Termux instale: pkg install ffmpeg -y'); }
    }
    await ctx.sock.sendMessage(ctx.chat, { sticker: webp }, { quoted: ctx.msg });
  }
};


// Text stickers are generated locally; user text is escaped before SVG rendering.
export const textStickerCommands=Array.from({length:6},(_,i)=>({
 name:i?'attp'+(i+1):'attp',category:'Figurinhas',description:'Cria figurinha de texto local',
 async execute(ctx){
 const value=ctx.args.join(' ').trim();
 if(!value||Array.from(value).length>80)return ctx.reply('Informe um texto de até 80 caracteres.');
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]);
 const chars=Array.from(value),lines=[];
 while(chars.length)lines.push(chars.splice(0,16).join(''));
 const size=Math.min(58,Math.floor(360/lines.length));
 const colors=['#ffffff','#ffcf44','#62e5ff','#ff92cb','#a4ff9e','#d4b5ff'];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">'+lines.map((line,j)=>'<text x="256" y="'+(256+(j-(lines.length-1)/2)*size*1.15)+'" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="'+size+'" fill="'+colors[i]+'" stroke="#111111" stroke-width="3" paint-order="stroke">'+escape(line)+'</text>').join('')+'</svg>';
 const {default:sharp}=await import('sharp');
 const sticker=await sharp(Buffer.from(svg)).webp({quality:85}).toBuffer();
 await ctx.sock.sendMessage(ctx.chat,{sticker});
 }
}));

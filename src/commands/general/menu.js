const V4_LOGO = 'https://telegra.ph/file/cc8a2fd436377132c9b96.jpg';
const CATEGORY_ICONS = { Geral: '🪀', Administração: '🛡️', Figurinhas: '🎨', Economia: '💰', Proprietário: '👑' };
const FRAME = '╭━─━─━─≪✠≫─━─━─━╮';
const END = '╰━─━─━─≪✠≫─━─━─━╯';

export function renderV4Menu(ctx, category) {
  const all = ctx.registry.list().filter(c => !c.ownerOnly || ctx.isOwner);
  const selected = category ? all.filter(c => c.category === category) : all;
  const sections = new Map();
  for (const cmd of selected) {
    const group = cmd.category || 'Geral';
    if (!sections.has(group)) sections.set(group, []);
    sections.get(group).push(cmd);
  }
  const now = new Date();
  const stamp = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(now);
  const header = [
    FRAME,
    '⎮╭═────═⌘═────═╮',
    `⎮┝─⊳ 🤖 *BOT:* ${ctx.config.name}`,
    `⎮┝─⊳ 👑 *DONO:* ${ctx.config.ownerName || 'Não configurado'}`,
    `⎮┝─⊳ 🧩 *VERSÃO:* 5.2`,
    `⎮┝─⊳ 📌 *PREFIXO:* ${ctx.config.prefix}`,
    `⎮┝─⊳ 📅 *DATA/HORA:* ${stamp}`,
    '⎮╰═────═⌘═────═╯',
    END
  ];
  for (const [group, cmds] of sections) {
    header.push('', `╭─━─━─━─━─━─━─⊳`, `┝─⊳ ${CATEGORY_ICONS[group] || '📁'} *MENU ${group.toUpperCase()}*`, '╰─━─━─━─━─━─━─⊳', FRAME);
    for (const cmd of cmds) header.push(`⎮┝─⊳ ${ctx.config.prefix}${cmd.name}`);
    header.push(END);
  }
  header.push('', '✠ *VIZZABOT V5* • Modular', `Use ${ctx.config.prefix}comandos para ver descrições.`);
  return header.join('\n');
}

export default {
  name: 'menu', aliases: ['ajuda', 'help', 'menulist'], category: 'Geral', description: 'Exibe menu no estilo clássico V4',
  async execute(ctx) {
    const categoryName = { adm: 'Administração', admin: 'Administração', dono: 'Proprietário', fig: 'Figurinhas', rpg: 'Economia', geral: 'Geral' }[ctx.args[0]?.toLowerCase()];
    const caption = renderV4Menu(ctx, categoryName);
    const logo = process.env.MENU_LOGO_URL?.trim() || V4_LOGO;
    try {
      await ctx.sock.sendMessage(ctx.chat, { image: { url: logo }, caption }, { quoted: ctx.msg });
    } catch (err) {
      ctx.logger.warn({ err }, 'Não foi possível enviar imagem do menu; enviando texto');
      await ctx.reply(caption);
    }
  }
};

const V4_LOGO = 'https://telegra.ph/file/cc8a2fd436377132c9b96.jpg';
const ICONS = { Geral:'🌐', Administração:'🛡️', Figurinhas:'🎨', Economia:'💎', Proprietário:'👑', Brincadeiras:'🎲', Menus:'📚', Ferramentas:'🧰' };
const ALIASES = { adm:'Administração', admin:'Administração', dono:'Proprietário', fig:'Figurinhas', rpg:'Economia', geral:'Geral', brincadeiras:'Brincadeiras', fun:'Brincadeiras', ferramentas:'Ferramentas' };
export function renderV4Menu(ctx, category) {
  const all = ctx.registry.list().filter(c => !c.ownerOnly || ctx.isOwner);
  const selected = category ? all.filter(c => c.category === category) : all;
  const sections = new Map();
  for (const cmd of selected) {
    const key = cmd.category || 'Geral';
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key).push(cmd);
  }
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  const p = ctx.config.prefix;
  const lines = [
    '╭━━━〔 ✦ V I Z Z A B O T ✦ 〕━━━╮',
    '┃  ⚡ *CENTRAL DE COMANDOS*',
    '┣━━━━━━━━━━━━━━━━━━━━━━',
    `┃ 🤖 *BOT:* ${ctx.config.name}`,
    `┃ 👑 *DONO:* ${ctx.config.ownerName || '𝖛𝖍𝖘'}`,
    `┃ 📱 *NÚMERO:* ${ctx.config.owners[0] || 'Não configurado'}`,
    `┃ ⌨️ *PREFIXO:* ${p}`,
    `┃ 🕒 *DATA:* ${date}`,
    `┃ 📚 *COMANDOS:* ${selected.length}`,
    '╰━━━━━━━━━━━━━━━━━━━━━━╯'
  ];
  for (const [name, cmds] of sections) {
    lines.push('', `╭━━〔 ${ICONS[name] || '📁'} *${name.toUpperCase()}* 〕━━╮`);
    for (const cmd of cmds) lines.push(`┃ ✧ ${p}${cmd.name}`);
    lines.push('╰━━━━━━━━━━━━━━━━━━━━━━╯');
  }
  lines.push('', '✦ *VIZZABOT V5* ✦', `Digite ${p}comandos para detalhes.`, `Ex.: ${p}menu adm • ${p}menu fig`);
  return lines.join('\n');
}
export default {
  name: 'menu', aliases: ['ajuda','help','menulist'], category: 'Geral', description: 'Menu principal com imagem e categorias',
  async execute(ctx) {
    const category = ALIASES[ctx.args[0]?.toLowerCase()];
    const caption = renderV4Menu(ctx, category);
    const logo = process.env.MENU_LOGO_URL?.trim() || V4_LOGO;
    try { await ctx.sock.sendMessage(ctx.chat, { image: { url: logo }, caption }, { quoted: ctx.msg }); }
    catch (err) { ctx.logger.warn({ err }, 'Imagem do menu indisponível'); await ctx.reply(caption); }
  }
};

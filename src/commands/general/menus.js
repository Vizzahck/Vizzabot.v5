const menus = [
  { name: 'menuadm', aliases: ['menuadmin'], category: 'Administração', title: '🛡️ ADMINISTRAÇÃO' },
  { name: 'menubrincadeiras', aliases: ['brincadeiras', 'brincadeira'], category: 'Brincadeiras', title: '🎲 BRINCADEIRAS' },
  { name: 'menurpg', aliases: ['menu-rpg'], category: 'Economia', title: '💰 RPG / ECONOMIA' },
  { name: 'menufig', aliases: ['menufigurinhas'], category: 'Figurinhas', title: '🎨 FIGURINHAS' },
  { name: 'menudono', aliases: ['menuowner'], category: 'Proprietário', title: '👑 PROPRIETÁRIO' },
  { name: 'menulogos', aliases: ['logos'], category: 'Logos', title: '🖼️ LOGOS' },
  { name: 'menudownload', aliases: ['menudownloads'], category: 'Downloads', title: '📥 DOWNLOADS' },
  { name: 'menujogos', aliases: [], category: 'Jogos', title: '🎮 JOGOS' },
  { name: 'menupremium', aliases: [], category: 'Premium', title: '⭐ PREMIUM' }
];
export const categoryMenus = menus.map(({ name, aliases, category, title }) => ({
  name, aliases, category: 'Menus', description: 'Abre '+title,
  async execute(ctx) {
    const list = ctx.registry.list().filter(c => c.category === category && (!c.ownerOnly || ctx.isOwner));
    if (!list.length) return ctx.reply('╭━━━ '+title+' ━━━╮\n⏳ Este menu existia no V4, mas os comandos ainda não foram migrados.\n╰━━━━━━━━━━━━╯');
    await ctx.reply('╭━━━ '+title+' ━━━╮\n'+list.map(c => '┃ ✦ '+ctx.config.prefix+c.name+' — '+c.description).join('\n')+'\n╰━━━━━━━━━━━━╯');
  }
}));

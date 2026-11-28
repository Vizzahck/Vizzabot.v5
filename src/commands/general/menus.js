import { sendMenu } from './menu-layout.js';
const menus = [
  { name: 'menugeral', aliases: ['menuprincipal'], category: 'Geral', title: '🌐 GERAL' },
  { name: 'menuferramentas', aliases: ['ferramentas'], category: 'Ferramentas', title: '🧰 FERRAMENTAS' },
  { name: 'menuadm', aliases: ['menuadmin'], category: 'Administração', title: '🛡️ ADMINISTRAÇÃO' },
  { name: 'menubrincadeiras', aliases: ['brincadeiras', 'brincadeira'], category: 'Brincadeiras', title: '🎲 BRINCADEIRAS' },
  { name: 'menurpg', aliases: ['menu-rpg'], category: 'Economia', title: '💰 RPG / ECONOMIA' },
  { name: 'menufig', aliases: ['menufigurinhas'], category: 'Figurinhas', title: '🎨 FIGURINHAS' },
  { name: 'menudono', aliases: ['menuowner'], category: 'Proprietário', title: '👑 PROPRIETÁRIO' },
  { name: 'menulogos', aliases: ['logos'], category: 'Logos', title: '🖼️ LOGOS' },
  { name: 'menudownload', aliases: ['menudownloads'], category: 'Pesquisa e Downloads', title: '🔎 PESQUISA E DOWNLOADS' },
  { name: 'menujogos', aliases: [], category: 'Jogos', title: '🎮 JOGOS' },
  { name: 'menupremium', aliases: [], category: 'Premium', title: '⭐ PREMIUM' }
];
export const categoryMenus = menus.map(({ name, aliases, category, title }) => ({
  name, aliases, ownerOnly: name === 'menudono', category: 'Menus', description: 'Abre '+title,
  async execute(ctx) { await sendMenu(ctx,{category,title}); }
}));

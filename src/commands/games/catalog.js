// Preserve V4 catalog numbers; do not distribute unofficial APKs.
export const gameTitles=[
 'Minecraft','Dragon Ball Z Dokkan Battle','GTA San Andreas','GTA San Andreas','GTA San Andreas','GTA San Andreas','GTA San Andreas',
 'Last Day on Earth Survival','Bomber Friends','Arcade Hunter','Zombie Idle Defense','PAC-MAN','Car Driving School Simulator','Cyber Fighters',
 'Drag Racing','Mr Bow','Airport City','Crash Bandicoot','Real Steel World Robot Boxing','Anger of Stick 5','Angry Birds 2','Special Forces Group 2','Roblox','Critical Strike','Dream League Soccer','Clash of Clans','Criminal Case Paris','Drift Max World','Downhill Masters','Monopoly','Truckers of Europe 3','Pou','Subway Surfers','Minecraft','CarX Street','World Bus Driving Simulator','Hybrid Animals','Turboprop Flight Simulator','SimplePlanes','Survival on Raft Crafting in the Ocean'
];
export function storeSearch(title){return 'https://play.google.com/store/search?c=apps&q='+encodeURIComponent(title);}
const alternatives={35:['Farming Simulator 20'],36:['Pickup']};
export const gameCatalog=[
 ...gameTitles.map((title,i)=>({
  name:'jogo'+(i+1),category:'Jogos',description:'Busca '+title+' na loja oficial',
  async execute(ctx){
   const entries=[title,...(alternatives[i+1]||[])];
   await ctx.reply('🎮 '+entries.map(t=>t+'\n'+storeSearch(t)).join('\n\n')+'\n\nConsulte disponibilidade, preço e classificação indicativa na loja. Não enviamos APKs modificados.');
  }
 })),
 {name:'catalogojogos',aliases:['listajogos'],category:'Jogos',description:'Lista os 40 títulos do catálogo V4',async execute(ctx){
  const p=Number(ctx.args[0]||1);if(!Number.isInteger(p)||p<1||p>4)return ctx.reply('Use '+ctx.config.prefix+'catalogojogos 1 a 4.');
  await ctx.reply('🎮 CATÁLOGO • '+p+'/4\n'+gameTitles.slice((p-1)*10,p*10).map((t,i)=>ctx.config.prefix+'jogo'+((p-1)*10+i+1)+' — '+t).join('\n')+'\n\nBusca na loja oficial, sem garantia de disponibilidade.');
 }}
];

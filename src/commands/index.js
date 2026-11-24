import { restoredGames } from './games/restored-v4.js';
import menu from './general/menu.js';
import comandos from './general/comandos.js';
import ping from './general/ping.js';
import sobre from './general/sobre.js';
import perfil from './general/perfil.js';
import status from './owner/status.js';
import sticker from './stickers/sticker.js';
import antilink from './admin/antilink.js';
import ban from './admin/ban.js';
import boasvindas from './admin/boasvindas.js';
import avisos from './admin/avisos.js';
import saldo from './rpg/saldo.js';
import diario from './rpg/diario.js';
import ranking from './rpg/ranking.js';
import dado from './fun/dado.js';
import moeda from './fun/moeda.js';
import ship from './fun/ship.js';
import escolher from './fun/escolher.js';
import ball from './fun/8ball.js';
import simi from './fun/simi.js';
import desligar from './owner/desligar.js';
import { categoryMenus } from './general/menus.js';
import linkimg from './general/linkimg.js';
import extrairtexto from './general/extrairtexto.js';
import { groupTools } from './admin/group-tools.js';
import { v4Fun, sorteio } from './fun/v4-fun.js';
import { economyTools } from './rpg/economy-tools.js';
import { gameCommands } from './games/two-player.js';
import { mediaCommands } from './downloads/media.js';
import { ownerSettings } from './owner/settings.js';
import { v4Utilities } from './general/v4-utilities.js';
import { extraGroupCommands } from './admin/extra-group.js';
import { publicServices } from './general/public-services.js';
import { warningCommands } from './admin/warnings.js';
import { adventureCommands } from './rpg/adventure.js';
import { usefulV4Commands } from './general/useful-v4.js';
import { mediaFilterCommands } from './admin/media-filters.js';
import { wordFilterCommands } from './admin/word-filter.js';
import { simpleV4Commands } from './general/simple-v4-batch.js';
import { utilityBatch2 } from './general/utility-batch-2.js';
import { utilityBatch3 } from './general/utility-batch-3.js';
import { v4QuickCommands } from './fun/v4-quick.js';
import { practicalBatch } from './general/practical-batch.js';
import { v4ExtraCommands } from './general/v4-extra-batch.js';
import { dailyBatch } from './general/daily-batch.js';
const baseCommands = [menu, comandos, ping, sobre, perfil, sticker, antilink, ban, boasvindas, avisos, saldo, diario, ranking, status, dado, moeda, ship, escolher, ball, simi, desligar, linkimg, extrairtexto, ...categoryMenus, ...groupTools, ...v4Fun, sorteio, ...economyTools, ...gameCommands, ...mediaCommands, ...ownerSettings, ...v4Utilities, ...extraGroupCommands, ...publicServices, ...warningCommands, ...adventureCommands, ...usefulV4Commands, ...mediaFilterCommands, ...wordFilterCommands, ...simpleV4Commands, ...utilityBatch2, ...utilityBatch3, ...v4QuickCommands, ...practicalBatch, ...v4ExtraCommands, ...dailyBatch, ...restoredGames];

const legacyAliases = {
 sticker:['st','stk'], extrairtexto:['totext','ler','lerfoto'], linkimg:['gerarlink','imgpralink'],
 perfil:['me','my-info'], saldo:['my'], ranking:['rankcoins'], inventario:['itensrpg'],
 minerar:['extrair-minerio'], tesouro:['buscar-tesouros','caçar-tesouro'],
 antiimagem:['antiimg'], boasvindas:['bemvindo','welcome'], advertir:['adverter'],
 descgp:['descriçãogp'], mencionar:['marcawa'], menu:['menulist'], menuadm:['menuadmin'],
 menufig:['menufigurinhas'], menujogos:['jogos'], menudownload:['download'],
 repetir:['repertirtexto']
};
// Preserve existing commands and aliases; never shadow a registered name.
const occupied=new Set(baseCommands.flatMap(c=>[c.name,...(c.aliases||[])]));
export const commands=baseCommands.map(c=>{
 const aliases=[...(c.aliases||[])];
 for(const alias of legacyAliases[c.name]||[]){
  if(!occupied.has(alias)){occupied.add(alias);aliases.push(alias);}
 }
 return {...c,aliases};
});

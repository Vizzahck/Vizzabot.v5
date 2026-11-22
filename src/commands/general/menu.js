import { sendMenu, menuText } from './menu-layout.js';
const aliases={adm:'Administração',admin:'Administração',dono:'Proprietário',fig:'Figurinhas',rpg:'Economia',geral:'Geral',brincadeiras:'Brincadeiras',fun:'Brincadeiras',ferramentas:'Ferramentas',jogos:'Jogos',download:'Downloads',logos:'Logos',premium:'Premium'};
export function renderV4Menu(ctx,category){return menuText(ctx,{category});}
export default {name:'menu',aliases:['ajuda','help','menulist'],category:'Geral',description:'Menu principal com foto e categorias',async execute(ctx){
 const category=aliases[ctx.args[0]?.toLowerCase()]||null;
 await sendMenu(ctx,{category,title:category?category.toUpperCase():'CENTRAL DE COMANDOS'});
}};

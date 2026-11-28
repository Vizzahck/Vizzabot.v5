import { randomInt } from 'node:crypto';
import { groupRoles } from '../../core/group.js';

const pick=a=>a[randomInt(a.length)];
const cmd=(name,aliases,description,execute)=>({name,aliases,category:'Brincadeiras',description,execute});
const note='\n🎲 Resultado aleatório, apenas brincadeira.';
const styles=[
 ['Negrito',0x1d400,0x1d41a,0x1d7ce],
 ['Monoespaçado',0x1d670,0x1d68a,0x1d7f6],
 ['Duplo',0x1d538,0x1d552,0x1d7d8],
 ['Sem serifa',0x1d5a0,0x1d5ba,0x1d7e2],
 ['Gótico',0x1d56c,0x1d586,null]
];
const doubleExceptions={C:'ℂ',H:'ℍ',N:'ℕ',P:'ℙ',Q:'ℚ',R:'ℝ',Z:'ℤ'};
function styled(s,style){
 const [name,upper,lower,digit]=style;
 return Array.from(s,ch=>{
  if(name==='Duplo'&&Object.hasOwn(doubleExceptions,ch))return doubleExceptions[ch];
  const n=ch.codePointAt(0);
  if(n>=65&&n<=90)return String.fromCodePoint(upper+n-65);
  if(n>=97&&n<=122)return String.fromCodePoint(lower+n-97);
  if(digit&&n>=48&&n<=57)return String.fromCodePoint(digit+n-48);
  return ch;
 }).join('');
}
const suggestions=[
 ['comida',[], 'Sugestão de comida',['Pizza','Sushi','Hambúrguer','Salada','Massa'],'🍽️ Que tal '],
 ['humor',[], 'Sorteia um humor para personagem fictício',['Feliz','Triste','Irritado','Animado','Relaxado'],'🎭 Humor do personagem: '],
 ['filme',[], 'Sorteia gênero de filme',['Comédia','Ação','Romance','Suspense','Ficção científica'],'🎬 Gênero para hoje: '],
 ['estilomusical',['musicahoje'],'Sorteia gênero musical',['Pop','Rock','Jazz','Eletrônica','Indie'],'🎵 Estilo musical para hoje: '],
 ['climadiversao',[], 'Sorteia clima de cenário fictício',['Ensolarado','Chuvoso','Nublado','Neve','Vento'],'🌤️ Clima da aventura: '],
 ['feliz',[], 'Sorteia uma atividade agradável',['Ouvir uma música','Conversar com amigos','Desenhar','Jogar algo divertido','Descansar'],'🌻 Ideia para hoje: '],
 ['energia',[], 'Sorteia energia de personagem fictício',['Explorador','Mago','Inventor','Guardião','Aventureiro'],'⚡ Energia da aventura: ']
];
function init(db){
 db.exec('CREATE TABLE IF NOT EXISTS group_modes (jid TEXT NOT NULL,mode TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(jid,mode))');
 db.exec('CREATE TABLE IF NOT EXISTS fun_optin (chat TEXT NOT NULL,jid TEXT NOT NULL,PRIMARY KEY(chat,jid))');
}
async function players(c){
 if(!c.chat.endsWith('@g.us'))return [];
 const db=c.store.db;init(db);
 const meta=await c.sock.groupMetadata(c.chat);
 const enrolled=new Set(db.prepare('SELECT jid FROM fun_optin WHERE chat=?').all(c.chat).map(r=>r.jid));
 return [...new Set(meta.participants.map(p=>p.id).filter(id=>enrolled.has(id)))];
}
async function duo(c){
 const p=await players(c);
 if(p.length<2)return c.reply('São necessárias duas pessoas inscritas com '+c.config.prefix+'participarbrincadeiras 1.');
 const a=p.splice(randomInt(p.length),1)[0],b=pick(p);
 await c.sock.sendMessage(c.chat,{text:'🎮 Dupla de aventura sorteada: @'+a.split('@')[0]+' e @'+b.split('@')[0]+'\nApenas uma dupla fictícia para jogar.',mentions:[a,b]});
}
export const restoredFun=[
 {...cmd('modo-gamer',['gamer'],'Ativa/desativa brincadeiras no grupo',async c=>{
  if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
  const roles=await groupRoles(c.sock,c.chat,c.sender,c.isOwner,c.isBotAdmin);
  if(!roles.admin)return c.reply('Somente administradores.');
  const db=c.store.db;init(db);
  const value=String(c.args[0]||'').toLowerCase();
  const current=db.prepare("SELECT enabled FROM group_modes WHERE jid=? AND mode='modo-gamer'").get(c.chat)?.enabled??1;
  if(!['0','1','on','off'].includes(value))return c.reply('Modo gamer '+(current?'ativo':'inativo')+'. Use '+c.config.prefix+'modo-gamer 1 ou 0.');
  const enabled=Number(value==='1'||value==='on');
  db.prepare("INSERT INTO group_modes(jid,mode,enabled) VALUES (?,'modo-gamer',?) ON CONFLICT(jid,mode) DO UPDATE SET enabled=excluded.enabled").run(c.chat,enabled);
  await c.reply('Modo gamer '+(enabled?'ativado':'desativado')+'.');
 }),category:'Administração'},
 cmd('fazernick',['nick'],'Gera apelidos com cinco estilos Unicode',async c=>{
  const s=c.args.join(' ').trim();
  if(!s||Array.from(s).length>32)return c.reply('Uso: '+c.config.prefix+'fazernick seu nome (até 32 caracteres).');
  await c.reply('🔮 LISTA DE NICKS\n\n'+styles.map(style=>style[0]+': '+styled(s,style)).join('\n')+'\n\nA exibição depende da fonte do aparelho.');
 }),
 ...suggestions.map(([name,aliases,description,values,prefix])=>cmd(name,aliases,description,async c=>c.reply(prefix+pick(values)+note))),
 cmd('dinheiro',[],'Sorteia um tesouro imaginário, sem alterar o saldo RPG',async c=>c.reply('🪙 Tesouro imaginário: '+randomInt(10001)+' moedas. Nenhuma moeda real ou RPG foi adicionada.'+note)),
 cmd('piada2',[],'Conta outra piada offline',async c=>c.reply(pick(['Por que o relógio foi à escola? Para aprender a contar as horas.','Qual é o cúmulo da rapidez? Fechar a geladeira antes de a luz apagar.','Por que o lápis ficou famoso? Porque tinha ponta para tudo.','O que a nuvem disse ao vento? Você me leva para qualquer lugar!']))),
 cmd('participarbrincadeiras',[],'Inscrição voluntária em sorteios de duplas e ranking de anime',async c=>{
  if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
  const db=c.store.db;init(db);
  if(c.args[0]==='1'){db.prepare('INSERT OR IGNORE INTO fun_optin(chat,jid) VALUES (?,?)').run(c.chat,c.sender);return c.reply('Você entrou nos sorteios de brincadeiras. Para sair, use '+c.config.prefix+'participarbrincadeiras 0.');}
  if(c.args[0]==='0'){db.prepare('DELETE FROM fun_optin WHERE chat=? AND jid=?').run(c.chat,c.sender);return c.reply('Você saiu dos sorteios.');}
  await c.reply('Use 1 para participar ou 0 para sair.');
 }),
 cmd('dupla',['casal','shipo','alma-gemeas'],'Sorteia dupla de jogo entre participantes voluntários',duo),
 cmd('rankotakus',[],'Sorteio de fãs de anime inscritos voluntariamente',async c=>{
  const p=await players(c);
  if(!p.length)return c.reply('Nenhum inscrito. Use '+c.config.prefix+'participarbrincadeiras 1.');
  const chosen=[];while(p.length&&chosen.length<7)chosen.push(p.splice(randomInt(p.length),1)[0]);
  await c.sock.sendMessage(c.chat,{text:'🍥 Sorteio de fãs de anime\n'+chosen.map((id,i)=>(i+1)+'. @'+id.split('@')[0]).join('\n')+note,mentions:chosen});
 }),
 cmd('amor',[],'Sorteia afinidade entre personagens fictícios',async c=>{
  const names=c.args.join(' ').split('|').map(s=>s.trim());
  if(names.length!==2||names.some(n=>!n||n.length>40||n.includes('@')))return c.reply('Use '+c.config.prefix+'amor personagem 1 | personagem 2.');
  await c.reply('💫 Afinidade fictícia: '+names.join(' e ')+' — '+randomInt(101)+'%'+note);
 })
];

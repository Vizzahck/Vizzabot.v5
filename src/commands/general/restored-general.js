import { readFile } from 'node:fs/promises';
import { ownerState } from '../owner/restored.js';
import { isPremium } from '../owner/personalization.js';

const cmd=(name,aliases,description,execute,ownerOnly=false)=>({name,aliases,description,execute,ownerOnly,category:ownerOnly?'Proprietário':'Geral'});
const text=c=>c.args.join(' ').trim();
const version=async()=>JSON.parse(await readFile(new URL('../../../package.json',import.meta.url),'utf8')).version;
function init(db){
 db.exec("CREATE TABLE IF NOT EXISTS general_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL, resolved INTEGER NOT NULL DEFAULT 0)");
}
const cooldowns=new Map();
async function submit(c,kind){
 if(c.chat.endsWith('@g.us'))return c.reply('Envie este comando no privado do bot. Não inclua informações pessoais.');
 if(c.args.at(-1)!=='confirmar')return c.reply('Use '+c.config.prefix+(kind==='convite'?'convite link':' '+kind+' mensagem').trim()+' confirmar. Seu texto será armazenado localmente para revisão pelo dono do bot. Não inclua dados pessoais.');
 const body=c.args.slice(0,-1).join(' ').trim();
 if(!body||body.length>500)return c.reply('Informe até 500 caracteres.');
 if(kind==='convite'&&!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]{15,40}$/.test(body))return c.reply('Informe um convite válido de um grupo que autorizou seu compartilhamento.');
 const now=Date.now();
 for(const [k,t] of cooldowns)if(now-t>=300000)cooldowns.delete(k);
 if(cooldowns.has(c.sender))return c.reply('Aguarde cinco minutos antes de enviar outro relato.');
 if(cooldowns.size>=1000)return c.reply('Muitas solicitações. Tente novamente depois.');
 const db=c.store.db;init(db);
 const result=db.prepare("INSERT INTO general_feedback(kind,body,created) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM general_feedback WHERE resolved=0)<500").run(kind,body,now);
 if(!result.changes)return c.reply('A caixa de relatos está cheia. Tente mais tarde.');
 cooldowns.set(c.sender,now);
 await c.reply('✅ Registrado para revisão pelo dono. Protocolo #'+result.lastInsertRowid+'.');
}
const guides=[
 ['infolistanegra','Lista de bloqueios','O dono pode consultar comandos bloqueados com {p}listacomandos e gerenciar usuários por {p}block_user_cmd e {p}unblock_user_cmd.'],
 ['infopalavrao','Filtro de palavras','Administradores podem consultar {p}configgp e {p}listapalavra. Veja {p}info antipalavra para detalhes.'],
 ['infobancarac','Proteção do grupo','Consulte {p}configgp e {p}menuadm. A V5 usa filtros de mídia, palavras e links; não bloqueia pessoas pela aparência do nome.'],
 ['infosorteio','Sorteios','Use {p}sorteio pizza, pastel, bolo ou {p}sorteionumero 1 100.'],
 ['infobemvindo','Boas-vindas','Use {p}boasvindas para consultar ou configurar o recurso. Administradores podem definir a legenda local com {p}legendabvgrupo.'],
 ['infovotacao','Votações','Administradores iniciam com {p}votacao pergunta | 5. Vote com {p}votar sim ou não e consulte {p}resultadovoto.'],
 ['infotexto','Texto','Use {p}texto mensagem, {p}repetir 2 mensagem ou {p}menu ferramentas para conhecer mais funções.']
];
export const restoredGeneral=[
 cmd('informacoes',['informações'],'Mostra informações da versão e canais de sugestões',async c=>{
  const v=await version(),s=await ownerState();
  await c.reply('🤖 '+c.config.name+'\nVersão: '+v+'\nProprietário: '+c.config.ownerName+'\nPremium: '+(c.isOwner||isPremium(s,c.sender)?'ativo':'inativo')+'\nComandos disponíveis: '+c.registry.list().filter(x=>!x.ownerOnly||c.isOwner).length+'\nUse '+c.config.prefix+'menu para navegar, '+c.config.prefix+'bug para relatar problemas e '+c.config.prefix+'sugestao para sugerir melhorias.');
 }),
 cmd('infodono',[],'Mostra o nome configurado do proprietário',async c=>c.reply('👑 Proprietário: '+c.config.ownerName+'\nPara enviar sugestões ou erros, use '+c.config.prefix+'sugestao ou '+c.config.prefix+'bug no privado do bot.')),
 cmd('level',['nivel','nível'],'Consulta nível e experiência do jogador',async c=>{
  const u=c.store.user(c.sender),level=1+Math.floor(u.xp/100);
  await c.reply('🏅 Nível: '+level+'\nXP: '+u.xp+'\nPróximo nível: '+(100-u.xp%100)+' XP restantes.');
 }),
 cmd('bug',['erro'],'Registra um erro para revisão pelo dono',c=>submit(c,'bug')),
 cmd('sugestao',['sugestão'],'Registra uma sugestão para o bot',c=>submit(c,'sugestao')),
 cmd('novocmd',[],'Sugere um comando novo',c=>submit(c,'novocmd')),
 cmd('convite',['comvite'],'Encaminha convite autorizado para revisão local',c=>submit(c,'convite')),
 cmd('listarelatos',[],'Lista relatos pendentes no privado do dono',async c=>{
  if(c.chat.endsWith('@g.us'))return c.reply('Consulte os relatos no privado.');
  const page=Number(c.args[0]||1);if(!Number.isSafeInteger(page)||page<1||page>100)return c.reply('Informe uma página de 1 a 100.');
  const db=c.store.db;init(db);
  const rows=db.prepare('SELECT id,kind,body FROM general_feedback WHERE resolved=0 ORDER BY id DESC LIMIT 5 OFFSET ?').all((page-1)*5);
  await c.reply(rows.length?'Relatos pendentes • página '+page+'\n\n'+rows.map(r=>'#'+r.id+' • '+r.kind+'\n'+r.body).join('\n\n'):'Nenhum relato nesta página.');
 },true),
 cmd('resolverrelato',[],'Remove um relato concluído por ID',async c=>{
  if(c.chat.endsWith('@g.us'))return c.reply('Use este comando no privado.');
  const id=Number(c.args[0]);if(!Number.isSafeInteger(id)||id<1||c.args[1]!=='confirmar')return c.reply('Uso: '+c.config.prefix+'resolverrelato 1 confirmar');
  const db=c.store.db;init(db);
  const r=db.prepare('DELETE FROM general_feedback WHERE id=?').run(id);
  await c.reply(r.changes?'Relato removido.':'Relato não encontrado.');
 },true),
 ...guides.map(([name,title,body])=>cmd(name,[],'Guia: '+title,c=>c.reply('📖 '+title+'\n'+body.replaceAll('{p}',c.config.prefix))))
];

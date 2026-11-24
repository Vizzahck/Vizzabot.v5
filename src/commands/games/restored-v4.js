import { randomInt } from 'node:crypto';
import { groupRoles } from '../../core/group.js';
const sessions=new Map(), polls=new Map(), quizzes=new Map();
const ttl=15*60*1000;
const current=(map,chat)=>{const g=map.get(chat);if(g&&g.until<=Date.now()){map.delete(chat);return null;}return g;};
const cmd=(name,aliases,description,execute)=>({name,aliases,description,execute,category:'Jogos'});
const group=ctx=>ctx.chat.endsWith('@g.us');
const admin=async ctx=>(await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin)).admin;
const show=g=>[0,3,6].map(i=>g.cells.slice(i,i+3).map((v,j)=>v||String(i+j+1)).join(' | ')).join('\n');
const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const questions=[['Qual mamífero voa?','morcego'],['Qual animal tem três corações?','polvo'],['Qual é o maior animal terrestre?','elefante'],['Qual animal tem listras pretas e brancas?','zebra'],['Qual ave não voa e vive na Antártida?','pinguim']];
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
export const restoredGames=[
cmd('jogodavelha',['velha'],'Convida um membro para jogo da velha',async c=>{
 if(!group(c))return c.reply('Somente em grupos.');
 if(current(sessions,c.chat))return c.reply('Já existe uma partida.');
 const target=c.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
 if(!target||target===c.sender)return c.reply('Marque outro participante.');
 if(sessions.size>=1000)return c.reply('Limite de partidas atingido.');
 sessions.set(c.chat,{players:[c.sender,target],cells:Array(9).fill(''),turn:0,accepted:false,until:Date.now()+ttl});
 await c.sock.sendMessage(c.chat,{text:'🎮 @'+target.split('@')[0]+', aceite com '+c.config.prefix+'aceitarvelha',mentions:[target]});
}),
cmd('aceitarvelha',[],'Aceita o convite de jogo da velha',async c=>{
 const g=current(sessions,c.chat);if(!g||g.accepted||g.players[1]!==c.sender)return c.reply('Nenhum convite para você.');
 g.accepted=true;g.until=Date.now()+ttl;await c.reply(show(g)+'\nX começa: '+c.config.prefix+'jogadavelha 1');
}),
cmd('jogadavelha',[],'Joga em uma posição de 1 a 9',async c=>{
 const g=current(sessions,c.chat);if(!g?.accepted||g.players[g.turn]!==c.sender)return c.reply('Não é sua vez.');
 const i=Number(c.args[0])-1;if(!Number.isInteger(i)||i<0||i>8||g.cells[i])return c.reply('Posição inválida.');
 const mark=g.turn?'O':'X';g.cells[i]=mark;
 const won=wins.some(line=>line.every(j=>g.cells[j]===mark));
 if(won||g.cells.every(Boolean)){sessions.delete(c.chat);return c.reply(show(g)+'\n'+(won?mark+' venceu!':'Empate!'));}
 g.turn=1-g.turn;g.until=Date.now()+ttl;await c.reply(show(g)+'\nVez de '+(g.turn?'O':'X'));
}),
cmd('resetarvelha',['resetavelha','resetarv','resetav','rv'],'Cancela o jogo da velha',async c=>{
 const g=current(sessions,c.chat);if(!g)return c.reply('Nenhuma partida.');
 if(!g.players.includes(c.sender)&&!await admin(c))return c.reply('Sem permissão.');
 sessions.delete(c.chat);await c.reply('Partida cancelada.');
}),
cmd('votacao',['votação'],'Cria votação: pergunta | minutos',async c=>{
 if(!group(c)||!await admin(c))return c.reply('Somente administradores do grupo.');
 const [q,m='5']=c.args.join(' ').split('|').map(x=>x.trim());const minutes=Number(m);
 if(!q||q.length>200||!Number.isInteger(minutes)||minutes<1||minutes>60)return c.reply('Uso: '+c.config.prefix+'votacao pergunta | 5');
 if(current(polls,c.chat))return c.reply('Já existe uma votação.');
 if(polls.size>=1000)return c.reply('Limite de votações atingido.');
 polls.set(c.chat,{q,votes:new Map(),until:Date.now()+minutes*60000});
 await c.reply(q+'\nVote com '+c.config.prefix+'votar sim ou não. Use '+c.config.prefix+'resultadovoto para consultar.');
}),
cmd('votar',[],'Registra ou altera seu voto',async c=>{
 const p=current(polls,c.chat),v=norm(c.args.join(' '));if(!p)return c.reply('Nenhuma votação ativa.');
 if(!['sim','nao'].includes(v))return c.reply('Escolha sim ou não.');
 if(p.votes.size>=1000&&!p.votes.has(c.sender))return c.reply('Limite de votos atingido.');
 p.votes.set(c.sender,v);await c.reply('Voto registrado.');
}),
cmd('resultadovoto',[],'Consulta o resultado da votação',async c=>{
 const p=polls.get(c.chat);if(!p)return c.reply('Nenhuma votação.');
 const a=[...p.votes.values()];await c.reply(p.q+'\nSim: '+a.filter(v=>v==='sim').length+'\nNão: '+a.filter(v=>v==='nao').length+'\n'+(p.until<=Date.now()?'Encerrada':'Em andamento'));
}),
cmd('delvote',['delvoto'],'Remove a votação',async c=>{if(!group(c)||!await admin(c))return c.reply('Somente administradores.');polls.delete(c.chat);await c.reply('Votação removida.');}),
cmd('quizanimais',[],'Inicia quiz de animais (1) ou encerra (0)',async c=>{
 if(!group(c)||!await admin(c))return c.reply('Somente administradores do grupo.');
 if(c.args[0]==='0'){quizzes.delete(c.chat);return c.reply('Quiz encerrado.');}
 if(c.args[0]!=='1')return c.reply('Use 1 para iniciar ou 0 para encerrar.');
 if(quizzes.size>=1000&&!quizzes.has(c.chat))return c.reply('Limite de quizzes atingido.');
 const q=questions[randomInt(questions.length)];quizzes.set(c.chat,{q,until:Date.now()+ttl});await c.reply(q[0]+'\nResponda com '+c.config.prefix+'respostaquiz animal');
}),
cmd('respostaquiz',[],'Responde ao quiz',async c=>{const g=current(quizzes,c.chat);if(!g)return c.reply('Nenhum quiz ativo.');if(norm(c.args.join(' '))!==g.q[1])return c.reply('Tente novamente!');quizzes.delete(c.chat);await c.reply('Resposta correta!');}),
cmd('revelaranimal',['revelaanimal'],'Revela a resposta do quiz',async c=>{if(!group(c)||!await admin(c))return c.reply('Somente administradores.');const g=current(quizzes,c.chat);if(!g)return c.reply('Nenhum quiz ativo.');quizzes.delete(c.chat);await c.reply(g.q[1]);})
];

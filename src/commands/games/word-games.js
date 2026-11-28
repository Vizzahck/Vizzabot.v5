import { randomInt } from 'node:crypto';
import { groupRoles } from '../../core/group.js';

// Offline adaptation of the original V4 anagram and Naruto quiz.
const words=[
 ['ESCADA','Objeto'],['CIMENTO','Construções'],['BANANA','Fruta'],['PORTUGAL','País'],['CAMARÃO','Alimento'],
 ['HIDRANTE','Objeto'],['FOGUETE','Objeto'],['SKATE','Objeto'],['MACACO','Animal'],['LASANHA','Alimento'],
 ['PASTEL','Alimento'],['COXINHA','Alimento'],['BICICLETA','Objeto'],['CAVALO','Animal'],['SATURNO','Planeta'],
 ['CEREJA','Fruta'],['HISTÓRIA','Matéria'],['CELULAR','Objeto'],['NOTEBOOK','Objeto'],['COMPUTADOR','Objeto'],
 ['LANTERNA','Objeto'],['CACHORRO','Animal'],['TOMATE','Alimento'],['SAXOFONE','Instrumento musical'],['CROÁCIA','País'],
 ['MEGAFONE','Objeto'],['RAPOSA','Animal'],['RINOCERONTE','Animal'],['TANGERINA','Fruta']
];
const anime=[
 ['Qual é o nome do cão parceiro de Kiba?','Akamaru'],
 ['Qual é a organização que usa mantos pretos com nuvens vermelhas?','Akatsuki'],
 ['Qual técnica ocular cria chamas negras?','Amaterasu'],
 ['Qual é o nome da unidade de operações especiais da Vila da Folha?','Anbu'],
 ['Qual elemento ninja é associado à madeira?','Mokuton'],
 ['Qual elemento ninja é associado à água?','Suiton'],
 ['Qual elemento ninja é associado ao fogo?','Katon'],
 ['Qual elemento ninja é associado ao vento?','Fuuton'],
 ['Qual elemento ninja é associado ao raio?','Raiton'],
 ['Qual elemento ninja é associado à terra?','Doton']
];
const riddles=[
 ['O que tem dentes, mas não consegue morder?','pente'],
 ['Quanto mais se tira, maior fica. O que é?','buraco'],
 ['O que tem ponteiros, mas não tem mãos?','relógio'],
 ['O que sobe e desce sem sair do lugar?','escada'],
 ['O que fica molhado enquanto seca você?','toalha']
];
const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/\s+/g,' ');
const shuffle=s=>{
 const a=Array.from(s);
 for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}
 if(a.join('')===s)return a.slice(1).concat(a[0]).join('');
 return a.join('');
};
const ttl=15*60*1000;
export function createWordGames({now=Date.now,pick=a=>a[randomInt(a.length)]}={}){
 const active=new Map();
 function get(key){const g=active.get(key);if(g&&g.expires<=now()){active.delete(key);return null;}return g;}
 const key=c=>c.chat.endsWith('@g.us')?c.chat:c.sender;
 const format=(g,p)=>g.question+'\nResponda com '+p+'responder sua_resposta. Expira em 15 minutos.';
 async function permitted(c){
  if(!c.chat.endsWith('@g.us'))return true;
  return (await groupRoles(c.sock,c.chat,c.sender,c.isOwner,c.isBotAdmin)).admin;
 }
 async function start(c,type){
  if(!await permitted(c))return c.reply('Somente administradores podem iniciar ou encerrar no grupo.');
  const k=key(c),old=get(k);
  if(c.args[0]==='0'){
   if(!old||old.type!==type)return c.reply('Nenhuma partida desse tipo.');
   active.delete(k);return c.reply('Partida encerrada.');
  }
  if(c.args.length&&c.args[0]!=='1')return c.reply('Use 1 para começar ou 0 para encerrar.');
  if(old)return c.reply(format(old,c.config.prefix));
  for(const [id,g] of active)if(g.expires<=now())active.delete(id);
  if(active.size>=1000)return c.reply('Limite de partidas atingido.');
  let question,answer;
  if(type==='anagrama'){const [w,h]=pick(words);answer=w;question='🔤 ANAGRAMA\nPalavra: '+shuffle(w)+'\nDica: '+h;}
  else {const [q,a]=pick(type==='quizanime'?anime:riddles);answer=a;question=(type==='quizanime'?'🍥 QUIZ NARUTO':'🧩 ADIVINHA')+'\n'+q;}
  const g={type,question,answer,expires:now()+ttl};active.set(k,g);
  await c.reply(format(g,c.config.prefix));
 }
 async function answer(c){
  const k=key(c),g=get(k);if(!g)return c.reply('Nenhuma partida ativa de anagrama, adivinha ou quiz anime.');
  if(!c.args.length)return c.reply('Informe sua resposta.');
  if(norm(c.args.join(' '))!==norm(g.answer))return c.reply('Ainda não! Tente novamente.');
  active.delete(k);await c.reply('🎉 Resposta correta: '+g.answer+'!');
 }
 async function reveal(c){
  if(!await permitted(c))return c.reply('Somente administradores.');
  const k=key(c),g=get(k);if(!g)return c.reply('Nenhuma partida ativa.');
  active.delete(k);await c.reply('Resposta: '+g.answer);
 }
 return {start,answer,reveal};
}
const games=createWordGames();
const command=(name,aliases,description,execute)=>({name,aliases,category:'Jogos',description,execute});
export const wordGameCommands=[
 command('anagrama',[],'Descubra a palavra embaralhada',c=>games.start(c,'anagrama')),
 command('quizanime',['quiznaruto'],'Quiz Naruto por pistas, sem API',c=>games.start(c,'quizanime')),
 command('adivinha',[],'Adivinhe a resposta de uma charada',c=>games.start(c,'adivinha')),
 command('responder',['respostaanagrama','respostaanime'],'Responde a um anagrama ou quiz textual',games.answer),
 command('revelarjogo',['revelaranagrama','revelaranime'],'Encerra a partida revelando a resposta',games.reveal)
];

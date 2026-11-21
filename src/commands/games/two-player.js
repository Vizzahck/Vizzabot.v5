// Two-player games. Sessions are in memory and expire after 15 minutes.
const sessions=new Map();
const TTL=15*60*1000;
const words=['ABACAXI','ELEFANTE','COMPUTADOR','GIRASSOL','BIBLIOTECA','ASTRONAUTA','CACHOEIRA','BORBOLETA','DINOSSAURO','TEMPESTADE'];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
export function createGames({random=Math.random,now=Date.now}={}){
 const active=new Map();
 function current(chat){const game=active.get(chat);if(game&&now()-game.updated>TTL){active.delete(chat);return null;}return game||null;}
 const mention=ctx=>ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]||ctx.msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
 const tag=jid=>'@'+String(jid).split('@')[0].split(':')[0];
 async function invite(ctx,type){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('🎮 Convites de dois jogadores são feitos em grupos. Marque o adversário.');
  const target=mention(ctx);
  if(!target)return ctx.reply('Uso: '+ctx.config.prefix+type+' @pessoa');
  if(target===ctx.sender)return ctx.reply('Você não pode se desafiar.');
  if(current(ctx.chat))return ctx.reply('Já existe uma partida ou convite neste grupo. Use !cancelarjogo ou aguarde 15 minutos.');
  const g={type,host:ctx.sender,guest:target,status:'invite',updated:now()};
  active.set(ctx.chat,g);
  await ctx.sock.sendMessage(ctx.chat,{text:'🎮 *DESAFIO DE '+(type==='ppt'?'PEDRA, PAPEL E TESOURA':'FORCA')+'*\n'+tag(ctx.sender)+' convidou '+tag(target)+'!\n'+tag(target)+', digite *!aceitarjogo* ou *!recusarjogo*.\n⏳ Convite expira em 15 minutos.',mentions:[ctx.sender,target]});
 }
 async function accept(ctx,yes){
  const g=current(ctx.chat);if(!g||g.status!=='invite')return ctx.reply('Nenhum convite pendente.');
  if(ctx.sender!==g.guest)return ctx.reply('Somente a pessoa convidada pode responder.');
  if(!yes){active.delete(ctx.chat);return ctx.reply('❌ Convite recusado.');}
  g.status='playing';g.updated=now();
  if(g.type==='ppt'){g.moves=new Map();return ctx.reply('✊✋✌️ *Partida iniciada!*\nCada jogador envia !jogar pedra, !jogar papel ou !jogar tesoura.\nAs escolhas ficam ocultas até ambos jogarem.');}
  g.word=words[Math.floor(random()*words.length)];g.guesses=new Set();g.errors=0;g.turn=g.host;
  return ctx.sock.sendMessage(ctx.chat,{text:'🔤 *FORCA COOPERATIVA*\n'+board(g)+'\n'+tag(g.turn)+' começa com !letra A. Alternem os turnos!\n6 erros permitidos.',mentions:[g.turn]});
 }
 function board(g){return [...g.word].map(c=>g.guesses.has(c)?c:'_').join(' ')+'\n❌ Erros: '+g.errors+'/6\n🔎 Letras: '+([...g.guesses].join(', ')||'nenhuma');}
 async function play(ctx,move){
  const g=current(ctx.chat);if(!g||g.status!=='playing'||g.type!=='ppt')return ctx.reply('Não há partida de pedra, papel e tesoura ativa.');
  if(ctx.sender!==g.host&&ctx.sender!==g.guest)return ctx.reply('Você não participa desta partida.');
  const choice=norm(move).toLowerCase();
  if(!['pedra','papel','tesoura'].includes(choice))return ctx.reply('Use !jogar pedra, !jogar papel ou !jogar tesoura.');
  if(g.moves.has(ctx.sender))return ctx.reply('Você já escolheu. Aguarde o adversário.');
  g.moves.set(ctx.sender,choice);g.updated=now();
  if(g.moves.size<2)return ctx.reply('🔐 Escolha registrada. Aguardando o outro jogador.');
  const a=g.moves.get(g.host),b=g.moves.get(g.guest);
  const win=a===b?'🤝 Empate!':((a==='pedra'&&b==='tesoura')||(a==='papel'&&b==='pedra')||(a==='tesoura'&&b==='papel'))?tag(g.host)+' venceu!':tag(g.guest)+' venceu!';
  active.delete(ctx.chat);
  return ctx.sock.sendMessage(ctx.chat,{text:'🏆 *RESULTADO*\n'+tag(g.host)+': '+a+'\n'+tag(g.guest)+': '+b+'\n'+win,mentions:[g.host,g.guest]});
 }
 async function letter(ctx,letter){
  const g=current(ctx.chat);if(!g||g.status!=='playing'||g.type!=='forca')return ctx.reply('Não há jogo da forca ativo.');
  if(ctx.sender!==g.host&&ctx.sender!==g.guest)return ctx.reply('Você não participa desta partida.');
  if(ctx.sender!==g.turn)return ctx.reply('⏳ Aguarde sua vez.');
  const c=norm(letter);
  if(!/^[A-Z]$/.test(c))return ctx.reply('Use !letra A (uma letra por vez).');
  if(g.guesses.has(c))return ctx.reply('Essa letra já foi escolhida.');
  g.guesses.add(c);if(!g.word.includes(c))g.errors++;
  g.updated=now();
  const won=[...g.word].every(ch=>g.guesses.has(ch));
  const lost=g.errors>=6;
  if(won||lost){active.delete(ctx.chat);return ctx.reply(board(g)+'\n'+(won?'🎉 Vocês venceram!':'💀 Fim de jogo!')+' Palavra: *'+g.word+'*');}
  g.turn=ctx.sender===g.host?g.guest:g.host;
  return ctx.sock.sendMessage(ctx.chat,{text:'🔤 *FORCA*\n'+board(g)+'\nVez de '+tag(g.turn)+' — !letra A',mentions:[g.turn]});
 }
 async function cancel(ctx){const g=current(ctx.chat);if(!g)return ctx.reply('Nenhuma partida ativa.');if(ctx.sender!==g.host&&ctx.sender!==g.guest&&!ctx.isOwner)return ctx.reply('Somente os jogadores podem cancelar.');active.delete(ctx.chat);return ctx.reply('🛑 Partida cancelada.');}
 return {invite,accept,play,letter,cancel,current};
}
export const games=createGames();
export const gameCommands=[
 {name:'ppt',aliases:['pedrapapeltesoura','jokenpo'],category:'Jogos',description:'Desafia alguém para pedra, papel e tesoura',execute:ctx=>games.invite(ctx,'ppt')},
 {name:'forca',aliases:['jogodaforca'],category:'Jogos',description:'Convida alguém para forca cooperativa',execute:ctx=>games.invite(ctx,'forca')},
 {name:'aceitarjogo',aliases:['aceitardesafio'],category:'Jogos',description:'Aceita convite para jogar',execute:ctx=>games.accept(ctx,true)},
 {name:'recusarjogo',aliases:['recusardesafio'],category:'Jogos',description:'Recusa convite para jogar',execute:ctx=>games.accept(ctx,false)},
 {name:'jogar',aliases:['escolhappt'],category:'Jogos',description:'Escolhe pedra, papel ou tesoura',execute:ctx=>games.play(ctx,ctx.args[0])},
 {name:'letra',aliases:['chutarletra'],category:'Jogos',description:'Escolhe uma letra na forca',execute:ctx=>games.letter(ctx,ctx.args[0])},
 {name:'cancelarjogo',aliases:['sairjogo'],category:'Jogos',description:'Cancela a partida atual',execute:ctx=>games.cancel(ctx)}
];

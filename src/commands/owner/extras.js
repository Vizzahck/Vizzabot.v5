import { ownerState, change } from './restored.js';
const cmd=(name,description,execute)=>({name,description,execute,ownerOnly:true,category:'Proprietário'});
export const ownerExtras=[
 cmd('arquivargp','Arquiva o grupo atual',async c=>{
 if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
 await c.sock.chatModify({archive:true,lastMessages:[{key:c.msg.key,messageTimestamp:c.msg.messageTimestamp}]},c.chat);await c.reply('Grupo arquivado.');
 }),
 cmd('desarquivargp','Desarquiva o grupo atual',async c=>{
 if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
 await c.sock.chatModify({archive:false,lastMessages:[{key:c.msg.key,messageTimestamp:c.msg.messageTimestamp}]},c.chat);await c.reply('Grupo desarquivado.');
 }),
 cmd('setdespedida','Define mensagem de despedida ou reset',async c=>{
 const t=c.args.join(' ').trim();if(!t||t.length>500)return c.reply('Informe até 500 caracteres ou reset.');
 await change(s=>{if(t==='reset')delete s.farewellText;else s.farewellText=t;});await c.reply('Configuração salva.');
 }),
 cmd('menutexto','Alterna menu somente texto: on/off',async c=>{
 const v=c.args[0];if(!['on','off'].includes(v))return c.reply('Use on ou off.');
 await change(s=>{s.menuTextOnly=v==='on';});await c.reply('Configuração salva.');
 }),
 cmd('configbot','Consulta configurações operacionais do bot',async c=>{
 const s=await ownerState();
 await c.reply(['⚙️ Configurações do bot','Ativo: '+(s.enabled!==false?'Sim':'Não'),'Recepção: '+(s.receive!==false?'Sim':'Não'),'Aviso privado: '+(s.privateNotice?'Sim':'Não'),'Menu texto: '+(s.menuTextOnly?'Sim':'Não'),'Comandos bloqueados: '+(s.blockedCommands||[]).length,'Premium: '+(s.premium||[]).length].join('\n'));
 }),
 cmd('listagp','Lista grupos participantes',async c=>{
 const groups=Object.values(await c.sock.groupFetchAllParticipating());
 const page=Math.max(1,Math.floor(Number(c.args[0])||1));
 const rows=groups.slice((page-1)*15,page*15).map(g=>String(g.subject||'Sem nome').slice(0,100)+' — '+g.id);
 await c.reply('Grupos: '+groups.length+' | Página '+page+'\n'+(rows.join('\n')||'Sem resultados.'));
 }),
 cmd('limparblockcmd','Libera todos os comandos públicos bloqueados',async c=>{
 if(c.args[0]!=='confirmar')return c.reply('Use limparblockcmd confirmar.');
 await change(s=>{s.blockedCommands=[];});await c.reply('Bloqueios de comandos removidos.');
 }),
 cmd('ausente','Ativa aviso de ausência no privado',async c=>{
 const reason=c.args.join(' ').trim();if(reason.length>300)return c.reply('Limite de 300 caracteres.');
 await change(s=>{s.away=true;s.awayText=reason||'O proprietário está ausente no momento.';});await c.reply('Aviso de ausência ativado.');
 }),
 cmd('ativo','Desativa aviso de ausência',async c=>{
 await change(s=>{s.away=false;delete s.awayText;});await c.reply('Aviso de ausência desativado.');
 }),
 cmd('alugar_gp','Registra prazo de acesso do grupo em dias',async c=>{
 if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
 const days=Number(c.args[0]);if(!Number.isInteger(days)||days<1||days>365)return c.reply('Informe de 1 a 365 dias.');
 const expiry=Date.now()+days*86400000;
 await change(s=>{s.rentals??={};s.rentals[c.chat]=expiry;});
 await c.reply('Prazo registrado até '+new Date(expiry).toISOString().slice(0,10)+'.');
 }),
 cmd('remover_aluguel','Remove prazo registrado',async c=>{
 const id=c.args[0]||c.chat;if(!/^[\d-]+@g\.us$/.test(id))return c.reply('Informe ID de grupo.');
 await change(s=>{if(s.rentals)delete s.rentals[id];});await c.reply('Registro removido.');
 }),
 {...cmd('lista_alugueis','Lista prazos dos grupos',async c=>{
 const s=await ownerState();const rows=Object.entries(s.rentals||{}).map(([id,end])=>id+' — '+new Date(end).toISOString().slice(0,10)+(end<=Date.now()?' (vencido)':' (ativo)'));
 await c.reply(rows.slice(0,50).join('\n')||'Nenhum aluguel registrado.');
 }),aliases:['lista_aluguel','rm_aluguel'].filter(a=>a!=='rm_aluguel')}
];

import { groupRoles } from '../../core/group.js';

const ddds = Object.freeze({
 '11':'São Paulo (SP)','12':'Vale do Paraíba (SP)','13':'Baixada Santista (SP)','14':'Bauru (SP)','15':'Sorocaba (SP)','16':'Ribeirão Preto (SP)','17':'São José do Rio Preto (SP)','18':'Presidente Prudente (SP)','19':'Campinas (SP)',
 '21':'Rio de Janeiro (RJ)','22':'Norte Fluminense (RJ)','24':'Sul Fluminense (RJ)',
 '27':'Vitória (ES)','28':'Sul do Espírito Santo (ES)',
 '31':'Belo Horizonte (MG)','32':'Juiz de Fora (MG)','33':'Governador Valadares (MG)','34':'Uberlândia (MG)','35':'Sul de Minas (MG)','37':'Divinópolis (MG)','38':'Montes Claros (MG)',
 '41':'Curitiba (PR)','42':'Ponta Grossa (PR)','43':'Londrina (PR)','44':'Maringá (PR)','45':'Cascavel (PR)','46':'Francisco Beltrão (PR)',
 '47':'Joinville (SC)','48':'Florianópolis (SC)','49':'Chapecó (SC)',
 '51':'Porto Alegre (RS)','53':'Pelotas (RS)','54':'Caxias do Sul (RS)','55':'Santa Maria (RS)',
 '61':'Brasília (DF)','62':'Goiânia (GO)','63':'Palmas (TO)','64':'Rio Verde (GO)','65':'Cuiabá (MT)','66':'Rondonópolis (MT)','67':'Campo Grande (MS)',
 '68':'Rio Branco (AC)','69':'Porto Velho (RO)',
 '71':'Salvador (BA)','73':'Ilhéus (BA)','74':'Juazeiro (BA)','75':'Feira de Santana (BA)','77':'Vitória da Conquista (BA)','79':'Aracaju (SE)',
 '81':'Recife (PE)','82':'Maceió (AL)','83':'João Pessoa (PB)','84':'Natal (RN)','85':'Fortaleza (CE)','86':'Teresina (PI)','87':'Petrolina (PE)','88':'Juazeiro do Norte (CE)','89':'Picos (PI)',
 '91':'Belém (PA)','92':'Manaus (AM)','93':'Santarém (PA)','94':'Marabá (PA)','95':'Boa Vista (RR)','96':'Macapá (AP)','97':'Interior do Amazonas (AM)','98':'São Luís (MA)','99':'Interior do Maranhão (MA)'
});
export const dddLookup = number => ddds[String(number)] || null;
const onlyGroup=ctx=>ctx.chat.endsWith('@g.us');
export const usefulV4Commands=[
 {name:'ddd',category:'Ferramentas',description:'Consulta a região aproximada de um DDD brasileiro',async execute(ctx){
  const ddd=ctx.args[0]?.replace(/\D/g,'');
  if(!/^\d{2}$/.test(ddd||''))return ctx.reply('Uso: '+ctx.config.prefix+'ddd 98');
  await ctx.reply(dddLookup(ddd)?'📞 DDD '+ddd+': '+dddLookup(ddd)+'\nObs.: indica região de origem, não localização atual.':'DDD não reconhecido.');
 }},
 {name:'google',aliases:['pesquisargoogle'],category:'Pesquisa e Downloads',description:'Gera link de pesquisa no Google sem API paga',async execute(ctx){
  const query=ctx.args.join(' ').trim();
  if(!query||query.length>150)return ctx.reply('Uso: '+ctx.config.prefix+'google assunto (até 150 caracteres)');
  await ctx.reply('🔎 Pesquisa: https://www.google.com/search?q='+encodeURIComponent(query));
 }},
 {name:'idiomas',aliases:['idioma'],category:'Ferramentas',description:'Mostra idiomas comuns para tradução',async execute(ctx){
  await ctx.reply('🌍 *IDIOMAS*\nPortuguês: pt\nInglês: en\nEspanhol: es\nFrancês: fr\nAlemão: de\nItaliano: it\nJaponês: ja\nCoreano: ko\n\nCódigos ISO 639-1.');
 }},
 {name:'idgp',aliases:['idgrupo'],category:'Administração',description:'Exibe identificador do grupo atual',async execute(ctx){
  if(!onlyGroup(ctx))return ctx.reply('Somente em grupos.');
  await ctx.reply('🆔 ID do grupo: '+ctx.chat);
 }},
 {name:'admins',aliases:['adm','listadmins','listaadmins'],category:'Administração',description:'Lista administradores do grupo',async execute(ctx){
  if(!onlyGroup(ctx))return ctx.reply('Somente em grupos.');
  const meta=await ctx.sock.groupMetadata(ctx.chat);
  const admins=meta.participants.filter(p=>p.admin==='admin'||p.admin==='superadmin').slice(0,100);
  if(!admins.length)return ctx.reply('Não encontrei administradores.');
  await ctx.sock.sendMessage(ctx.chat,{text:'🛡️ *ADMINISTRADORES — '+meta.subject+'*\n'+admins.map((p,i)=>(i+1)+'. @'+p.id.split('@')[0]).join('\n'),mentions:admins.map(p=>p.id)});
 }},
 {name:'atividade',aliases:['atividades'],category:'Administração',description:'Resumo atual de membros e administradores',async execute(ctx){
  if(!onlyGroup(ctx))return ctx.reply('Somente em grupos.');
  const meta=await ctx.sock.groupMetadata(ctx.chat);
  const count=meta.participants.filter(p=>p.admin).length;
  await ctx.reply('📊 *'+meta.subject+'*\n👥 Membros: '+meta.participants.length+'\n🛡️ Administradores: '+count+'\nℹ️ Estatísticas históricas não são armazenadas.');
 }},
 {name:'getquoted',aliases:['getinfo'],category:'Ferramentas',description:'Mostra texto de uma mensagem respondida',async execute(ctx){
  const m=ctx.msg.message;
  const info=m?.extendedTextMessage?.contextInfo||m?.imageMessage?.contextInfo||m?.videoMessage?.contextInfo;
  const quoted=info?.quotedMessage;
  const text=quoted?.conversation||quoted?.extendedTextMessage?.text||quoted?.imageMessage?.caption||quoted?.videoMessage?.caption;
  if(!quoted)return ctx.reply('Responda a uma mensagem com '+ctx.config.prefix+'getquoted');
  if(!text)return ctx.reply('A mensagem citada não contém texto acessível.');
  await ctx.reply('💬 *MENSAGEM CITADA*\n'+String(text).slice(0,1800));
 }},
 {name:'listagp',aliases:['listagps','listagrupos'],category:'Proprietário',ownerOnly:true,description:'Lista grupos conhecidos pela conexão atual',async execute(ctx){
  const groups=await ctx.sock.groupFetchAllParticipating();
  const list=Object.values(groups||{}).sort((a,b)=>String(a.subject).localeCompare(String(b.subject),'pt')).slice(0,80);
  await ctx.reply('👥 *GRUPOS ('+Object.keys(groups||{}).length+')*\n'+(list.map((g,i)=>(i+1)+'. '+g.subject+' — '+g.id).join('\n')||'Nenhum grupo encontrado.')+(Object.keys(groups||{}).length>80?'\n... Lista limitada a 80 grupos.':''));
 }}
];

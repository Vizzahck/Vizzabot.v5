// Compact, privacy-conscious Termux dashboard for Pino events.
const color={reset:'\x1b[0m',green:'\x1b[32m',yellow:'\x1b[33m',red:'\x1b[31m',cyan:'\x1b[36m',gray:'\x1b[90m',bold:'\x1b[1m'};
const paint=(code,text)=>process.stdout.isTTY?code+text+color.reset:text;
const timestamp=()=>new Date().toLocaleTimeString('pt-BR',{hour12:false});
const clean=value=>String(value??'').replace(/[\r\n\x1b]/g,' ').slice(0,150);
const events={
 received:'📩 MENSAGEM',moderated:'🛡️ MODERAÇÃO',command:'⚡ COMANDO',
 'command-completed':'✅ CONCLUÍDO','command-failed':'❌ FALHOU',
 'unknown-command':'❔ DESCONHECIDO','rate-limited':'⏳ LIMITE',
 denied:'⛔ NEGADO'
};
export function formatTerminalRecord(record){
 const event=record.activity;
 if(event){
  const label=events[event]||clean(event);
  const details=[record.chatType==='group'?'GRUPO':record.chatType==='private'?'PRIVADO':'',record.command?'!'+clean(record.command):'',event==='received'?clean(record.messageType):''].filter(Boolean).join('  ·  ');
  return {level:record.level>=50?'error':'activity',text:label+(details?'  '+details:'')};
 }
 const msg=clean(record.msg);
 const status=record.status!==undefined?' (status '+clean(record.status)+')':'';
 if(record.level>=50){
  const err=clean(record.err?.message||record.err?.data?.message||'');
  return {level:'error',text:'ERRO  '+msg+status+(err?' — '+err:'')};
 }
 if(record.level>=40)return {level:'warn',text:'AVISO  '+msg+status};
 if(record.level>=30)return {level:'info',text:msg};
 return null;
}
export function terminalStream(){
 return {write(line){
  try{
   const record=JSON.parse(line);
   const formatted=formatTerminalRecord(record);
   if(!formatted)return;
   const shade=formatted.level==='error'?color.red:formatted.level==='warn'?color.yellow:formatted.level==='activity'?color.cyan:color.green;
   process.stdout.write(paint(color.gray,'['+timestamp()+'] ')+paint(shade,formatted.text)+'\n');
  }catch{process.stdout.write('[Vizzabot] Evento de log indisponível\n');}
 }};
}
export function terminalBanner({name,ownerName,prefix,commands}){
 const lines=['╔══════════════════════════════════════╗','║          VIZZABOT V5  •  TERMUX      ║','╚══════════════════════════════════════╝',name+'  |  Dono: '+ownerName,'Prefixo: '+prefix+'  |  Comandos: '+commands,'Monitor de atividades ativo. CTRL+C encerra.','────────────────────────────────────────'];
 console.log('\n'+lines.map(line=>paint(color.bold+color.cyan,line)).join('\n')+'\n');
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { normalizePhone } from '../src/core/local-config.js';
const path='config.local.json';
const rl=createInterface({input:stdin,output:stdout});
const ask=async(label,fallback='')=>(await rl.question(label+(fallback?' ['+fallback+']':'')+': ')).trim()||fallback;
try{
 console.log('\n╔══════════════════════════════════════╗');
 console.log('║   VIZZABOT V5 — INSTALAÇÃO LOCAL     ║');
 console.log('╚══════════════════════════════════════╝');
 if(existsSync(path)){
  console.log('⚠️ Já existe config.local.json. Nada foi alterado.');
  console.log('Para alterar o dono, use os comandos do proprietário ou edite o arquivo manualmente.');
  process.exitCode=0;
 }else{
  const name=await ask('Nome do proprietário');
  const phone=normalizePhone(await ask('Número do proprietário com DDI e DDD'));
  const botName=await ask('Nome do bot','Vizzabot V5');
  const prefix=await ask('Prefixo','!');
  if(!name||name.length>80||!botName||botName.length>80||!prefix||prefix.length>5||/\s/.test(prefix))throw Error('Nome ou prefixo inválido');
  console.log('\nConfira: '+botName+' | Dono: '+name+' | Número: '+phone.slice(0,4)+'*****'+phone.slice(-2)+' | Prefixo: '+prefix);
  const confirm=(await ask('Confirmar criação? (sim/não)','não')).toLowerCase();
  if(confirm!=='sim')console.log('Cancelado; nenhum arquivo criado.');
  else{
   const data={owner:{name,numbers:[phone]},botAdmins:[],bot:{name:botName,prefix},features:{simi:0,imageLinks:0,activityMonitor:1}};
   writeFileSync(path,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
   for(const dir of ['sessions','data','logs'])mkdirSync(dir,{recursive:true});
   console.log('✅ Instalação configurada. Execute: npm run check && npm test && npm start');
   console.log('⚠️ Cada cliente deve usar sua própria pasta de instalação e pareamento.');
  }
 }
}catch(error){console.error('❌ '+error.message);process.exitCode=1;}finally{rl.close();}

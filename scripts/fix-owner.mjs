import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const file='config.local.json';
if(!existsSync(file)){console.error('Configuração local não encontrada.');process.exitCode=1;}
else {
 const data=JSON.parse(readFileSync(file,'utf8'));
 data.owner??={};
 let changed=false;
 if(!data.owner.name||['Seu nome','𝖛𝖍𝖘'].includes(data.owner.name)){if(data.owner.name!=='𝖛𝖍𝖘'){data.owner.name='𝖛𝖍𝖘';changed=true;}}
 const numbers=data.owner.numbers;
 if(!Array.isArray(numbers)||numbers.length===0||(numbers.length===1&&numbers[0]==='5598999999999')){data.owner.numbers=['5598987037044'];changed=true;}
 if(changed){writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});console.log('👑 Dono atualizado: '+data.owner.name+' | '+data.owner.numbers.join(', '));}
 else console.log('Configuração de proprietário mantida: '+(data.owner.name||'não informado')+' | '+(data.owner.numbers||[]).join(', '));
}

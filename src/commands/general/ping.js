import { performance } from 'node:perf_hooks';
import os from 'node:os';
export default {
 name:'ping',category:'Geral',description:'Latência de envio e estado do bot',
 async execute(ctx){
 const start=performance.now();
 await ctx.reply('🏓 Medindo resposta...');
 const ms=Math.round(performance.now()-start);
 const t=Math.floor(process.uptime()), memory=process.memoryUsage();
 const mb=n=>(n/1048576).toFixed(1)+' MB';
 await ctx.reply(['🏓 PONG — '+ctx.config.name,'🟢 Online','⚡ Envio: '+ms+' ms','⏱️ Ativo: '+Math.floor(t/86400)+'d '+Math.floor(t/3600)%24+'h '+Math.floor(t/60)%60+'m '+t%60+'s','💾 RAM do processo: '+mb(memory.rss),'📦 Heap: '+mb(memory.heapUsed),'🖥️ Plataforma: '+os.platform()+' / '+os.arch(),'🔧 Node: '+process.version].join('\n'));
 }
};

import { readFile } from 'node:fs/promises';
export default {
  name:'sobre', category:'Geral', description:'Informações da versão instalada',
  async execute(ctx){
    const pkg=JSON.parse(await readFile(new URL('../../../package.json',import.meta.url),'utf8'));
    await ctx.reply(ctx.config.name+' • base independente • versão '+pkg.version);
  }
};

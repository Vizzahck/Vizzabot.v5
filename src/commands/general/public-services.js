// Serviços públicos gratuitos, sem chave de API. Dependem de conexão à internet.
const TIMEOUT_MS = 9000;
export async function getJson(url, fetcher = fetch) {
 const response = await fetcher(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'Vizzabot-V5/5.2 (educational WhatsApp bot)' } });
 if (!response.ok) throw new Error('Serviço indisponível (' + response.status + ')');
 return response.json();
}
export function cleanQuery(args) {
 const query = args.join(' ').trim().replace(/[\u0000-\u001f]/g, ' ');
 if (!query || query.length > 100) return null;
 return query;
}
export function weatherDescription(code) {
 if (code === 0) return 'Céu limpo';
 if ([1,2,3].includes(code)) return 'Parcialmente nublado';
 if ([45,48].includes(code)) return 'Neblina';
 if ([51,53,55,56,57].includes(code)) return 'Garoa';
 if ([61,63,65,66,67,80,81,82].includes(code)) return 'Chuva';
 if ([71,73,75,77,85,86].includes(code)) return 'Neve';
 if ([95,96,99].includes(code)) return 'Trovoadas';
 return 'Condição variável';
}
export const publicServices = [
 {name:'wikipedia',aliases:['wiki'],category:'Ferramentas',description:'Resumo da Wikipédia em português (grátis)',async execute(ctx){
  const query=cleanQuery(ctx.args);
  if (!query) return ctx.reply('Uso: '+ctx.config.prefix+'wikipedia assunto');
  try {
   const search=await getJson('https://pt.wikipedia.org/w/api.php?'+new URLSearchParams({action:'query',list:'search',srsearch:query,srlimit:'1',format:'json',origin:'*'}));
   const title=search?.query?.search?.[0]?.title;
   if (!title) return ctx.reply('🔎 Nenhum artigo encontrado.');
   const page=await getJson('https://pt.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(title));
   const summary=String(page?.extract||'').trim().slice(0,1300);
   const link='https://pt.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));
   await ctx.reply('📚 *'+title+'*\n\n'+(summary||'Resumo indisponível.')+'\n\n🔗 '+link);
  }catch { await ctx.reply('⚠️ Wikipédia indisponível agora. Tente novamente depois.'); }
 }},
 {name:'clima',aliases:['previsaotempo'],category:'Ferramentas',description:'Clima atual por cidade via Open-Meteo (grátis)',async execute(ctx){
  const city=cleanQuery(ctx.args);
  if (!city) return ctx.reply('Uso: '+ctx.config.prefix+'clima Pinheiro MA');
  try {
   const geo=await getJson('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:city,count:'1',language:'pt',format:'json'}));
   const place=geo?.results?.[0];
   if (!place) return ctx.reply('📍 Cidade não encontrada. Tente apenas o nome da cidade.');
   const weather=await getJson('https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:String(place.latitude),longitude:String(place.longitude),current:'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',timezone:'auto'}));
   const w=weather?.current;
   if (!w || !Number.isFinite(w.temperature_2m)) throw Error('Dados ausentes');
   await ctx.reply('🌤️ *Clima em '+place.name+(place.admin1?', '+place.admin1:'')+'*\n'+weatherDescription(w.weather_code)+'\n🌡️ Temperatura: '+w.temperature_2m+' °C\n🥵 Sensação: '+w.apparent_temperature+' °C\n💧 Umidade: '+w.relative_humidity_2m+'%\n💨 Vento: '+w.wind_speed_10m+' km/h\n🕒 '+w.time+' (hora local)\nFonte: Open-Meteo');
  }catch { await ctx.reply('⚠️ Não foi possível consultar o clima agora.'); }
 }}
];

function arithmetic(source){
 const input=source.replace(/,/g,'.').trim();
 if(!input||input.length>100||!/^[0-9+*/().%\s-]+$/.test(input))throw Error('Expressão inválida');
 const tokens=input.match(/\d+(?:\.\d+)?|[()+*/%-]/g);
 if(!tokens||tokens.join('')!==input.replace(/\s/g,''))throw Error('Expressão inválida');
 let i=0;
 function factor(){const t=tokens[i++];if(t==='-')return -factor();if(t==='+')return factor();if(t==='('){const n=expr();if(tokens[i++]!==')')throw Error('Parênteses inválidos');return n;}if(!/^\d/.test(t||''))throw Error('Número esperado');return Number(t);}
 function term(){let n=factor();while(['*','/','%'].includes(tokens[i])){const op=tokens[i++],v=factor();n=op==='*'?n*v:op==='/'?n/v:n%v;}return n;}
 function expr(){let n=term();while(['+','-'].includes(tokens[i])){const op=tokens[i++];const v=term();n=op==='+'?n+v:n-v;}return n;}
 const result=expr();if(i!==tokens.length||!Number.isFinite(result))throw Error('Resultado inválido');return result;
}
export { arithmetic };
const randomChoice=(arr)=>arr[Math.floor(Math.random()*arr.length)];
export const v4Utilities=[
 {name:'calcular',aliases:['calc'],category:'Ferramentas',description:'Calcula expressões matemáticas',async execute(ctx){try{const expression=ctx.args.join(' ');const result=arithmetic(expression);await ctx.reply('🧮 '+expression+' = *'+result+'*');}catch{await ctx.reply('Uso: !calcular (10 + 5) * 2');}}},
 {name:'contar_caracteres',aliases:['contarcaracteres'],category:'Ferramentas',description:'Conta caracteres do texto',async execute(ctx){const s=ctx.args.join(' ');if(!s)return ctx.reply('Uso: !contar_caracteres seu texto');await ctx.reply('🔤 Caracteres: '+[...s].length+'\n📝 Palavras: '+s.trim().split(/\s+/).length);}},
 {name:'raiz_quadrada',aliases:['raizquadrada'],category:'Ferramentas',description:'Calcula raiz quadrada',async execute(ctx){const n=Number(ctx.args[0]);if(!Number.isFinite(n)||n<0)return ctx.reply('Uso: !raiz_quadrada 81');await ctx.reply('√'+n+' = '+Math.sqrt(n));}},
 {name:'repetir',aliases:['repertirtexto'],category:'Ferramentas',description:'Repete texto até 5 vezes',async execute(ctx){const n=Number(ctx.args[0]);const s=ctx.args.slice(1).join(' ');if(!Number.isInteger(n)||n<1||n>5||!s||s.length>200)return ctx.reply('Uso: !repetir 3 texto (máximo 5 vezes)');await ctx.reply(Array(n).fill(s).join('\n'));}},
 {name:'embaralhar',aliases:['embaralharpalavra'],category:'Jogos',description:'Embaralha uma palavra',async execute(ctx){const s=ctx.args.join(' ').trim();if(!s||s.length>40)return ctx.reply('Uso: !anagrama palavra');const a=[...s];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}await ctx.reply('🔀 '+a.join(''));}},
 {name:'sorteionumero',aliases:['sorteionumeros'],category:'Brincadeiras',description:'Sorteia número dentro de intervalo',async execute(ctx){const a=Number(ctx.args[0]),b=Number(ctx.args[1]);if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b<a||b-a>1000000)return ctx.reply('Uso: !sorteionumero 1 100');await ctx.reply('🎲 Número sorteado: *'+(a+Math.floor(Math.random()*(b-a+1)))+'*');}}
];

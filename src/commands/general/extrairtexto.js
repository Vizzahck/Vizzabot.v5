import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadImage } from '../../core/media.js';
const MAX_IMAGE = 8 * 1024 * 1024;
export async function runOcr(buffer, {language='eng',timeoutMs=25000}={}){
 const dir=await mkdtemp(join(tmpdir(),'vizzabot-ocr-'));
 const file=join(dir,'imagem.png');
 try{
  await writeFile(file,buffer);
  return await new Promise((resolve,reject)=>{
   const child=spawn('tesseract',[file,'stdout','-l',language],{stdio:['ignore','pipe','pipe']});
   let out='',err='',done=false;
   const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(result);};
   const timer=setTimeout(()=>{child.kill('SIGKILL');finish(Error('OCR excedeu o tempo limite'));},timeoutMs);
   child.stdout.on('data',chunk=>{out+=chunk;if(out.length>12000){child.kill('SIGKILL');finish(Error('Texto extraído excede o limite'));}});
   child.stderr.on('data',chunk=>{err+=chunk;if(err.length>2000)err=err.slice(-2000);});
   child.on('error',e=>finish(e));
   child.on('close',code=>code===0?finish(null,out.trim()):finish(Error('OCR falhou: '+err.slice(-200))));
  });
 }finally{await rm(dir,{recursive:true,force:true}).catch(()=>{});}
}
export default {
 name:'extrairtexto',aliases:['ocr','textoimagem'],category:'Ferramentas',
 description:'Extrai texto de imagem com OCR local (Tesseract, sem API paga)',
 async execute(ctx){
  let image;
  try{image=await downloadImage(ctx.sock,ctx.msg,ctx.logger,MAX_IMAGE);}
  catch(error){ctx.logger?.warn?.({message:error.message},'Imagem OCR indisponível');return ctx.reply('⚠️ Não consegui ler a imagem (limite de 8 MB).');}
  if(!image)return ctx.reply('📸 Envie uma imagem com *'+ctx.config.prefix+'extrairtexto* na legenda ou responda a uma imagem com esse comando.');
  if(!['image/jpeg','image/png','image/webp'].includes(image.mimetype))return ctx.reply('⚠️ Use imagem JPG, PNG ou WEBP.');
  try{
   const {default:sharp}=await import('sharp');
   const normalized=await sharp(image.buffer,{limitInputPixels:20000000}).rotate().resize({width:2200,withoutEnlargement:true}).png().toBuffer();
   let result;
   try{result=await runOcr(normalized,{language:'por'});}
   catch(error){
    if(/Failed loading language|Error opening data file|Tesseract couldn't load/i.test(error.message))result=await runOcr(normalized,{language:'eng'});
    else throw error;
   }
   await ctx.reply(result?'📝 *TEXTO EXTRAÍDO*\n\n'+result.slice(0,3500)+(result.length>3500?'\n\n… texto limitado a 3500 caracteres.':''):'🔎 Não encontrei texto legível nessa imagem.');
  }catch(error){
   ctx.logger?.warn?.({message:error.message},'Falha na extração OCR');
   await ctx.reply(error.code==='ENOENT'?'⚠️ OCR não instalado. No Termux execute: *pkg install tesseract* e tente novamente.':'⚠️ Não consegui extrair o texto. Tente uma imagem mais nítida.');
  }
 }
};

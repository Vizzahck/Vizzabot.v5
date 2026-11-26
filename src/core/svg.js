import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Native Sharp is optional at runtime, notably on Android/Termux.
export async function renderSvg(svg, format='png'){
 if(!['png','webp'].includes(format))throw new Error('Formato inválido');
 try{
  const {default:sharp}=await import('sharp');
  const image=sharp(Buffer.from(svg),{limitInputPixels:4000000});
  return await (format==='webp'?image.webp({quality:85}):image.png()).toBuffer();
 }catch{
  const dir=await mkdtemp(join(tmpdir(),'vizzabot-svg-'));
  try{
   const input=join(dir,'input.svg'),output=join(dir,'output.'+format);
   await writeFile(input,svg);
   await new Promise((resolve,reject)=>{
    const p=spawn('magick',['-limit','memory','128MiB','-limit','map','256MiB','-background','none',input,output],{stdio:'ignore'});
    const timer=setTimeout(()=>p.kill('SIGKILL'),20000);
    p.once('error',e=>{clearTimeout(timer);reject(e);});
    p.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('ImageMagick indisponível ou conversão falhou'));});
   });
   return await readFile(output);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
}

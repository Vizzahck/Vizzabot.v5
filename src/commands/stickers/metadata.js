import { createHash } from 'node:crypto';
const LIMIT=1024*1024;
function chunk(type,data){
 const b=Buffer.alloc(8+data.length+(data.length%2));b.write(type,0,'ascii');b.writeUInt32LE(data.length,4);data.copy(b,8);return b;
}
export function stickerMetadata(input,pack,author){
 if(input.length<20||input.length>LIMIT||input.toString('ascii',0,4)!=='RIFF'||input.toString('ascii',8,12)!=='WEBP'||input.readUInt32LE(4)+8!==input.length)throw Error('WebP inválido');
 const parts=[];let flags=0,width,height,vp8x=false;
 for(let pos=12;pos<input.length;){
  if(pos+8>input.length)throw Error('Chunk inválido');
  const kind=input.toString('ascii',pos,pos+4),size=input.readUInt32LE(pos+4),end=pos+8+size+(size%2);
  if(end>input.length)throw Error('Chunk truncado');
  const data=input.subarray(pos+8,pos+8+size);
  if(kind==='VP8X'){
   if(size!==10||vp8x)throw Error('VP8X inválido');
   vp8x=true;flags=data[0];width=data.readUIntLE(4,3)+1;height=data.readUIntLE(7,3)+1;
  }else if(kind!=='EXIF'){
   if(kind==='VP8 '&&!width&&size>=10&&data[3]===0x9d&&data[4]===1&&data[5]===0x2a){width=data.readUInt16LE(6)&0x3fff;height=data.readUInt16LE(8)&0x3fff;}
   if(kind==='VP8L'&&!width&&size>=5&&data[0]===0x2f){const bits=data.readUInt32LE(1);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;if(bits&0x10000000)flags|=0x10;}
   if(kind==='ALPH')flags|=0x10;if(kind==='ICCP')flags|=0x20;if(kind==='XMP ')flags|=4;if(kind==='ANIM')flags|=2;
   parts.push({kind,data});
  }
  pos=end;
 }
 if(!width||!height||width>512||height>512||!parts.some(p=>['VP8 ','VP8L','ANMF'].includes(p.kind)))throw Error('Dimensões inválidas');
 const extended=Buffer.alloc(10);extended[0]=flags|8;extended.writeUIntLE(width-1,4,3);extended.writeUIntLE(height-1,7,3);
 const json=Buffer.from(JSON.stringify({'sticker-pack-id':createHash('sha256').update(pack+'\0'+author).digest('hex').slice(0,32),'sticker-pack-name':pack,'sticker-pack-publisher':author,emojis:['✨']}));
 const header=Buffer.from([0x49,0x49,0x2a,0,8,0,0,0,1,0,0x41,0x57,7,0,0,0,0,0,22,0,0,0]);header.writeUInt32LE(json.length,14);
 const chunks=[chunk('VP8X',extended),...parts.filter(p=>p.kind!=='XMP ').map(p=>chunk(p.kind,p.data)),chunk('EXIF',Buffer.concat([header,json])),...parts.filter(p=>p.kind==='XMP ').map(p=>chunk(p.kind,p.data))];
 const body=Buffer.concat([Buffer.from('WEBP'),...chunks]);const riff=Buffer.alloc(8);riff.write('RIFF');riff.writeUInt32LE(body.length,4);return Buffer.concat([riff,body]);
}

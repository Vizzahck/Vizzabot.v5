import { readFile } from 'node:fs/promises';
import { ownerState } from '../commands/owner/restored.js';
export async function handleGroupParticipants(sock, event, store, logger) {
  const settings=await ownerState();
  if (!store.group(event.id).welcome || !['add','remove'].includes(event.action)) return;
  if(event.action==='remove'&&!settings.farewellText&&!settings.farewellImage)return;
  for (const jid of event.participants || []) {
    try {
      const key=event.action==='remove'?'farewell':'welcome';
      const text=key==='farewell'?(settings.farewellText||'Até logo!'):((settings.welcomeSecond&&settings.welcomeText2?settings.welcomeText2:settings.welcomeText)||'👋 Boas-vindas ao grupo! Leia as regras e divirta-se.');
      const image=settings[key+'Image']?await readFile('data/'+key+'-custom.jpg').catch(()=>null):null;
      await sock.sendMessage(event.id,image?{image,caption:text}:{text});
    } catch (err) { logger.warn({ err }, 'Falha nas boas-vindas'); }
  }
}

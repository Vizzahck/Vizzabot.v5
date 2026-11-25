import { readFile } from 'node:fs/promises';
import { ownerState } from '../commands/owner/restored.js';
export async function handleGroupParticipants(sock, event, store, logger) {
  const settings=await ownerState();
  if (!store.group(event.id).welcome || !['add','remove'].includes(event.action)) return;
  store.db.exec('CREATE TABLE IF NOT EXISTS group_greetings (jid TEXT NOT NULL,kind TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(jid,kind))');
  const local=store.db.prepare('SELECT body FROM group_greetings WHERE jid=? AND kind=?').get(event.id,event.action==='remove'?'farewell':'welcome')?.body;
  if(event.action==='remove'&&!local&&!settings.farewellText&&!settings.farewellImage)return;
  for (const jid of event.participants || []) {
    try {
      const key=event.action==='remove'?'farewell':'welcome';
      const text=local||(key==='farewell'?(settings.farewellText||'Até logo!'):((settings.welcomeSecond&&settings.welcomeText2?settings.welcomeText2:settings.welcomeText)||'👋 Boas-vindas ao grupo! Leia as regras e divirta-se.'));
      const image=settings[key+'Image']?await readFile('data/'+key+'-custom.jpg').catch(()=>null):null;
      await sock.sendMessage(event.id,image?{image,caption:text}:{text});
    } catch (err) { logger.warn({ err }, 'Falha nas boas-vindas'); }
  }
}

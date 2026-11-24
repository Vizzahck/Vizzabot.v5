import { ownerState } from '../commands/owner/restored.js';
export async function handleGroupParticipants(sock, event, store, logger) {
  const settings=await ownerState();
  if (!store.group(event.id).welcome || !['add','remove'].includes(event.action)) return;
  if(event.action==='remove'&&!settings.farewellText)return;
  for (const jid of event.participants || []) {
    try {
      await sock.sendMessage(event.id, { text: event.action==='remove'?settings.farewellText:settings.welcomeText || '👋 Boas-vindas ao grupo! Leia as regras e divirta-se.' });
    } catch (err) { logger.warn({ err }, 'Falha nas boas-vindas'); }
  }
}

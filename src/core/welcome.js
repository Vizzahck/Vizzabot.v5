import { ownerState } from '../commands/owner/restored.js';
export async function handleGroupParticipants(sock, event, store, logger) {
  if (event.action !== 'add' || !store.group(event.id).welcome) return;
  const settings=await ownerState();
  for (const jid of event.participants || []) {
    try {
      await sock.sendMessage(event.id, { text: settings.welcomeText || '👋 Boas-vindas ao grupo! Leia as regras e divirta-se.' });
    } catch (err) { logger.warn({ err }, 'Falha nas boas-vindas'); }
  }
}

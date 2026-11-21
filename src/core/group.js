function sameParticipant(a = '', b = '') {
  if (!a || !b) return false;
  if (a === b) return true;
  // Baileys pode incluir um sufixo de dispositivo em JIDs de telefone.
  const normalize = jid => jid.replace(/:\d+(?=@)/, '');
  return normalize(a) === normalize(b);
}
export async function groupRoles(sock, chat, sender, owner = false) {
  if (!chat?.endsWith('@g.us')) return { group: false, admin: false, botAdmin: false };
  const meta = await sock.groupMetadata(chat);
  const participants = meta.participants || [];
  const isAdmin = p => p?.admin === 'admin' || p?.admin === 'superadmin';
  const senderInfo = participants.find(p => sameParticipant(p.id, sender));
  const botInfo = participants.find(p => sameParticipant(p.id, sock.user?.id));
  return { group: true, admin: owner || isAdmin(senderInfo), botAdmin: isAdmin(botInfo) };
}

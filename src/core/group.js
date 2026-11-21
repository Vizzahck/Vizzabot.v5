export async function groupRoles(sock, chat, sender, owner = false) {
  if (!chat?.endsWith('@g.us')) return { group: false, admin: false, botAdmin: false };
  const meta = await sock.groupMetadata(chat);
  const participants = meta.participants || [];
  const isAdmin = p => Boolean(p?.admin);
  const senderInfo = participants.find(p => p.id === sender);
  const botJid = sock.user?.id || '';
  const botNumber = botJid.split(':')[0].split('@')[0];
  const botInfo = participants.find(p => p.id === botJid || p.id.split('@')[0] === botNumber);
  return { group: true, admin: owner || isAdmin(senderInfo), botAdmin: isAdmin(botInfo) };
}

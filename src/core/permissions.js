export function normalizedNumber(jid = '') {
  return String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
}
export function isOwner(sender, owners = []) {
  return owners.includes(normalizedNumber(sender));
}
export function isBotAdmin(sender, admins = [], owners = []) {
  const phone = normalizedNumber(sender);
  return owners.includes(phone) || admins.includes(phone);
}

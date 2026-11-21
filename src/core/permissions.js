export function normalizedNumber(jid = '') {
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}
export function isOwner(sender, owners) {
  return owners.includes(normalizedNumber(sender));
}

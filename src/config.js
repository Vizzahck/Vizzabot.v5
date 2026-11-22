import 'dotenv/config';
import { readLocalConfig } from './core/local-config.js';
const local = readLocalConfig();
const envOwners = (process.env.OWNER_NUMBERS || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean);
const envAdmins = (process.env.BOT_ADMIN_NUMBERS || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean);
export const config = {
  name: local?.botName || process.env.BOT_NAME || 'Vizzabot V5',
  prefix: local?.prefix || process.env.BOT_PREFIX || '!',
  ownerName: local?.ownerName || process.env.OWNER_NAME || '𝖛𝖍𝖘',
  owners: local ? local.ownerNumbers : envOwners,
  botAdmins: local ? local.botAdmins : envAdmins,
  allowGroups: local?.allowGroups ?? (process.env.ALLOW_GROUPS !== 'false'),
  allowPrivate: local?.allowPrivate ?? (process.env.ALLOW_PRIVATE !== 'false'),
  simiEnabled: local?.simiEnabled ?? (process.env.SIMI_ENABLED === '1'),
  imageLinksEnabled: local?.imageLinksEnabled ?? false,
  activityMonitor: local?.activityMonitor ?? true,
  logLevel: process.env.LOG_LEVEL || 'info'
};
if (!config.owners.length) console.warn('AVISO: nenhum número de proprietário configurado. Comandos exclusivos ficarão indisponíveis.');

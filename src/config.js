import 'dotenv/config';
import { readLocalConfig } from './core/local-config.js';
const local = readLocalConfig();
const envOwners = (process.env.OWNER_NUMBERS || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean);
const envAdmins = (process.env.BOT_ADMIN_NUMBERS || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean);
export const config = {
  name: local?.botName || process.env.BOT_NAME || 'Vizzabot V5',
  prefix: local?.prefix || process.env.BOT_PREFIX || '!',
  ownerName: local?.ownerName || process.env.OWNER_NAME || '',
  owners: local ? local.ownerNumbers : envOwners,
  botAdmins: local ? local.botAdmins : envAdmins,
  allowGroups: process.env.ALLOW_GROUPS !== 'false',
  allowPrivate: process.env.ALLOW_PRIVATE !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info'
};
if (!config.owners.length) console.warn('AVISO: nenhum número de proprietário configurado. Comandos exclusivos ficarão indisponíveis.');

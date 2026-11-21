import 'dotenv/config';
export const config = {
  name: process.env.BOT_NAME || 'Vizzabot V5',
  prefix: process.env.BOT_PREFIX || '!',
  owners: (process.env.OWNER_NUMBERS || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean),
  allowGroups: process.env.ALLOW_GROUPS !== 'false',
  allowPrivate: process.env.ALLOW_PRIVATE !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info'
};

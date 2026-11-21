import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function normalizePhone(value) {
  const phone = String(value ?? '').replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 15) throw new Error('Número inválido no arquivo local: use DDI + DDD + número');
  return phone;
}
export function readLocalConfig(path = 'config.local.json') {
  const filename = resolve(path);
  if (!existsSync(filename)) return null;
  let data;
  try { data = JSON.parse(readFileSync(filename, 'utf8')); }
  catch (error) { throw new Error(`Não foi possível ler ${path}: ${error.message}`); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Configuração local precisa ser um objeto JSON');
  const owner = data.owner ?? {};
  const admins = data.botAdmins ?? [];
  if (!Array.isArray(owner.numbers) || !Array.isArray(admins)) throw new Error('owner.numbers e botAdmins precisam ser listas');
  const ownerNumbers = [...new Set(owner.numbers.map(normalizePhone))];
  const botAdmins = [...new Set(admins.map(normalizePhone))].filter(n => !ownerNumbers.includes(n));
  const ownerName = typeof owner.name === 'string' ? owner.name.trim().slice(0, 80) : '';
  const bot = data.bot ?? {};
  if (bot === null || typeof bot !== 'object' || Array.isArray(bot)) throw new Error('bot precisa ser um objeto');
  const botName = typeof bot.name === 'string' && bot.name.trim() ? bot.name.trim().slice(0, 80) : undefined;
  const prefix = typeof bot.prefix === 'string' && bot.prefix.trim() && bot.prefix.length <= 5 ? bot.prefix : undefined;
  const simi = data.features?.simi ?? 0;
  if (simi !== 0 && simi !== 1) throw new Error('features.simi deve ser 0 ou 1');
  return { ownerName, ownerNumbers, botAdmins, botName, prefix, simiEnabled: simi === 1 };
}

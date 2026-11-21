import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export function normalizePairingNumber(value) {
  const number = String(value || '').replace(/\D/g, '');
  if (number.length < 10 || number.length > 15) throw new Error('Informe um número válido com DDI e DDD (somente dígitos).');
  return number;
}

export async function askPairingNumber() {
  if (process.env.PAIRING_NUMBER?.trim()) return normalizePairingNumber(process.env.PAIRING_NUMBER);
  if (!stdin.isTTY) throw new Error('Terminal interativo necessário. Configure PAIRING_NUMBER no .env se estiver executando sem terminal.');
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const value = await rl.question('Digite o número do WhatsApp com DDI e DDD (ex.: 5598999999999): ');
    return normalizePairingNumber(value);
  } finally {
    rl.close();
  }
}

export function formatPairingCode(code) {
  return String(code).replace(/\s|-/g, '').match(/.{1,4}/g)?.join('-') || String(code);
}

import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { config } from './config.js';
import { commands } from './commands/index.js';
import { createRegistry } from './core/registry.js';
import { handleMessage } from './core/handler.js';
const logger = P({ level: config.logLevel });
const registry = createRegistry(commands);
let reconnectTimer;
async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessions/whatsapp');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ auth: state, version, logger, printQRInTerminal: false, markOnlineOnConnect: false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) await handleMessage(sock, msg, registry, config, logger);
  });
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) { console.log('Escaneie o QR no WhatsApp > Aparelhos conectados:'); qrcode.generate(qr, { small: true }); }
    if (connection === 'open') logger.info('Vizzabot V5 conectado');
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        logger.error('Sessão encerrada. Faça novo pareamento; verifique a pasta sessions.');
      } else {
        logger.warn({ status }, 'Desconectado; tentando novamente em 5s');
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => connect().catch(err => logger.error({ err }, 'Reconexão falhou')), 5000);
      }
    }
  });
}
connect().catch(err => { logger.error({ err }, 'Falha na inicialização'); process.exitCode = 1; });

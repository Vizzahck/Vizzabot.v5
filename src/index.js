import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import P from 'pino';
import { askPairingNumber, formatPairingCode } from './core/pairing.js';
import { config } from './config.js';
import { commands } from './commands/index.js';
import { createRegistry } from './core/registry.js';
import { handleMessage } from './core/handler.js';
import { handleGroupParticipants } from './core/welcome.js';
import { openDatabase } from './database/index.js';
const logger = P({ level: config.logLevel });
const registry = createRegistry(commands);
const store = openDatabase();
let reconnectTimer;
let reconnectAttempts = 0;
let currentSocket;
let stopping = false;
async function connect() {
  if (stopping) return;
  const { state, saveCreds } = await useMultiFileAuthState('./sessions/whatsapp');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ auth: state, version, logger, printQRInTerminal: false, markOnlineOnConnect: false });
  currentSocket = sock;
  let pairingRequested = false;
  let pairingCodeShown = false;
  sock.ev.on('creds.update', () => saveCreds().catch(err => logger.error({ err }, 'Falha ao salvar sessão')));
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      handleMessage(sock, msg, registry, config, logger, store).catch(err => logger.error({ err }, 'Falha ao tratar mensagem'));
    }
  });
  sock.ev.on('group-participants.update', event => {
    handleGroupParticipants(sock, event, store, logger).catch(err => logger.error({ err }, 'Falha em evento de grupo'));
  });
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (!state.creds.registered && qr && !pairingRequested && !stopping) {
      pairingRequested = true;
      void (async () => {
        try {
          const phone = await askPairingNumber();
          const code = await sock.requestPairingCode(phone);
          pairingCodeShown = true;
          console.log('\n========================================');
          console.log('CÓDIGO DE VINCULAÇÃO: ' + formatPairingCode(code));
          console.log('WhatsApp > Aparelhos conectados > Conectar aparelho >');
          console.log('Conectar com número de telefone > Digite o código acima.');
          console.log('========================================\n');
        } catch (err) {
          logger.error({ err }, 'Falha ao solicitar código de pareamento');
          console.error('Não foi possível gerar o código. Verifique o número e reinicie o bot.');
        }
      })();
    }
    if (connection === 'open') {
      reconnectAttempts = 0;
      if (pairingCodeShown) console.log('WhatsApp vinculado com sucesso.');
      logger.info('Vizzabot V5 conectado');
    }
    if (connection === 'close' && !stopping) {
      const status = lastDisconnect?.error?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        logger.error('Sessão encerrada. Faça novo pareamento; verifique a pasta sessions.');
        return;
      }
      const delay = Math.min(60000, 5000 * (2 ** Math.min(reconnectAttempts++, 4)));
      logger.warn({ status, delay }, 'Desconectado; reconexão agendada');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => connect().catch(err => logger.error({ err }, 'Reconexão falhou')), delay);
    }
  });
}
async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearTimeout(reconnectTimer);
  try { currentSocket?.ws?.close(); } catch (err) { logger.warn({ err }, 'Erro ao fechar socket'); }
  store.close();
  logger.info('Vizzabot encerrado');
}
process.once('SIGINT', () => { shutdown().finally(() => process.exit(0)); });
process.once('SIGTERM', () => { shutdown().finally(() => process.exit(0)); });
connect().catch(err => { logger.error({ err }, 'Falha na inicialização'); process.exitCode = 1; store.close(); });

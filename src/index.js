import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import P from 'pino';
import { terminalStream, terminalBanner } from './core/terminal.js';
import { askPairingNumber, formatPairingCode } from './core/pairing.js';
import { config } from './config.js';
import { commands } from './commands/index.js';
import { createRegistry } from './core/registry.js';
import { handleMessage } from './core/handler.js';
import { trackOutgoingMessages } from './core/outgoing.js';
import { handleGroupParticipants } from './core/welcome.js';
import { openDatabase } from './database/index.js';
const logger = P({ level: config.logLevel }, terminalStream());
const registry = createRegistry(commands);
const store = openDatabase();
terminalBanner({name:config.name,ownerName:config.ownerName,ownerNumbers:config.owners,prefix:config.prefix,commands:commands.length});
let reconnectTimer;
let reconnectAttempts = 0;
let currentSocket;
let stopping = false;
let pairingNumber;
let pairingAttempt = 0;
let pairingSessionFailed = false;
async function connect() {
  if (stopping) return;
  const { state, saveCreds } = await useMultiFileAuthState('./sessions/whatsapp');
  if (!state.creds.registered && !pairingNumber) {
    pairingNumber = await askPairingNumber();
    console.log('Número de pareamento: ' + pairingNumber.slice(0, 4) + '*****' + pairingNumber.slice(-2));
  }
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ auth: state, version, logger, printQRInTerminal: false, markOnlineOnConnect: false, connectTimeoutMs: 60000, defaultQueryTimeoutMs: 90000, keepAliveIntervalMs: 30000 });
  currentSocket = sock;
  const sentIds = trackOutgoingMessages(sock);
  const seenMessageIds = new Set();
  let inboundCount = 0;
  let decryptedCount = 0;
  let pairingRequested = false;
  let pairingCodeShown = false;
  sock.ev.on('creds.update', () => saveCreds().catch(err => logger.error({ err }, 'Falha ao salvar sessão')));
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (currentSocket !== sock || stopping) return;
    inboundCount += messages.length;
    if (config.activityMonitor) logger.info({ count: messages.length, type }, 'WhatsApp entregou lote de mensagens ao bot');
    if (type !== 'notify' && type !== 'append') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      decryptedCount++;
      if (type === 'append' && !msg.key?.fromMe) continue;
      const identity = [msg.key?.remoteJid, msg.key?.participant, msg.key?.id].join(':');
      if (msg.key?.id && seenMessageIds.has(identity)) continue;
      if (msg.key?.id) {
        seenMessageIds.add(identity);
        if (seenMessageIds.size > 2000) seenMessageIds.delete(seenMessageIds.values().next().value);
      }
      handleMessage(sock, msg, registry, config, logger, store, sentIds).catch(err => logger.error({ err }, 'Falha ao tratar mensagem'));
    }
  });
  sock.ev.on('group-participants.update', event => {
    handleGroupParticipants(sock, event, store, logger).catch(err => logger.error({ err }, 'Falha em evento de grupo'));
  });
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (currentSocket !== sock || stopping) return;
    if (!state.creds.registered && qr && !pairingRequested && !stopping && !pairingSessionFailed) {
      pairingRequested = true;
      void (async () => {
        try {
          // Aguardar brevemente a inicialização do socket antes de solicitar o código.
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (stopping || currentSocket !== sock || pairingSessionFailed) return;
          const code = await sock.requestPairingCode(pairingNumber);
          if (stopping || currentSocket !== sock || pairingSessionFailed) return;
          pairingCodeShown = true;
          pairingAttempt += 1;
          console.log('\n========================================');
          console.log('NOVO CÓDIGO DE VINCULAÇÃO: ' + formatPairingCode(code));
          console.log('WhatsApp > Aparelhos conectados > Conectar aparelho >');
          console.log('Conectar com número de telefone > Digite o código NOVO.');
          console.log('Não compartilhe o código com ninguém.');
          console.log('========================================\n');
        } catch (err) {
          logger.error({ err }, 'Falha ao solicitar código de pareamento');
          console.error('Não foi possível gerar o código. Confira a conexão e reinicie.');
        }
      })();
    }
    if (connection === 'open') {
      reconnectAttempts = 0;
      pairingSessionFailed = false;
      if (pairingCodeShown) console.log('WhatsApp vinculado com sucesso.');
      logger.info('Vizzabot V5 conectado');
      logger.info({ allowPrivate: config.allowPrivate, allowGroups: config.allowGroups, activityMonitor: config.activityMonitor }, 'Diagnóstico de recepção ativo; envie !ping de outro número');
      setTimeout(() => { if (currentSocket !== sock || stopping) return; logger.info({ inboundCount, decryptedCount }, `Diagnóstico: ${inboundCount} recebidas, ${decryptedCount} descriptografadas`); }, 30000).unref?.();
    }
    if (connection === 'close' && !stopping) {
      currentSocket = undefined;
      const status = lastDisconnect?.error?.output?.statusCode;
      if (status === DisconnectReason.loggedOut || status === DisconnectReason.badSession) {
        pairingSessionFailed = true;
        logger.error({ status }, 'Sessão recusada ou encerrada. Pare o bot e use o comando de reiniciar pareamento (termux/reset-pairing.sh).');
        console.error('Pareamento não concluído. Para solicitar outro código, execute: bash termux/reset-pairing.sh');
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

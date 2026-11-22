import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path = './data/vizzabot.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  // Keep SQL migrations and economy methods as valid multiline JavaScript.
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_settings (
      jid TEXT PRIMARY KEY,
      antilink INTEGER NOT NULL DEFAULT 0,
      welcome INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      coins INTEGER NOT NULL DEFAULT 0 CHECK(coins >= 0),
      xp INTEGER NOT NULL DEFAULT 0 CHECK(xp >= 0),
      last_daily INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS mining_cooldowns (jid TEXT PRIMARY KEY, last_mine INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS warnings (
      group_jid TEXT NOT NULL,
      user_jid TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (group_jid, user_jid)
    );
  `);
  const mediaFlags = ['antisticker', 'antiaudio', 'antivideo', 'antiimagem'];
  const groupColumns = new Set(db.prepare('PRAGMA table_info(group_settings)').all().map(c => c.name));
  for (const flag of mediaFlags) {
    if (!groupColumns.has(flag)) db.exec('ALTER TABLE group_settings ADD COLUMN '+flag+' INTEGER NOT NULL DEFAULT 0');
  }
  const columns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!columns.includes('last_daily')) db.exec('ALTER TABLE users ADD COLUMN last_daily INTEGER NOT NULL DEFAULT 0');
  const insertUser = db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)');
  const getUser = db.prepare('SELECT * FROM users WHERE jid = ?');
  const updateDaily = db.prepare('UPDATE users SET coins=coins+?, xp=xp+10, last_daily=? WHERE jid=?');
  const getTop = db.prepare('SELECT jid, coins, xp FROM users ORDER BY coins DESC, jid ASC LIMIT ?');
  const getWarnings = db.prepare('SELECT count FROM warnings WHERE group_jid=? AND user_jid=?');
  const incrementWarning = db.prepare('INSERT INTO warnings(group_jid,user_jid,count) VALUES (?,?,1) ON CONFLICT(group_jid,user_jid) DO UPDATE SET count=count+1');
  return {
    db,
    group(jid) { return db.prepare('SELECT * FROM group_settings WHERE jid = ?').get(jid) || { jid, antilink: 0, welcome: 0, antisticker: 0, antiaudio: 0, antivideo: 0, antiimagem: 0 }; },
    setGroup(jid, key, enabled) {
      if (!['antilink', 'welcome', ...mediaFlags].includes(key)) throw new Error('Configuração inválida');
      db.prepare('INSERT OR IGNORE INTO group_settings(jid) VALUES (?)').run(jid);
      db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(enabled ? 1 : 0, jid);
    },
    user(jid) { insertUser.run(jid); return getUser.get(jid); },
    claimDaily(jid, now, amount, cooldown) {
      if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(cooldown) || cooldown <= 0) throw new Error('Parâmetros inválidos');
      db.exec('BEGIN IMMEDIATE');
      try {
        insertUser.run(jid);
        const user = getUser.get(jid);
        const remainingMs = Math.max(0, cooldown - (now - user.last_daily));
        if (user.last_daily > 0 && remainingMs > 0) {
          db.exec('COMMIT');
          return { ok: false, remainingMs, coins: user.coins };
        }
        updateDaily.run(amount, now, jid);
        const coins = getUser.get(jid).coins;
        db.exec('COMMIT');
        return { ok: true, remainingMs: 0, coins };
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    mine(jid, now, amount, cooldown) {
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Valor inválido');
      db.exec('BEGIN IMMEDIATE');
      try {
        insertUser.run(jid);
        const last = db.prepare('SELECT last_mine FROM mining_cooldowns WHERE jid=?').get(jid)?.last_mine || 0;
        const remainingMs = last ? Math.max(0, cooldown - (now-last)) : 0;
        if (remainingMs) { db.exec('COMMIT'); return {ok:false,remainingMs}; }
        db.prepare('INSERT INTO mining_cooldowns(jid,last_mine) VALUES (?,?) ON CONFLICT(jid) DO UPDATE SET last_mine=excluded.last_mine').run(jid,now);
        db.prepare('UPDATE users SET coins=coins+?,xp=xp+5 WHERE jid=?').run(amount,jid);
        const coins=getUser.get(jid).coins;
        db.exec('COMMIT');return {ok:true,coins};
      } catch(err) { db.exec('ROLLBACK'); throw err; }
    },
    transfer(from,to,amount) {
      if (from===to || !Number.isSafeInteger(amount) || amount<=0 || amount>1000000) return {ok:false,reason:'invalid'};
      db.exec('BEGIN IMMEDIATE');
      try {
        insertUser.run(from);insertUser.run(to);
        const debit=db.prepare('UPDATE users SET coins=coins-? WHERE jid=? AND coins>=?').run(amount,from,amount);
        if(!debit.changes){db.exec('COMMIT');return {ok:false,reason:'funds'};}
        db.prepare('UPDATE users SET coins=coins+? WHERE jid=?').run(amount,to);
        db.exec('COMMIT');return {ok:true,coins:getUser.get(from).coins};
      }catch(err){db.exec('ROLLBACK');throw err;}
    },
    topUsers(limit = 10) { return getTop.all(Math.min(50, Math.max(1, limit))); },
    warnings(group, user) { return getWarnings.get(group, user)?.count || 0; },
    warn(group, user) {
      incrementWarning.run(group, user);
      return this.warnings(group, user);
    },
    close() { db.close(); }
  };
}

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path = './data/vizzabot.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
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
    CREATE TABLE IF NOT EXISTS warnings (
      group_jid TEXT NOT NULL,
      user_jid TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (group_jid, user_jid)
    );
  `);
  // Compatibilidade com bancos criados antes do sistema de economia.
  const columns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!columns.includes('last_daily')) db.exec('ALTER TABLE users ADD COLUMN last_daily INTEGER NOT NULL DEFAULT 0');
  const insertUser = db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)');
  const getUser = db.prepare('SELECT * FROM users WHERE jid = ?');
  const daily = db.transaction((jid, now, amount, cooldown) => {
    insertUser.run(jid);
    const user = getUser.get(jid);
    const remainingMs = Math.max(0, cooldown - (now - user.last_daily));
    if (user.last_daily > 0 && remainingMs > 0) return { ok: false, remainingMs, coins: user.coins };
    db.prepare('UPDATE users SET coins=coins+?, xp=xp+10, last_daily=? WHERE jid=?').run(amount, now, jid);
    return { ok: true, remainingMs: 0, coins: getUser.get(jid).coins };
  });
  return {
    db,
    group(jid) { return db.prepare('SELECT * FROM group_settings WHERE jid = ?').get(jid) || { jid, antilink: 0, welcome: 0 }; },
    setGroup(jid, key, enabled) {
      if (!['antilink', 'welcome'].includes(key)) throw new Error('Configuração inválida');
      db.prepare('INSERT OR IGNORE INTO group_settings(jid) VALUES (?)').run(jid);
      db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(enabled ? 1 : 0, jid);
    },
    user(jid) { insertUser.run(jid); return getUser.get(jid); },
    claimDaily(jid, now, amount, cooldown) {
      if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(cooldown) || cooldown <= 0) throw new Error('Parâmetros inválidos');
      return daily(jid, now, amount, cooldown);
    },
    topUsers(limit = 10) { return db.prepare('SELECT jid, coins, xp FROM users ORDER BY coins DESC, jid ASC LIMIT ?').all(Math.min(50, Math.max(1, limit))); },
    warnings(group, user) { return db.prepare('SELECT count FROM warnings WHERE group_jid=? AND user_jid=?').get(group, user)?.count || 0; },
    warn(group, user) {
      db.prepare('INSERT INTO warnings(group_jid,user_jid,count) VALUES (?,?,1) ON CONFLICT(group_jid,user_jid) DO UPDATE SET count=count+1').run(group,user);
      return this.warnings(group, user);
    },
    close() { db.close(); }
  };
}

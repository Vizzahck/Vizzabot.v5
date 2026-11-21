import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path = './data/vizzabot.sqlite') {
  mkdirSync(dirname(path), { recursive: true });
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
      coins INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS warnings (
      group_jid TEXT NOT NULL,
      user_jid TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (group_jid, user_jid)
    );
  `);
  return {
    db,
    group(jid) { return db.prepare('SELECT * FROM group_settings WHERE jid = ?').get(jid) || { jid, antilink: 0, welcome: 0 }; },
    setGroup(jid, key, enabled) {
      if (!['antilink', 'welcome'].includes(key)) throw new Error('Configuração inválida');
      db.prepare('INSERT OR IGNORE INTO group_settings(jid) VALUES (?)').run(jid);
      db.prepare(`UPDATE group_settings SET ${key} = ? WHERE jid = ?`).run(enabled ? 1 : 0, jid);
    },
    user(jid) {
      db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(jid);
      return db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
    },
    warn(group, user) {
      db.prepare('INSERT INTO warnings(group_jid,user_jid,count) VALUES (?,?,1) ON CONFLICT(group_jid,user_jid) DO UPDATE SET count=count+1').run(group,user);
      return db.prepare('SELECT count FROM warnings WHERE group_jid=? AND user_jid=?').get(group,user).count;
    },
    close() { db.close(); }
  };
}

import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

const defaultDbPath = path.join(process.cwd(), "data", "monitor.db");

function ensureDbDirectory(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export async function openDatabase(dbPath = defaultDbPath) {
  ensureDbDirectory(dbPath);

  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initializeDatabase(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS keyword_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL,
      article_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wechat_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      article_uid TEXT NOT NULL,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      wx_id TEXT NOT NULL,
      publish_time INTEGER NOT NULL,
      publish_time_str TEXT NOT NULL,
      read_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      looking_count INTEGER NOT NULL DEFAULT 0,
      is_original INTEGER NOT NULL DEFAULT 0,
      classify TEXT NOT NULL DEFAULT '',
      ip_wording TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(search_id) REFERENCES keyword_searches(id)
    );

    CREATE TABLE IF NOT EXISTS xiaohongshu_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      note_id TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_avatar TEXT NOT NULL DEFAULT '',
      liked_count INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      collected_count INTEGER NOT NULL DEFAULT 0,
      shared_count INTEGER NOT NULL DEFAULT 0,
      note_type TEXT NOT NULL DEFAULT '',
      tag_title TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '',
      publish_time INTEGER NOT NULL,
      publish_time_str TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(search_id) REFERENCES keyword_searches(id)
    );

    CREATE TABLE IF NOT EXISTS topic_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      report_status TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      hot_insights TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(search_id) REFERENCES keyword_searches(id)
    );

    CREATE TABLE IF NOT EXISTS topic_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      brief TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES topic_reports(id)
    );
  `);
}

export async function getInitializedDatabase(dbPath?: string) {
  const db = await openDatabase(dbPath);
  await initializeDatabase(db);
  return db;
}

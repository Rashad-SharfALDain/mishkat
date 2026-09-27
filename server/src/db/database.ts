import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
let lastLoadedMtime = 0;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'institution.sqlite');

export async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const fileExists = fs.existsSync(DB_FILE);
  const fileMtime = fileExists ? fs.statSync(DB_FILE).mtimeMs : 0;

  if (dbInstance && (!fileExists || fileMtime <= lastLoadedMtime)) {
    return dbInstance;
  }

  if (fileExists) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
    lastLoadedMtime = fileMtime;
  } else {
    dbInstance = new SQL.Database();
    lastLoadedMtime = 0;
  }

  // Execute schema additively (CREATE TABLE IF NOT EXISTS preserves all existing data)
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.run(schemaSql);
  }

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, buffer);
    if (fs.existsSync(DB_FILE)) {
      lastLoadedMtime = fs.statSync(DB_FILE).mtimeMs;
    }
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error(`SQL Error in query "${sql}":`, error);
    throw error;
  }
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number }> {
  const db = await getDb();
  try {
    db.run(sql, params);
    let lastInsertRowid = 0;
    try {
      const res = db.exec("SELECT last_insert_rowid() as id");
      if (res && res[0] && res[0].values && res[0].values[0]) {
        lastInsertRowid = Number(res[0].values[0][0]) || 0;
      }
    } catch (_) {}
    saveDb();
    return { lastInsertRowid };
  } catch (error) {
    console.error(`SQL Error in run "${sql}":`, error);
    throw error;
  }
}


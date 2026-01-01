import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use DATA_PATH env var for production (Coolify volume), fallback to local for dev
const dataPath = process.env.DATA_PATH || join(__dirname, '../../../data');
const db = new Database(join(dataPath, 'attendance.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with schema
export function initDatabase() {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
    console.log('Database initialized successfully');
}

export default db;

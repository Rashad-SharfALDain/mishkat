/**
 * MISHKAT — MIGRATION 001: Legal Name Governance & Document Security
 * Phase 2.4-D2 Controlled Database Migration
 * Reference: SPEC-MISHKAT-P2.4-V2 & PHASE_2_4_C2_MIGRATION_SPEC_CORRECTED.md
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import initSqlJs, { Database } from 'sql.js';

const DB_PATH = path.join(process.cwd(), 'data', 'institution.sqlite');
const MIGRATION_VERSION = '001_p24_legal_name_documents';
const MIGRATION_NAME = 'p24_legal_name_and_documents';

export async function runMigration(): Promise<{ success: boolean; executionTimeMs: number; message: string }> {
  const startTime = Date.now();
  console.log(`[MIGRATION] Starting ${MIGRATION_VERSION}...`);

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}`);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db: Database = new SQL.Database(fileBuffer);

  try {
    // 1. Ensure schema_migrations exists
    db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'success'
      );
    `);

    // Check if already applied
    const checkStmt = db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
    checkStmt.bind([MIGRATION_VERSION]);
    const alreadyApplied = checkStmt.step();
    checkStmt.free();

    if (alreadyApplied) {
      console.log(`[MIGRATION] Version ${MIGRATION_VERSION} already applied. Skipping.`);
      return { success: true, executionTimeMs: 0, message: 'Already applied' };
    }

    // Begin atomic transaction
    db.run('BEGIN IMMEDIATE TRANSACTION;');

    // Helper to check column existence before adding
    const getColumns = (tableName: string): string[] => {
      const stmt = db.prepare(`PRAGMA table_info(${tableName});`);
      const cols: string[] = [];
      while (stmt.step()) {
        const obj = stmt.getAsObject() as { name: string };
        cols.push(obj.name);
      }
      stmt.free();
      return cols;
    };

    // 2. Add columns to applicants
    const appCols = getColumns('applicants');
    const appColumnsToAdd: [string, string][] = [
      ['legal_first_name', 'TEXT DEFAULT NULL'],
      ['legal_second_name', 'TEXT DEFAULT NULL'],
      ['legal_third_name', 'TEXT DEFAULT NULL'],
      ['legal_fourth_name', 'TEXT DEFAULT NULL'],
      ['legal_full_name', 'TEXT DEFAULT NULL'],
      ['normalized_legal_name', 'TEXT DEFAULT NULL'],
      ['legal_name_normalized', 'TEXT DEFAULT NULL'],
      ['name_verification_status', "TEXT DEFAULT 'pending'"],
      ['name_verified_from', 'TEXT DEFAULT NULL'],
      ['name_verified_by', 'TEXT DEFAULT NULL REFERENCES users(id)'],
      ['name_verified_at', 'DATETIME DEFAULT NULL'],
      ['name_verification_notes', 'TEXT DEFAULT NULL'],
      ['name_second_approver', 'TEXT DEFAULT NULL REFERENCES users(id)'],
      ['name_second_approved_at', 'DATETIME DEFAULT NULL']
    ];

    for (const [colName, colDef] of appColumnsToAdd) {
      if (!appCols.includes(colName)) {
        db.run(`ALTER TABLE applicants ADD COLUMN ${colName} ${colDef};`);
      }
    }

    // 3. Add columns to students
    const stuCols = getColumns('students');
    const stuColumnsToAdd: [string, string][] = [
      ['legal_first_name', 'TEXT DEFAULT NULL'],
      ['legal_second_name', 'TEXT DEFAULT NULL'],
      ['legal_third_name', 'TEXT DEFAULT NULL'],
      ['legal_fourth_name', 'TEXT DEFAULT NULL'],
      ['legal_full_name', 'TEXT DEFAULT NULL'],
      ['normalized_legal_name', 'TEXT DEFAULT NULL'],
      ['legal_name_normalized', 'TEXT DEFAULT NULL'],
      ['name_verification_status', "TEXT DEFAULT 'legacy_unverified'"],
      ['name_verified_from', 'TEXT DEFAULT NULL'],
      ['name_verified_by', 'TEXT DEFAULT NULL REFERENCES users(id)'],
      ['name_verified_at', 'DATETIME DEFAULT NULL'],
      ['name_verification_notes', 'TEXT DEFAULT NULL']
    ];

    for (const [colName, colDef] of stuColumnsToAdd) {
      if (!stuCols.includes(colName)) {
        db.run(`ALTER TABLE students ADD COLUMN ${colName} ${colDef};`);
      }
    }

    // 4. Create applicant_documents table
    db.run(`
      CREATE TABLE IF NOT EXISTS applicant_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        applicant_id TEXT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
        student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
        document_type TEXT NOT NULL,
        document_number TEXT,
        storage_key TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        is_encrypted INTEGER DEFAULT 1,
        iv_hex TEXT NOT NULL,
        auth_tag_hex TEXT NOT NULL,
        key_version INTEGER DEFAULT 1,
        upload_status TEXT DEFAULT 'uploaded',
        verification_status TEXT DEFAULT 'pending',
        rejection_reason TEXT,
        uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_applicant_docs_app_id ON applicant_documents(applicant_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_applicant_docs_student_id ON applicant_documents(student_id);');

    // 5. Create document_upload_sessions table (Zero raw token, token_hash only)
    db.run(`
      CREATE TABLE IF NOT EXISTS document_upload_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        applicant_id TEXT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        client_ip TEXT,
        expires_at DATETIME NOT NULL,
        max_uploads INTEGER DEFAULT 1,
        uploads_completed INTEGER DEFAULT 0,
        is_used INTEGER DEFAULT 0,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_upload_sessions_token_hash ON document_upload_sessions(token_hash);');
    db.run('CREATE INDEX IF NOT EXISTS idx_upload_sessions_applicant ON document_upload_sessions(applicant_id);');

    // 6. Create unique index on parent_student
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair 
      ON parent_student(parent_user_id, student_id);
    `);

    // 7. Safe Historical Backfill for applicants
    db.run(`
      UPDATE applicants 
      SET legal_full_name = student_name,
          name_verification_status = 'legacy_unverified'
      WHERE legal_full_name IS NULL;
    `);

    // 8. Safe Historical Backfill for students using COALESCE(u.name, a.student_name)
    db.run(`
      UPDATE students 
      SET legal_full_name = (
        SELECT COALESCE(u.name, a.student_name)
        FROM students s2
        LEFT JOIN users u ON s2.user_id = u.id
        LEFT JOIN applicants a ON s2.applicant_id = a.id
        WHERE s2.id = students.id
      ),
      name_verification_status = 'legacy_unverified'
      WHERE legal_full_name IS NULL;
    `);

    // 9. Record migration in schema_migrations
    const executionTimeMs = Date.now() - startTime;
    const migrationContent = fs.readFileSync(__filename, 'utf8');
    const checksum = crypto.createHash('sha256').update(migrationContent).digest('hex');

    const regStmt = db.prepare(`
      INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, status)
      VALUES (?, ?, ?, ?, 'success');
    `);
    regStmt.bind([MIGRATION_VERSION, MIGRATION_NAME, checksum, executionTimeMs]);
    regStmt.step();
    regStmt.free();

    // Commit transaction
    db.run('COMMIT;');

    // Persist changes to disk
    const exportedData = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(exportedData));

    console.log(`[MIGRATION] Migration ${MIGRATION_VERSION} completed successfully in ${executionTimeMs}ms.`);
    return { success: true, executionTimeMs, message: 'Migration executed and committed' };
  } catch (error) {
    try {
      db.run('ROLLBACK;');
    } catch (rbError) {
      console.error('[MIGRATION] Failed to rollback transaction:', rbError);
    }
    console.error(`[MIGRATION] Migration ${MIGRATION_VERSION} failed:`, error);
    throw error;
  }
}

// Allow standalone execution via `node` or `tsx`
if (require.main === module || process.argv[1]?.includes('001_p24_legal_name_documents')) {
  runMigration()
    .then((result) => {
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration execution failed with error:', err);
      process.exit(1);
    });
}

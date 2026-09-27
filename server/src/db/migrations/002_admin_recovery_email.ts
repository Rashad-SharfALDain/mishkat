/**
 * MISHKAT — MIGRATION 002: Admin Recovery Email Configuration
 * Dedicated additive migration for setting recovery_email on the primary admin account.
 * Preserves admin login (admin@mishkat.edu.sa) and configures 20rashad21@gmail.com as recovery destination.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import initSqlJs, { Database } from 'sql.js';

const DB_PATH = path.join(process.cwd(), 'data', 'institution.sqlite');
const MIGRATION_VERSION = '002_admin_recovery_email';
const MIGRATION_NAME = 'admin_recovery_email_configuration';

const TARGET_ADMIN_ID = 'cc6b2eed-a4e2-42a3-9295-74beb50d7e97';
const EXPECTED_ADMIN_EMAIL = 'admin@mishkat.edu.sa';
const TARGET_RECOVERY_EMAIL = '20rashad21@gmail.com';

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

    // 2. Check if already applied
    const checkStmt = db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
    checkStmt.bind([MIGRATION_VERSION]);
    const alreadyApplied = checkStmt.step();
    checkStmt.free();

    if (alreadyApplied) {
      console.log(`[MIGRATION] Version ${MIGRATION_VERSION} already applied. Skipping.`);
      return { success: true, executionTimeMs: 0, message: 'Already applied' };
    }

    // 3. Begin atomic transaction
    db.run('BEGIN IMMEDIATE TRANSACTION;');

    // 4. Check if recovery_email column exists in users
    const colsStmt = db.prepare('PRAGMA table_info(users);');
    const userColumns: string[] = [];
    while (colsStmt.step()) {
      const colObj = colsStmt.getAsObject() as { name: string };
      userColumns.push(colObj.name);
    }
    colsStmt.free();

    if (!userColumns.includes('recovery_email')) {
      console.log('[MIGRATION] Adding column recovery_email TEXT to users table...');
      db.run('ALTER TABLE users ADD COLUMN recovery_email TEXT;');
    } else {
      console.log('[MIGRATION] Column recovery_email already exists in users table.');
    }

    // 5. Pre-update verification: Admin user must match exact expected identifier and email
    const verifyStmt = db.prepare('SELECT id, name, email, role, status, recovery_email FROM users WHERE id = ?');
    verifyStmt.bind([TARGET_ADMIN_ID]);
    const userFound = verifyStmt.step();

    if (!userFound) {
      verifyStmt.free();
      throw new Error(`CRITICAL: Admin user with ID ${TARGET_ADMIN_ID} not found in database!`);
    }

    const adminUser = verifyStmt.getAsObject() as {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      recovery_email: string | null;
    };
    verifyStmt.free();

    if (adminUser.email !== EXPECTED_ADMIN_EMAIL) {
      throw new Error(`CRITICAL: Admin email mismatch! Expected ${EXPECTED_ADMIN_EMAIL}, got ${adminUser.email}`);
    }
    if (adminUser.role !== 'admin') {
      throw new Error(`CRITICAL: Admin role mismatch! Expected admin, got ${adminUser.role}`);
    }
    if (adminUser.status !== 'active') {
      throw new Error(`CRITICAL: Admin status mismatch! Expected active, got ${adminUser.status}`);
    }

    console.log(`[MIGRATION] Verified admin account: id=${adminUser.id}, email=${adminUser.email}, role=${adminUser.role}`);

    // 6. Update recovery_email for this specific admin only
    const updateStmt = db.prepare(`
      UPDATE users
      SET recovery_email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND email = ?;
    `);
    updateStmt.bind([TARGET_RECOVERY_EMAIL, TARGET_ADMIN_ID, EXPECTED_ADMIN_EMAIL]);
    updateStmt.step();
    updateStmt.free();

    console.log(`[MIGRATION] Updated recovery_email to ${TARGET_RECOVERY_EMAIL} for admin ID ${TARGET_ADMIN_ID}.`);

    // 7. Record in audit_logs
    const auditId = crypto.randomUUID();
    const auditMeta = JSON.stringify({
      admin_id: TARGET_ADMIN_ID,
      login_email: EXPECTED_ADMIN_EMAIL,
      old_recovery_email: adminUser.recovery_email || null,
      new_recovery_email: TARGET_RECOVERY_EMAIL,
      operation: 'UPDATE_ADMIN_RECOVERY_EMAIL',
    });

    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at)
      VALUES (?, ?, 'UPDATE_ADMIN_RECOVERY_EMAIL', 'users', ?, ?, '127.0.0.1', CURRENT_TIMESTAMP);
    `);
    auditStmt.bind([auditId, TARGET_ADMIN_ID, TARGET_ADMIN_ID, auditMeta]);
    auditStmt.step();
    auditStmt.free();

    // 8. Record migration in schema_migrations
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

    // 9. Commit atomic transaction
    db.run('COMMIT;');

    // 10. Persist changes to disk
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
if (require.main === module || process.argv[1]?.includes('002_admin_recovery_email')) {
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

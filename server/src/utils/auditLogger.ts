import { v4 as uuidv4 } from 'uuid';
import { run } from '../db/database';

export async function recordAudit(
  userId: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string,
  metadata: any,
  ipAddress?: string
): Promise<void> {
  try {
    const id = uuidv4();
    await run(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, userId || null, action, entityType, entityId, JSON.stringify(metadata), ipAddress || null]);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}

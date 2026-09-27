import { v4 as uuidv4 } from 'uuid';
import { run, query } from '../db/database';

export interface CreateNotificationParams {
  recipientUserId: string;
  recipientRole: string; // 'student' | 'parent' | 'admin' | 'supervisor'
  title: string;
  message: string;
  notificationType: 'absence' | 'late' | 'warning' | 'excuse_status' | 'observation' | 'evaluation';
  referenceEntityType?: 'attendance' | 'attendance_excuses' | 'evaluations';
  referenceEntityId?: string;
}

/**
 * Creates an in-platform notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams): Promise<string> {
  const id = uuidv4();
  await run(`
    INSERT INTO notifications (
      id, recipient_user_id, recipient_role, title, message,
      notification_type, reference_entity_type, reference_entity_id, is_read
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `, [
    id,
    params.recipientUserId,
    params.recipientRole,
    params.title,
    params.message,
    params.notificationType,
    params.referenceEntityType || null,
    params.referenceEntityId || null,
  ]);
  return id;
}

/**
 * Notifies all linked parents of a given student
 */
export async function notifyLinkedParents(
  studentId: string,
  notification: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientRole'>
): Promise<void> {
  const parents = await query<{ parent_user_id: string }>(`
    SELECT parent_user_id FROM parent_student
    WHERE student_id = ? AND status = 'active'
  `, [studentId]);

  for (const p of parents) {
    await createNotification({
      ...notification,
      recipientUserId: p.parent_user_id,
      recipientRole: 'parent',
    });
  }
}

/**
 * Notifies the student user directly
 */
export async function notifyStudent(
  studentId: string,
  notification: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientRole'>
): Promise<void> {
  const student = await query<{ user_id: string }>(`
    SELECT user_id FROM students WHERE id = ?
  `, [studentId]);

  if (student && student.length > 0 && student[0].user_id) {
    await createNotification({
      ...notification,
      recipientUserId: student[0].user_id,
      recipientRole: 'student',
    });
  }
}

import { ParentDashboardData, ChildSummary, Announcement, AdminUser, StudentActivity } from '../types';

const API_BASE = '/api';
const PARENT_TOKEN_KEY = 'mishkat_parent_token';

export function getParentToken(): string | null {
  return localStorage.getItem(PARENT_TOKEN_KEY);
}

export function setParentToken(token: string): void {
  localStorage.setItem(PARENT_TOKEN_KEY, token);
}

export function logoutParent(): void {
  localStorage.removeItem(PARENT_TOKEN_KEY);
}

function getParentAuthHeader(): Record<string, string> {
  const token = getParentToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Parent Login (accepts Phone or Email)
export async function loginParent(identifier: string, password: string): Promise<{
  token: string;
  user: AdminUser;
  parent: any;
}> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر تسجيل دخول ولي الأمر');
  }
  if (data.user.role !== 'parent') {
    throw new Error('هذا الحساب ليس مخصصًا لأولياء الأمور. يرجى استخدام البوابة المخصصة لصلاحيتك.');
  }
  setParentToken(data.token);
  return data;
}

// Verify parent session on app load
export async function verifyParentSession(): Promise<{ user: AdminUser; parent: any } | null> {
  const token = getParentToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getParentAuthHeader(),
    });
    if (!res.ok) {
      logoutParent();
      return null;
    }
    const data = await res.json();
    if (data.user.role !== 'parent') {
      logoutParent();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Change parent password
export async function changeParentPassword(current_password: string, new_password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getParentAuthHeader(),
    },
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'فشل تغيير كلمة المرور');
  }
  return data;
}

// Fetch Parent Dashboard
export async function fetchParentDashboard(): Promise<ParentDashboardData> {
  const res = await fetch(`${API_BASE}/parent/dashboard`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب بيانات لوحة تحكم ولي الأمر');
  }
  return res.json();
}

// Fetch Parent Profile
export async function fetchParentProfile(): Promise<any> {
  const res = await fetch(`${API_BASE}/parent/profile`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب الملف الشخصي');
  }
  const data = await res.json();
  return data.profile;
}

// Update Parent Profile Contact Info
export async function updateParentProfile(payload: { phone?: string; address?: string; email?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/parent/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getParentAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل تحديث بيانات الاتصال');
  }
}

// Fetch Parent Linked Students
export async function fetchParentStudents(): Promise<ChildSummary[]> {
  const res = await fetch(`${API_BASE}/parent/students`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب قائمة الأبناء');
  }
  const data = await res.json();
  return data.students;
}

// Fetch Child Profile
export async function fetchChildProfile(studentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/parent/students/${studentId}`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب ملف الطالب');
  }
  const data = await res.json();
  return data.student;
}

// Fetch Child Attendance Foundation
export async function fetchChildAttendance(studentId: string): Promise<{
  status_message: string;
  attendance_rate: number | null;
  summary: { present: number; absent: number; excused: number; total_sessions: number };
  records: any[];
}> {
  const res = await fetch(`${API_BASE}/parent/students/${studentId}/attendance`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب سجل الحضور');
  }
  return res.json();
}

// Fetch Child Educational Progress Foundation
export async function fetchChildProgress(studentId: string): Promise<{
  educational_track: string;
  current_level: string;
  status_message: string;
  categories: { name: string; description: string }[];
  scores: any[];
}> {
  const res = await fetch(`${API_BASE}/parent/students/${studentId}/progress`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب مؤشرات التقدم التعليمي');
  }
  return res.json();
}

// Fetch Child Activities (Read-only for parent)
export async function fetchChildActivities(studentId: string): Promise<{ activities: StudentActivity[] }> {
  const res = await fetch(`${API_BASE}/parent/students/${studentId}/activities`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب أنشطة الطالب');
  }
  return res.json();
}

// Fetch Parent Announcements
export async function fetchParentAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE}/parent/announcements`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب الإعلانات');
  }
  const data = await res.json();
  return data.announcements;
}

// ========================================================
// Phase 2.3: Parent Attendance, Child Excuses, Published Evaluations & Notifications
// ========================================================

export async function fetchChildAttendanceDetail(childId: string): Promise<{
  student: any;
  summary: any;
  records: any[];
}> {
  const res = await fetch(`${API_BASE}/attendance/student/${childId}`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب تفاصيل سجل حضور الابن');
  }
  return res.json();
}

export async function submitChildExcuse(payload: {
  student_id: string;
  session_id?: string;
  excuse_date: string;
  excuse_type: string;
  reason: string;
  document_url?: string;
}): Promise<{ message: string; excuse_id: string }> {
  const res = await fetch(`${API_BASE}/attendance/excuses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getParentAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر تقديم طلب العذر');
  }
  return data;
}

export async function fetchParentExcuses(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/attendance/excuses`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب سجل الأعذار');
  }
  const data = await res.json();
  return data.excuses || [];
}

export async function fetchChildEvaluations(childId: string, periodId?: string): Promise<{
  student: any;
  summary: any;
  evaluations: any[];
}> {
  const url = periodId
    ? `${API_BASE}/evaluations/student/${childId}?period_id=${periodId}`
    : `${API_BASE}/evaluations/student/${childId}`;
  const res = await fetch(url, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب التقييمات المعتمدة');
  }
  return res.json();
}

export async function fetchParentNotifications(): Promise<{ unread_count: number; notifications: any[] }> {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getParentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب الإشعارات');
  }
  return res.json();
}

export async function markParentNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getParentAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل تحديث حالة الإشعار');
}

export async function markAllParentNotificationsAsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: getParentAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل تحديث كافة الإشعارات');
}


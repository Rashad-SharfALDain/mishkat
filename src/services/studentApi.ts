import { StudentProfile, StudentActivity, Announcement, StudentDashboardData, AdminUser } from '../types';

const API_BASE = '/api';
const STUDENT_TOKEN_KEY = 'mishkat_student_token';

export function getStudentToken(): string | null {
  return localStorage.getItem(STUDENT_TOKEN_KEY);
}

export function setStudentToken(token: string): void {
  localStorage.setItem(STUDENT_TOKEN_KEY, token);
}

export function logoutStudent(): void {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
}

function getStudentAuthHeader(): Record<string, string> {
  const token = getStudentToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Student Login (accepts Student Number or Email)
export async function loginStudent(identifier: string, password: string): Promise<{
  token: string;
  user: AdminUser;
  student: any;
}> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر تسجيل دخول الطالب');
  }
  if (data.user.role !== 'student') {
    throw new Error('هذا الحساب مخصص للإدارة وليس للطلاب. يرجى استخدام بوابة الإدارة.');
  }
  setStudentToken(data.token);
  return data;
}

// Verify student session on load
export async function verifyStudentSession(): Promise<{ user: AdminUser; student: any } | null> {
  const token = getStudentToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getStudentAuthHeader(),
    });
    if (!res.ok) {
      logoutStudent();
      return null;
    }
    const data = await res.json();
    if (data.user.role !== 'student') {
      logoutStudent();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Change student password
export async function changeStudentPassword(current_password: string, new_password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getStudentAuthHeader(),
    },
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'فشل تغيير كلمة المرور');
  }
  return data;
}

// Fetch Student Dashboard
export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const res = await fetch(`${API_BASE}/student/dashboard`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب بيانات لوحة تحكم الطالب');
  }
  return res.json();
}

// Fetch Student Profile
export async function fetchStudentProfile(): Promise<StudentProfile> {
  const res = await fetch(`${API_BASE}/student/profile`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب الملف الشخصي');
  }
  const data = await res.json();
  return data.profile;
}

// Update Student Profile Contact Info
export async function updateStudentProfile(payload: { phone?: string; emergency_contact?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/student/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getStudentAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل تحديث بيانات الاتصال');
  }
}

// Fetch Student Educational Program
export async function fetchStudentProgram(): Promise<any> {
  const res = await fetch(`${API_BASE}/student/program`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب المسار التعليمي');
  }
  return res.json();
}

// Fetch Student Activities
export async function fetchStudentActivities(): Promise<StudentActivity[]> {
  const res = await fetch(`${API_BASE}/student/activities`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب الأنشطة');
  }
  const data = await res.json();
  return data.activities;
}

// Submit Student Activity
export async function submitStudentActivity(studentActivityId: string, submission_content: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/student/activities/${studentActivityId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getStudentAuthHeader(),
    },
    body: JSON.stringify({ submission_content }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'فشل تسليم النشاط');
  }
  return data;
}

// Fetch Student Announcements
export async function fetchStudentAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE}/student/announcements`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل جلب الإعلانات');
  }
  const data = await res.json();
  return data.announcements;
}

// ========================================================
// Phase 2.3: Student Attendance, Excuses, Published Evaluations & Notifications
// ========================================================

export async function fetchStudentAttendance(studentId: string): Promise<{
  student: any;
  summary: any;
  records: any[];
}> {
  const res = await fetch(`${API_BASE}/attendance/student/${studentId}`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب سجل الحضور');
  }
  return res.json();
}

export async function submitStudentExcuse(payload: {
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
      ...getStudentAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر تقديم طلب العذر');
  }
  return data;
}

export async function fetchStudentExcuses(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/attendance/excuses`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب سجل الأعذار');
  }
  const data = await res.json();
  return data.excuses || [];
}

export async function fetchStudentPublishedEvaluations(studentId: string): Promise<{
  student: any;
  summary: any;
  evaluations: any[];
}> {
  const res = await fetch(`${API_BASE}/evaluations/student/${studentId}`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب التقييمات المعتمدة');
  }
  return res.json();
}

export async function fetchStudentNotifications(): Promise<{ unread_count: number; notifications: any[] }> {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'تعذر جلب الإشعارات');
  }
  return res.json();
}

export async function markStudentNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل تحديث حالة الإشعار');
}

export async function markAllStudentNotificationsAsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: getStudentAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل تحديث كافة الإشعارات');
}


import { Applicant, ProgramTrack, FAQItem, InstitutionSettings, DashboardStats, ContactMessage, AdminUser, Student, Parent, LinkedStudentDetail, SystemUser, AuditLogItem, RolePermissionsMatrix, ApplicantDocument, DocumentUploadSession } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mishkat_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSettings(): Promise<InstitutionSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('فشل جلب إعدادات المؤسسة');
  const data = await res.json();
  return data.settings;
}

export async function updateSettings(settings: Partial<InstitutionSettings>): Promise<void> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل تحديث الإعدادات');
  }
}

export async function fetchPrograms(): Promise<ProgramTrack[]> {
  const res = await fetch(`${API_BASE}/programs`);
  if (!res.ok) throw new Error('فشل جلب المسارات التعليمية');
  const data = await res.json();
  return data.programs;
}

export async function fetchFAQs(): Promise<FAQItem[]> {
  const res = await fetch(`${API_BASE}/faq`);
  if (!res.ok) throw new Error('فشل جلب الأسئلة الشائعة');
  const data = await res.json();
  return data.faqs;
}

export async function submitApplication(payload: any): Promise<{ application_number: string; applicant_id?: string; message: string }> {
  const res = await fetch(`${API_BASE}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ أثناء إرسال طلب التسجيل');
  }
  return data;
}

export async function submitContact(payload: any): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر إرسال الرسالة');
  }
  return data;
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'فشل تسجيل الدخول');
  }
  localStorage.setItem('mishkat_admin_token', data.token);
  return data;
}

export async function verifyAdminSession(): Promise<AdminUser | null> {
  const token = localStorage.getItem('mishkat_admin_token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      localStorage.removeItem('mishkat_admin_token');
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem('mishkat_admin_token');
}

export async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'فشل تغيير كلمة المرور');
  }
  return data;
}

export async function fetchAdminDashboard(): Promise<{ stats: DashboardStats; recentApplicants: any[] }> {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب بيانات لوحة التحكم');
  return res.json();
}

export async function fetchAdminApplicants(status?: string, search?: string): Promise<Applicant[]> {
  const params = new URLSearchParams();
  if (status && status !== 'الكل') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/admin/applicants?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب قائمة المتقدمين');
  const data = await res.json();
  return data.applicants;
}

export async function fetchApplicantDetail(id: string): Promise<{ applicant: Applicant; payment?: any; existing_student?: any }> {
  const res = await fetch(`${API_BASE}/admin/applicants/${id}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب تفاصيل المتقدم');
  return res.json();
}

export async function updateApplicantStatus(
  id: string,
  status?: string,
  internal_notes?: string,
  legalParts?: {
    legal_first_name?: string;
    legal_second_name?: string;
    legal_third_name?: string;
    legal_fourth_name?: string;
  }
): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/applicants/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      status,
      internal_notes,
      ...(legalParts || {}),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'فشل تحديث بيانات الطلب');
  }
}

export async function verifyApplicantLegalName(
  id: string,
  verified_from: string = 'national_id',
  notes?: string
): Promise<{ success: boolean; message: string; name_verification_status: string }> {
  const res = await fetch(`${API_BASE}/admin/applicants/${id}/verify-name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ verified_from, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل توثيق الاسم القانوني');
  return data;
}

export async function verifyStudentLegalName(
  id: string,
  verified_from: string = 'national_id',
  notes?: string
): Promise<{ success: boolean; message: string; name_verification_status: string }> {
  const res = await fetch(`${API_BASE}/admin/students/${id}/verify-name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ verified_from, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل توثيق الاسم القانوني للطالب');
  return data;
}

export async function fetchAdminMessages(): Promise<ContactMessage[]> {
  const res = await fetch(`${API_BASE}/admin/messages`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب رسائل التواصل');
  const data = await res.json();
  return data.messages;
}

export async function updateMessageStatus(id: string, status: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/messages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('فشل تحديث حالة الرسالة');
}

// ==========================================
// PHASE 2.4-E2 — SECURE DOCUMENT UPLOAD APIS
// ==========================================

export async function createDocumentUploadSession(applicantId: string): Promise<DocumentUploadSession> {
  const res = await fetch(`${API_BASE}/documents/upload-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_id: applicantId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل إنشاء جلسة رفع الوثائق');
  return data;
}

export async function uploadIdentityDocument(
  applicantId: string,
  uploadToken: string,
  documentType: string,
  file: File,
  documentNumber?: string
): Promise<ApplicantDocument> {
  const formData = new FormData();
  formData.append('applicant_id', applicantId);
  formData.append('upload_token', uploadToken);
  formData.append('document_type', documentType);
  if (documentNumber) {
    formData.append('document_number', documentNumber);
  }
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      'x-upload-token': uploadToken,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل رفع الوثيقة');
  return data.document;
}

export async function fetchApplicantDocumentsStatus(
  applicantId: string,
  uploadToken?: string
): Promise<ApplicantDocument[]> {
  const headers: Record<string, string> = {};
  if (uploadToken) {
    headers['x-upload-token'] = uploadToken;
  }
  const token = localStorage.getItem('mishkat_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/documents/applicant/${applicantId}/status`, { headers });
  if (!res.ok) throw new Error('فشل جلب حالة وثائق المتقدم');
  const data = await res.json();
  return data.documents || [];
}

export async function fetchAdminApplicantDocuments(applicantId: string): Promise<ApplicantDocument[]> {
  const res = await fetch(`${API_BASE}/admin/applicants/${applicantId}/documents`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب قائمة وثائق المتقدم');
  const data = await res.json();
  return data.documents || [];
}

export async function downloadAdminDocument(documentId: number, originalFilename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/documents/${documentId}/download`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'تعذر تنزيل الوثيقة (مقتصر على Strict Admin)');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = originalFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function verifyApplicantLegalName(
  applicantId: string,
  action: 'verify' | 'reject' | 'correction_requested',
  notes?: string,
  verifiedFrom?: string
): Promise<{
  success: boolean;
  message: string;
  name_verification_status: string;
  verified_by: string;
  verified_at: string;
}> {
  const res = await fetch(`${API_BASE}/admin/applicants/${applicantId}/verify-name`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      notes,
      verified_from: verifiedFrom,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'فشل اتخاذ قرار التحقق من الاسم');
  }
  return res.json();
}


// ==========================================
// PHASE 2.1 — ADMIN STUDENT MANAGEMENT APIS
// ==========================================

export async function fetchAdminStudents(search?: string, status?: string, track?: string): Promise<Student[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'الكل') params.append('status', status);
  if (track && track !== 'الكل') params.append('track', track);

  const res = await fetch(`${API_BASE}/admin/students?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب قائمة الطلاب');
  const data = await res.json();
  return data.students;
}

export async function fetchAdminStudentDetail(id: string): Promise<{ student: any; activity_stats: any }> {
  const res = await fetch(`${API_BASE}/admin/students/${id}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب تفاصيل ملف الطالب');
  return res.json();
}

export async function createStudentFromApplicant(applicantId: string): Promise<{
  success: boolean;
  message: string;
  student: any;
  credentials: {
    identifier: string;
    email: string;
    temporary_password: string;
    must_change_password: boolean;
  };
}> {
  const res = await fetch(`${API_BASE}/admin/students/from-applicant/${applicantId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر إنشاء حساب الطالب');
  }
  return data;
}

export async function updateAdminStudent(id: string, payload: any): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/students/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل تحديث بيانات الطالب');
  }
}

export async function resetAdminStudentAccess(id: string): Promise<{ temporary_password: string; student_number: string }> {
  const res = await fetch(`${API_BASE}/admin/students/${id}/reset-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر إعادة تعيين كلمة المرور');
  }
  return data;
}

// ----------------------------------------------------
// Admin Parent Management API Functions (Phase 2.2)
// ----------------------------------------------------

export async function fetchAdminParents(search?: string, status?: string): Promise<Parent[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'الكل') params.append('status', status);

  const res = await fetch(`${API_BASE}/admin/parents?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب قائمة أولياء الأمور');
  const data = await res.json();
  return data.parents;
}

export async function fetchAdminParentDetail(id: string): Promise<{ parent: Parent; linked_students: LinkedStudentDetail[] }> {
  const res = await fetch(`${API_BASE}/admin/parents/${id}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب تفاصيل ولي الأمر');
  return res.json();
}

export async function createAdminParent(payload: {
  full_name: string;
  phone: string;
  email?: string;
  relationship?: string;
  address?: string;
  national_id?: string;
  student_id?: string;
}): Promise<{
  success: boolean;
  message: string;
  parent: any;
  credentials: {
    identifier: string;
    email: string;
    temporary_password: string;
    must_change_password: boolean;
  };
}> {
  const res = await fetch(`${API_BASE}/admin/parents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر إنشاء حساب ولي الأمر');
  }
  return data;
}

export async function createAdminParentFromApplicant(applicantId: string): Promise<{
  success: boolean;
  message: string;
  is_new_account: boolean;
  parent: any;
  credentials?: {
    identifier: string;
    temporary_password: string;
    must_change_password: boolean;
  } | null;
}> {
  const res = await fetch(`${API_BASE}/admin/parents/from-applicant/${applicantId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر تفعيل حساب ولي الأمر من بيانات المتقدم');
  }
  return data;
}

export async function linkStudentToParent(
  parentId: string,
  student_id: string,
  relationship?: string,
  is_primary?: boolean
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/parents/${parentId}/link-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ student_id, relationship, is_primary }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر ربط الطالب بولي الأمر');
  }
  return data;
}

export async function unlinkStudentFromParent(parentId: string, studentId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/parents/${parentId}/link-student/${studentId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر فك ارتباط الطالب');
  }
  return data;
}

export async function updateAdminParent(id: string, payload: any): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/parents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'فشل تحديث بيانات ولي الأمر');
  }
}

export async function resetAdminParentAccess(id: string): Promise<{ temporary_password: string; identifier: string }> {
  const res = await fetch(`${API_BASE}/admin/parents/${id}/reset-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر إعادة تعيين كلمة المرور');
  }
  return data;
}

// ========================================================
// Phase 2.3: Attendance & Sessions Services
// ========================================================

export async function fetchSessions(filters?: { date?: string; program_id?: string; status?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.program_id) params.append('program_id', filters.program_id);
  if (filters?.status) params.append('status', filters.status);

  const res = await fetch(`${API_BASE}/attendance/sessions?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب قائمة الجلسات واللقاءات');
  const data = await res.json();
  return data.sessions || [];
}

export async function createSession(payload: {
  program_id?: string;
  title: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/attendance/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر جدولة اللقاء');
  return data.session;
}

export async function fetchSessionDetails(id: string): Promise<{ session: any; students: any[] }> {
  const res = await fetch(`${API_BASE}/attendance/sessions/${id}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب تفاصيل الجلسة');
  return res.json();
}

export async function recordAttendance(
  sessionId: string,
  records: { student_id: string; status: string; notes?: string }[]
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/attendance/sessions/${sessionId}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ records }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر رصد سجل الحضور');
  return data;
}

export async function fetchStudentAttendanceHistory(studentId: string): Promise<{
  student: any;
  summary: any;
  records: any[];
}> {
  const res = await fetch(`${API_BASE}/attendance/student/${studentId}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب سجل حضور الطالب');
  return res.json();
}

export async function fetchAdminExcuses(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/attendance/excuses`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب طلبات الأعذار');
  const data = await res.json();
  return data.excuses || [];
}

export async function reviewExcuse(
  id: string,
  review_status: 'approved' | 'rejected',
  reviewer_notes?: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/attendance/excuses/${id}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ review_status, reviewer_notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر مراجعة طلب العذر');
  return data;
}

// ========================================================
// Phase 2.3: Educational Evaluations Services
// ========================================================

export async function fetchEvaluationPeriods(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/evaluations/periods`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب فترات التقييم');
  const data = await res.json();
  return data.periods || [];
}

export async function createEvaluationPeriod(payload: {
  academic_year: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/evaluations/periods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر إنشاء فترة التقييم');
  return data.period;
}

export async function fetchEvaluationDimensions(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/evaluations/dimensions`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب محاور التقييم');
  const data = await res.json();
  return data.dimensions || [];
}

export async function fetchStudentEvaluationsAdmin(studentId: string, periodId?: string): Promise<{
  student: any;
  summary: any;
  evaluations: any[];
}> {
  const url = periodId
    ? `${API_BASE}/evaluations/student/${studentId}?period_id=${periodId}`
    : `${API_BASE}/evaluations/student/${studentId}`;
  const res = await fetch(url, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب تقييمات الطالب');
  return res.json();
}

export async function saveStudentEvaluation(
  studentId: string,
  payload: {
    period_id: string;
    dimension_id: string;
    qualitative_rating?: string | null;
    numerical_score?: number | null;
    supervisor_notes?: string | null;
    evaluation_status?: 'draft' | 'submitted' | 'published';
  }
): Promise<{ message: string; evaluation_id: string }> {
  const res = await fetch(`${API_BASE}/evaluations/student/${studentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر حفظ التقييم');
  return data;
}

export async function publishPeriodEvaluations(periodId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/evaluations/periods/${periodId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر نشر التقييمات');
  return data;
}

// ========================================================
// Phase 2.3: In-App Notifications Services
// ========================================================

export async function fetchNotifications(): Promise<{ unread_count: number; notifications: any[] }> {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب الإشعارات');
  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل تحديث حالة الإشعار');
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل تحديث كافة الإشعارات');
}

// ========================================================
// User Management & Permissions Services (ADMIN)
// ========================================================

export async function fetchAdminUsers(
  search: string = '',
  role: string = 'all',
  status: string = 'all'
): Promise<{ users: SystemUser[]; metrics: any }> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (role !== 'all') params.append('role', role);
  if (status !== 'all') params.append('status', status);

  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب قائمة المستخدمين');
  return res.json();
}

export async function fetchAdminUserDetail(id: string): Promise<{ user: SystemUser; linkedData: any }> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('تعذر جلب تفاصيل المستخدم');
  return res.json();
}

export async function createAdminUser(payload: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
  must_change_password?: boolean;
}): Promise<{ message: string; user: SystemUser }> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر إنشاء المستخدم');
  return data;
}

export async function updateAdminUser(
  id: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: 'active' | 'inactive';
  }
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل تحديث بيانات المستخدم');
  return data;
}

export async function toggleAdminUserStatus(id: string, status: 'active' | 'inactive'): Promise<{ message: string; status: string }> {
  const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر تغيير حالة المستخدم');
  return data;
}

export async function resetAdminUserPassword(
  id: string,
  new_password?: string,
  must_change_password?: boolean
): Promise<{ message: string; temporary_password?: string; must_change_password: boolean }> {
  const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ new_password, must_change_password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل إعادة تعيين كلمة المرور');
  return data;
}

export async function fetchPermissionsMatrix(): Promise<{ permissions_matrix: RolePermissionsMatrix }> {
  const res = await fetch(`${API_BASE}/admin/permissions`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب مصفوفة الصلاحيات');
  return res.json();
}

export async function fetchAuditLogs(limit: number = 100, action?: string): Promise<{ logs: AuditLogItem[] }> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (action) params.append('action', action);

  const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('فشل جلب سجل الرقابة والعمليات');
  return res.json();
}

// ========================================================
// Password Reset Services (Public)
// ========================================================

export async function requestForgotPassword(identifier: string, role?: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر إرسال طلب استعادة كلمة المرور');
  return data;
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; role?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
  return data;
}

export async function submitResetPassword(token: string, new_password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل إعادة تعيين كلمة المرور');
  return data;
}




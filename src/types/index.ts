export type ApplicantStatus = 'جديد' | 'قيد المراجعة' | 'مقبول' | 'مرفوض' | 'مكتمل';

export interface Applicant {
  id: string;
  application_number: string;
  student_name: string;
  legal_first_name?: string | null;
  legal_second_name?: string | null;
  legal_third_name?: string | null;
  legal_fourth_name?: string | null;
  legal_full_name?: string | null;
  normalized_legal_name?: string | null;
  name_verification_status?: 'legacy_unverified' | 'pending' | 'verified' | 'rejected' | 'correction_requested' | null;
  name_verified_from?: string | null;
  name_verified_by?: string | null;
  name_verified_at?: string | null;
  name_verification_notes?: string | null;
  name_second_approver?: string | null;
  name_second_approved_at?: string | null;
  date_of_birth: string;
  gender: string;
  grade: string;
  school: string;
  city: string;
  phone: string;
  email?: string;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email?: string;
  academic_level: string;
  interested_tracks: string[];
  motivation: string;
  skills?: string;
  leadership_experience?: string;
  status: ApplicantStatus;
  internal_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export type DocumentType = 'national_id' | 'passport' | 'family_card' | 'ninth_grade_cert';
export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface ApplicantDocument {
  id: number;
  applicant_id: string;
  student_id?: string | null;
  document_type: DocumentType | string;
  document_number?: string | null;
  original_filename: string;
  file_size: number;
  mime_type: string;
  file_hash?: string;
  is_encrypted?: boolean | number;
  upload_status: string;
  verification_status: DocumentVerificationStatus | string;
  rejection_reason?: string | null;
  uploaded_by?: string | null;
  verified_by?: string | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DocumentUploadSession {
  upload_token: string;
  applicant_id: string;
  expires_at: string;
  max_uploads: number;
  uploads_completed?: number;
  is_used?: boolean;
}

export interface ProgramTrack {
  id: string;
  title: string;
  description: string;
  category: 'sharia' | 'knowledge' | 'character' | 'leadership';
  icon: string;
  topics: string[];
  sort_order: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

export interface InstitutionSettings {
  institution_name: string;
  tagline: string;
  sub_tagline: string;
  registration_status: 'open' | 'closed';
  registration_fee: string;
  registration_fee_max: string;
  currency: string;
  eligible_grades: string;
  application_deadline: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  address: string;
  working_hours: string;
  donation_account_name: string;
  donation_iban: string;
  [key: string]: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status?: 'active' | 'inactive';
  must_change_password?: boolean;
  last_login_at?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'supervisor' | 'student' | 'parent';
  status: 'active' | 'inactive';
  must_change_password?: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  student_info?: {
    id: string;
    student_number: string;
    academic_status: string;
    educational_track: string;
  } | null;
  parent_info?: {
    id: string;
    relationship: string;
    linked_children_count: number;
  } | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata: any;
  ip_address?: string;
  created_at: string;
  actor?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface RolePermissionsMatrix {
  [role: string]: {
    roleNameAr: string;
    description: string;
    modules: Array<{
      category: string;
      permissions: Array<{
        key: string;
        label: string;
        granted: boolean;
      }>;
    }>;
  };
}

export interface DashboardStats {
  total: number;
  new: number;
  inReview: number;
  accepted: number;
  rejected: number;
  completed: number;
  studentsCount?: number;
}

export type AcademicStatus = 'نشط' | 'متوقف مؤقتًا' | 'متخرج' | 'منسحب' | 'غير نشط';

export interface Student {
  id: string;
  applicant_id?: string;
  user_id: string;
  student_number: string;
  student_name?: string;
  legal_first_name?: string | null;
  legal_second_name?: string | null;
  legal_third_name?: string | null;
  legal_fourth_name?: string | null;
  legal_full_name?: string | null;
  normalized_legal_name?: string | null;
  name_verification_status?: 'legacy_unverified' | 'pending' | 'verified' | 'rejected' | 'correction_requested' | null;
  name_verified_by?: string | null;
  name_verified_at?: string | null;
  admission_date: string;
  academic_status: AcademicStatus;
  current_grade: string;
  current_level: string;
  educational_track: string;
  emergency_contact?: string;
  profile_photo?: string;
  city?: string;
  school?: string;
  phone?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  user_email?: string;
  must_change_password?: boolean;
  created_at: string;
}

export interface StudentProfile {
  student_number: string;
  student_name: string;
  academic_status: AcademicStatus;
  current_grade: string;
  current_level: string;
  educational_track: string;
  admission_date: string;
  school: string;
  city: string;
  phone: string;
  email: string;
  guardian_name: string;
  guardian_relationship: string;
  emergency_contact: string;
  date_of_birth?: string;
  gender?: string;
}

export interface StudentActivity {
  student_activity_id: string;
  activity_id: string;
  title: string;
  description: string;
  activity_type: string;
  due_date: string;
  status: 'لم يبدأ' | 'قيد التنفيذ' | 'تم التسليم' | 'تم التقييم';
  submission_content?: string;
  submitted_at?: string;
  evaluation?: string;
  evaluator_notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: string;
  publish_date: string;
  created_at?: string;
}

export interface StudentDashboardData {
  student: {
    id: string;
    student_number: string;
    student_name: string;
    academic_status: AcademicStatus;
    current_grade: string;
    current_level: string;
    educational_track: string;
    admission_date: string;
  };
  program: ProgramTrack | null;
  stats: {
    activities_total: number;
    activities_completed: number;
    activities_pending: number;
    attendance_status: string;
    certificates_count: number;
  };
  announcements: Announcement[];
  recentActivities: StudentActivity[];
}

export interface Parent {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  national_id?: string;
  status: 'نشط' | 'غير نشط';
  children_count?: number;
  user_email?: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChildSummary {
  id: string;
  student_number: string;
  student_name: string;
  admission_date: string;
  academic_status: AcademicStatus;
  current_grade: string;
  current_level: string;
  educational_track: string;
  school?: string;
  city?: string;
  guardian_relation: string;
  is_primary: number | boolean;
}

export interface ParentDashboardData {
  parent: {
    id: string;
    full_name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
    status: string;
  };
  children: ChildSummary[];
  announcements: Announcement[];
  stats: {
    children_count: number;
    attendance_status: string;
    evaluations_status: string;
  };
}

export interface LinkedStudentDetail {
  relationship_id: string;
  relationship: string;
  is_primary: number;
  link_status: string;
  linked_at: string;
  student_id: string;
  student_number: string;
  academic_status: AcademicStatus;
  current_grade: string;
  educational_track: string;
  student_name: string;
  school?: string;
  city?: string;
}

// ========================================================
// Phase 2.3 Types: Attendance, Excuses, Hybrid Evaluations, Notifications
// ========================================================

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'مستأذن' | 'غياب بعذر';

export interface EducationalSession {
  id: string;
  program_id?: string | null;
  program_title?: string | null;
  title: string;
  session_date: string;
  start_time?: string | null;
  end_time?: string | null;
  supervisor_id?: string | null;
  supervisor_name?: string | null;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendance_records_count?: number;
  created_at?: string;
}

export interface AttendanceRecord {
  id?: string;
  attendance_id?: string;
  session_id?: string;
  student_id: string;
  student_number?: string;
  student_name?: string;
  educational_track?: string;
  status: AttendanceStatus;
  notes?: string | null;
  recorded_by?: string;
  recorded_at?: string;
  excuse_id?: string | null;
  session_title?: string;
  session_date?: string;
  start_time?: string;
  location?: string;
  excuse_status?: 'pending' | 'approved' | 'rejected';
  excuse_reason?: string;
}

export interface AttendanceSummary {
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  leave: number;
  discipline_rate: number;
  unexcused_absences: number;
  warning_triggered: boolean;
}

export interface AttendanceExcuse {
  id: string;
  student_id: string;
  session_id?: string | null;
  excuse_date: string;
  submitted_by_user_id: string;
  submitted_by_role: string;
  excuse_type: string;
  reason: string;
  document_url?: string | null;
  review_status: 'pending' | 'approved' | 'rejected';
  reviewer_notes?: string | null;
  reviewed_by?: string | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  student_name?: string;
  student_number?: string;
  session_title?: string;
}

export interface EvaluationPeriod {
  id: string;
  academic_year: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed' | 'archived';
  created_at?: string;
}

export interface EvaluationDimension {
  id: string;
  dimension_name: string;
  weight: number;
  max_score: number;
  evaluation_mode: 'hybrid' | 'qualitative' | 'numerical';
  qualitative_scale: string[];
  sort_order: number;
  status: string;
}

export type QualitativeRating = 'ممتاز' | 'جيد جدًا' | 'جيد' | 'يحتاج متابعة';
export type EvaluationStatus = 'draft' | 'submitted' | 'published';

export interface StudentEvaluation {
  id: string;
  period_id: string;
  student_id: string;
  dimension_id: string;
  qualitative_rating?: QualitativeRating | string | null;
  numerical_score?: number | null;
  supervisor_notes?: string | null;
  evaluated_by?: string | null;
  evaluator_name?: string | null;
  evaluation_status: EvaluationStatus;
  dimension_name?: string;
  weight?: number;
  max_score?: number;
  sort_order?: number;
  period_name?: string;
  academic_year?: string;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationSummary {
  total_evaluations: number;
  overall_score: number | null;
  overall_rating: string | null;
  evaluation_mode: string;
}

export interface InAppNotification {
  id: string;
  recipient_user_id: string;
  recipient_role: string;
  title: string;
  message: string;
  notification_type: 'absence' | 'late' | 'warning' | 'excuse_status' | 'evaluation' | 'general';
  reference_entity_type?: string | null;
  reference_entity_id?: string | null;
  is_read: number;
  created_at: string;
  read_at?: string | null;
}



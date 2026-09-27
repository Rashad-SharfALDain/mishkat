-- Database Schema for Charitable Educational Institution (دار خيرية تعليمية)

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    recovery_email TEXT,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'supervisor', 'reviewer'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    must_change_password INTEGER DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applicants (
    id TEXT PRIMARY KEY,
    application_number TEXT UNIQUE NOT NULL, -- e.g. APP-2026-00001
    student_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    gender TEXT NOT NULL, -- 'ذكر', 'أنثى'
    grade TEXT NOT NULL, -- 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
    school TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    guardian_name TEXT NOT NULL,
    guardian_relationship TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    guardian_email TEXT,
    academic_level TEXT DEFAULT 'جيد جدًا',
    interested_tracks TEXT, -- JSON array of selected tracks
    motivation TEXT NOT NULL,
    skills TEXT,
    leadership_experience TEXT, -- 'نعم', 'لا' + details
    status TEXT NOT NULL DEFAULT 'جديد', -- 'جديد', 'قيد المراجعة', 'مقبول', 'مرفوض', 'مكتمل'
    internal_notes TEXT DEFAULT '',
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'sharia', 'knowledge', 'character', 'leadership'
    icon TEXT,
    topics TEXT, -- JSON array of topics
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications_programs (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applicants(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    application_id TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'waived', 'sponsored', 'paid'
    payment_type TEXT NOT NULL DEFAULT 'registration', -- 'registration', 'sponsorship', 'donation'
    payment_method TEXT, -- 'bank_transfer', 'electronic_pending'
    transaction_reference TEXT,
    notes TEXT,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faq (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'عام',
    sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published'
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'read', 'replied', 'archived'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- PHASE 2.1 — STUDENT & PARENT EDUCATIONAL PLATFORM
-- ========================================================

-- 1. Students Table (Linked to accepted applicant and user account)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    applicant_id TEXT UNIQUE,
    user_id TEXT UNIQUE NOT NULL,
    student_number TEXT UNIQUE NOT NULL, -- e.g. STU-2026-00001
    admission_date TEXT NOT NULL,
    academic_status TEXT NOT NULL DEFAULT 'نشط', -- 'نشط', 'متوقف مؤقتًا', 'متخرج', 'منسحب', 'غير نشط'
    current_grade TEXT,
    current_level TEXT DEFAULT 'المستوى الأول',
    educational_track TEXT,
    profile_photo TEXT,
    emergency_contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Announcements Foundation
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'all_students', -- 'all', 'all_students', 'parents', specific program
    status TEXT NOT NULL DEFAULT 'published', -- 'published', 'draft', 'archived'
    publish_date TEXT DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Educational Activities Foundation
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- 'واجب', 'مشروع قيمي', 'قراءة موجهة', 'مبادرة مجتمعية', 'ورشة تفاعلية'
    due_date TEXT,
    program_id TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
);

-- 4. Student Activities (Individual submissions & qualitative evaluations)
CREATE TABLE IF NOT EXISTS student_activities (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'لم يبدأ', -- 'لم يبدأ', 'قيد التنفيذ', 'تم التسليم', 'تم التقييم'
    submission_content TEXT,
    submitted_at DATETIME,
    evaluation TEXT,
    evaluator_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- 5. Parents Entity & Parent-Student Relationship (Phase 2.2)
CREATE TABLE IF NOT EXISTS parents (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    relationship TEXT DEFAULT 'ولي أمر', -- 'أب', 'أم', 'ولي أمر'
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    national_id TEXT,
    status TEXT NOT NULL DEFAULT 'نشط', -- 'نشط', 'غير نشط'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parent_student (
    id TEXT PRIMARY KEY,
    parent_user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    relationship TEXT NOT NULL, -- 'أب', 'أم', 'ولي أمر'
    is_primary INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 6. Learning Modules Architecture (Courses, Modules, Resources for Phase 2.3+)
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    program_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS course_modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'TEXT'
    resource_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

-- 7. Audit Logs Table (Administrative actions tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================================
-- PHASE 2.3 — ATTENDANCE & EDUCATIONAL EVALUATION PLATFORM
-- ========================================================

-- 1. الفترات والسنوات الأكاديمية (Evaluation & Academic Periods)
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id TEXT PRIMARY KEY,
    academic_year TEXT NOT NULL,         -- e.g. '2026-2027'
    period_name TEXT NOT NULL,           -- e.g. 'الفصل الدراسي الأول', 'الربع الأول'
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed', 'upcoming'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. أبعاد ومحاور التقييم القابلة للتخصيص (Evaluation Dimensions & Configuration)
CREATE TABLE IF NOT EXISTS evaluation_dimensions (
    id TEXT PRIMARY KEY,
    dimension_name TEXT NOT NULL,        -- 'العلوم الشرعية', 'العلوم والمعارف المعاصرة', ...
    evaluation_mode TEXT DEFAULT 'hybrid', -- 'qualitative', 'numerical', 'hybrid'
    weight REAL DEFAULT 20.0,            -- الوزن النسبي المئوي
    max_score REAL DEFAULT 100.0,        -- الدرجة القصوى في حال النمط الرقمي
    qualitative_scale TEXT,              -- JSON array: ['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة']
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. الجلسات واللقاءات التعليمية (Educational Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    program_id TEXT,                     -- مرتبط بمسار تعليمي
    title TEXT NOT NULL,                 -- عنوان اللقاء / الورشة
    session_date TEXT NOT NULL,          -- YYYY-MM-DD
    start_time TEXT,                     -- HH:MM
    end_time TEXT,                       -- HH:MM
    supervisor_id TEXT,                  -- المشرف المسؤول (users.id)
    location TEXT,                       -- القاعة أو رابط اللقاء
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. سجل الحضور والانضباط اليومي (Attendance Records)
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL,                -- 'حاضر', 'غائب', 'متأخر', 'مستأذن', 'غياب بعذر'
    recorded_by TEXT NOT NULL,           -- المعرف الذي قام بالرصد
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,                          -- ملاحظة المشرف أثناء الرصد
    excuse_id TEXT,                      -- رابط العذر المعتمد إن وجد
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 5. طلبات الأعذار والاستئذان الرسمية (Attendance Excuses)
CREATE TABLE IF NOT EXISTS attendance_excuses (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    session_id TEXT,                     -- الجلسة المرتبطة (إن حددت)
    excuse_date TEXT NOT NULL,           -- تاريخ الغياب/الاستئذان
    submitted_by_user_id TEXT NOT NULL,  -- معرف ولي الأمر أو الطالب مقدم الطلب
    submitted_by_role TEXT NOT NULL,     -- 'parent', 'student'
    excuse_type TEXT NOT NULL,           -- 'صحي', 'طارئ أسري', 'ارتباط مدرسي', 'أخرى'
    reason TEXT NOT NULL,                -- شرح العذر
    document_url TEXT,                   -- رابط التقرير الطبي أو المستند المؤيد
    review_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by TEXT,                    -- المشرف/الإداري المراجع
    reviewer_notes TEXT,                 -- سبب القبول أو الرفض
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. سجل التقييمات التربوية (Student Evaluations)
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    dimension_id TEXT NOT NULL,
    qualitative_rating TEXT,             -- 'ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة'
    numerical_score REAL,                -- الدرجة في حال النمط الرقمي
    supervisor_notes TEXT,               -- التوجيه والملاحظات التربوية النوعية
    evaluated_by TEXT NOT NULL,          -- المشرف الراصد
    evaluation_status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'published'
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE RESTRICT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (dimension_id) REFERENCES evaluation_dimensions(id) ON DELETE RESTRICT,
    FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 7. منظومة الإشعارات الداخلية (Internal Platform Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_user_id TEXT NOT NULL,
    recipient_role TEXT NOT NULL,        -- 'parent', 'student', 'admin', 'supervisor'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,     -- 'absence', 'late', 'warning', 'excuse_status', 'observation', 'evaluation'
    reference_entity_type TEXT,          -- 'attendance', 'attendance_excuses', 'evaluations'
    reference_entity_id TEXT,
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. طلبات استعادة كلمة المرور الآمنة لمرة واحدة (Password Resets)
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- الفهارس التراكمية لتحسين أداء الاستعلامات وعزل المعرفات
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(period_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);


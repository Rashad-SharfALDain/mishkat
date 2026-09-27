# PHASE 2.4-C MIGRATION PREFLIGHT & DRY-RUN REVIEW
## الفحص والمراجعة المعمارية والمحاكاة الجافة لملف الترحيل 001 — مؤسسة مِشكاة التربوية والتعليمية

**المرحلة:** Phase 2.4-C Migration Preflight & Dry-Run Review  
**تاريخ المراجعة:** 26 سبتمبر 2026  
**المرجعية الهندسية:** `SPEC-MISHKAT-P2.4-V2` و `PHASE_2_4_A_MIGRATION_READINESS_AUDIT.md` و `PHASE_2_4_MIGRATION_PLAN.md`  
**طبيعة المرحلة:** **مراجعة وتدقيق وفحص ساكن فقط (Review & Dry-Run Only — No Database Writes)**  
**القرار النهائي للبوابة:** **`CHANGES_REQUIRED`** (تعديلات ومواءمات تصميمية محددة قبل السماح بالتنفيذ)

---

## 1. Executive Summary (الملخص التنفيذي)
أُجريت هذه المراجعة المعمارية الدقيقة (Dry-Run Review) لتحليل كافة أوامر SQL والتحولات الهيكلية المقترحة في الترحيل:
`001_p24_legal_name_documents`
قبل السماح بتنفيذه على قاعدة البيانات الحالية `data/institution.sqlite`.

### أهم مخرجات الفحص والتدقيق:
1. **سلامة المخطط التراكمي:** كافة التعديلات المقترحة هي **تراكمية بحتة (Purely Additive)** ولا تتضمن أي حذف لأي جدول أو عمود قائم.
2. **اكتشافات هيكلية جوهرية في قاعدة البيانات الحالية:**
   - معرفات الجداول الأساسية (`applicants.id`, `students.id`, `users.id`) هي من نوع **`TEXT` (UUIDs)** وليست `INTEGER`. لذا يجب أن تكون كافة حقول الربط الخارجي (Foreign Keys) في الجداول الجديدة من نوع `TEXT`.
   - جدول الطلاب `students` **لا يحتوي على عمود باسم `name`**، بل يرتبط الاسم عبر `users.name` و `applicants.student_name`. وبالتالي فإن سكريبت الـ Backfill يجب أن يستعلم عن الاسم عبر الدمج (Join) وليس عبر استعلام مباشر.
3. **أمان قيد التفرد الأسري (`parent_student`):** أثبت الفحص البرمجي خلو كافة السجلات الـ 37 الحالية من أي تكرار (`0 duplicates`)، مما يجعل إضافة المؤشر الفريد `idx_parent_student_unique_pair` آمنة 100%.
4. **نزاهة الأسماء التاريخية:** 26 من أصل 29 متقدماً و 16 من أصل 17 طالباً مسجلون بأسماء ثلاثية، و 0 سجل يحتوي على اسم رباعي. لذا، فإن فرض حقول رباعية إلزامية أو اختلاق اسم رابع وهمي ممنوع منعاً باتاً؛ ويتم ترحيل الاسم الكامل التاريخي كما هو مع وسمه بـ `legacy_unverified` وإبقاء أجزاء الأسماء الأربعة فارغة (`NULL`).
5. **ملاحظة أمنية على رمز جلسة الرفع:** تخزين رمز الرفع `upload_token` بنصه الصريح يشكل خطراً أمنياً؛ ويجب تعديل التصميم لتخزين بصمة الرمز المشفرة `token_hash` (SHA-256).

---

## 2. Current Database Baseline (خط الأساس لسجلات قاعدة البيانات)
تمت قراءة أعداد السجلات عبر استعلامات `Read-Only` وتوثيق خط الأساس الثابت الذي يجب أن يبقى مطابقاً بعد أي عملية:

| اسم الجدول (`Table`) | عدد السجلات الحالي (`Baseline`) | حالة الأعمدة ونوع المعرف الأساسي (`PK Type`) |
|---|:---:|---|
| `users` | **58** | `id TEXT PRIMARY KEY` (UUID) |
| `students` | **17** | `id TEXT PRIMARY KEY`, `applicant_id TEXT`, `user_id TEXT` |
| `parents` | **37** | `id TEXT PRIMARY KEY`, `user_id TEXT` |
| `applicants` | **29** | `id TEXT PRIMARY KEY` (UUID), `student_name TEXT` |
| `parent_student` | **37** | `id TEXT PRIMARY KEY`, `parent_user_id TEXT`, `student_id TEXT` |
| `audit_logs` | **323** | `id INTEGER PRIMARY KEY AUTOINCREMENT` |
| `password_resets` | **11** | `id INTEGER PRIMARY KEY AUTOINCREMENT`, `token_hash TEXT` |
| `attendance` | **36** | `id TEXT PRIMARY KEY`, `student_id TEXT` |
| `evaluations` | **8** | `id TEXT PRIMARY KEY`, `student_id TEXT` |
| `notifications` | **225** | `id TEXT PRIMARY KEY`, `user_id TEXT` |
| `payments` | **26** | `id TEXT PRIMARY KEY` |
| `sessions` | **25** | `id TEXT PRIMARY KEY` |

---

## 3. Migration Objects (الكائنات المستهدفة بالترحيل 001)

يشمل الترحيل 001 العمليات الهيكلية التالية:
1. **تعديل جدول `applicants`:** إضافة 13 عموداً جديداً متعلقة بالاسم القانوني والتحقق البشري والاعتماد المزدوج.
2. **تعديل جدول `students`:** إضافة 9 أعمدة جديدة متعلقة بالاسم القانوني والتحقق المعتمد.
3. **إنشاء جدول `applicant_documents`:** جدول معزول لوثائق إثبات الهوية المشفرة وتتبع حالة التدقيق.
4. **إنشاء جدول `document_upload_sessions`:** جدول إدارة جلسات الرفع العامة المؤقتة والمؤمنة ضد هجمات التخمين.
5. **إنشاء المؤشر الفريد `idx_parent_student_unique_pair`:** قيد تفرد علاقة الأبوة والبنوة.
6. **إنشاء جدول `schema_migrations`:** جدول تتبع إصدارات وبصمات الترحيلات البرمجية.
7. **الترحيل التراكمي للبيانات التاريخية (Safe Backfill):** ضبط الأسماء التاريخية بحالة `legacy_unverified`.

---

## 4. applicants Changes (تحليل أعمدة المتقدمين)

| العمود المقترح | النوع (`Data Type`) | القيد (`Constraint`) | القيمة الافتراضية | التوافق مع SQLite |
|---|---|---|---|---|
| `legal_first_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_second_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_third_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_fourth_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_full_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `normalized_legal_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `name_verification_status` | `TEXT` | `NULL` | `'pending'` | متوافق 100% |
| `name_verified_from` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `name_verified_by` | `TEXT` | `NULL` (FK `users.id`) | `NULL` | متوافق (نوع المعرف TEXT) |
| `name_verified_at` | `DATETIME` | `NULL` | `NULL` | متوافق 100% |
| `name_verification_notes`| `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `name_second_approver` | `TEXT` | `NULL` (FK `users.id`) | `NULL` | متوافق (نوع المعرف TEXT) |
| `name_second_approved_at`| `DATETIME` | `NULL` | `NULL` | متوافق 100% |

- **سلامة العمود القديم `student_name`:** يبقى كما هو دون تعديل أو حذف، وتستمر الأنظمة الحالية في قراءته بسلاسة.

---

## 5. students Changes (تحليل أعمدة الطلاب)

| العمود المقترح | النوع (`Data Type`) | القيد (`Constraint`) | القيمة الافتراضية | التوافق مع SQLite |
|---|---|---|---|---|
| `legal_first_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_second_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_third_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_fourth_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `legal_full_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `normalized_legal_name` | `TEXT` | `NULL` | `NULL` | متوافق 100% |
| `name_verification_status` | `TEXT` | `NULL` | `'legacy_unverified'` | متوافق 100% |
| `name_verified_by` | `TEXT` | `NULL` (FK `users.id`) | `NULL` | متوافق (نوع المعرف TEXT) |
| `name_verified_at` | `DATETIME` | `NULL` | `NULL` | متوافق 100% |

- **أثر التغيير:** يمنح جدول الطلاب القدرة على تخزين الاسم القانوني المعتمد مباشرة دون الحاجة للدمج المستمر مع جداول أخرى، مع بقاء بيانات الطلاب الـ 17 سالمة تماماً.

---

## 6. applicant_documents (تحليل جدول الوثائق)

```sql
CREATE TABLE IF NOT EXISTS applicant_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applicant_id TEXT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL, -- 'national_id', 'birth_certificate', 'family_card', 'passport'
  document_number TEXT,
  storage_key TEXT NOT NULL UNIQUE, -- اسم الملف العشوائي على القرص (UUID)
  file_path TEXT NOT NULL, -- المسار النسبي الداخلي فقط: data/documents/<uuid>.enc
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT NOT NULL, -- بصمة SHA-256 للملف الأصلي للتحقق من النزاهة
  is_encrypted INTEGER DEFAULT 1,
  iv_hex TEXT NOT NULL, -- متجه تهيئة AES-GCM (12 bytes / 24 hex chars)
  auth_tag_hex TEXT NOT NULL, -- وسم مصادقة AES-GCM (16 bytes / 32 hex chars)
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
CREATE INDEX IF NOT EXISTS idx_applicant_docs_app_id ON applicant_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_docs_student_id ON applicant_documents(student_id);
```

### فحص الأمان ونزاهة المسارات:
- `storage_key` يستخدم UUIDv4 يمنع التصادم بنسبة 100%.
- `file_path` يخزن مساراً نسبياً فقط ولا يحتوي على مسارات النظام المطلقة (`C:\...`) أو روابط ويب.
- العلاقات الخارجية تستخدم `TEXT` لتطابق أنواع معرفات الجداول الأصلية.

---

## 7. document_upload_sessions (تحليل جدول جلسات الرفع المؤقتة)

### التعديل الأمني الإلزامي (Security Adjustment):
بدلاً من تخزين الرمز الصريح `upload_token` في قاعدة البيانات، يُخزن الهاش المشفر للرمز `token_hash` بنظام SHA-256 لمنع استغلال الرموز في حال تسريب القاعدة:

```sql
CREATE TABLE IF NOT EXISTS document_upload_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applicant_id TEXT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 للرمز المؤقت المرسل للعميل
  client_ip TEXT,
  expires_at DATETIME NOT NULL,
  max_uploads INTEGER DEFAULT 1,
  uploads_completed INTEGER DEFAULT 0,
  is_used INTEGER DEFAULT 0,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token_hash ON document_upload_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_applicant ON document_upload_sessions(applicant_id);
```

---

## 8. schema_migrations (تحليل جدول تتبع الترحيلات)

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'success'
);
```

- **آلية منع التكرار:** المفتاح الأساسي `version` يمنع تشغيل نفس الترحيل مرتين.
- **التحقق من البصمة:** مقارنة بصمة SHA-256 للملف قبل التنفيذ لرفض أي ملف ترحيل تم تعديله بعد تطبيقه.

---

## 9. parent_student Unique Constraint (تحليل قيد التفرد)

تم تنفيذ الاستعلام التالي في وضع القراءة:
```sql
SELECT parent_user_id, student_id, COUNT(*) as c 
FROM parent_student 
GROUP BY parent_user_id, student_id 
HAVING COUNT(*) > 1;
```
- **النتيجة الفعلية:** **0 تكرارات (0 duplicates)** عبر كافة السجلات الـ 37.
- **أمر الفهرس المقترح:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair 
ON parent_student(parent_user_id, student_id);
```
- **درجة الأمان:** آمن 100% ولا يتعارض مع أي بيانات قائمة.

---

## 10. Historical Data Handling (تحليل ومعالجة البيانات التاريخية)

### إحصائيات الأسماء الحالية:
- **المتقدمون (`applicants` - 29 سجلاً):**
  - أسماء ثلاثية (3 كلمات): **26 سجلاً** (مثال: "سليمان خالد الدوسري").
  - أسماء نماذج تجريبية (5 كلمات): **3 سجلات** (مثال: "عبدالرحمن محمد السعيد (نموذج تجريبي)").
  - أسماء رباعية (4 كلمات): **0 سجل**.
  - أسماء فارغة أو NULL: **0 سجل**.
- **الطلاب (`students` - 17 سجلاً):**
  - أسماء ثلاثية: **16 سجلاً**.
  - أسماء تجريبية: **سجل واحد**.
  - أسماء رباعية: **0 سجل**.

### استنتاج حاسم يمنع التزييف:
أي محاولة برمجية لتفكيك الأسماء القديمة إلى أربعة أجزاء ستؤدي إما إلى خطأ برمجي أو اختلاق اسم رابع غير صحيح.  
لذا، فإن استراتيجية الترحيل الصارمة المعتمدة هي:
1. ملء `legal_full_name` بالاسم التاريخي كاملاً كما هو.
2. ضبط `name_verification_status = 'legacy_unverified'`.
3. ترك الحقول الأربعة (`legal_first_name`, `legal_second_name`, `legal_third_name`, `legal_fourth_name`) بقيمة `NULL`.
4. لا يُعتبر أي اسم موثقاً حتى يتم تدقيق وثيقة رسمية معتمدة من قبل موظف الإدارة.

---

## 11. Exact Proposed SQL (نصوص أوامر SQL المقترحة للترحيل 001)

```sql
-- ============================================================================
-- MIGRATION 001: Legal Name Governance & Document Security (DRY-RUN SPECIFICATION)
-- ============================================================================

-- 1. إضافة أعمدة جدول المتقدمين (applicants)
ALTER TABLE applicants ADD COLUMN legal_first_name TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN legal_second_name TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN legal_third_name TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN legal_fourth_name TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN legal_full_name TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN normalized_legal_name TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN name_verification_status TEXT DEFAULT 'pending';
ALTER TABLE applicants ADD COLUMN name_verified_from TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN name_verified_by TEXT DEFAULT NULL REFERENCES users(id);
ALTER TABLE applicants ADD COLUMN name_verified_at DATETIME DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN name_verification_notes TEXT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN name_second_approver TEXT DEFAULT NULL REFERENCES users(id);
ALTER TABLE applicants ADD COLUMN name_second_approved_at DATETIME DEFAULT NULL;

-- 2. إضافة أعمدة جدول الطلاب (students)
ALTER TABLE students ADD COLUMN legal_first_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_second_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_third_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_fourth_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_full_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN normalized_legal_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN name_verification_status TEXT DEFAULT 'legacy_unverified';
ALTER TABLE students ADD COLUMN name_verified_by TEXT DEFAULT NULL REFERENCES users(id);
ALTER TABLE students ADD COLUMN name_verified_at DATETIME DEFAULT NULL;

-- 3. إنشاء جدول وثائق المتقدمين (applicant_documents)
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
CREATE INDEX IF NOT EXISTS idx_applicant_docs_app_id ON applicant_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_docs_student_id ON applicant_documents(student_id);

-- 4. إنشاء جدول جلسات الرفع المؤقتة (document_upload_sessions)
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
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token_hash ON document_upload_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_applicant ON document_upload_sessions(applicant_id);

-- 5. إنشاء الفهرس الفريد لمنع تكرار علاقات الولاية (parent_student)
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair 
ON parent_student(parent_user_id, student_id);

-- 6. ترحيل وتأمين الأسماء التاريخية في جدول المتقدمين (Safe Historical Backfill)
UPDATE applicants 
SET legal_full_name = student_name,
    name_verification_status = 'legacy_unverified'
WHERE legal_full_name IS NULL;

-- 7. ترحيل وتأمين الأسماء التاريخية في جدول الطلاب (Safe Historical Backfill)
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

-- 8. إنشاء جدول تتبع الترحيلات وتوثيق الإصدار
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'success'
);
```

---

## 12. SQL Safety Analysis (تحليل سلامة أوامر SQL)
- كافة أوامر `ALTER TABLE ADD COLUMN` تضيف أعمدة بقيم افتراضية قابلة لأن تكون `NULL`، وهو ما لا يتطلب إعادة بناء الجداول في SQLite.
- لا يوجد أي أمر `DROP TABLE` أو `DROP COLUMN` أو `RENAME COLUMN`.
- استعلامات الـ `UPDATE` مشروطة بـ `WHERE legal_full_name IS NULL`، مما يجعلها قابلة لإعادة التشغيل دون التأثير على أي سجلات يتم تحديثها لاحقاً (Idempotent).
- لا يوجد خطر من قفل الجداول لفترات طويلة لأن حجم البيانات الحالي (725KB) صغير جداً وتستغرق المعاملة بضع أجزاء من الثانية.

---

## 13. SQLite Compatibility (التوافق مع محرك SQLite)
- **توافق DDL:** أوامر `ALTER TABLE ADD COLUMN` مدعومة ومطابقة لمعايير SQLite 3.
- **توافق الفهارس:** دعم كامل لـ `CREATE UNIQUE INDEX IF NOT EXISTS`.
- **معاملات الذرية:** دعم كامل لـ `BEGIN IMMEDIATE TRANSACTION` و `COMMIT` و `ROLLBACK`.
- **توافق المعرفات الخارجية:** المعرفات الخارجية المرجعية تم ضبطها لتكون `TEXT` لتتطابق تماماً مع معرفات UUID في الجداول الأصلية.

---

## 14. Transaction Plan (خطة المعاملات الذرية وفصل الملفات)
- **داخل المعاملة الذرية (SQL Transaction):**  
  تُنفذ كافة أوامر DDL الـ 25 وأوامر الترحيل الـ 2 وسجل التوثيق داخل كتلة واحدة:
  ```text
  BEGIN IMMEDIATE TRANSACTION;
  -- All SQL changes
  COMMIT;
  ```
- **خارج المعاملة الذرية (File System Operations):**  
  أي عمليات على نظام الملفات (إنشاء مجلد التخزين، فحص رأس النسخة الاحتياطية، حساب بصمة الملف) تتم حصرياً **قبل** فتح معاملة الـ SQL. في حال فشل أي أمر SQL، يُنفذ `ROLLBACK` فوراً وتبقى قاعدة البيانات نقية 100%.

---

## 15. Backup Verification (التحقق من النسخة الاحتياطية)
تم فحص النسخة الاحتياطية الموثقة:  
`data/backups/institution_p24_preparation_1790450006741.sqlite`  
- **الحجم:** 724,992 بايت (مطابق بنسبة 100% للأصل).
- **الترويسة:** `SQLite format 3\0` (سليمة).
- **أعداد السجلات في النسخة:** متطابقة تماماً مع خط الأساس (users: 58, students: 17, applicants: 29, parent_student: 37, audit_logs: 323).

---

## 16. Rollback / Disaster Recovery Strategy (خطة التراجع والتعافي)

1. **التراجع المنطقي (Logical Rollback):**  
   نظراً لأن الترحيل تراكمي 100% ولا يحذف أي عمود قديم، فإن تعطيل ميزة الحوكمة عبر مفتاح تشغيلي (`ENABLE_LEGAL_NAME_GOVERNANCE=false`) يعيد النظام فوراً للعمل وفق المنطق القديم دون الحاجة لأي تعديل على قاعدة البيانات.
2. **الاستعادة في حالات الطوارئ القصوى (Disaster Recovery Restore):**  
   في حال حدوث خلل كارثي في نظام التشغيل أثناء الكتابة، يتم استبدال ملف `institution.sqlite` بالنسخة الاحتياطية الموثقة `institution_p24_preparation_1790450006741.sqlite` لتعود القاعدة إلى حالتها الأصلية النظيفة خلال ثوانٍ.

---

## 17. Post-Migration Validation Plan (خطة التحقق بعد التنفيذ المستقبلي)

فور تنفيذ الترحيل لاحقاً، يجب أن تجتاز قاعدة البيانات الفحوصات الآلية التالية:
1. **تطابق أعداد السجلات:** التأكد من أن أعداد كافة الجداول الـ 12 تطابق خط الأساس السابق تماماً (Delta = 0).
2. **التحقق من العلاقات الأجنبية:** تنفيذ `PRAGMA foreign_key_check;` وتأكيد خلوه من أي أخطاء.
3. **التحقق من سلامة المؤشر الفريد:** التأكد من وجود `idx_parent_student_unique_pair` ورفض أي محاولة إدخال مكررة.
4. **التحقق من سلامة الأعمدة الجديدة:** قراءة `PRAGMA table_info` لكل من `applicants` و `students`.
5. **فحص سويت الأمان:** التأكد من أن سويت `test_security_hotfix.js` لا يزال يحقق **26/26 PASS** و Exit Code 0.

---

## 18. Security Review (المراجعة الأمنية لمكونات الترحيل)

| العنصر الأمني | التحليل والتقييم | التوصية الهندسية |
|---|---|---|
| **Anti-IDOR في الوثائق** | ربط الرفع برمز جلسة مؤقت `token_hash` بدلاً من الاعتماد على معرف المتقدم | معتمد في التصميم المعدل |
| **Plaintext Token Storage** | تخزين رمز الرفع الصريح في قاعدة البيانات يمثل خطراً | **تم التعديل لتخزين الهاش SHA-256** |
| **Path Traversal** | تجنب استخدام المسارات المطلقة واستخدام UUID للملفات | معتمد ومحصن عبر `storage_key` |
| **Fake Verification** | وسم الأسماء التاريخية بـ `legacy_unverified` يمنع الاعتماد الوهمي | محصن تماماً |
| **Audit Logs Protection** | عدم إدراج المفاتيح أو محتوى الوثائق في بيانات التدقيق | محصن وموثق |

---

## 19. Institutional Decisions (القرارات الإدارية المعلقة - PENDING)
تظل القرارات التالية معلقة بانتظار التوجيه الإداري المؤسسي ولا تؤثر على سلامة الـ DDL:
1. **مستوى الاعتماد البشري:** هل يُكتفى بمراجع إداري واحد أم يُلزم المشرف الثاني (`Four-Eyes Principle`)؟ (الجدول يدعم الحالتين).
2. **أنواع الوثائق المعتمدة رسمياً:** اعتماد القائمة النهائية للوثائق المقبولة في استمارة التسجيل.
3. **سياسة السجلات التاريخية:** اعتماد خطة بقاء الأسماء التاريخية كـ `legacy_unverified` حتى يتم تحديثها إدارياً.

---

## 20. Risks & Blockers (المخاطر والعوائق الفنية المتبقية)
1. **حزمة Multer:** يلزم تثبيت `multer` و `@types/multer` قبل بدء كتابة مسارات رفع الوثائق.
2. **مفتاح التشفير:** يلزم تعيين `DOCUMENT_ENCRYPTION_KEY` في ملف `.env` المحلي قبل تشغيل مسارات التشفير.

---

## 21. FINAL DECISION (القرار النهائي لبوابة الترحيل 2.4-C)

# 🟡 **`CHANGES_REQUIRED`**

### أسباب ومبررات القرار:
المخطط الهيكلي سليم وتراكمي بنسبة 100%، ولكن **يلزم اعتماد التعديلات التصميمية الثلاثة التالية في كود الترحيل قبل تنفيذه**:
1. **تعديل نوع المعرفات الخارجية (FKs):** ضبط نوع الحقول المرجعية (`applicant_id`, `student_id`, `verified_by`) لتكون **`TEXT`** وليست `INTEGER` لتطابق معرفات UUID الفعلية في الجداول الأصلية.
2. **تأمين جدول جلسات الرفع:** تخزين `token_hash` (SHA-256) بدلاً من الرمز الصريح الخام `upload_token`.
3. **تعديل استعلام ترحيل الطلاب القدامى:** سحب الاسم من `users.name` / `applicants.student_name` عبر الدمج (Join) لعدم وجود عمود باسم `name` داخل جدول `students`.

*(تم تضمين هذه التعديلات الثلاثة في نصوص SQL المقترحة أعلاه لتصبح جاهزة للتنفيذ فور صدور الموافقة الإدارية).*

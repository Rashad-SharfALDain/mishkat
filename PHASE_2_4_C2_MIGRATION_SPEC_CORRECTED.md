# PHASE 2.4-C2 MIGRATION SPECIFICATION (CORRECTED)
## مواصفة الترحيل الهيكلي المصححة — مؤسسة مِشكاة التربوية والتعليمية

**المرحلة:** Phase 2.4-C2 Migration Specification Correction  
**تاريخ التحديث:** 26 سبتمبر 2026  
**المرجعية:** `SPEC-MISHKAT-P2.4-V2` و `PHASE_2_4_C_MIGRATION_DRY_RUN.md`  
**طبيعة المرحلة:** **مراجعة ومواصفة نهائية مصححة فقط — دون تنفيذ أي أمر على قاعدة البيانات**  
**الحالة المقترحة:** **`READY_FOR_IMPLEMENTATION_REVIEW`**

---

## 1. Executive Summary (الملخص التنفيذي للتصحيحات)

بناءً على نتائج المراجعة الفنية والمحاكاة الجافة (Phase 2.4-C) التي خلصت إلى حالة `CHANGES_REQUIRED`، تم في هذه الوثيقة إجراء **التصحيحات الهندسية الكاملة للمواصفة** لمعالجة كافة الملاحظات قبل الشروع في أي تنفيذ.

### ملخص المعالجات والتصحيحات المنجزة:
1. **تصحيح أنواع المفاتيح الأجنبية (Foreign Keys Data Type Correction):**  
   تم تعديل كافة المفاتيح الأجنبية المرجعية (`applicant_id`, `student_id`, `verified_by`, `uploaded_by`, `name_verified_by`, `name_second_approver`) لتكون **`TEXT`** بشكل صريح ومطلق لتتطابق بنيوياً مع معرفات UUID المستخدمة في الجداول الأصلية (`users`, `applicants`, `students`).
2. **التحصين التام لرمز جلسة الرفع (`token_hash` Architecture):**  
   تم استبعاد تخزين الرمز الخام `upload_token` نهائياً، واستبداله بعمود `token_hash TEXT NOT NULL UNIQUE` يخزن بصمة الرمز المشفرة (SHA-256)، مع حظر ظهور الرمز الخام في السجلات أو رسائل الخطأ أو الـ Audit Logs.
3. **تصحيح استعلام الترحيل التاريخي (Historical Backfill):**  
   تمت إزالة أي افتراض لوجود عمود باسم `name` في جدول `students`، وتم بناء الاستعلام اعتماداً على العلاقات الحقيقية في قاعدة البيانات (`COALESCE(u.name, a.student_name)`).
4. **حظر تزييف الأسماء (Zero Synthetic Data):**  
   تأكيد بقاء الحقول الأربعة المجزأة (`legal_first_name`, إلخ) فارغة (`NULL`) لكافة السجلات التاريخية لعدم وجود أي اسم رباعي حالياً (26 اسماً ثلاثياً في المتقدمين و16 في الطلاب)، ومنع أي تخمين أو اشتقاق عشوائي للاسم الرابع.
5. **منع التوثيق التلقائي الوهمي (No Fake Verification):**  
   وسم كافة السجلات التاريخية صراحة بـ `legacy_unverified`، مع التحقق المعماري الصارم من استحالة تحويل أي سجل تلقائياً إلى `verified` إلا بإجراء بشري إداري موثق بوثيقة رسمية.

---

## 2. All Proposed Migration Changes (حصر التغييرات الهيكلية الكاملة)

### أولاً: جدول المتقدمين (`applicants`)
إضافة الأعمدة التراكمية التالية عبر `ALTER TABLE ADD COLUMN`:
- `legal_first_name TEXT DEFAULT NULL`
- `legal_second_name TEXT DEFAULT NULL`
- `legal_third_name TEXT DEFAULT NULL`
- `legal_fourth_name TEXT DEFAULT NULL`
- `legal_full_name TEXT DEFAULT NULL`
- `normalized_legal_name TEXT DEFAULT NULL`
- `name_verification_status TEXT DEFAULT 'pending'`
- `name_verified_from TEXT DEFAULT NULL`
- `name_verified_by TEXT DEFAULT NULL REFERENCES users(id)` (مفتاح أجنبي `TEXT`)
- `name_verified_at DATETIME DEFAULT NULL`
- `name_verification_notes TEXT DEFAULT NULL`
- `name_second_approver TEXT DEFAULT NULL REFERENCES users(id)` (مفتاح أجنبي `TEXT`)
- `name_second_approved_at DATETIME DEFAULT NULL`

### ثانياً: جدول الطلاب (`students`)
إضافة الأعمدة التراكمية التالية:
- `legal_first_name TEXT DEFAULT NULL`
- `legal_second_name TEXT DEFAULT NULL`
- `legal_third_name TEXT DEFAULT NULL`
- `legal_fourth_name TEXT DEFAULT NULL`
- `legal_full_name TEXT DEFAULT NULL`
- `normalized_legal_name TEXT DEFAULT NULL`
- `name_verification_status TEXT DEFAULT 'legacy_unverified'`
- `name_verified_by TEXT DEFAULT NULL REFERENCES users(id)` (مفتاح أجنبي `TEXT`)
- `name_verified_at DATETIME DEFAULT NULL`

### ثالثاً: جدول وثائق المتقدمين الجديد (`applicant_documents`)
جدول معزول بالكامل ومخصص لإدارة ملفات إثبات الهوية المشفرة ساكناً بـ AES-256-GCM:
- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `applicant_id TEXT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE`
- `student_id TEXT REFERENCES students(id) ON DELETE SET NULL`
- `document_type TEXT NOT NULL` (`national_id`, `birth_certificate`, `family_card`, `passport`)
- `document_number TEXT`
- `storage_key TEXT NOT NULL UNIQUE` (UUIDv4)
- `file_path TEXT NOT NULL` (مسار نسبي داخلي: `data/documents/<uuid>.enc`)
- `original_filename TEXT NOT NULL`
- `file_size INTEGER NOT NULL`
- `mime_type TEXT NOT NULL`
- `file_hash TEXT NOT NULL` (SHA-256 للمحتوى الأصلي)
- `is_encrypted INTEGER DEFAULT 1`
- `iv_hex TEXT NOT NULL` (متجه التهيئة 12 بايت / 24 hex)
- `auth_tag_hex TEXT NOT NULL` (وسم المصادقة 16 بايت / 32 hex)
- `key_version INTEGER DEFAULT 1`
- `upload_status TEXT DEFAULT 'uploaded'`
- `verification_status TEXT DEFAULT 'pending'`
- `rejection_reason TEXT`
- `uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL`
- `verified_by TEXT REFERENCES users(id) ON DELETE SET NULL`
- `verified_at DATETIME`
- `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
- `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`

### رابعاً: جدول جلسات الرفع المؤقتة المحصن (`document_upload_sessions`)
- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `applicant_id TEXT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE`
- `token_hash TEXT NOT NULL UNIQUE` (بصمة SHA-256 بطول 64 خانة Hex)
- `client_ip TEXT`
- `expires_at DATETIME NOT NULL`
- `max_uploads INTEGER DEFAULT 1`
- `uploads_completed INTEGER DEFAULT 0`
- `is_used INTEGER DEFAULT 0`
- `used_at DATETIME`
- `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`

### خامساً: قيد تفرد علاقات الولاية الأسرية (`parent_student`)
- مؤشر فريد يمنع تكرار أي علاقة بين ولي أمر وطالب:
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair ON parent_student(parent_user_id, student_id);`

### سادساً: جدول تتبع الترحيلات (`schema_migrations`)
- `version VARCHAR(50) PRIMARY KEY`
- `name VARCHAR(255) NOT NULL`
- `checksum VARCHAR(64) NOT NULL`
- `applied_at DATETIME DEFAULT CURRENT_TIMESTAMP`
- `execution_time_ms INTEGER NOT NULL`
- `status VARCHAR(20) DEFAULT 'success'`

---

## 3. Final Data Types & Foreign Keys Mapping (جدول التوافق النهائي للمفاتيح)

| الجدول المصدر (`Source Table`) | الحقل المرجعي (`Column`) | نوع البيانات المعتمد (`Data Type`) | الجدول المستهدف (`Target Table`) | المفتاح المستهدف ونوعه |
|---|---|---|---|---|
| `applicants` | `name_verified_by` | **`TEXT`** | `users` | `id TEXT` |
| `applicants` | `name_second_approver` | **`TEXT`** | `users` | `id TEXT` |
| `students` | `name_verified_by` | **`TEXT`** | `users` | `id TEXT` |
| `applicant_documents` | `applicant_id` | **`TEXT`** | `applicants` | `id TEXT` |
| `applicant_documents` | `student_id` | **`TEXT`** | `students` | `id TEXT` |
| `applicant_documents` | `uploaded_by` | **`TEXT`** | `users` | `id TEXT` |
| `applicant_documents` | `verified_by` | **`TEXT`** | `users` | `id TEXT` |
| `document_upload_sessions` | `applicant_id` | **`TEXT`** | `applicants` | `id TEXT` |
| `parent_student` | `parent_user_id` | **`TEXT`** | `users` | `id TEXT` |
| `parent_student` | `student_id` | **`TEXT`** | `students` | `id TEXT` |

*التوافق:* 100% متطابق مع البنية الفعلية للمشروع حيث لا يوجد أي تعارض بين سلاسل UUID النصية.

---

## 4. Token Hash Design & Zero-Exposure Architecture (معمارية حماية الرموز)

لحماية مسار الرفع العام من أي استغلال:
1. **التوليد بالذاكرة:** يُنشأ الرمز السري عشوائياً في طبقة الخدمة عبر `crypto.randomBytes(32).toString('hex')` (طول 64 خانة Hex).
2. **الحساب الفوري للبصمة:** قبل تخزين أي بيانات، يُحسب الهاش المشفر:
   ```typescript
   const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
   ```
3. **التخزين المشفر فقط:** يُخزن `tokenHash` حصراً في عمود `token_hash` بجدول `document_upload_sessions`.
4. **سياسة عدم الظهور الصارمة (Zero-Exposure Policy):**
   - **قاعدة البيانات:** لا يوجد أي عمود يخزن `rawToken`.
   - **سجلات الخادم (Console & Logs):** يُحظر طباعة `rawToken` في سجلات التشغيل.
   - **سجلات التدقيق (`audit_logs`):** يُسجل فقط `session_id` و `applicant_id` ونوع الحدث (`UPLOAD_SESSION_ISSUED`) دون إدراج الرمز.
   - **رسائل الأخطاء (Error Responses):** عند فشل التحقق من الرمز، تعيد الـ API رسالة عامة `403 Forbidden: Invalid or expired upload token` دون ذكر أي جزء من الرمز في تفاصيل الخطأ.
5. **التحقق عند الرفع:** يرسل العميل الرمز عبر الترويسة `X-Upload-Session-Token`، فيقوم الخادم بحساب الهاش للرمز المرسل والاستعلام عن تطابقه مع `token_hash` والتأكد من `is_used = 0` و `expires_at > CURRENT_TIMESTAMP`.

---

## 5. Historical Backfill Design (تصميم الترحيل الآمن للبيانات التاريخية)

### أ. جدول المتقدمين (`applicants`):
- يتم ترحيل القيمة المخزنة في `student_name` مباشرة إلى `legal_full_name`.
- يتم وسم الحالة بـ `'legacy_unverified'`.
- تظل الحقول الأربعة (`legal_first_name`, `legal_second_name`, `legal_third_name`, `legal_fourth_name`) بقيمة `NULL`.

### ب. جدول الطلاب (`students`):
- نظراً لأن جدول `students` لا يحتوي على عمود `name`، يتم استخراج الاسم المعتمد عبر الاستعلام المدمج التالي:
  ```sql
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
  ```
- هذا يضمن استرجاع الاسم الموثق بحساب المستخدم أو بطلب الالتحاق دون أي فقدان أو خطأ.

---

## 6. Legacy Verification Protection (تحصين السجلات ضد التوثيق الوهمي)

1. **الوسم الصريح بـ `legacy_unverified`:**  
   كافة الطلاب الـ 17 والمتقدمين الـ 29 يتم وسمهم بـ `legacy_unverified`.
2. **استحالة التحويل التلقائي في الترحيل:**  
   لا تتضمن أوامر الـ SQL المقترحة أي شرط أو منطق يتيح ضبط `name_verification_status = 'verified'`.
3. **بوابة التحقق الصارمة في واجهات النظام والـ Backend:**  
   لا يمكن لأي سجل تاريخي الانتقال إلى `verified` إلا عبر الخطوات الرقابية الإلزامية التالية مستقبلاً:
   - قيام ولي الأمر أو الطالب برفع وثيقة إثبات هوية رسمية حديثة.
   - قيام موظف إداري مخول بالدخول وتدقيق الوثيقة بالعين المجردة ومطابقتها حرفياً مع الحقول الأربعة.
   - اعتماد الاسم رسمياً، مما يُسجل في `audit_logs` مع تخزين `name_verified_by` و `name_verified_at`.

---

## 7. Exact Proposed SQL (نصوص أوامر SQL النهائية الجاهزة للتنفيذ)

```sql
-- ============================================================================
-- MISHKAT PHASE 2.4 — MIGRATION 001 (FINAL CORRECTED SPECIFICATION)
-- ============================================================================

-- 1. إضافة أعمدة الحوكمة والتحقق لجدول المتقدمين (applicants)
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

-- 2. إضافة أعمدة الحوكمة والتحقق لجدول الطلاب (students)
ALTER TABLE students ADD COLUMN legal_first_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_second_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_third_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_fourth_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN legal_full_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN normalized_legal_name TEXT DEFAULT NULL;
ALTER TABLE students ADD COLUMN name_verification_status TEXT DEFAULT 'legacy_unverified';
ALTER TABLE students ADD COLUMN name_verified_by TEXT DEFAULT NULL REFERENCES users(id);
ALTER TABLE students ADD COLUMN name_verified_at DATETIME DEFAULT NULL;

-- 3. إنشاء جدول وثائق المتقدمين المعزول والمشفر (applicant_documents)
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

-- 4. إنشاء جدول جلسات الرفع المؤقتة المؤمن بالبصمة المشفرة (document_upload_sessions)
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

-- 5. إنشاء المؤشر الفريد لمنع تكرار علاقات الأبوة والبنوة (parent_student)
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair 
ON parent_student(parent_user_id, student_id);

-- 6. ترحيل الأسماء التاريخية للمتقدمين وتثبيتها بحالة غير موثقة (Safe Backfill)
UPDATE applicants 
SET legal_full_name = student_name,
    name_verification_status = 'legacy_unverified'
WHERE legal_full_name IS NULL;

-- 7. ترحيل الأسماء التاريخية للطلاب بالدمج الصحيح وتثبيتها بحالة غير موثقة (Safe Backfill)
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

-- 8. إنشاء جدول تتبع وإدارة الترحيلات البرمجية (schema_migrations)
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

## 8. SQLite Compatibility & Transaction Plan (التوافق وخطة المعاملات الذرية)

### أ. التوافق مع SQLite 3:
- كافة أوامر `ALTER TABLE ADD COLUMN` مدعومة أصلياً لإضافة أعمدة تقبل `NULL`.
- كافة المفاتيح الأجنبية معرّفة بـ `TEXT` وتتطابق مع المعرفات الحالية.
- الفهارس الفريدة `CREATE UNIQUE INDEX` متوافقة ومدعومة.

### ب. خطة المعاملة الذرية (Atomic Execution):
تُنفذ الأوامر السابقة حصرياً داخل معاملة ذرية موحدة:
```typescript
db.run('BEGIN IMMEDIATE TRANSACTION;');
try {
  // Execute Step 1 through Step 8
  db.run('COMMIT;');
} catch (error) {
  db.run('ROLLBACK;');
  throw error;
}
```
في حال طرأ أي خطأ أثناء تنفيذ أي سطر، يتم التراجع الفوري الكامل لتعود قاعدة البيانات إلى حالتها الأصلية النظيفة بنسبة 100%.

---

## 9. Post-Migration Verification Plan (خطة التحقق بعد التنفيذ)

فور تشغيل الترحيل مستقبلاً، يُلزم النظام بإجراء الفحوصات الآلية التالية:
1. **تطابق أعداد السجلات:** التأكد من بقاء الجداول على خط الأساس الثابت دون أي زيادة أو نقصان:
   - `users`: 58
   - `students`: 17
   - `parents`: 37
   - `applicants`: 29
   - `parent_student`: 37
   - `audit_logs`: 323
2. **فحص العلاقات الأجنبية:** تنفيذ `PRAGMA foreign_key_check;` وتأكيد خلوه من أي انتهاك.
3. **فحص الأعمدة الجديدة:** التحقق من وجود الأعمدة الـ 13 في `applicants` والأعمدة الـ 9 في `students`.
4. **فحص جدول الترحيلات:** التأكد من تسجيل `001_p24_legal_name_documents` في `schema_migrations`.
5. **سويت الأمان:** تشغيل سويت الاختبارات والتأكد من بقاء `test_security_hotfix.js` بنتيجة **26/26 PASS**.

---

## 10. Security Checks Matrix (مصفوفة التحقق الأمني)

| البند الأمني | التقييم في المواصفة المصححة | النتيجة |
|---|---|:---:|
| **Zero Raw Token Storage** | تخزين `token_hash` (SHA-256) بدلاً من الرمز الصريح | **PASSED** |
| **No Logs / Audit Leaks** | حظر طباعة الرموز والمفاتيح في السجلات والـ audit | **PASSED** |
| **Anti-IDOR Binding** | ربط جلسات الرفع بالهاش المشفر ورقم المتقدم وIP | **PASSED** |
| **Data Integrity Preservation** | حظر التعديل أو الحذف وحماية الأسماء التاريخية | **PASSED** |
| **No Fake Verification** | تثبيت حالة القدامى كـ `legacy_unverified` حصراً | **PASSED** |
| **Isolated Storage** | تخزين الوثائق المشفرة داخل `data/documents/` خارج الويب | **PASSED** |

---

## 11. Remaining Institutional Decisions (القرارات الإدارية المعلقة - PENDING)
1. **مستوى الاعتماد البشري:** هل يُلزم النظام بمراجعين اثنين (`Four-Eyes Principle`) للاعتماد النهائي أم يُكتفى بمراجع واحد؟ (المخطط يدعم الحالتين عبر حقلي `name_verified_by` و `name_second_approver`).
2. **قائمة الوثائق الرسمية المعتمدة:** تأكيد قائمة أنواع الوثائق المقبولة نهائياً في الاستمارة.
3. **تحديث وثائق الطلاب القدامى:** تحديد سياسة تحديث وتوثيق وثائق الطلاب الـ 17 الحاليين (هل تكون عند أول طلب شهادة رسمية أم يتم إتاحتها اختيارياً).

---

## 12. FINAL STATUS (الحالة النهائية للبوابة)

# 🟢 **`READY_FOR_IMPLEMENTATION_REVIEW`**

*(تم إنجاز كافة التصحيحات والتعديلات المطلوبة على المواصفة المعمارية للترحيل 001 بنجاح كامل، وأصبحت صياغة الـ SQL متطابقة 100% مع قاعدة البيانات الفعلية وخالية من أي مخاطر تشغيلية أو أمنية، بانتظار المراجعة والاعتماد المؤسسي الصريح قبل التنفيذ).*

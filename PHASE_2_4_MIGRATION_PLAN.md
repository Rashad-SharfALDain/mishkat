# PHASE 2.4 MIGRATION PLAN
## خطة وتصميم إطار الترحيل والترقية الهيكلية — مؤسسة مِشكاة التربوية والتعليمية
**المرحلة:** Phase 2.4-B Infrastructure Preparation (Architecture & Specification Only)  
**المرجعية:** `SPEC-MISHKAT-P2.4-V2` & `PHASE_2_4_A_MIGRATION_READINESS_AUDIT.md`  
**حالة التنفيذ:** **تخطيط وتوثيق معماري فقط — يمنع تشغيل أي سكريبت تنفيذي في هذه المرحلة**

---

## 1. تصميم إطار عمل الترحيل (Migration Framework Design)

### أ. مسار حفظ ملفات الترحيل
توضع كافة ملفات الترحيل في مجلد مخصص ومستقل تحت البنية البرمجية لقاعدة البيانات:
```text
server/src/db/migrations/
```
يضمن هذا العزل عدم اختلاط ملفات الترحيل الهيكلية بسكريبتات التهيئة الأولية (`schema.sql`, `seed.ts`).

### ب. اصطلاح التسمية (Naming Convention)
تُسمى الملفات بتسلسل رقمي ثلاثي متبوع بوصف وظيفي دقيق:
```text
001_p24_legal_name_documents.ts
002_next_phase_feature.ts
```

### ج. جدول تتبع الإصدارات (`schema_migrations`)
لضمان تتبع حالة الترحيل ومنع تشغيل أي ترحيل أكثر من مرة، يُنشأ جدول تتبع النظام تلقائياً:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER NOT NULL,
  applied_by VARCHAR(100) DEFAULT 'system'
);
```

### د. حساب البصمة الرقمية (Checksum) ومنع التكرار (Idempotency)
1. قبل تنفيذ أي ملف، يحسب المحرك بصمة SHA-256 لمحتوى الملف البرمجي.
2. يستعلم المحرك من `schema_migrations` عن `version`:
   - إذا كان مسجلاً وبنفس الـ `checksum`: يتم تخطي الملف باعتباره نُفذ بنجاح مسبقاً (`SKIPPED: Already Applied`).
   - إذا كان مسجلاً بـ `checksum` مختلف: **يتوقف النظام فوراً** مع إصدار تنبيه أمني (`FATAL: Migration file modified after execution`).
   - إذا لم يكن مسجلاً: يتم المضي في خطوات التنفيذ.

### هـ. المعاملات الذرية ومعالجة الأخطاء (Atomic Transactions & Failure Handling)
- كل عملية ترحيل تُنفذ داخل معاملة ذرية كاملة (`BEGIN TRANSACTION; ... COMMIT;`).
- في حال حدوث أي خطأ برمجي أو استثناء SQL أثناء التنفيذ:
  1. يُنفذ فوراً `ROLLBACK TRANSACTION;`.
  2. يُسجل الخطأ بالتفصيل في سجلات الخادم.
  3. **يتوقف النظام فوراً** ولا يُسجل الإصدار في `schema_migrations`.
  4. تظل قاعدة البيانات في حالتها الأصلية النظيفة دون أي أثر جزئي.

### و. التحقق القبلي التلقائي (Automated Preflight & Backup Verification)
قبل أن يشرع محرك الترحيل في أي تعديل:
1. التحقق من سلامة وصلاحية قراءة قاعدة البيانات (`PRAGMA integrity_check`).
2. التحقق الإلزامي من وجود نسخة احتياطية حديثة صالحة تم إنشاؤها والتحقق من رأسها الثنائي (`SQLite format 3`) في `data/backups/`.
3. التحقق من عدم وجود عمليات قفل نشطة على الملف.

---

## 2. تفاصيل الترحيل الأول: Migration 001

### الاسم المقترح:
`001_p24_legal_name_documents.ts`

### محتويات الترحيل الهيكلية:

#### A. إضافة حقول الاسم الرباعي والتحقق لجدول المتقدمين (`applicants`)
إضافة الأعمدة التراكمية التالية دون المساس ببيانات الجدول الأصلية:
- `legal_first_name TEXT`: الاسم الأول القانوني.
- `legal_second_name TEXT`: اسم الأب القانوني.
- `legal_third_name TEXT`: اسم الجد القانوني.
- `legal_fourth_name TEXT`: اسم العائلة / اللقب القانوني.
- `legal_full_name TEXT`: الاسم الرباعي المجمع رسمياً.
- `normalized_legal_name TEXT`: الاسم القانوني المعالج لغوياً لفحص التكرارات (إزالة الهمزات، التاء المربوطة، المسافات الزائدة).
- `name_verification_status TEXT DEFAULT 'pending'`: حالة التحقق (`pending`, `verified`, `rejected`, `legacy_unverified`).
- `name_verified_by INTEGER REFERENCES users(id)`: معرف الموظف الإداري الأول الذي اعتمد الاسم.
- `name_verified_at DATETIME`: وقت اعتماد الاسم الأول.
- `name_verification_notes TEXT`: ملاحظات التدقيق الإداري.
- `second_approver_id INTEGER REFERENCES users(id)`: معرف المشرف الثاني في حال تفعيل الاعتماد المزدوج.
- `second_approved_at DATETIME`: وقت الاعتماد الثاني.

#### B. إضافة حقول الاسم الرباعي والتحقق لجدول الطلاب (`students`)
- `legal_first_name TEXT`
- `legal_second_name TEXT`
- `legal_third_name TEXT`
- `legal_fourth_name TEXT`
- `legal_full_name TEXT`
- `normalized_legal_name TEXT`
- `name_verification_status TEXT DEFAULT 'legacy_unverified'`
- `name_verified_by INTEGER REFERENCES users(id)`
- `name_verified_at DATETIME`

#### C. إنشاء جدول وثائق المتقدمين (`applicant_documents`)
جدول معزول مخصص لإدارة وثائق إثبات الهوية الشخصية ومطابقتها:
```sql
CREATE TABLE IF NOT EXISTS applicant_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applicant_id INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'national_id', 'birth_certificate', 'family_card', 'passport'
  file_uuid TEXT NOT NULL UNIQUE, -- اسم الملف المشفر على القرص
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  encrypted_size INTEGER NOT NULL,
  file_sha256 TEXT NOT NULL, -- البصمة للتحقق من النزاهة بعد فك التشفير
  iv_hex TEXT NOT NULL, -- متجه التهيئة AES-GCM (12 bytes hex)
  auth_tag_hex TEXT NOT NULL, -- وسم المصادقة AES-GCM (16 bytes hex)
  key_version INTEGER DEFAULT 1,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  rejection_reason TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  verified_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_applicant_docs_applicant_id ON applicant_documents(applicant_id);
```

#### D. إنشاء جدول جلسات رفع الوثائق المؤقتة (`document_upload_sessions`)
جدول مؤقت يدير صلاحيات الرفع العام بطريقة مؤمنة تماماً ضد هجمات التخمين وتجاوز المعرفات (Anti-IDOR):
```sql
CREATE TABLE IF NOT EXISTS document_upload_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applicant_id INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE, -- SHA-256 للرمز المؤقت المرسل للعميل
  client_ip TEXT,
  expires_at DATETIME NOT NULL,
  max_uploads INTEGER DEFAULT 1,
  uploads_completed INTEGER DEFAULT 0,
  is_consumed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token ON document_upload_sessions(session_token_hash);
```

#### E. إنشاء المؤشر الفريد لجدول العلاقات الأسرية (`parent_student`)
نظراً لأن الفحص التقني في Phase 2.4-A أثبت خلو الجدول تماماً من التكرارات (0 duplicates عبر 37 سجلاً)، فإن الترحيل يضيف المؤشر الفريد الإلزامي لمنع إنشاء أي روابط ولاية مكررة مستقبلاً:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair 
ON parent_student(parent_user_id, student_id);
```

#### F. إنشاء جدول تتبع الترحيلات (`schema_migrations`)
تسجيل جدول التتبع وتوثيق تنفيذ الإصدار 001 فور اكتمال كافة العمليات أعلاه بنجاح.

---

## 3. آلية معالجة وحماية البيانات التاريخية (Historical Data Backfill Strategy)

1. **الالتزام بالقواعد الإلزامية:**
   - **حظر الحذف:** لا يُحذف أي سجل قديم من `applicants` أو `students`.
   - **حظر التحقق الآلي الوهمي:** لا يُوسم أي سجل قديم بـ `verified` نهائياً.
   - **حظر اختلاق أجزاء أسماء:** لا يتم تخمين أو اختلاق اسم رابع أو اسم جد للسجلات التاريخية التي تحتوي أسماء ثلاثية (وهي 26 من أصل 29 سجلاً).
2. **استراتيجية الترحيل الآمن المعتمدة:**
   - ضبط حقل الاسم الكامل القانوني ليطابق الاسم المسجل تاريخياً:
     ```sql
     UPDATE applicants 
     SET legal_full_name = student_name,
         name_verification_status = 'legacy_unverified'
     WHERE legal_full_name IS NULL;
     ```
   - بالمثل لجدول الطلاب:
     ```sql
     UPDATE students 
     SET legal_full_name = name,
         name_verification_status = 'legacy_unverified'
     WHERE legal_full_name IS NULL;
     ```
   - تظل الحقول الأربعة المجزأة (`legal_first_name`, إلخ) فارغة (`NULL`) للسجلات التاريخية إلى حين قيام ولي الأمر أو الإدارة بتحديثها رسمياً بموجب وثيقة إثبات هوية معتمدة.

---

## 4. التحقق والتوكيد بعد الترحيل (Post-Migration Verification)

فور انتهاء الترحيل، يُجري المحرك الفحوصات الآلية التالية للتحقق من سلامة العملية:
1. التحقق من وجود كافة الأعمدة الجديدة عبر `PRAGMA table_info(applicants);` و `PRAGMA table_info(students);`.
2. التحقق من وجود الجداول الجديدة وفهارسها عبر `PRAGMA index_list(parent_student);`.
3. التأكد من أن عدد السجلات في `applicants` و `students` و `parent_student` لم يتغير إطلاقاً (Delta = 0).
4. التأكد من تسجيل الإصدار `001` في جدول `schema_migrations`.
5. التحقق من تشغيل واجتياز سويت الأمان المرجعي `test_security_hotfix.js` بنسبة **26/26 PASS**.

---

## 5. خطة التراجع الآمن (Safe Rollback Plan)
في حال طرأ أي طارئ يستدعي التراجع:
1. التراجع لا يعتمد على حذف الأعمدة يدوياً (حيث أن SQLite قديمة لا تدعم `ALTER TABLE DROP COLUMN` بسلاسة).
2. يتم التراجع فوراً باستعادة النسخة الاحتياطية الموثقة المنشأة قبل لحظة الترحيل مباشرة:
   `data/backups/institution_p24_preparation_<timestamp>.sqlite`
3. هذا يضمن عودة فورية بنسبة 100% لنفس الحالة المطابقة لسويت الأمان المرجعي.

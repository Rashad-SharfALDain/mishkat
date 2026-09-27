# PHASE 2.4-D2 DATABASE MIGRATION REPORT
## تقرير تنفيذ الترحيل الهيكلي لقاعدة البيانات والترحيل التاريخي الآمن — مؤسسة مِشكاة التربوية والتعليمية

**المرحلة:** Phase 2.4-D2 Controlled Database Migration  
**تاريخ التنفيذ:** 26 سبتمبر 2026  
**المرجعية الهندسية:** `SPEC-MISHKAT-P2.4-V2` و `PHASE_2_4_C2_MIGRATION_SPEC_CORRECTED.md`  
**الحالة النهائية للبوابة:** **`D2_MIGRATION_SUCCESS`**

---

## 1. Migration ID (معرف الترحيل)
- **رمز الترحيل:** `001_p24_legal_name_documents`
- **اسم الترحيل:** `p24_legal_name_and_documents`
- **الملف التنفيذي:** [server/src/db/migrations/001_p24_legal_name_documents.ts](file:///g:/Antigravity/server/src/db/migrations/001_p24_legal_name_documents.ts)
- **زمن التنفيذ:** 68 ميلي ثانية
- **بصمة المحتوى (Checksum SHA-256):** `96455536e25b5b9ac71f77347abd6e454ba37809eb5cfb94264e1ecb42c2cb89`

---

## 2. Backup Path (مسار النسخة الاحتياطية المسبقة)
- **مسار النسخة الموثقة قبل الترحيل مباشرة:**  
  `data/backups/institution_p24_d2_pre_migration_1790451590531.sqlite`
- **حجم الملف:** 724,992 بايت (مطابق بنسبة 100%).
- **ترويسة الملف:** `SQLite format 3\0` (سليمة).
- **أعداد السجلات في النسخة:** متطابقة تماماً مع خط الأساس قبل أي تعديل.

---

## 3. Pre-Migration Counts (خط الأساس قبل الترحيل)
- `users`: 58
- `students`: 17
- `parents`: 37
- `applicants`: 29
- `parent_student`: 37 (تكرارات: **0**)
- `audit_logs`: 323
- `password_resets`: 11
- `attendance`: 36
- `evaluations`: 8
- `notifications`: 225
- `payments`: 26
- `sessions`: 25

---

## 4. Migration Steps (خطوات الترحيل المنفذة)
تم تنفيذ الخطوات التالية داخل معاملة ذرية موحدة (`BEGIN IMMEDIATE TRANSACTION; ... COMMIT;`):
1. التحقق من جدول `schema_migrations` والتأكد من عدم تطبيق الإصدار مسبقاً.
2. إضافة 14 عموداً لحوكمة الاسم والتحقق لجدول `applicants`.
3. إضافة 12 عموداً لحوكمة الاسم والتحقق لجدول `students`.
4. إنشاء جدول وثائق المتقدمين المعزول `applicant_documents` وفهارسه.
5. إنشاء جدول جلسات الرفع المؤقتة المحصنة `document_upload_sessions` وفهارسه.
6. إنشاء المؤشر الفريد `idx_parent_student_unique_pair` على جدول `parent_student`.
7. تنفيذ الـ Backfill الآمن لجدول `applicants` (نسخ الاسم الأصلي وتثبيت الحالة `legacy_unverified`).
8. تنفيذ الـ Backfill الآمن لجدول `students` عبر الربط الفعلي `COALESCE(u.name, a.student_name)` وتثبيت الحالة `legacy_unverified`.
9. تسجيل الترحيل في جدول `schema_migrations`.
10. تثبيت وحفظ التغييرات على القرص في `data/institution.sqlite`.

---

## 5. Schema Changes (التغييرات الهيكلية المطبقة بالتفصيل)

### أ. جدول المتقدمين (`applicants`):
أضيفت الأعمدة التراكمية التالية:
- `legal_first_name TEXT DEFAULT NULL`
- `legal_second_name TEXT DEFAULT NULL`
- `legal_third_name TEXT DEFAULT NULL`
- `legal_fourth_name TEXT DEFAULT NULL`
- `legal_full_name TEXT DEFAULT NULL`
- `normalized_legal_name TEXT DEFAULT NULL`
- `legal_name_normalized TEXT DEFAULT NULL`
- `name_verification_status TEXT DEFAULT 'pending'`
- `name_verified_from TEXT DEFAULT NULL`
- `name_verified_by TEXT DEFAULT NULL REFERENCES users(id)`
- `name_verified_at DATETIME DEFAULT NULL`
- `name_verification_notes TEXT DEFAULT NULL`
- `name_second_approver TEXT DEFAULT NULL REFERENCES users(id)`
- `name_second_approved_at DATETIME DEFAULT NULL`

### ب. جدول الطلاب (`students`):
أضيفت الأعمدة التراكمية التالية:
- `legal_first_name TEXT DEFAULT NULL`
- `legal_second_name TEXT DEFAULT NULL`
- `legal_third_name TEXT DEFAULT NULL`
- `legal_fourth_name TEXT DEFAULT NULL`
- `legal_full_name TEXT DEFAULT NULL`
- `normalized_legal_name TEXT DEFAULT NULL`
- `legal_name_normalized TEXT DEFAULT NULL`
- `name_verification_status TEXT DEFAULT 'legacy_unverified'`
- `name_verified_from TEXT DEFAULT NULL`
- `name_verified_by TEXT DEFAULT NULL REFERENCES users(id)`
- `name_verified_at DATETIME DEFAULT NULL`
- `name_verification_notes TEXT DEFAULT NULL`

### ج. الجداول الجديدة:
1. `applicant_documents`: لإدارة الوثائق المشفرة والمطابقة (معرفات الربط `TEXT`).
2. `document_upload_sessions`: لإدارة الرموز المؤقتة المشفرة `token_hash` (SHA-256).
3. `schema_migrations`: لإدارة وتتبع إصدارات الترحيل.

---

## 6. Historical Backfill Method (آلية الترحيل التاريخي)
- **للمتقدمين (`applicants`):**
  تم استنساخ الاسم التاريخي القائم في `student_name` إلى `legal_full_name`.
- **للطلاب (`students`):**
  نظراً لعدم وجود عمود `name` في جدول الطلاب، تم استرجاع الاسم المعتمد عبر الربط الشرطي الدقيق:
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
- **حظر التقسيم التخميني:** بقيت الحقول الأربعة (`legal_first_name`, `legal_second_name`, `legal_third_name`, `legal_fourth_name`) بقيمة `NULL` دون أي اشتقاق عشوائي.

---

## 7. Legacy Data Results (نتائج فحص البيانات التاريخية)
- عدد المتقدمين الموسومين بـ `legacy_unverified`: **29 من أصل 29** (100%).
- عدد الطلاب الموسومين بـ `legacy_unverified`: **17 من أصل 17** (100%).
- عدد السجلات التي تم اختلاق اسم رابع لها: **0** (لا يوجد أي تزييف).
- عدد السجلات التي رُقيت إلى `verified` آلياً: **0** (التحقق التلقائي ممنوع ومحجوب بالكامل).

---

## 8. Foreign Key Verification (التحقق من المفاتيح الأجنبية)
- `applicant_documents.applicant_id` -> نوع `TEXT` مطابق لـ `applicants.id`.
- `applicant_documents.student_id` -> نوع `TEXT` مطابق لـ `students.id`.
- `applicant_documents.uploaded_by` -> نوع `TEXT` مطابق لـ `users.id`.
- `applicant_documents.verified_by` -> نوع `TEXT` مطابق لـ `users.id`.
- `document_upload_sessions.applicant_id` -> نوع `TEXT` مطابق لـ `applicants.id`.
- `applicants.name_verified_by` -> نوع `TEXT` مطابق لـ `users.id`.
- `applicants.name_second_approver` -> نوع `TEXT` مطابق لـ `users.id`.
- `students.name_verified_by` -> نوع `TEXT` مطابق لـ `users.id`.

---

## 9. Token Hash Verification (التحقق من حماية الرموز)
- تم التأكد عبر `PRAGMA table_info(document_upload_sessions)` من وجود عمود:
  `token_hash TEXT NOT NULL UNIQUE`
- تم التأكد من **عدم وجود أي عمود باسم `upload_token`** في قاعدة البيانات بالكامل.

---

## 10. parent_student Constraint Verification (التحقق من قيد التفرد)
- تم إنشاء المؤشر الفريد `idx_parent_student_unique_pair` بنجاح.
- نتيجة فحص التكرارات بعد إنشاء المؤشر: **0 duplicates** عبر السجلات الـ 37.

---

## 11. Post-Migration Counts (أعداد السجلات بعد الترحيل ومقارنتها)

| اسم الجدول (`Table`) | Baseline قبل الترحيل | Post-Migration بعد الترحيل | الفارق (`Delta`) | حالة المطابقة |
|---|:---:|:---:|:---:|:---:|
| `users` | 58 | 58 | **0** | متطابق تماماً |
| `students` | 17 | 17 | **0** | متطابق تماماً |
| `parents` | 37 | 37 | **0** | متطابق تماماً |
| `applicants` | 29 | 29 | **0** | متطابق تماماً |
| `parent_student` | 37 | 37 | **0** | متطابق (0 duplicates) |
| `audit_logs` | 323 | 323 | **0** | متطابق تماماً |
| `password_resets` | 11 | 11 | **0** | متطابق تماماً |
| `attendance` | 36 | 36 | **0** | متطابق تماماً |
| `evaluations` | 8 | 8 | **0** | متطابق تماماً |
| `notifications` | 225 | 225 | **0** | متطابق تماماً |
| `payments` | 26 | 26 | **0** | متطابق تماماً |
| `sessions` | 25 | 25 | **0** | متطابق تماماً |
| `applicant_documents` | — | **0** | جديد فارغ | سليم |
| `document_upload_sessions` | — | **0** | جديد فارغ | سليم |
| `schema_migrations` | — | **1** | سجل التوثيق | `001` مسجل بنجاح |

---

## 12. Data Fingerprint Comparison (مقارنة البصمات الرقمية للبيانات)

تمت مطابقة بصمة SHA-256 للبيانات الحرجة قبل الترحيل وبعده:
- **بصمة جدول المستخدمين (`users`):**
  - قبل: `12b6d56dcd9c3df5f0b6c7b718953caf0c809483fb3d9e1a8406f1fd09f38264`
  - بعد: `12b6d56dcd9c3df5f0b6c7b718953caf0c809483fb3d9e1a8406f1fd09f38264` (**تطابق 100%**)
- **بصمة جدول الطلاب (`students`):**
  - قبل: `6bc686d5823df5ab83cacf0295640227fe4e75a2bd0668d76c3979fc771c0a8a`
  - بعد: `6bc686d5823df5ab83cacf0295640227fe4e75a2bd0668d76c3979fc771c0a8a` (**تطابق 100%**)
- **بصمة جدول المتقدمين (`applicants`):**
  - قبل: `0d3b1b1244d8617879c305f518b7cbf060f396ebccd558ea8b8423651f452132`
  - بعد: `0d3b1b1244d8617879c305f518b7cbf060f396ebccd558ea8b8423651f452132` (**تطابق 100%**)

---

## 13. SQLite Integrity Check (فحص سلامة قاعدة البيانات)
- نتيجة استعلام `PRAGMA integrity_check;`:  
  **`ok`** (سليمة وخالية تماماً من أي تلف في الملف أو الفهارس).

---

## 14. Foreign Key Check (فحص العلاقات الأجنبية)
- نتيجة استعلام `PRAGMA foreign_key_check;`:
  - الجداول الجديدة والمعدلة (`applicants`, `students`, `applicant_documents`, `document_upload_sessions`): **0 انتهاكات**.
  - أظهر الفحص حالتين سابقتين في جدول `password_resets` لصفوف تم تنظيف مستخدميها في اختبارات سابقة قبل Phase 2.4، وتمت مطابقتها بالنسخة الاحتياطية وثبت وجودها مسبقاً قبل الترحيل.

---

## 15. Unexpected Changes (التغييرات غير المتوقعة)
- **لا توجد أي تغييرات غير متوقعة**؛ تم تنفيذ الخطة المعتمدة في المواصفة المصححة حرفياً.

---

## 16. Rollback Status (حالة التراجع)
- **لم يُطلب التراجع ولم تدعُ الحاجة إليه** لنجاح كافة العمليات والفحوصات بنسبة 100%.
- النسخة الاحتياطية الأصلية المستقلة `institution_p24_d2_pre_migration_1790451590531.sqlite` محفوظة وجاهزة كضمانة تشغيلية دائمة.

---

## 17. Security Review (المراجعة الأمنية لمرحلة ما بعد الترحيل)
- لم يتم تسريب أي رمز أو مفتاح في قاعدة البيانات أو السجلات.
- لم يُنشأ مفتاح `DOCUMENT_ENCRYPTION_KEY` في هذه المرحلة.
- مسار فحص صحة الخادم `GET /api/health` مستقر ويعيد `HTTP 200 OK`.

---

## 18. Next Gate (البوابة التالية المقترحة)
**Phase 2.4-D3 — Post-Migration Verification & Integrity Audit:**  
إجراء التدقيق المستقل النهائي وتأكيد النزاهة الهندسية وعدم تكرار الترحيل والتطابق التام مع خط الأساس.

---

## 19. FINAL STATUS (الحالة النهائية للبوابة)

# 🟢 **`D2_MIGRATION_SUCCESS`**

---

## 20. FINAL DATA SAFETY STATEMENT (إقرار أمان البيانات النهائي)

- **Migration executed:** **YES**
- **Rows deleted:** **0**
- **Users deleted:** **0**
- **Students deleted:** **0**
- **Applicants deleted:** **0**
- **Parents deleted:** **0**
- **Documents created:** **0**
- **Raw tokens stored:** **0**
- **Encryption keys generated:** **0**

---
*(تم التوقف تماماً وفق التعليمات — لا انتقال لمرحلة D3، ولا رفع للوثائق، ولا توليد للمفاتيح، ولا تعديل للواجهات، بانتظار توجيهاتكم).*
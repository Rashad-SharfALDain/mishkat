# PHASE 2.4-D3 POST-MIGRATION VERIFICATION REPORT
## تقرير التدقيق والتحقق بعد الترحيل الهيكلي — مؤسسة مِشكاة التربوية والتعليمية

**المرحلة:** Phase 2.4-D3 Post-Migration Verification & Integrity Audit  
**تاريخ التحقق:** 26 سبتمبر 2026  
**طبيعة المرحلة:** **تدقيق وفحص ساكن في وضع القراءة الصارم فقط (Read-Only Verification — No Modifications)**  
**ملف قاعدة البيانات المفحوص:** `data/institution.sqlite`  
**المرجعية الأساسية:** `schema.sql` و `PHASE_2_4_C2_MIGRATION_SPEC_CORRECTED.md` و `PHASE_2_4_D2_DATABASE_MIGRATION_REPORT.md`  
**القرار النهائي للبوابة:** **`CHANGES_REQUIRED`**

---

## 1. Executive Summary (الملخص التنفيذي)
أُجري هذا التدقيق الهندسي المستقل والنهائي في وضع **القراءة الصارم (Read-Only)** على قاعدة البيانات `data/institution.sqlite` بعد تنفيذ الترحيل الهيكلي `001_p24_legal_name_documents`.

### ملخص النتائج المحققة:
1. **سلامة المخطط وعدم تكرار الترحيل (Idempotency):** الترحيل 001 مسجل مرة واحدة فقط في `schema_migrations`، وكافة أسماء الأعمدة في جميع الجداول فريدة بنسبة 100% (Duplicate columns = 0).
2. **سلامة التكامل البنيوي للملف (Integrity):** أعاد فحص `PRAGMA integrity_check;` النتيجة المطلوبة `ok`.
3. **أمان البيانات التاريخية والتحقق البشري:**
   - كافة المتقدمين (29/29) والطلاب (17/17) موسومون بـ `legacy_unverified` بنسبة 100%.
   - لا يوجد أي اسم رابع تم اختلاقه أو تخمينه (الحقول الأربعة بقيمة `NULL`).
   - لا توجد أي سجلات موثقة آلياً (`verified = 0`, `name_verified_by = NULL`).
4. **نزاهة قيد التفرد الأسري (`parent_student`):** عدد التكرارات هو **0**، والمؤشر الفريد `idx_parent_student_unique_pair` نشط ومفعل.
5. **تطابق النسخة الاحتياطية والبصمات:** تطابق بنسبة 100% لبيانات وسجلات وبصمات المستخدمين والطلاب والمتقدمين مقارنة مع النسخة الاحتياطية قبل الترحيل.
6. **فحص العلاقات الأجنبية (Foreign Key Check):** الجداول الجديدة والمعدلة بالترحيل 001 خالية تماماً من أي انتهاك (0 violations). ولكن الفحص الشامل للقاعدة كشف عن وجود انتهاكين سابقين في جدول `password_resets` (الصفان 8 و 9) لحساب تجريبي تم حذفه في جلسات سابقة. وبناءً على القاعدة الإلزامية بعدم الإصلاح التلقائي وتوثيق أي انتهاك، صُنفت البوابة كـ **`CHANGES_REQUIRED`** لاتخاذ قرار إداري بشأن تنظيف سجلات الاستعادة اليتيمة.

---

## 2. Scope (نطاق التحقق المنفذ)
- قراءة وتدقيق قاعدة البيانات في وضع Read-Only دون أي أمر كتابة (0 INSERT, 0 UPDATE, 0 DELETE, 0 ALTER, 0 DROP).
- عدم تشغيل الخادم قسرياً والاعتماد على الخادم المحلي القائم للفحص.
- عدم إصلاح أي خلل تلقائياً وتوثيق الوقائع بأدلتها الرقمية الفعلية.

---

## 3. Migration Idempotency (التحقق من عدم تكرار الترحيل)
- **الاستعلام المنفذ:**
  ```sql
  SELECT * FROM schema_migrations;
  ```
  **النتيجة الفعلية:**
  - `version`: `'001_p24_legal_name_documents'`
  - `name`: `'p24_legal_name_and_documents'`
  - `checksum`: `96455536e25b5b9ac71f77347abd6e454ba37809eb5cfb94264e1ecb42c2cb89`
  - `status`: `'success'`
  - **عدد السجلات في جدول الترحيلات:** **1 فقط**.
- **الخلاصة:** محاولة التشغيل الثانية تم تخطيها بنجاح وأمان (Skipped) ولم تنتج أي تكرار.

---

## 4. Schema Verification (التحقق الهيكلي من الجداول)
- **جدول `applicants`:** يتضمن 39 عموداً، تشمل الأعمدة الـ 14 الجديدة لحوكمة الاسم القانوني والتحقق البشري والاعتماد المزدوج.
- **جدول `students`:** يتضمن 25 عموداً، تشمل الأعمدة الـ 12 الجديدة لحوكمة الاسم والتحقق.
- **جدول `applicant_documents`:** يتضمن 23 عموداً مع ضبط كافة المفاتيح الأجنبية لتكون `TEXT`.
- **جدول `document_upload_sessions`:** يتضمن 10 أعمدة، معتمد على `token_hash` حصراً.

---

## 5. Database Integrity Check (فحص سلامة قاعدة البيانات)
- **الاستعلام المنفذ:**
  ```sql
  PRAGMA integrity_check;
  ```
- **القيمة المتوقعة:** `ok`
- **القيمة الفعلية المحققة:** **`ok`**
- **الحالة:** **PASS**

---

## 6. Foreign Key Check (فحص العلاقات الأجنبية والانتهاكات)
- **الاستعلام المنفذ:**
  ```sql
  PRAGMA foreign_key_check;
  ```
- **القيمة المتوقعة:** `0 violations`
- **النتيجة الفعلية التفصيلية:**
  - جداول الترحيل 001 (`applicants`, `students`, `applicant_documents`, `document_upload_sessions`, `parent_student`): **0 violations (صفر انتهاكات)**.
  - جدول `password_resets`: **2 violations** في الصفين (Row ID: 8, Row ID: 9).
    - السبب الدقيق: الصفان يتبعان لحساب تجريبي (`test.sec.muho74ky_9ad7b0fb.sup@test.mishkat.edu.sa` بالمعرف `5d410123-b551-4e68-9af9-aa48ebe820a4`) تم إنشاؤه أثناء اختبارات Hotfix السابقة وحُذف المستخدم عند تنظيف الجلسة دون تفعيل حذف سجلات الاستعادة التابعة له.
- **الإجراء المتخذ وفق التعليمات الإلزامية:** لم يتم إصلاح السجلين أو حذفهما تلقائياً، وتم توثيق الواقعة وتصنيف البوابة كـ **`CHANGES_REQUIRED`**.

---

## 7. Parent-Student Constraint (فحص قيد تفرد علاقات الولاية)
- **الاستعلام المنفذ:**
  ```sql
  SELECT parent_user_id, student_id, COUNT(*) AS c
  FROM parent_student
  GROUP BY parent_user_id, student_id
  HAVING COUNT(*) > 1;
  ```
- **النتيجة الفعلية:** **`duplicates = 0`** (صفر تكرارات عبر كافة السجلات الـ 37).
- **فحص الفهرس الفريد:** الفهرس `idx_parent_student_unique_pair` موجود في `PRAGMA index_list(parent_student)` ومعرّف كـ `unique = 1`.
- **الحالة:** **PASS**

---

## 8. Applicants Legal Name Verification (فحص الاسم القانوني للمتقدمين)

| الفحص (`Check`) | المتوقع (`Expected`) | الفعلي (`Actual`) | الحالة (`Status`) |
|---|:---:|:---:|:---:|
| إجمالي المتقدمين (`COUNT(*)`) | 29 | **29** | **PASS** |
| الموسومون بـ `legacy_unverified` | 29 | **29** | **PASS** |
| الموثقون تلقائياً (`verified`) | 0 | **0** | **PASS** |
| وجود اسم رابع (`legal_fourth_name NOT NULL`) | 0 | **0** | **PASS** |
| توثيق إداري مصطنع (`name_verified_by NOT NULL`) | 0 | **0** | **PASS** |
| وقت توثيق مصطنع (`name_verified_at NOT NULL`) | 0 | **0** | **PASS** |

---

## 9. Students Legal Name Verification (فحص الاسم القانوني للطلاب)

| الفحص (`Check`) | المتوقع (`Expected`) | الفعلي (`Actual`) | الحالة (`Status`) |
|---|:---:|:---:|:---:|
| إجمالي الطلاب (`COUNT(*)`) | 17 | **17** | **PASS** |
| الموسومون بـ `legacy_unverified` | 17 | **17** | **PASS** |
| الموثقون تلقائياً (`verified`) | 0 | **0** | **PASS** |
| وجود اسم رابع (`legal_fourth_name NOT NULL`) | 0 | **0** | **PASS** |
| توثيق إداري مصطنع (`name_verified_by NOT NULL`) | 0 | **0** | **PASS** |
| وقت توثيق مصطنع (`name_verified_at NOT NULL`) | 0 | **0** | **PASS** |

---

## 10. Legacy Data Verification (فحص ترحيل البيانات التاريخية)
- كافة المتقدمين الـ 29 تم نقل أسمائهم من `student_name` إلى `legal_full_name` بنسبة 100%.
- كافة الطلاب الـ 17 تم نقل أسمائهم بالدمج الفعلي الصحيح `COALESCE(u.name, a.student_name)` بنسبة 100%.
- بقيت الحقول الأربعة المجزأة (`legal_first_name`, `legal_second_name`, `legal_third_name`, `legal_fourth_name`) بقيمة `NULL`.

---

## 11. Fourth Name Safety (أمان حظر اختلاق الاسم الرابع)
- المتقدمون: `legal_fourth_name NOT NULL = 0` (صفر سجلات).
- الطلاب: `legal_fourth_name NOT NULL = 0` (صفر سجلات).
- **الخلاصة:** لم يتم توليد أو تخمين أي اسم رابع للأسماء التاريخية الثلاثية.

---

## 12. Human Verification Safety (أمان حظر التوثيق الوهمي)
- لا يوجد أي سجل يحمل حالة `verified`.
- لا توجد أي بيانات مصطنعة في حقول التدقيق الإداري.
- التحول إلى `verified` يتطلب مسار تدقيق بشري موثق بوثيقة هوية رسمية.

---

## 13. Token Security Verification (التحقق من أمان الرموز)
- تم فحص جدول `document_upload_sessions`:
  - عمود `token_hash` (`TEXT NOT NULL UNIQUE`): **موجود ومفعل**.
  - عمود `upload_token`: **غير موجود نهائياً**.
- فحص الأسرار في قاعدة البيانات والسجلات:
  - **`RAW_TOKEN_FOUND = NO`**
  - **`SECRET_PRESENT = NO`**

---

## 14. Document Table Verification (التحقق من جداول الوثائق)
- جدول `applicant_documents`:
  - عدد السجلات: **`0`** (فارغ وسليم).
  - المفاتيح الأجنبية `applicant_id`, `student_id`, `uploaded_by`, `verified_by`: جميعها **`TEXT`** تطابق معرفات UUID الأصلية.
- جدول `document_upload_sessions`:
  - عدد السجلات: **`0`** (فارغ وسليم).
  - المفتاح الأجنبي `applicant_id`: من نوع **`TEXT`**.

---

## 15. Duplicate Column Check (فحص عدم تكرار أسماء الأعمدة)

| اسم الجدول | إجمالي الأعمدة (`Total Cols`) | الأعمدة الفريدة (`Unique Cols`) | عدد الأعمدة المكررة | الحالة |
|---|:---:|:---:|:---:|:---:|
| `applicants` | 39 | 39 | **0** | **PASS** |
| `students` | 25 | 25 | **0** | **PASS** |
| `applicant_documents` | 23 | 23 | **0** | **PASS** |
| `document_upload_sessions` | 10 | 10 | **0** | **PASS** |
| `schema_migrations` | 6 | 6 | **0** | **PASS** |

---

## 16. Backup Comparison (المقارنة المباشرة مع النسخة الاحتياطية)
تمت المقارنة مع النسخة `data/backups/institution_p24_d2_pre_migration_1790451590531.sqlite`:
- **Users match:** **`TRUE`**
- **Students match:** **`TRUE`**
- **Applicants match:** **`TRUE`**
- **Parents match:** **`TRUE`**
- **Parent_Student match:** **`TRUE`**

---

## 17. Fingerprint Comparison (مقارنة البصمات الرقمية للبيانات)

| الكيان المفحوص | البصمة المسجلة في D2 | البصمة المحسوبة في D3 | النتيجة الفعلية |
|---|---|---|:---:|
| **USERS** | `12b6d56dcd9c3df5f0b6c7b718953caf0c809483fb3d9e1a8406f1fd09f38264` | `12b6d56dcd9c3df5f0b6c7b718953caf0c809483fb3d9e1a8406f1fd09f38264` | **`MATCH`** |
| **STUDENTS** | `6bc686d5823df5ab83cacf0295640227fe4e75a2bd0668d76c3979fc771c0a8a` | `6bc686d5823df5ab83cacf0295640227fe4e75a2bd0668d76c3979fc771c0a8a` | **`MATCH`** |
| **APPLICANTS** | `0d3b1b1244d8617879c305f518b7cbf060f396ebccd558ea8b8423651f452132` | `0d3b1b1244d8617879c305f518b7cbf060f396ebccd558ea8b8423651f452132` | **`MATCH`** |

---

## 18. Database Counts (جدول مقارنة أعداد السجلات)

| اسم الجدول (`Table`) | المتوقع (`Expected`) | الفعلي بعد D3 (`Actual`) | الفارق (`Delta`) | الحالة |
|---|:---:|:---:|:---:|:---:|
| `users` | 58 | **58** | 0 | **PASS** |
| `students` | 17 | **17** | 0 | **PASS** |
| `parents` | 37 | **37** | 0 | **PASS** |
| `applicants` | 29 | **29** | 0 | **PASS** |
| `parent_student` | 37 | **37** | 0 | **PASS** |
| `audit_logs` | 323 | **323** | 0 | **PASS** |
| `password_resets` | 11 | **11** | 0 | **PASS** |
| `attendance` | 36 | **36** | 0 | **PASS** |
| `evaluations` | 8 | **8** | 0 | **PASS** |
| `notifications` | 225 | **225** | 0 | **PASS** |
| `payments` | 26 | **26** | 0 | **PASS** |
| `sessions` | 25 | **25** | 0 | **PASS** |
| `applicant_documents` | 0 | **0** | 0 | **PASS** |
| `document_upload_sessions` | 0 | **0** | 0 | **PASS** |
| `schema_migrations` | 1 | **1** | 0 | **PASS** |

---

## 19. Application Health (فحص صحة التطبيق)
- تم تنفيذ الاستعلام عن مسار الصحة القائم دون تشغيل خوادم جديدة أو استخدام `npm.ps1`:
  ```text
  GET http://localhost:5000/api/health
  ```
- **النتيجة الفعلية:**
  - `status`: **`ok`**
  - `institution`: `'مؤسسة مِشكاة التربوية والتعليمية'`
  - `version`: `'1.0.0'`
  - **`APPLICATION_HEALTH_CHECK`**: **`PASS`**

---

## 20. Findings (الملاحظات الهندسية المسجلة)
1. نجاح الترحيل 001 بكفاءة متناهية، وثبات أعداد السجلات والبصمات الرقمية دون أي تغيير أو فقدان.
2. اكتشاف وجود سجلين يتيمين في جدول `password_resets` (الصفان 8 و 9) ورثا من جلسات اختبارات سابقة لحساب محذوف، وأظهرهما استعلام `PRAGMA foreign_key_check;`.

---

## 21. Required Changes (التعديلات والإجراءات المطلوبة قبل المرحلة التالية)
- إصدار توجيه إداري بشأن السجلين اليتيمين في `password_resets`:
  - إما اعتمادهما كسجلات تاريخية غير مؤثرة على تشغيل المرحلة 2.4 والاستمرار بها.
  - أو السماح بتنظيفهما ضمن سكريبت صيانة معتمد قبل بدء المرحلة D4.

---

## 22. جدول نتائج الفحوصات الفعلية (Actual Results Summary Table)

| الاختبار (`Test`) | القيمة المتوقعة (`Expected`) | القيمة الفعلية المحققة (`Actual`) | الحالة (`Status`) |
|---|---|---|:---:|
| `schema_migrations count` | 1 | **1** (`001_p24_legal_name_documents`) | **PASS** |
| `integrity_check` | `ok` | **`ok`** | **PASS** |
| `foreign_key_check (new tables)` | 0 violations | **0 violations** | **PASS** |
| `foreign_key_check (global DB)` | 0 violations | **2 pre-existing violations in password_resets** | **CHANGES_REQUIRED** |
| `parent_student duplicates` | 0 | **0** | **PASS** |
| `parent_student unique index` | Present (unique) | **`idx_parent_student_unique_pair` (unique: 1)** | **PASS** |
| `applicants total` | 29 | **29** | **PASS** |
| `applicants legacy_unverified` | 29 | **29** | **PASS** |
| `applicants verified` | 0 | **0** | **PASS** |
| `applicants legal_fourth_name` | 0 | **0** | **PASS** |
| `students total` | 17 | **17** | **PASS** |
| `students legacy_unverified` | 17 | **17** | **PASS** |
| `students verified` | 0 | **0** | **PASS** |
| `students legal_fourth_name` | 0 | **0** | **PASS** |
| `applicant_documents count` | 0 | **0** | **PASS** |
| `document_upload_sessions count` | 0 | **0** | **PASS** |
| `token_hash column` | Present | **Present (TEXT NOT NULL UNIQUE)** | **PASS** |
| `upload_token column` | Absent | **Absent (0 occurrences)** | **PASS** |
| `Duplicate columns in schema` | 0 | **0** | **PASS** |
| `Backup comparison (all 5)` | All TRUE | **Users, Students, Apps, Parents, PS: All TRUE** | **PASS** |
| `Fingerprints (Users, Stu, Apps)` | All MATCH | **All 3 MATCH** | **PASS** |
| `Application health` | status: 'ok' | **status: 'ok' (HTTP 200)** | **PASS** |

---

## 23. Final Gate (القرار النهائي لبوابة D3)

# 🟡 **`CHANGES_REQUIRED`**

*(صُنفت البوابة كـ `CHANGES_REQUIRED` التزاماً بالشرط الإلزامي الصارم: "إذا وجدت Foreign Key violation لا تصلحها، سجلها كـ CHANGES_REQUIRED"، وذلك لوجود صفين في جدول `password_resets` يرجعان لاختبارات سابقة، بانتظار توجيهكم المؤسسي بشأنها قبل الانتقال إلى D4).*

---

## 24. ZERO CHANGE GUARANTEE (إقرار الأمان المطلق لمرحلة D3)

- **Database modified by D3:** **NO**
- **Database rows modified by D3:** **0**
- **Database schema modified by D3:** **NO**
- **Users modified by D3:** **0**
- **Students modified by D3:** **0**
- **Applicants modified by D3:** **0**
- **Parents modified by D3:** **0**
- **Parent_Student modified by D3:** **0**
- **Documents created by D3:** **0**
- **Upload sessions created by D3:** **0**
- **Encryption key generated by D3:** **NO**

---
*(تم التوقف تماماً وفق التعليمات — لا انتقال لمرحلة D4، ولا بناء لـ Upload API، ولا إنشاء لواجهات الوثائق، ولا توليد لمفاتيح التشفير، بانتظار مراجعتكم وتوجيهاتكم).*

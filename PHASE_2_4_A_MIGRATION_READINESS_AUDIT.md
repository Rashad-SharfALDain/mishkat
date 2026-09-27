# PHASE 2.4-A MIGRATION READINESS AUDIT
## Pre-Implementation + Migration Readiness Audit & Design Validation Gate
**رمز التقرير:** `AUDIT-P2.4-A-READINESS-V1`  
**تاريخ المراجعة:** 26 سبتمبر 2026  
**طبيعة المرحلة:** فحص وتحليل وتدقيق جاهزية فقط (**Inspection & Analysis Only — No Implementation**)  
**المرجعية التصميمية:** `SPEC-MISHKAT-P2.4-V2`  
**حالة سويت الأمان المرجعي:** `test_security_hotfix.js` = **26/26 PASS (Exit Code 0)**  
**ملف قاعدة البيانات المفحوص:** `data/institution.sqlite`  

---

## 1. Executive Summary (الملخص التنفيذي)

أُجريت هذه المراجعة التقنية العميقة في وضع **القراءة والتحليل فقط (Read-Only)** استجابةً لمتطلبات مرحلة **Phase 2.4-A**، للتحقق الشامل من جاهزية البنية التحتية وقاعدة البيانات البرمجية قبل الشروع في أي عملية ترحيل (Migration) أو تعديل برمجي لتنفيذ حوكمة الأسماء الرباعية ومستودع الوثائق.

### الخلاصة التنفيذية والنتيجة:
- **النتيجة العامة للجاهزية:** **CONDITIONAL GO (موافقة مشروطة)**.
- **سلامة وتوافق المخطط (Schema Compatibility):** أثبت الفحص الساكن بنسبة 100% أن المخطط المقترح في `SPEC-MISHKAT-P2.4-V2` هو **تراكمي غير مدمر بالكامل (Fully Additive & Non-Destructive)**؛ ولن يؤدي إلى فقدان أي بيانات تاريخية.
- **نزاهة جدول العلاقات الأسرية (`parent_student`):** أثبت الفحص خلو الجدول من أي تكرار (`0 duplicates`)، مما يجعل إضافة قيد التفرد `UNIQUE(parent_user_id, student_id)` عبر المؤشر الفريد آمنة وجاهزة فوراً دون أي تعارض.
- **عوائق ما قبل التنفيذ (Pre-Implementation Blockers):**
  1. حزمة معالجة رفع الملفات متعددة الأجزاء (`multer` و `@types/multer`) **غير مثبتة حالياً** في `package.json`.
  2. مفتاح التشفير الساكن `DOCUMENT_ENCRYPTION_KEY` **غير معرّف** في ملف البيئة `.env`.
  3. المجلد التخزيني المعزول للوثائق `data/documents/` **غير موجود** على القرص حالياً.
  4. البيانات التاريخية (29 متقدماً و 17 طالباً) تحتوي على 26 اسماً ثلاثياً؛ مما يفرض وسمها كـ `legacy_unverified` للحفاظ على النزاهة دون اصطناع اسم رابع وهمي.

---

## 2. Current System State (حالة النظام والبيئة الحالية)

- **الخادم الخلفي:** يعمل محلياً على المنفذ `5000` تحت وضع الجلسة المؤقت `NODE_ENV=development`.
- **حالة الـ Health Check:** يعيد `HTTP 200 OK` ورسالة المؤسسة الرسمية بنجاح عبر `GET /api/health`.
- **سويت الأمان الحاكم:** ملف `test_security_hotfix.js` محصن ومعتمد وحقق `26/26 PASS` بـ `Exit Code 0`، ودلتا الجداول بعد تشغيله كانت `0` لكافة الجداول المؤسسية.
- **ملف قاعدة البيانات الفعلي:** `data/institution.sqlite` (الحجم: ~725 كيلوبايت)، وتتطابق مساراته بين التطبيق وسويت الاختبار.

---

## 3. Database Inventory (جرد الجداول والسجلات الحالية)

تم إجراء جرد شامل لكافة الجداول في `data/institution.sqlite` عبر استعلامات `SELECT count(*)` في وضع القراءة فقط:

| # | اسم الجدول (Table Name) | عدد السجلات الحالي (Baseline) | حالة الجدول ووظيفته في المنظومة |
|:---:|---|:---:|---|
| 1 | `users` | **58** | حسابات المستخدمين (مدراء، مشرفون، طلاب، أولياء أمور) |
| 2 | `applicants` | **29** | طلبات الالتحاق المرفوعة عبر البوابة |
| 3 | `students` | **17** | سجلات الطلاب المقبولين المعتمدين |
| 4 | `parents` | **37** | سجلات أولياء الأمور المرتبطين بالنظام |
| 5 | `parent_student` | **37** | روابط البنوة والولاية بين أولياء الأمور والطلاب |
| 6 | `audit_logs` | **323** | سجل الرقابة والتدقيق غير القابل للحذف (Append-Only) |
| 7 | `password_resets` | **11** | سجلات رموز استعادة كلمة المرور المشفرة بـ SHA-256 |
| 8 | `attendance` | **36** | سجلات رصد الحضور والغياب للجلسات |
| 9 | `attendance_excuses` | **9** | طلبات الأعذار المرفوعة من أولياء الأمور |
| 10 | `evaluations` | **8** | التقييمات التربوية النوعية والرقمية المرصودة |
| 11 | `evaluation_periods` | **2** | الفترات الأكاديمية وفصول التقييم |
| 12 | `evaluation_dimensions` | **5** | أبعاد ومحاور التقييم التربوي الخمسة |
| 13 | `sessions` | **25** | الجلسات والورش واللقاءات التعليمية المجدولة |
| 14 | `programs` | **4** | المسارات والبرامج التعليمية التأسيسية |
| 15 | `applications_programs` | **0** | جدول وسيط للربط المتعدد بين الطلبات والبرامج |
| 16 | `payments` | **26** | سجلات المساهمات وسداد الرسوم |
| 17 | `notifications` | **225** | إشعارات النظام الموجهة للمستخدمين |
| 18 | `activities` | **3** | الأنشطة والمبادرات التربوية التفاعلية |
| 19 | `student_activities` | **51** | تسليمات الطلاب ومشاركاتهم في الأنشطة |
| 20 | `courses` | **0** | المقررات الدراسية (بنية مستقبلية) |
| 21 | `course_modules` | **0** | وحدات المقررات (بنية مستقبلية) |
| 22 | `learning_resources` | **0** | مصادر التعلم والمكتبة (بنية مستقبلية) |
| 23 | `content` | **0** | إدارة المحتوى الثابت (بنية مستقبلية) |
| 24 | `faq` | **11** | بنك الأسئلة الشائعة وإجاباتها المعتمدة |
| 25 | `contact_messages` | **22** | رسائل التواصل الواردة عبر الموقع |
| 26 | `announcements` | **3** | الإعلانات الإدارية والتربوية المنشورة |
| 27 | `settings` | **19** | إعدادات وهوية المؤسسة وضوابط التسجيل |

**إجمالي الجداول القائمة:** 27 جدولاً.

---

## 4. Existing Schema Analysis (تحليل بنية الجداول المستهدفة)

### 4.1 جدول المتقدمين (`applicants`):
- **الأعمدة الحالية (25 عموداً):** `id`, `application_number`, `student_name`, `date_of_birth`, `gender`, `grade`, `school`, `city`, `phone`, `email`, `guardian_name`, `guardian_relationship`, `guardian_phone`, `guardian_email`, `academic_level`, `interested_tracks`, `motivation`, `skills`, `leadership_experience`, `status`, `internal_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.
- **القيود والفهارس:**
  - `sqlite_autoindex_applicants_1` (PRIMARY KEY: `id`).
  - `sqlite_autoindex_applicants_2` (UNIQUE: `application_number`).
- **الملاحظة التدقيقية:** لا توجد أي حقول للاسم القانوني المجزأ (`legal_*`)، ولا توجد حقول لتوثيق الوثيقة.

### 4.2 جدول الطلاب (`students`):
- **الأعمدة الحالية (13 عموداً):** `id`, `applicant_id`, `user_id`, `student_number`, `admission_date`, `academic_status`, `current_grade`, `current_level`, `educational_track`, `profile_photo`, `emergency_contact`, `created_at`, `updated_at`.
- **القيود والفهارس:**
  - `sqlite_autoindex_students_1` (PRIMARY KEY: `id`).
  - `sqlite_autoindex_students_2` (UNIQUE: `applicant_id`).
  - `sqlite_autoindex_students_3` (UNIQUE: `user_id`).
  - `sqlite_autoindex_students_4` (UNIQUE: `student_number`).
  - مفاتيح أجنبية: `user_id -> users(id)`, `applicant_id -> applicants(id)`.
- **الملاحظة التدقيقية:** الجدول لا يحتوي على أي حقول للاسم أو حالة التحقق الوثائقي.

### 4.3 جدول العلاقات الأسرية (`parent_student`):
- **الأعمدة الحالية (7 أعمدة):** `id`, `parent_user_id`, `student_id`, `relationship`, `is_primary`, `status`, `created_at`.
- **القيود والفهارس:**
  - `sqlite_autoindex_parent_student_1` (PRIMARY KEY: `id`).
  - مفاتيح أجنبية: `parent_user_id -> users(id)`, `student_id -> students(id)`.
- **الملاحظة التدقيقية:** يفتقر لقيد فريد على الزوج `(parent_user_id, student_id)`.

### 4.4 جدول سجل الرقابة (`audit_logs`):
- **الأعمدة الحالية (8 أعمدة):** `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`, `ip_address`.
- **الفهارس:** `idx_audit_logs_action`, `idx_audit_logs_user`.
- **الملاحظة التدقيقية:** البنية مرنة وجاهزة لاستقبال أحداث الوثائق والأسماء دون تعديل في أعمدة الجدول.

### 4.5 فحص وجود الجداول الجديدة:
- `applicant_documents`: **غير موجود (False)**.
- `document_upload_sessions`: **غير موجود (False)**.
- `schema_migrations`: **غير موجود (False)**.

---

## 5. V2 Requirement Mapping (مطابقة متطلبات V2 مع الواقع الحالي)

| # | المتطلب في SPEC V2 | الحالة الحالية في المخطط | الترحيل المطلوب (Migration Needed) | مستوى الخطر | تصنيف الخطر وإجراء المعالجة |
|:---:|---|---|---|:---:|---|
| 1 | **Legal Four-Part Name**<br>(`legal_first..fourth_name`) | غير موجودة | `ALTER TABLE applicants ADD COLUMN ...`<br>`ALTER TABLE students ADD COLUMN ...` | **LOW** | إضافة أعمدة تراكمية تقبل `NULL` دون المساس بالبيانات القديمة |
| 2 | **`legal_full_name`** | غير موجود | إضافة العمود في `applicants` و `students` | **LOW** | إضافة تراكمية آمنة |
| 3 | **`normalized_legal_name`** | غير موجود | إضافة العمود في `applicants` و `students` | **LOW** | حقل مشتق في الذاكرة يستخدم للفهرسة وكشف التكرار فقط |
| 4 | **`name_verification_status`** | غير موجود | إضافة العمود مع `DEFAULT 'pending'` في `applicants`<br>و `DEFAULT 'legacy_unverified'` في `students` | **LOW** | يضمن عدم ادعاء توثيق الأسماء القديمة كذباً |
| 5 | **`name_verified_by` & `at`** | غير موجودة | إضافة الأعمدة في `applicants` | **LOW** | حقول تدقيق بشري تراكمية |
| 6 | **`name_verification_notes`** | غير موجود | إضافة العمود في `applicants` | **LOW** | حقل ملاحظات إدارية تراكمي |
| 7 | **Second Approver Fields**<br>(`name_second_approver`, `at`) | غير موجودة | إضافة الأعمدة في `applicants` (جاهزية معمارية) | **LOW** | حقول اختيارية تدعم Four-Eyes عند تفعيلها إدارياً |
| 8 | **`applicant_documents` Table** | الجدول غير موجود | `CREATE TABLE IF NOT EXISTS applicant_documents` | **LOW** | إنشاء جدول جديد بالكامل مستقل عن الجداول القائمة |
| 9 | **`document_upload_sessions`** | الجدول غير موجود | `CREATE TABLE IF NOT EXISTS document_upload_sessions` | **LOW** | جدول جلسات الرفع المؤقتة (Anti-IDOR) |
| 10 | **`parent_student` Unique Index** | لا يوجد قيد تفرد حالياً | `CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair ON parent_student(parent_user_id, student_id)` | **LOW** | ثبت وجود 0 تكرارات؛ التنفيذ آمن بنسبة 100% |
| 11 | **`schema_migrations` Table** | الجدول غير موجود | `CREATE TABLE IF NOT EXISTS schema_migrations` | **LOW** | جدول تتبع الترحيلات المستقل |
| 12 | **Audit Events Expansion** | الأحداث الحالية لا تشمل الوثائق | لا يحتاج تعديل جدول؛ إضافة نصوص الأحداث في الكود | **LOW** | جدول `audit_logs` يستوعب الأحداث فورياً |
| 13 | **Report Data Source Update** | 18 استعلاماً تقرأ `a.student_name` | تحديث الاستعلامات لاعتماد `COALESCE` | **MEDIUM** | كود فقط دون تعديل في قاعدة البيانات |
| 14 | **Student Creation Verification Gate** | ينشئ الطالب فور كون الحالة 'مقبول' | إضافة شرط `name_verification_status === 'verified'` | **MEDIUM** | كود منطقي في `adminStudents.ts` |

---

## 6. Historical Data Analysis (تحليل البيانات التاريخية)

أظهر الفحص الاستقصائي الدقيق للبيانات التاريخية القائمة في `applicants` (29 سجلاً) و `students` (17 سجلاً) الحقائق الرقمية التالية:

1. **فحص حقول الأسماء:**
   - السجلات ذات الأسماء الفارغة أو `NULL`: **`0`** (جميع السجلات الـ 29 تحتوي على نص اسم).
2. **توزيع عدد كلمات الأسماء الحالية:**
   - أسماء تتكون من **3 كلمات:** **`26` سجلاً** (تمثل 89.6% من إجمالي المتقدمين).
   - أسماء تتكون من **5 كلمات:** **`3` سجلات** (تمثل 10.4% وتتضمن عبارة تجريبية "نموذج تجريبي").
   - أسماء تتكون من **4 كلمات:** **`0` سجلات** (لا يوجد أي اسم رباعي صريح حالياً في النظام!).
3. **تكرار الأسماء في الطلاب القائمين (17 طالباً):**
   - 16 طالباً يحملون الاسم الثلاثي: **"سليمان خالد الدوسري"** (ناتجون عن دورات الاختبار السابقة ببريد `sulaiman.d@example.com`).
   - طالب واحد يحمل الاسم: **"سعود عبدالعزيز الشمري (نموذج تجريبي)"**.
4. **الخلاصة التدقيقية للبيانات التاريخية:**
   - محاولة تجزئة الأسماء القديمة آلياً إلى أربعة أجزاء ستفشل حتماً لعدم وجود اسم الجد في 26 سجلاً.
   - **القرار المعماري الصائب المعتمد في V2:** عدم تجزئة الأسماء القديمة قسراً، وترحيلها كـ `legal_full_name = student_name`، مع إسناد حالة التحقق إلى **`legacy_unverified`** حصراً؛ لحماية استقرار الطلاب المقبولين سابقاً دون ادعاء توثيقهم بوثائق لم تُفحص.

---

## 7. Migration Impact Analysis (تحليل أثر الترحيل للبيانات القديمة)

- **السجلات القابلة للترحيل:** 100% من سجلات `applicants` (29 سجلاً) و `students` (17 سجلاً) مؤهلة للترحيل التوافقي.
- **خطر فقدان البيانات (Data Loss Risk):** **`0%`** (منعدم كلياً)؛ لأن استراتيجية الترحيل تراكمية بنسبة 100%، وتعتمد الإضافة فقط (`ADD COLUMN` و `CREATE TABLE IF NOT EXISTS`).
- **خطر كسر العلاقات (Foreign Keys Risk):** **`0%`**؛ لا يتم تعديل أي مفتاح أساسي أو أجنبي قائم.
- **أثر قيد التفرد على `parent_student`:** فحص الـ 37 علاقة أثبت وجود **صفر تكرارات**؛ مما يضمن أن تطبيق `CREATE UNIQUE INDEX` لن يتعارض مع أي سجل موجود ولن يرمي أي استثناء `ConstraintViolation`.

---

## 8. Document Security Readiness (جاهزية أمن الوثائق)

- **المجلد التخزيني `data/documents/`:** **غير موجود حالياً على القرص** (يتطلب إنشاؤه برمجياً أثناء التهيئة مع ضبط مسار معزول خارج جذر الويب).
- **حزم معالجة الملفات في `package.json`:**
  - مكتبة `multer`: **غير مثبتة** (Blocker).
  - مكتبة `@types/multer`: **غير مثبتة** (Blocker).
- **محرك فحص البايتات السحرية (Magic Bytes):** الكود الحالي لا يحتوي على دالة للتحقق الثنائي للبايتات؛ يتطلب تضمين دالة فحص الذاكرة في مسار الوثائق المستحدث.
- **خدمة الملفات الثابتة:** مجلد `data/` مستثنى تماماً من `express.static` في [server/src/index.ts](file:///g:/Antigravity/server/src/index.ts#L36) (حيث يُخدم فقط `public/images`)؛ مما يوفر عزلاً طبيعياً جاهزاً يمنع الوصول المباشر عبر الويب.

---

## 9. Encryption Readiness (جاهزية التشفير الساكن)

- **المتغير البيئي `DOCUMENT_ENCRYPTION_KEY`:** **غير موجود** حالياً في ملف `.env`.
- **معمارية التشفير المقترحة (`AES-256-GCM`):** يدعم محرك Node.js الداخلي `crypto` خوارزمية `aes-256-gcm` جاهزياً دون الحاجة لمكتبات خارجية.
- **خطر التخزين في المستودع:** يُحظر قطيعاً تضمين مفتاح التشفير في الكود أو ارتكابه في git؛ يجب توليد مفتاح عشوائي بطول 32 بايت (256-bit Hex) وتعيينه في `.env` المحلي غير المتتبع.
- **تصنيف الجاهزية:** متطلب تنفيذي مسبق (**Implementation Prerequisite**).

---

## 10. RBAC Readiness (جاهزية مصفوفة الصلاحيات)

- **دوال الميدلوير المتوفرة في [server/src/middleware/auth.ts](file:///g:/Antigravity/server/src/middleware/auth.ts):**
  - `requireStrictAdmin`: جاهزة ومطبقة وتفحص صراحة `role === 'admin'`.
  - `requireAdmin`: جاهزة للمشرفين والإدارة.
  - `requireStudent`: جاهزة ومحصنة.
  - `requireParent`: جاهزة ومحصنة.
  - `requireAuth`: جاهزة لفحص JWT العام.
- **المسارات المستهدفة في Phase 2.4:**
  - `POST /api/applicants/:id/documents`: محمي برمز جلسة الرفع `X-Upload-Session-Token` للمتقدمين أو `requireStrictAdmin` للإدارة.
  - `GET /api/documents/:id/view`: `requireStrictAdmin` حصراً (السياسة المحافظة المعتمدة).
  - `PATCH /api/admin/applicants/:id/verify-name`: `requireStrictAdmin` حصراً.
  - `GET /api/admin/applicants/:id/duplicate-check`: `requireStrictAdmin` حصراً.
  - `POST /api/admin/students/from-applicant/:id`: محمي مسبقاً بـ `requireStrictAdmin`.

---

## 11. Audit Trail Readiness (جاهزية سجل الرقابة)

- **طبيعة الجدول:** جدول `audit_logs` قائم ومفحوص وثبت أنه **Append-Only** ولا يمكن التلاعب به.
- **الأحداث المستحدثة المقررة:**
  - `UPLOAD_APPLICANT_DOCUMENT`
  - `VERIFY_STUDENT_DOCUMENT`
  - `REJECT_STUDENT_DOCUMENT`
  - `VERIFY_LEGAL_NAME`
  - `UPDATE_LEGAL_NAME`
  - `DUPLICATE_NAME_FLAGGED`
  - `DUPLICATE_NAME_REVIEWED`
- **حماية البيانات الحساسة:** حظر تمرير أي مسارات ملفات داخلية، أو مفاتيح تشفير، أو كلمات مرور في حقل `metadata`؛ واقتصار البيانات المسجلة على معرّفات العمليات ونوع الوثيقة والسبب الإداري.

---

## 12. Reports Impact (حصر الاستعلامات ومسارات التقارير المتأثرة)

يوضح الجدول التالي كافة المواضع التي تستدعي الاسم حالياً في الكود الخلفي، وصيغة الاستعلام المحدثة المطلوبة في V2:

| الملف (File) | المسار أو نوع الاستعلام | مصدر الاسم الحالي | مصدر الاسم المطلوب في V2 | مستوى الخطر |
|---|---|---|---|:---:|
| [`server/src/routes/attendance.ts:102`](file:///g:/Antigravity/server/src/routes/attendance.ts#L102) | `GET /sessions/:id/records` (كشف الحضور) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/attendance.ts:271`](file:///g:/Antigravity/server/src/routes/attendance.ts#L271) | `GET /students/:id/absences` (غيابات الطالب) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/attendance.ts:444, 491`](file:///g:/Antigravity/server/src/routes/attendance.ts#L444) | `GET /excuses` (مراجعة الأعذار) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/evaluations.ts:111`](file:///g:/Antigravity/server/src/routes/evaluations.ts#L111) | `GET /periods/:id/grades` (درجات التقييم) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/parent.ts:13, 53, 193`](file:///g:/Antigravity/server/src/routes/parent.ts#L13) | `GET /dashboard`, `/children` (لوحة ولي الأمر) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/student.ts:11, 84, 123`](file:///g:/Antigravity/server/src/routes/student.ts#L11) | `GET /dashboard`, `/profile` (لوحة الطالب) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/adminStudents.ts:225, 278`](file:///g:/Antigravity/server/src/routes/adminStudents.ts#L225) | `GET /students` (إدارة الطلاب) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/adminParents.ts:118`](file:///g:/Antigravity/server/src/routes/adminParents.ts#L118) | `GET /parents/:id` (أبناء ولي الأمر للإدارة) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |
| [`server/src/routes/adminUsers.ts:317`](file:///g:/Antigravity/server/src/routes/adminUsers.ts#L317) | `GET /users/:id` (تفاصيل المستخدم) | `a.student_name` | `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` | **LOW** |

---

## 13. Registration UI Impact (أثر واجهة تسجيل المتقدمين)

- **الملف:** [`src/components/RegistrationStepper.tsx`](file:///g:/Antigravity/src/components/RegistrationStepper.tsx).
- **الوضع الحالي:** يستقبل حقلاً واحداً `student_name` في الخطوة الأولى.
- **التعديل المخطط في V2:**
  1. تجزئة حقل الاسم في الخطوة 1 إلى 4 حقول واضحة:
     - `legal_first_name` (الاسم الأول)
     - `legal_second_name` (اسم الأب)
     - `legal_third_name` (اسم الجد)
     - `legal_fourth_name` (اسم العائلة / اللقب)
  2. دمج الأجزاء تلقائياً لإرسال `student_name` للمحافظة على التوافق مع مسار `POST /api/apply`.
  3. إضافة خطوة فرعية أو حقل تفاعلي لرفع الوثيقة الثبوتية فور إنشاء مسودة الطلب، مع التحقق من الحجم والامتداد في المتصفح قبل الإرسال.

---

## 14. Admin UI Impact (أثر واجهة مراجعة وتدقيق الطلبات)

- **الملف:** [`src/components/admin/ApplicantDetailModal.tsx`](file:///g:/Antigravity/src/components/admin/ApplicantDetailModal.tsx).
- **الوضع الحالي:** نافذة بطاقة تفاصيل تقليدية تتيح زر "إنشاء حساب الطالب" مباشرة بمجرد اختيار الحالة "مقبول".
- **التعديل المخطط في V2 (Dual Inspection UI):**
  1. إعادة تصميم النافذة لتنقسم إلى شقين بصرين متجاورين:
     - **الشق الأيمن:** بيانات المتقدم وأجزاء الاسم الرباعي وحقول التعديل الإداري قبل الاعتماد.
     - **الشق الأيسر:** عارض الوثيقة الرقمي الآمن (عارض PDF/صورة مدمج مع أدوات التكبير).
  2. شريط تنبيه كشف التكرارات (Duplicate Warning Banner) يظهر فوراً في حال تطابق الاسم المطبع مع طالب مسجل.
  3. **قفل زر إنشاء الطالب:** تعطيل زر `handleCreateStudent` بصرياً وبرمجياً حتى تصبح حالة توثيق الاسم `name_verification_status === 'verified'`.

---

## 15. parent_student Constraint Analysis (تحليل قيد التفرد)

- **عدد العلاقات الحالي في الجدول:** **37 علاقة**.
- **عدد التكرارات المكتشفة:** **`0` تكرارات (صفر قطعي)**.
- **سلامة التطبيق:** إضافة المؤشر الفريد:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair 
  ON parent_student(parent_user_id, student_id);
  ```
  تعتبر عملية آمنة بنسبة 100%، ولن تتطلب أي تنظيف مسبق، ولن تؤدي إلى أي فشل في قيود قاعدة البيانات.

---

## 16. Regression Safety (أمان عدم الانحدار وسويت الأمان)

- **حالة سويت الأمان المعتمد:**
  - تم فحص كود [test_security_hotfix.js](file:///g:/Antigravity/test_security_hotfix.js) والتأكد من عدم تغييره.
  - النتيجة المرجعية الموثقة هي **26/26 PASS** و **Exit Code 0**.
- **ضمانة عدم الانحدار في Phase 2.4:**
  - التعديلات في المخطط تراكمية بالكامل (`NULLABLE`) ولا تحذف أو تعدل أي عمود يعتمد عليه `test_security_hotfix.js`.
  - مسار `POST /api/admin/test-session/cleanup` وميدلوير `requireStrictAdmin` لن يُمسّا إطلاقاً.
  - لن يُعاد تشغيل أي اختبار كتابة خلال مرحلة الفحص الحالية لضمان استقرار قاعدة البيانات بنسبة 100%.

---

## 17. Risk Register (سجل المخاطر وخطة المعالجة)

| # | الخطر المحتمل | الاحتمالية | الأثر | خطة التخفيف والمعالجة الوقائية (Mitigation Strategy) |
|:---:|---|:---:|:---:|---|
| **R-01** | كسر استعلامات التقارير القديمة عند غياب الاسم القانوني | منخفض | مرتفع | استخدام دالة `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name)` لضمان القراءة السلسة. |
| **R-02** | عدم قدرة الطلاب القدامى على استيفاء الاسم الرباعي | مرتفع | متوسط | ترحيل السجلات التاريخية بحالة `legacy_unverified` وإتاحة تحديثها إدارياً عند طلب شهادة رسمية. |
| **R-03** | محاولة رفع ملفات ملغومة أو استهلاك مساحة القرص | منخفض | مرتفع | التحقق الصارم من Magic Bytes، تحديد 5MB كحد أقصى، وتخزين الملفات بأسماء UUID معزولة خارج الويب. |
| **R-04** | هجمات التخمين وتجاوز المعرفات (IDOR) في رفع الوثائق | متوسط | مرتفع | ربط الرفع برمز جلسة مؤقت وموقع تشفيرياً (`X-Upload-Session-Token`) بدلاً من الاعتماد على معرف المتقدم وحده. |
| **R-05** | حرمان أقارب يحملون نفس الاسم من التسجيل | متوسط | مرتفع | جعل التطبيع اللغوي أداة تنبيه وكشف تكرار (Soft Duplicate) مع إتاحة الاعتماد البشري المبرر. |

---

## 18. Required Preconditions (المتطلبات التنفيذية المسبقة قبل البدء)

يجب استيفاء المتطلبات الأربعة التالية قبل الانتقال إلى مرحلة التنفيذ (Phase 2.4-B):
1. **تثبيت حزم الرفع:** إضافة `multer` و `@types/multer` إلى `package.json` عبر أمر التثبيت الرسمي.
2. **إعداد مفتاح التشفير:** توليد وتعيين `DOCUMENT_ENCRYPTION_KEY` في ملف `.env` المحلي بطول 256 بت.
3. **تهيئة المجلد التخزيني:** إنشاء المجلد الداخلي المعزول `data/documents/` مع ضبط صلاحيات القراءة والكتابة لنظام التشغيل.
4. **اعتماد سياسة البيانات التاريخية:** إقرار الإدارة لوسم السجلات القديمة بـ `legacy_unverified`.

---

## 19. Proposed Implementation Order (ترتيب خطوات التنفيذ المقترح)

عند صدور أمر البدء بمرحلة التنفيذ (Phase 2.4-B)، تُنفذ الخطوات بالترتيب الهندسي الصارم الآتي:
1. **الخطوة 1:** تثبيت الحزم المطلوبة (`multer`, `@types/multer`) وتهيئة المجلد التخزيني ومفتاح البيئة.
2. **الخطوة 2:** تشغيل النسخ الاحتياطي التلقائي وتنفيذ سكريبت الترحيل التراكمي المستقل في `server/src/db/migrations/001_p24_governance.ts`.
3. **الخطوة 3:** بناء وحدة التطبيع اللغوي `normalizeArabicName` ومحرك فحص التكرارات في الـ Backend.
4. **الخطوة 4:** بناء مسار إدارة ورفع وتدفق الوثائق الآمن (`server/src/routes/documents.ts`) متضمناً التحقق من Magic Bytes ورموز الجلسات.
5. **الخطوة 5:** تحديث مسار `adminStudents.ts` لربط إنشاء حساب الطالب باكتمال التحقق البشري من الاسم والوثيقة.
6. **الخطوة 6:** تحديث استعلامات التقارير والشهادات في ملفات المسارات (Attendance, Evaluations, Parent, Student).
7. **الخطوة 7:** تحديث واجهات المستخدم (استمارة التسجيل ونافذة التدقيق الإداري المزدوج).
8. **الخطوة 8:** تشغيل سويت الاختبارات الشامل الجديد والتحقق من بقاء سويت الأمان `test_security_hotfix.js` بنسبة 26/26 PASS.

---

## 20. Blockers (حصر العوائق الفنية الحالية)

1. **حزمة Multer مفقودة:** مكتبة معالجة رفع الملفات `multer` و `@types/multer` غير موجودة في تبعيات المشروع (تمنع استقبال ملفات الوثائق برمجياً حالياً).
2. **مفتاح التشفير غير معرّف:** `DOCUMENT_ENCRYPTION_KEY` غير مسجل في `.env` (يمنع تطبيق التشفير الساكن للوثائق).
3. **مجلد التخزين غير موجود:** مسار `data/documents/` غير مهيأ على القرص.

---

## 21. GO / NO-GO Recommendation (التوصية النهائية لاعتماد البوابة)

بناءً على فحص كافة الأدلة البرمجية وقاعدة البيانات، تصدر بوابة المراجعة التصنيف التالي:

### ⚠️ النتيجة: **CONDITIONAL GO (موافقة مشروطة)**

#### الأسباب والأدلة الداعمة:
1. **أدلة الأمان المعماري:** لا يوجد أي تعارض هيكلي في قاعدة البيانات، ولا يوجد أي خطر لفقدان البيانات، وقيد `parent_student` جاهز بنسبة 100% لخلوه التام من التكرارات (0 duplicates).
2. **أسباب الاشتراط (Conditions to Clear):** لا يمكن البدء في كتابة كود المرحلة 2.4-B إلا بعد:
   - تثبيت حزمة `multer` و `@types/multer`.
   - تعيين `DOCUMENT_ENCRYPTION_KEY` في `.env`.
   - إنشاء مجلد `data/documents/`.
   - اعتماد الإدارة لخطة التعامل مع الأسماء القديمة كـ `legacy_unverified`.

---
**نهاية التقرير — Phase 2.4-A Migration Readiness Audit**

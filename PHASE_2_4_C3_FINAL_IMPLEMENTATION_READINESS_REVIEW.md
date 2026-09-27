# PHASE 2.4-C3 FINAL IMPLEMENTATION READINESS REVIEW
## المراجعة الهندسية المستقلة النهائية للجاهزية قبل التنفيذ — مؤسسة مِشكاة التربوية والتعليمية

**المرحلة:** Phase 2.4-C3 Final Implementation Readiness Review  
**تاريخ المراجعة:** 26 سبتمبر 2026  
**طبيعة المرحلة:** **مراجعة فنية مستقلة وتدقيق نهائي فقط — دون تنفيذ أي أمر على قاعدة البيانات أو الكود (NO EXECUTION)**  
**المرجعية الأساسية:** `schema.sql` و `PHASE_2_4_C2_MIGRATION_SPEC_CORRECTED.md` و `PHASE_2_4_C_MIGRATION_DRY_RUN.md`  
**الحالة النهائية للبوابة:** **`READY_FOR_IMPLEMENTATION_REVIEW`**

---

## 1. Executive Summary (الملخص التنفيذي)
أُجريت هذه المراجعة الهندسية المستقلة والنهائية لمواصفة الترحيل المصححة (`PHASE_2_4_C2_MIGRATION_SPEC_CORRECTED.md`) ومطابقتها المباشرة مع المخطط الأصلي للنظام (`server/src/db/schema.sql`) وقاعدة البيانات الحية (`data/institution.sqlite`).

### النتيجة الفنية العامة:
1. **المطابقة البنيوية الكاملة بنسبة 100%:** كافة أنواع المفاتيح الأجنبية (`TEXT`) تتطابق تماماً وبدون أي استثناء مع معرفات UUID في الجداول الأصلية.
2. **التحصين التام لرموز الجلسات:** تم استبعاد أي تخزين صريح للرموز المؤقتة واستبدالها بنظام البصمة المشفرة `token_hash` (SHA-256) مع سياسة انعدام الظهور (Zero-Exposure) في السجلات والـ Audit.
3. **أمان البيانات التاريخية والتحقق البشري:** تم تأكيد خلو استعلام الترحيل من أي افتراض خاطئ، ووسم كافة السجلات التاريخية صراحة بـ `legacy_unverified`، وتأكيد استحالة تحويل أي سجل آلياً إلى `verified`.
4. **نزاهة قيد التفرد الأسري:** تم التحقق برمجياً من وجود 0 تكرارات عبر كافة السجلات الـ 37 الحالية في `parent_student`، مما يجعل إنشاء المؤشر الفريد آمناً تماماً.
5. **جاهزية العبور للبوابة:** المواصفة مكتملة ومحصنة وجاهزة للمراجعة البشرية والاعتماد الإداري النهائي قبل بدء مرحلة التنفيذ.

---

## 2. Files Reviewed (الملفات التي تم فحصها كمرجع وحيد للحقيقة)

| اسم الملف | المسار | الدور في المراجعة |
|---|---|---|
| `schema.sql` | `server/src/db/schema.sql` | **المخطط المرجعي الأصلي للحقيقة (Source of Truth)** |
| `institution.sqlite` | `data/institution.sqlite` | **قاعدة البيانات الحية (Read-Only Inspection)** |
| `PHASE_2_4_C2_MIGRATION_SPEC_CORRECTED.md` | `g:/Antigravity/` | المواصفة الهندسية المصححة لملف الترحيل 001 |
| `PHASE_2_4_C_MIGRATION_DRY_RUN.md` | `g:/Antigravity/` | تقرير المحاكاة الجافة الأولي |
| `PHASE_2_4_B_INFRASTRUCTURE_READINESS_REPORT.md`| `g:/Antigravity/` | تقرير فحص البنية التحتية والنسخ الاحتياطي |
| `PHASE_2_4_A_MIGRATION_READINESS_AUDIT.md` | `g:/Antigravity/` | تقرير التدقيق المعماري الأول |

---

## 3. Schema Compatibility (التوافق مع المخطط الأصلي)
أثبتت المراجعة المقارنة بين `schema.sql` وقاعدة البيانات الحية ما يلي:
- **المعرفات الأساسية (Primary Keys):**
  - جدول `users`: المعرف `id TEXT PRIMARY KEY` (سطر 4 في schema.sql).
  - جدول `applicants`: المعرف `id TEXT PRIMARY KEY` (سطر 18 في schema.sql).
  - جدول `students`: المعرف `id TEXT PRIMARY KEY` (سطر 124 في schema.sql).
  - جدول `parents`: المعرف `id TEXT PRIMARY KEY` (سطر 166 في schema.sql).
  - جدول `parent_student`: المعرف `id TEXT PRIMARY KEY`، والحقول المرجعية `parent_user_id TEXT` و `student_id TEXT`.
- **طبيعة تعديلات الترحيل 001:**
  - كافة الأوامر هي `ALTER TABLE ADD COLUMN` بإضافة أعمدة قابلة لـ `NULL` وقيم افتراضية ثابتة.
  - لا يوجد أي أمر حذف (`DROP TABLE` / `DROP COLUMN`) أو إعادة تسمية (`RENAME`).
  - التوافق الهيكلي مع محرك SQLite ومخطط التطبيق هو **100%**.

---

## 4. Foreign Key Verification (التحقق الصارم من المفاتيح الأجنبية)

تمت مطابقة كافة العلاقات الجديدة مع المخطط المرجعي الأصلي `schema.sql` وأكدت المراجعة التطابق التام:

| الحقل الجديد في الترحيل 001 | نوع البيانات في الترحيل | الجدول المرجعي في `schema.sql` | نوع المفتاح المرجعي في المخطط الأصلي | حالة التطابق |
|---|:---:|---|:---:|:---:|
| `applicant_documents.applicant_id` | **`TEXT`** | `applicants` | `id TEXT` | **مطابق 100%** |
| `applicant_documents.student_id` | **`TEXT`** | `students` | `id TEXT` | **مطابق 100%** |
| `applicant_documents.uploaded_by` | **`TEXT`** | `users` | `id TEXT` | **مطابق 100%** |
| `applicant_documents.verified_by` | **`TEXT`** | `users` | `id TEXT` | **مطابق 100%** |
| `document_upload_sessions.applicant_id` | **`TEXT`** | `applicants` | `id TEXT` | **مطابق 100%** |
| `applicants.name_verified_by` | **`TEXT`** | `users` | `id TEXT` | **مطابق 100%** |
| `applicants.name_second_approver` | **`TEXT`** | `users` | `id TEXT` | **مطابق 100%** |
| `students.name_verified_by` | **`TEXT`** | `users` | `id TEXT` | **مطابق 100%** |

*الخلاصة:* تم القضاء نهائياً على أي مخاطر تعارض أنماط البيانات (Datatype Mismatch).

---

## 5. Token Security Review (مراجعة أمان رموز الجلسات)
- **غياب الرمز الخام عن قاعدة البيانات:** لا يحتوي جدول `document_upload_sessions` على أي عمود باسم `upload_token`؛ بل يعتمد حصراً على:
  ```sql
  token_hash TEXT NOT NULL UNIQUE
  ```
- **دورة حياة الرمز (Token Lifecycle):**
  1. توليد عشوائي بطول 256-bit عبر `crypto.randomBytes(32).toString('hex')`.
  2. حساب فوري للبصمة المشفرة `crypto.createHash('sha256').update(rawToken).digest('hex')`.
  3. تخزين `token_hash` فقط في قاعدة البيانات.
  4. إرسال الرمز الخام للعميل في استجابة الجلسة لمرة واحدة فقط.
- **حظر التسريب الصارم (Zero-Exposure Policy):**
  - **قاعدة البيانات:** لا يتم تخزين الرمز الخام في أي جدول أو حقل.
  - **السجلات العامة والخاصة (Console / App Logs):** محظور إدراج الرمز نهائياً.
  - **سجلات التدقيق (`audit_logs`):** يتم تسجيل `session_id` و `applicant_id` ونوع الحدث (`UPLOAD_SESSION_ISSUED`) دون إدراج الرمز.
  - **رسائل الاستثناءات والخطأ:** رسائل عامة محايدة (`403 Forbidden: Invalid or expired upload session`) دون عرض الرمز.
- **خصائص الحماية الإضافية:**
  - انتهاء الصلاحية التلقائي (`expires_at DATETIME NOT NULL` - 30 دقيقة).
  - الاستخدام الأحادي (`is_used = 1`, `used_at = CURRENT_TIMESTAMP`).
  - الربط بالمتقدم (`applicant_id`).
  - منع إعادة التشغيل (Replay Prevention).

---

## 6. Historical Backfill Review (مراجعة ترحيل الأسماء التاريخية)
- **إثبات عدم وجود `students.name`:** أكدت المراجعة في `schema.sql` (أسطر 123-139) وفحص الجدول الفعلي أن جدول `students` لا يحتوي على عمود باسم `name`.
- **صحة استعلام الاستخراج:** الاستعلام المعتمد في المواصفة المصححة يسحب الاسم بدقة وفق العلاقات الفعلية:
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
- **حظر تزييف الأسماء:**
  - لا يوجد أي تقسيم تخميني.
  - لا يوجد أي اختراع لاسم رابع.
  - الحقول الأربعة (`legal_first_name`, إلخ) تظل `NULL` لجميع السجلات القديمة.

---

## 7. Legacy Data Governance (حوكمة البيانات التاريخية والتحقق البشري)
- **حالة السجلات التاريخية:** وسم إلزامي لكافة السجلات التاريخية بـ `legacy_unverified`.
- **استحالة التوثيق التلقائي (No Fake Verification):** تم التحقق من أن سكريبت الترحيل لا يحتوي على أي أمر أو مسار يغير الحالة إلى `verified`.
- **الفصل بين ترحيل البيانات والاعتماد البشري:**
  - **Data Migration:** ترحيل تراكمي يحفظ الاسم الأصلي ويحدد الحالة كغير موثقة.
  - **Human Verification:** مسار إداري رقابي منفصل يعتمد على:
    - فحص وثيقة هوية رسمية مرفوعة.
    - مطابقة بصرية للحقول الأربعة.
    - تسجيل هوية المراجع (`name_verified_by`) ووقت التدقيق (`name_verified_at`).
    - تسجيل الحدث في `audit_logs`.
- **الاعتماد المزدوج (Four-Eyes Principle):** الحقول مصممة وموجودة (`name_second_approver`, `name_second_approved_at`) كخيار رقابي دون جعله عائقاً إلزامياً مجمداً للعمليات إلا بقرار مؤسسي.

---

## 8. Document Security Review (مراجعة أمان مستودع الوثائق)
- **العزل الجغرافي للملفات:** المجلد المستهدف `data/documents/` خارج مجلدات الويب العامة (`public/`, `dist/`).
- **حظر خوادم الملفات الثابتة:** لا يوجد أي وسيط `express.static` موجه لمجلد الوثائق.
- **إخفاء الهوية في نظام الملفات:** الملفات تخزن بأسماء عشوائية UUIDv4 مشفرة (`<uuid>.enc`).
- **القائمة البيضاء والتحقق المزدوج:**
  - الامتدادات المسموحة: `.pdf`, `.png`, `.jpg`, `.jpeg`.
  - فحص التواقيع الثنائية الحقيقية (Magic Bytes) لمنع الامتدادات الخادعة.
  - الحد الأقصى للحجم: 5 ميجابايت.
- **التشفير الساكن والنزاهة:**
  - التشفير: **AES-256-GCM** مع مفتاح 256-bit، ومتجه تهيئة عشوائي فريد لكل ملف (96-bit IV)، ووسم مصادقة (128-bit Auth Tag).
  - النزاهة: بصمة **SHA-256** منفصلة للمحتوى الأصلي للتحقق من عدم التلاعب بعد فك التشفير.
- **صلاحيات الوصول:** استعراض وتحميل الوثيقة الأصلية مقصور حصراً على المشرف الإداري بصلاحية `requireStrictAdmin`، بينما يُحجب الوصول المباشر عن الطلاب وأولياء الأمور ويقتصر عرضهم على حالة الوثيقة فقط.

---

## 9. Migration Safety Review (مراجعة سلامة عملية الترحيل)
- **الصبغة التراكمية:** الترحيل تراكمي بنسبة 100% (Additive).
- **حظر الحذف:** لا يوجد أي أمر `DROP TABLE` أو `DROP COLUMN` أو `DELETE`.
- **الاشتراطات المسبقة (Pre-migration Prerequisites):**
  - فحص سلامة النسخة الاحتياطية الموثقة `data/backups/institution_p24_preparation_1790450006741.sqlite`.
  - التحقق من سلامة SQLite عبر `PRAGMA integrity_check`.
- **المعاملة الذرية (Atomic Transaction):** تنفيذ كافة عمليات الـ SQL داخل كتلة `BEGIN IMMEDIATE TRANSACTION; ... COMMIT;` مع التراجع التلقائي `ROLLBACK;` عند حدوث أي خطأ لضمان عدم ترك أي أثر جزئي.
- **استراتيجية التراجع:**
  - التراجع التشغيلي (Logical Rollback): الترحيل تراكمي ولا يكسر الاستعلامات القديمة؛ لذا يمكن العودة للمنطق السابق بتعطيل المسارات الجديدة.
  - التعافي في الكوارث (Disaster Recovery): استعادة النسخة الاحتياطية الموثقة المجهزة سلفاً.

---

## 10. parent_student Constraint Review (مراجعة قيد التفرد)
- **الفحص الفعلي المقروء من قاعدة البيانات:**
  ```sql
  SELECT parent_user_id, student_id, COUNT(*) as c 
  FROM parent_student 
  GROUP BY parent_user_id, student_id 
  HAVING COUNT(*) > 1;
  ```
- **النتيجة المثبتة:** **0 تكرارات (0 duplicates)** عبر كافة السجلات الـ 37 الحالية.
- **أمر المؤشر الفريد المقترح:**
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_unique_pair ON parent_student(parent_user_id, student_id);`
- **حالة الأمان:** آمن 100% وجاهز للتطبيق دون أي خطر لتعارض البيانات.

---

## 11. Reporting Review (مراجعة مصادر الأسماء في التقارير)
- **مصدر الاسم المعتمد للتقارير المستقبلية:**
  `COALESCE(s.legal_full_name, a.legal_full_name, a.student_name, u.name)`
- **سلامة التقارير التاريخية:** استمرار ظهور الأسماء التاريخية كما هي تماماً دون أي تشويه أو اصطناع لأسماء رابعة مفقودة، مع ظهور الاسم الرباعي المعتمد للطلبات والطلاب الجدد.

---

## 12. Audit Trail Review (مراجعة سجل الرقابة والتدقيق)
- **الأحداث المجدولة للتسجيل في `audit_logs`:**
  - `UPLOAD_SESSION_ISSUED`
  - `DOCUMENT_UPLOADED`
  - `DOCUMENT_VERIFIED`
  - `DOCUMENT_REJECTED`
  - `LEGAL_NAME_VERIFIED`
  - `LEGAL_NAME_REJECTED`
  - `DUPLICATE_NAME_FLAGGED`
- **سياسة حماية البيانات الحساسة:**
  - يُحظر تسجيل كلمات المرور، أو الرموز المؤقتة الصريحة، أو مفاتيح التشفير، أو نصوص الوثائق المشفرة داخل عمود `metadata`.

---

## 13. Regression Compatibility (التوافق مع تحصينات الأمان السابقة)
أكدت المراجعة عدم وجود أي تعارض مع التحصينات الأمنية المعتمدة في سويت `test_security_hotfix.js`:
- مسار `POST /api/admin/test-session/cleanup` لم يُمس ويظل مخصصاً لبيئة الاختبار فقط.
- التحقق الصارم `requireStrictAdmin` مستمر ومحمي.
- تشفير رموز استعادة كلمة المرور (SHA-256) محفوظ دون تغيير.
- حظر الرمز التطويري في الإنتاج فعال.
- عزل بيانات أولياء الأمور والطلاب (Parent/Student Isolation) محصن بالكامل.

---

## 14. Required Future Test Matrix (مصفوفة الاختبارات التنفيذية المستقبلية)

تم تصميم مصفوفة الاختبارات الشاملة (20 اختباراً) لتنفيذها والتحقق منها برمجياً فور الدخول في مرحلة التنفيذ (Phase 2.4-D):

| المعرف | اسم الاختبار | الهدف من الاختبار | النتيجة المتوقعة |
|:---:|---|---|---|
| **TEST-A** | Four-part Legal Name Submission | إدخال اسم رباعي صحيح في الاستمارة | قبول الطلب وتخزينه وتطبيعه بنجاح |
| **TEST-B** | Missing Name Part Validation | إرسال اسم ينقصه أحد الأجزاء الأربعة | رفض الطلب بـ `400 Bad Request` |
| **TEST-C** | Historical `legacy_unverified` | فحص السجلات التاريخية بعد الترحيل | بقاء الحالة `legacy_unverified` والحقول الأربعة `NULL` |
| **TEST-D** | Valid Document Upload | رفع ملف PDF سليم برمز جلسة ساري | تخزين الوثيقة مشفرة وتسجيل الهاش |
| **TEST-E** | Invalid MIME Type | رفع ملف تنفيذي أو نصي بنوع غير مسموح | رفض الرفع فوراً بـ `400 Invalid Type` |
| **TEST-F** | Invalid Magic Bytes | رفع ملف بامتداد `.pdf` ولكن ترويسته `EXE` | كشف التزييف ورفض الملف بـ `400 Bad Content` |
| **TEST-G** | Oversized File (> 5MB) | محاولة رفع ملف أكبر من 5 ميجابايت | رفض الرفع فوراً بـ `413 Payload Too Large` |
| **TEST-H** | Expired Upload Token | استخدام رمز جلسة منتهي الصلاحية | رفض العملية بـ `403 Token Expired` |
| **TEST-I** | Replayed / Consumed Token | محاولة إعادة استخدام رمز جلسة تم استهلاكه | رفض العملية بـ `403 Token Already Consumed` |
| **TEST-J** | Wrong Applicant Token Binding | استخدام رمز صادر لمتقدم لرفع وثيقة لمتقدم آخر | رفض العملية بـ `403 IDOR Prevented` |
| **TEST-K** | Unauthorized Document Access | محاولة تحميل وثيقة بدون تسجيل دخول | رفض الوصول بـ `401 Unauthorized` |
| **TEST-L** | Supervisor Strict-Admin Bypass | محاولة مشرف عادي استعراض وثيقة أصلية | رفض الوصول بـ `403 Strict Admin Required` |
| **TEST-M** | Duplicate Normalized Name Flag | إدخال اسم يطابق اسماً مسجلاً بعد التطبيع اللغوي | تفعيل وسم التكرار وتنبيه الإدارة |
| **TEST-N** | Name Verification Audit | اعتماد اسم المتقدم من قبل الإدارة | تسجيل الحدث وتوثيق هوية المشرف في `audit_logs` |
| **TEST-O** | Document Verification Audit | اعتماد أو رفض وثيقة من قبل الإدارة | توثيق القرار وسببه في `audit_logs` |
| **TEST-P** | Parent/Student Isolation | محاولة ولي أمر استعراض بيانات طالب غير تابع له | حجب البيانات وتأكيد العزل التام |
| **TEST-Q** | Phase 2.1 Regression | فحص مسارات الطلاب والأنشطة والتقييمات | استمرار عملها بنسبة 100% |
| **TEST-R** | Phase 2.2 Regression | فحص مسارات الحضور والغياب والأعذار | استمرار عملها بنسبة 100% |
| **TEST-S** | Phase 2.3 Regression | فحص مسارات الإدارة وسجلات التدقيق والمصادقة | استمرار عملها بنسبة 100% |
| **TEST-T** | DB Integrity & Baseline Match | مقارنة أعداد كافة السجلات قبل وبعد العمليات | تطابق مطلق لكافة أعداد الجداول الأساسية |

---

## 15. Open Gaps & Required Changes (حصر النواقص والمتطلبات)
- **لا توجد أي نواقص معمارية في مواصفة الترحيل 001:** تم إغلاق كافة الملاحظات المتعلقة بأنواع البيانات، وتأمين الرموز، واستعلامات الـ Backfill.
- **متطلبات تشغيلية قبل كتابة الكود (Prerequisites before execution):**
  1. تثبيت حزمة `multer` و `@types/multer` في `package.json`.
  2. تعيين قيمة سرية آمنة لـ `DOCUMENT_ENCRYPTION_KEY` في ملف `.env` المحلي للخادم.

---

## 16. Future Implementation Sequence (تسلسل التنفيذ المقترح لمرحلة Phase 2.4-D)
عند صدور التوجيه الرسمي الصريح ببدء مرحلة التنفيذ، يتم اتباع الترتيب التالي:
1. **الخطوة 1:** تثبيت الحزم المطلوبة وتعيين مفتاح التشفير في البيئة المحلية.
2. **الخطوة 2:** إنشاء ملف الترحيل المستقل `server/src/db/migrations/001_p24_legal_name_documents.ts` وتنفيذه عبر معاملة ذرية.
3. **الخطوة 3:** التحقق الآلي الفوري من أعداد السجلات واجتياز `PRAGMA foreign_key_check`.
4. **الخطوة 4:** بناء خدمات الـ Backend (التطبيع، التحقق، رفع وتدفق الوثائق، ربط قبول الطالب بالتحقق).
5. **الخطوة 5:** تحديث واجهات الاستمارة وتدقيق الإدارة المزدوج وتحديث مسارات التقارير.
6. **الخطوة 6:** تشغيل مصفوفة الاختبارات الشاملة (A-T) وتأكيد بقاء سويت الأمان `test_security_hotfix.js` بنسبة **26/26 PASS**.

---

## 17. FINAL GATE (القرار النهائي لبوابة المراجعة C3)

# 🟢 **`READY_FOR_IMPLEMENTATION_REVIEW`**

*(المواصفة المعمارية لملف الترحيل 001 مستوفاة بالكامل، وخالية من أي تعارضات بنيوية أو أمنية، ومتوافقة بنسبة 100% مع المخطط المرجعي الأصلي وقاعدة البيانات الحية، وهي جاهزة تماماً للمراجعة الإدارية البشرية وإصدار إذن الانتقال لمرحلة التنفيذ).*

---

## 18. ZERO-CHANGE GUARANTEE (إقرار الضمان الصارم لعدم المساس بالنظام)

يُقر فريق المراجعة الهندسية بما يلي وبشكل قطعي ومثبت برمجياً:
- **Database modified:** **NO** (قاعدة البيانات لم تُعدل نهائياً).
- **Source modified:** **NO** (الكود المصدري لم يُعدل نهائياً).
- **.env modified:** **NO** (ملفات البيئة لم تُمس نهائياً).
- **Seed modified:** **NO** (ملفات البذر لم تُعدل نهائياً).
- **Packages installed:** **NO** (لم يتم تثبيت أي حزم برمجية).
- **Users created/modified:** **NO** (لم يُنشأ أو يُعدل أي مستخدم).
- **Students created/modified:** **NO** (لم يُنشأ أو يُعدل أي طالب).
- **Documents created:** **NO** (لم تُنشأ أو تُرفع أي وثائق).
- **Migration executed:** **NO** (لم يُنفذ أي ترحيل هيكلي إطلاقاً).
- **Real secrets exposed:** **NO** (لم يُولد أو يُطبع أو يُسرب أي مفتاح أو سر).

---
*(تم التوقف تماماً وفق التعليمات — لا انتقال لمرحلة التنفيذ إلا بعد المراجعة والاعتماد البشري الصريح).*

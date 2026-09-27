# PHASE 2.4-D3.1 FOREIGN KEY VIOLATION ROOT CAUSE REPORT
## تقرير التحقيق الجنائي والأدلة الرقمية لجذور مخالفات العلاقات الأجنبية — مؤسسة مِشكاة التربوية والتعليمية

**المرحلة:** Phase 2.4-D3.1 Prove Root Cause of `password_resets` FK Violations  
**تاريخ التحقيق:** 26 سبتمبر 2026  
**طبيعة المرحلة:** **تحقيق جنائي رقمي في وضع القراءة الصارم فقط (Read-Only Forensic Investigation — No Modifications)**  
**المرجعية:** `data/institution.sqlite` وقواعد النسخ الاحتياطية المسبقة لـ D2 و D1 و Phase 2.4-B  
**التصنيف الجذري للسبب (Root Cause Classification):** **`PRE_EXISTING_DATA_INTEGRITY_ISSUE`**

---

## 1. Executive Summary (الملخص التنفيذي)
أُجري هذا التحقيق الجنائي الرقمي المستقل في وضع **القراءة الصارم (Read-Only)** لإثبات السبب الجذري بالأدلة القطعية المقارنة للمخالفتين المرصودتين عبر استعلام `PRAGMA foreign_key_check;` في جدول استعادة كلمات المرور (`password_resets` للصفين 8 و 9).

### النتيجة الحاسمة المثبتة بالأدلة الرقمية:
1. **المخالفتان تاريخيتان وسابقتان لـ D2 قطيعاً (`PRE_EXISTING_VIOLATION`):**  
   أثبتت المقارنة الثنائية للنسخ الاحتياطية أن نفس المخالفتين ونفس الصفين (8 و 9) ونفس المفتاح الأجنبي كانت موجودة تماماً في:
   - النسخة الاحتياطية المأخوذة قبل ترحيل D2 مباشرة (`institution_p24_d2_pre_migration_1790451590531.sqlite`).
   - النسخة الاحتياطية المأخوذة قبل تثبيت حزم D1 (`institution_p24_d1_pre_install_1790451181744.sqlite`).
   - النسخة الاحتياطية المأخوذة في بداية المرحلة 2.4-B (`institution_p24_preparation_1790450006741.sqlite`).
2. **براءة الترحيل 001 براءة مطلقة ومثبتة برمجياً:**  
   أثبت الفحص الساكن للكود المصدري لملف الترحيل [001_p24_legal_name_documents.ts](file:///g:/Antigravity/server/src/db/migrations/001_p24_legal_name_documents.ts) أنه **لم يقرأ، ولم يكتب، ولم يعدل، ولم يحذف، ولم ينشئ أي علاقة تمس جدول `password_resets` نهائياً**.
3. **السبب الجذري الحقيقي (Root Cause):**  
   يعود سبب وجود الصفين اليتيمين إلى اختبارات أمنية سابقة نفذها سكريبت `test_security_hotfix.js` على مستخدم تجريبي (`test.sec.muho74ky_9ad7b0fb.sup@test.mishkat.edu.sa` بالمعرف `5d410123-b551-4e68-9af9-aa48ebe820a4`)؛ حيث قام مسار تنظيف جلسات الاختبار `POST /api/admin/test-session/cleanup` بحذف المستخدم من جدول `users` دون تفعيل الحذف المتتالي (Cascade) في بيئة SQLite لعدم تفعيل `PRAGMA foreign_keys = ON;` في جلسة التنظيف تلك، مما أبقى سجلي استعادة كلمة المرور يتيمين قبل بدء مرحلة Phase 2.4 بالكامل.

---

## 2. Exact Foreign Key (تحديد العلاقة الأجنبية المسؤولة بدقة)
تم الاستعلام عن تعريف العلاقات الأجنبية للجدول عبر:
```sql
PRAGMA foreign_key_list(password_resets);
```
**النتيجة الفعلية:**
- **الجدول التابع (Child Table):** `password_resets`
- **العمود التابع (Child Column):** `user_id`
- **الجدول الأصل المستهدف (Parent Table):** `users`
- **العمود الأصل المستهدف (Parent Column):** `id`
- **قاعدة التحديث (On Update):** `NO ACTION`
- **قاعدة الحذف (On Delete):** `CASCADE`
- **المعرف الفعلي للعلاقة:** `foreign key identifier = 0`

العلاقة الدقيقة المسببة للانتهاك هي:
```text
password_resets.user_id ──(REFERENCES)──> users.id
```

---

## 3. Affected Rows (فحص الصفين المتأثرين بأمان ودون كشف الأسرار)
تم فحص الصفين 8 و 9 عبر استعلام مقيد للبيانات الوصفية فقط مع حجب الرموز بالكامل (**MASK = YES**):

| Row ID | معرف السجل (`id`) | المعرف الأصل (`user_id`) | البريد الإلكتروني | تاريخ الإنشاء (`created_at`) | تاريخ الانتهاء (`expires_at`) | حالة الاستخدام (`used`) | سرية الرمز |
|:---:|---|---|---|---|---|:---:|:---:|
| **8** | `3a6ea42e-3274-48a5-b5b6-1e275b3e967a` | `5d410123-b551-4e68-9af9-aa48ebe820a4` | `test.sec.muho74ky...sup@test...` | `2026-09-26 00:47:29` | `2026-09-26T01:47:29.340Z` | 1 | **MASKED (SHA-256)** |
| **9** | `cf63e0d1-c28f-461c-965b-113b8abe7b0b` | `5d410123-b551-4e68-9af9-aa48ebe820a4` | `test.sec.muho74ky...sup@test...` | `2026-09-26 00:47:29` | `2026-09-26T01:47:29.351Z` | 0 | **MASKED (SHA-256)** |

---

## 4. Parent Record Status (حالة السجل الأصل في جدول المستخدمين)
- **المعرف الأصل المشترك للصفين 8 و 9:**  
  `user_id = '5d410123-b551-4e68-9af9-aa48ebe820a4'`
- **الاستعلام المنفذ للبحث في جدول المستخدمين:**
  ```sql
  SELECT id, name, email FROM users WHERE id = '5d410123-b551-4e68-9af9-aa48ebe820a4';
  ```
- **النتيجة الفعلية:** **`NONE (NOT FOUND)`** — السجل غير موجود نهائياً في جدول `users`.
- **التأكيد الجنائي:** غياب هذا السجل من `users` هو السبب المباشر الحصري الذي يجعل استعلام `PRAGMA foreign_key_check` يصنف الصفين 8 و 9 كـ orphan records.

---

## 5. Current Database Result (نتيجة الفحص في قاعدة البيانات الحالية)
- **قاعدة البيانات:** `data/institution.sqlite`
- **الاستعلام:** `PRAGMA foreign_key_check;`
- **المخرجات الفعلية:**
  ```json
  [
    ["password_resets", 8, "users", 0],
    ["password_resets", 9, "users", 0]
  ]
  ```
- **إجمالي الانتهاكات:** **2 انتهاكات** حصراً في جدول `password_resets`، وصفر انتهاكات في باقي جداول المنظومة.

---

## 6. D2 Pre-Migration Backup Result (فحص نسخة ما قبل ترحيل D2)
- **ملف النسخة الاحتياطية:** `data/backups/institution_p24_d2_pre_migration_1790451590531.sqlite` (أُخذت قبل لمس قاعدة البيانات في D2).
- **الاستعلام:** `PRAGMA foreign_key_check;`
- **المخرجات الفعلية:**
  ```json
  [
    ["password_resets", 8, "users", 0],
    ["password_resets", 9, "users", 0]
  ]
  ```
- **الدلالة القاطعة:** المخالفتان **كانتا موجودتين بنفس الصفوف وبنفس التفاصيل في النسخة الاحتياطية قبل بدء الترحيل 001**.

---

## 7. D1 Backup Result (فحص نسخة ما قبل تثبيت حزم D1)
- **ملف النسخة الاحتياطية:** `data/backups/institution_p24_d1_pre_install_1790451181744.sqlite` (أُخذت قبل تثبيت `multer`).
- **الاستعلام:** `PRAGMA foreign_key_check;`
- **المخرجات الفعلية:**
  ```json
  [
    ["password_resets", 8, "users", 0],
    ["password_resets", 9, "users", 0]
  ]
  ```
- **الدلالة القاطعة:** المخالفتان كانتا موجودتين قبل أي تعديل على `package.json` وقبل مرحلة D1 بأكملها.

---

## 8. password_resets Count Comparison (مقارنة أعداد السجلات عبر النسخ)

| قاعدة البيانات المفحوصة | عدد سجلات `password_resets` | عدد الانتهاكات | الصفوف المخالفة |
|---|:---:|:---:|:---:|
| **Current DB (`data/institution.sqlite`)** | **11** | **2** | Row 8, Row 9 |
| **D2 Pre-Migration Backup** | **11** | **2** | Row 8, Row 9 |
| **D1 Pre-Install Backup** | **11** | **2** | Row 8, Row 9 |
| **Phase 2.4-B Preparation Backup** | **11** | **2** | Row 8, Row 9 |

*الاستنتاج:* عدد سجلات الجدول هو 11 ثابتاً في كافة النسخ ولم يتغير إطلاقاً، والصفان 8 و 9 موجودان بنفس التاريخ والقيم عبر كافة النسخ.

---

## 9. Migration 001 Impact Analysis (تحليل أثر ملف الترحيل 001)
تم فحص الكود المصدري لملف الترحيل [server/src/db/migrations/001_p24_legal_name_documents.ts](file:///g:/Antigravity/server/src/db/migrations/001_p24_legal_name_documents.ts):
- **هل يقرأ `password_resets`؟** **`NO`** (لا يوجد أي استعلام SELECT للجدول).
- **هل يكتب أو يعدل في `password_resets`؟** **`NO`** (لا يوجد INSERT أو UPDATE).
- **هل يضيف أو يعدل FK في `password_resets`؟** **`NO`**.
- **هل يعدل أو يحذف أي صفوف من جدول `users`؟** **`NO`** (لم يمس صفوف المستخدمين نهائياً).
- **هل يحذف أي سجلات؟** **`NO`** (لا يحتوي الكود على أي أمر DELETE أو DROP).
- **خلاصة الفحص البرمجي:** الترحيل 001 **بريء براءة مطلقة بنسبة 100% من إحداث هذه المخالفة**.

---

## 10. Root Cause (السبب الجذري الحقيقي للانتهاك)
- **تصنيف السبب الجذري:** **`PRE_EXISTING_VIOLATION`**
- **السياق التاريخي لنشوء المخالفة:**  
  بتاريخ 26 سبتمبر 2026 الساعة `00:47:29` (أثناء تنفيذ سويت اختبارات الأمان `test_security_hotfix.js`)، قام سويت الاختبار بإنشاء حساب مشرف تجريبي تحت اسم مستخدم مؤقت لاختبار ثغرة استعادة كلمة المرور وتشفير الرموز، وأنشأ له طلبين في `password_resets` (الصفين 8 و 9). وعند قيام مسار `POST /api/admin/test-session/cleanup` بحذف بيانات الجلسة التجريبية، قام بحذف سجل المستخدم من `users` مباشرة، ولكن محرك SQLite الافتراضي لم يُفعّل الحذف المتتالي (Cascade Delete) على مستوى اتصال التنظيف، مما ترك السجلين 8 و 9 كـ orphaned records دون أب، وظلا محفوظين في قاعدة البيانات حتى كشفهما فحص `PRAGMA foreign_key_check;` في مرحلة D3.

---

## 11. Evidence Matrix (مصفوفة الأدلة الرقمية المقارنة)

| Evidence Item (بند الدليل) | Current DB | D2 Pre-Migration Backup | D1 Backup | Phase 2.4-B Backup | Conclusion (النتيجة القطعية) |
|---|:---:|:---:|:---:|:---:|---|
| **password_resets count** | **11** | **11** | **11** | **11** | السجلات ثابتة وتطابق 100% |
| **FK violations count** | **2** | **2** | **2** | **2** | الانتهاكات سابقة لـ D2 |
| **Row 8 exists & orphan** | **YES** | **YES** | **YES** | **YES** | موجود قبل الترحيل 001 |
| **Row 9 exists & orphan** | **YES** | **YES** | **YES** | **YES** | موجود قبل الترحيل 001 |
| **Parent record exists in `users`** | **NO** | **NO** | **NO** | **NO** | المستخدم محذوف سلفاً |
| **Migration 001 touches table** | **NO** | N/A | N/A | N/A | لا علاقة للترحيل بالجدول |

---

## 12. Data Safety Assessment (تقييم سلامة بيانات المؤسسة الحالية)
- لا يوجد أي خطر على بيانات الطلاب (17 طالباً)، أو أولياء الأمور (37 ولي أمر)، أو المتقدمين (29 متقدماً)، أو المستخدمين الفعليين (58 مستخدماً).
- كافة الجداول المتعلقة بالعملية التعليمية والحوكمة (`applicants`, `students`, `applicant_documents`, `document_upload_sessions`, `parent_student`) سليمة بنسبة 100% وتجتاز فحص العلاقات الأجنبية بـ **0 violations**.
- الصفان 8 و 9 منتهيا الصلاحية (`expires_at` انتهى في 26 سبتمبر 2026 الساعة 01:47 UTC)، ولا يمكن استخدامهما لاستعادة أي حساب، ولا يمثلان أي ثغرة أمنية أو خطراً تشغيلياً على النظام.

---

## 13. Recommended Remediation Options (خيارات المعالجة للمراجعة الإدارية)
*تُعرض الخيارات التالية للمراجعة فقط، ولم يُنفذ أي منها التزاماً بالقاعدة الصارمة:*

### الخيار أ (OPTION A):
**توثيق السجلين كـ legacy orphaned records وتركهما دون تعديل.**  
- **المزايا:** عدم لمس قاعدة البيانات نهائياً، والحفاظ الكامل على قاعدة عدم التعديل التلقائي.
- **العيوب:** سيظل استعلام `PRAGMA foreign_key_check` يظهر هاتين المخالفتين عند كل فحص شامل.

### الخيار ب (OPTION B):
**تنظيف السجلين بواسطة سكريبت صيانة مستقل ومخصص (Maintenance Cleanup Script) بعد أخذ نسخة احتياطية واعتماد إداري صريح.**  
- **الآلية:** تنفيذ أمر حذف مقيد للصفين المحددين بالمعرف فقط:
  ```sql
  DELETE FROM password_resets WHERE rowid IN (8, 9);
  ```
- **المزايا:** تنقية قاعدة البيانات ليصبح `PRAGMA foreign_key_check;` يعيد **`0 violations`** بالكامل وتصبح القاعدة نظيفة 100%.

### الخيار ج (OPTION C):
**استعادة سجل المستخدم التجريبي المحذوف فقط إذا وُجدت حاجة تشغيلية موثقة.**  
- **التقييم:** غير موصى به لأن الحساب تجريبي ومؤقت وانتهى الغرض منه.

---

## 14. Final Gate (القرار النهائي لبوابة D3.1)

# 🟢 **`PRE_EXISTING_DATA_INTEGRITY_ISSUE`**

*(ثبت بالأدلة الرقمية القاطعة في مصفوفة المقارنة أن مخالفتي العلاقات الأجنبية هما مشكلة تكامل بيانات سابقة وموروثة قبل مرحلة Phase 2.4-D2، وأن الترحيل 001 بريء منها تماماً ولم يحدث أي خلل أو انحدار في البيانات).*

---

## 15. ZERO CHANGE GUARANTEE (إقرار الضمان الصارم لعدم المساس بالنظام)

- **Database modified:** **NO**
- **password_resets modified:** **NO**
- **users modified:** **NO**
- **students modified:** **NO**
- **applicants modified:** **NO**
- **parents modified:** **NO**
- **Rows deleted:** **0**
- **Rows updated:** **0**
- **Rows inserted:** **0**
- **Migration rerun:** **NO**
- **Cleanup executed:** **NO**
- **Encryption key generated:** **NO**

---
*(تم التوقف تماماً — لم يتم حذف الصفين 8 و 9، ولم يتم تشغيل أي cleanup، ولم يتم الانتقال إلى D4 بانتظار توجيهكم الإداري بشأن اعتماد أحد خيارات المعالجة).*

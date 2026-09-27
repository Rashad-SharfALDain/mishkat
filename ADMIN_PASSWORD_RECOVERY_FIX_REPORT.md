# تقرير إصلاح استعادة كلمة مرور الإدارة ومعالجة خطأ addToast
## Admin Password Recovery Fix & Verification Report

**تاريخ التقرير:** 27 سبتمبر 2026  
**المشروع:** منصة مؤسسة مِشكاة التربوية والتعليمية  
**نطاق العمل:** إصلاح خطأ الواجهة (`TypeError: addToast is not a function`)، فحص مسار استعادة كلمة المرور، وتدقيق حساب الإدارة وإعدادات تسليم البريد الإلكتروني.

---

### 1. Root Cause of addToast Error (السبب الجذري لخطأ addToast)
- داخل سياق التطبيق الرئيسي [`src/context/AppContext.tsx`](file:///g:/Antigravity/src/context/AppContext.tsx)، كانت دالة إظهار التنبيهات معرّفة وممررة بالاسم `showToast` فقط ضمن واجهة `AppContextType` وقيمة المزود `AppContext.Provider`.
- في المقابل، اعتمدت واجهة استعادة كلمة المرور [`src/components/common/ResetPasswordModal.tsx`](file:///g:/Antigravity/src/components/common/ResetPasswordModal.tsx) (بالإضافة إلى أكثر من 10 مكونات أخرى داخل النظام مثل بوابة الطلاب وبوابة أولياء الأمور وإدارة المستخدمين) على استدعاء الدالة تحت اسم `addToast` عبر `const { addToast } = useApp()`.
- نتيجة عدم وجود `addToast` في كائن السياق المعار، كانت القيمة `undefined`، مما أدى عند استدعائها في السطر 92 (`addToast('تم استلام طلبك بنجاح', 'info')`) إلى الخطأ التالي في الواجهة:
  ```text
  TypeError: addToast is not a function
  ```

---

### 2. Frontend Component Affected (المكونات المتأثرة)
- **المكون الأساسي:** [`src/components/common/ResetPasswordModal.tsx`](file:///g:/Antigravity/src/components/common/ResetPasswordModal.tsx)
- **مزود السياق المركزي:** [`src/context/AppContext.tsx`](file:///g:/Antigravity/src/context/AppContext.tsx)
- **المكونات المستفيدة:** استفادت كافة مكونات النظام الأخرى التي تستخدم `addToast` (مثل [`StudentProfileView.tsx`](file:///g:/Antigravity/src/components/student/StudentProfileView.tsx)، [`ParentLoginModal.tsx`](file:///g:/Antigravity/src/components/parent/ParentLoginModal.tsx)، [`UsersPanel.tsx`](file:///g:/Antigravity/src/components/admin/UsersPanel.tsx)، إلخ) من معالجة التوافقية ومنع تكرار الخطأ.

---

### 3. Fix Applied (الإصلاح المطبق)
1. **في [`src/context/AppContext.tsx`](file:///g:/Antigravity/src/context/AppContext.tsx):**
   - إضافة `addToast` كدالة مرادفة لـ `showToast` في واجهة `AppContextType`.
   - توفير `addToast: showToast` داخل كائن `value` لمزود `AppContext.Provider`.
   - يضمن ذلك دعم الاستدعائين (`showToast` و `addToast`) بسلاسة دون كسر أي كود قائم.
2. **في [`src/components/common/ResetPasswordModal.tsx`](file:///g:/Antigravity/src/components/common/ResetPasswordModal.tsx):**
   - استخراج آمن للدوال: `const { addToast, showToast } = useApp();`
   - تطبيق دالة بديلة دفاعية: `const triggerToast = addToast || showToast || (() => {});`
   - تحديث نصوص التأكيد لتطابق متطلبات الواجهة الصارمة:
     - العنوان: **"تم استلام الطلب بنجاح"**
     - التوضيح: **"إذا كانت بيانات الحساب مطابقة، ستصل تعليمات الاستعادة إلى البريد المسجل."**
3. **التحقق من البناء والتجميع:**
   - تم تشغيل `npm run build` بنجاح كامل بدون أي أخطاء برمجية (`✓ built in 4.23s`).

---

### 4. Backend Recovery Flow (مسار الاستعادة في الواجهة الخلفية)
- نقطة النهاية: `POST /api/auth/forgot-password` في [`server/src/routes/auth.ts`](file:///g:/Antigravity/server/src/routes/auth.ts).
- **منع تعداد الحسابات (Anti-Enumeration):** الرد دائماً بـ HTTP 200 ورسالة موحدة عامة سواء كان الحساب مسجلاً أو غير مسجل.
- **تحديد معدل المحاولات (Rate Limiting):** حد أقصى 5 طلبات لكل 15 دقيقة لكل عنوان IP / معرّف عبر `checkRateLimit`.
- **توليد الرموز الآمنة:** توليد رمز عشوائي عالي الأمان مكون من 32 بايت (`crypto.randomBytes(32).toString('hex')`).
- **تشفير الرمز (SHA-256 Hashing):** لا يتم حفظ الرمز الخام إطلاقاً في قاعدة البيانات، بل يتم تشفيره وتخزين الهاش أحادي الاتجاه فقط في جدول `password_resets`.
- **الاستخدام الأحادي وانتهاء الصلاحية:** صلاحية الرمز محددة بـ 60 دقيقة فقط، ويصبح الرمز غير صالح فور استخدامه (`used = 1`) أو عند إصدار طلب استعادة جديد.
- **سجل التدقيق (Audit Logging):** تسجيل حدث `FORGOT_PASSWORD_REQUEST` بدون تسجيل أي رموز أو بيانات سرية.

---

### 5. Recovery Email Configuration (إعدادات بريد الاستعادة)
- تدقيق الكود في [`server/src/services/emailService.ts`](file:///g:/Antigravity/server/src/services/emailService.ts):
  - يعتمد إرسال البريد الحقيقي على توافر المتغيرات التالية في بيئة التشغيل:
    - `SMTP_HOST`
    - `SMTP_PORT`
    - `SMTP_USER`
    - `SMTP_PASSWORD`
    - `SMTP_FROM`
- **حالة فحص متغيرات البيئة في `.env` (دون كشف أي قيم):**
  - `SMTP_HOST` = not configured
  - `SMTP_PORT` = not configured
  - `SMTP_USER` = not configured
  - `SMTP_PASSWORD` = not configured
  - `SMTP_FROM` = not configured
- **النتيجة:**
  - `EMAIL_DELIVERY = NOT_CONFIGURED`
  - يعمل النظام حالياً بنمط المحاكاة المحلي (Simulated Dev Mode) حيث تُسجل رسائل البريد داخلياً في الذاكرة دون خروجها لخادم بريد فعلي.

---

### 6. Admin Account Configuration (بيانات حساب المدير والتعديل المقترح)
- تم فحص قاعدة البيانات [`data/institution.sqlite`](file:///g:/Antigravity/data/institution.sqlite) بأسلوب القراءة فقط (Read-Only):
  - **Current Admin Identifier:** `cc6b2eed-a4e2-42a3-9295-74beb50d7e97`
  - **Current Admin Name:** إدارة مؤسسة مِشكاة التربوية
  - **Current Role:** `admin` (Strict Admin)
  - **Current Status:** `active`
  - **Current Admin Email (Field: `users.email`):** `admin@mishkat.edu.sa`
  - **Target Recovery Email:** `20rashad21@gmail.com`

#### خيارات التعديل المقترحة (تنتظر موافقة المستخدم الصريحة قبل التنفيذ):
1. **الخيار الأول (تحديث حقل البريد المباشر):**
   ```sql
   UPDATE users
   SET email = '20rashad21@gmail.com', updated_at = CURRENT_TIMESTAMP
   WHERE id = 'cc6b2eed-a4e2-42a3-9295-74beb50d7e97';
   ```
   *ملاحظة:* في هذا الخيار، سيصبح اسم المستخدم لتسجيل الدخول وبريد الاستعادة كلاهما `20rashad21@gmail.com`.
2. **الخيار الثاني (إضافة حقل مخصص لبريد الاستعادة `recovery_email`):**
   ```sql
   ALTER TABLE users ADD COLUMN recovery_email TEXT;
   UPDATE users
   SET recovery_email = '20rashad21@gmail.com', updated_at = CURRENT_TIMESTAMP
   WHERE id = 'cc6b2eed-a4e2-42a3-9295-74beb50d7e97';
   ```
   *ملاحظة:* يتيح هذا الخيار بقاء تسجيل الدخول كـ `admin@mishkat.edu.sa` مع توجيه رسائل استعادة كلمة المرور فقط إلى `20rashad21@gmail.com`.

---

### 7. Security Controls Verified (الضوابط الأمنية التي تم التحقق منها)
| الضابط الأمني | الحالة | الملاحظة |
| :--- | :---: | :--- |
| `requireStrictAdmin` | ✅ محمي ومفعل | لم يتم المساس به |
| `RBAC Authorization` | ✅ محمي ومفعل | تم التحقق بنسبة 100% باختبارات الصلاحيات |
| `Password Reset Security Hotfix` | ✅ محمي ومفعل | كافة فحوصات الأمان نجحت 100% |
| `SHA-256 Token Hashing` | ✅ محمي ومفعل | الرموز تخزن كـ digest أحادي الاتجاه فقط |
| `Single-use Reset Tokens` | ✅ محمي ومفعل | رفض إعادة استخدام الرمز (HTTP 400) |
| `Token Expiry (60 mins)` | ✅ محمي ومفعل | رفض الرموز المنتهية (HTTP 400) |
| `Anti-Enumeration` | ✅ محمي ومفعل | رسالة موحدة لا تفصح عن وجود الحساب |
| `Rate Limiting` | ✅ محمي ومفعل | 5 طلبات / 15 دقيقة لكل عنوان أو مستخدم |
| `Zero Plaintext Exposure` | ✅ محمي ومفعل | لا يتم طباعة أي كلمة مرور أو رمز أو سر |

---

### 8. Email Delivery Status (حالة تسليم البريد)
```text
EMAIL_DELIVERY = NOT_CONFIGURED
```
- المنصة جاهزة برمجياً لإرسال البريد بمجرد إضافة بيانات الـ SMTP (مثل Gmail App Password أو خدمة SMTP مؤسسية) إلى ملف `.env`.
- لم يتم وضع أي كلمات مرور أو مفاتيح سرية في الكود المصدري.

---

### 9. Test Result (نتائج الاختبار الآمن)
1. **اختبار البناء للواجهة (Frontend Build):**
   - نجح بالكامل (`dist/` generated, 0 lint/typescript errors).
2. **اختبار واجهة استعادة كلمة المرور (UI Modal Flow):**
   - تم فحص استدعاء `triggerToast` والتأكد من اختفاء خطأ `TypeError: addToast is not a function`.
   - تظهر للمستخدم رسالة: **"تم استلام الطلب بنجاح"**.
   - تظهر للمستخدم إشارة الأمان: **"إذا كانت بيانات الحساب مطابقة، ستصل تعليمات الاستعادة إلى البريد المسجل."**.
3. **اختبار الواجهة الخلفية (Backend API Test):**
   - الرد بحالة HTTP 200 وبرسالة النجاح العامة.
   - عدم تسريب `token` أو `devToken` في الاستجابة.
   - التحقق من الرفض في حال كان المعرّف فارغاً (HTTP 400).
4. **حزمة اختبارات الأمان الشاملة ([`test_security_hotfix.js`](file:///g:/Antigravity/test_security_hotfix.js)):**
   - نجاح جميع بنود التدقيق بنسبة **100%**:
     - 10 اختبارات RBAC صارمة.
     - اختبارات تشفير واستخدام لمرة واحدة للرموز.
     - استعادة حالة قاعدة البيانات ومطابقتها التامة قبل وبعد الاختبار.

---

### 10. Files Modified (الملفات المعدلة)
1. [`src/context/AppContext.tsx`](file:///g:/Antigravity/src/context/AppContext.tsx): إضافة دعم `addToast` في واجهة السياق وتمريرها في المزود.
2. [`src/components/common/ResetPasswordModal.tsx`](file:///g:/Antigravity/src/components/common/ResetPasswordModal.tsx): استخدام الدالة بأمان دفاعي وتحديث نصوص واجهة الاستعادة.

---

### 11. Database Modified (هل تم تعديل قاعدة البيانات)
```text
Database Modified: NO
```
*(تم الامتناع عن تعديل حساب المدير في قاعدة البيانات التزاماً بالبند 5 من التعليمات حتى يتم عرض الخيارات والحصول على موافقة صريحة).*

---

### 12. Secrets Exposed (هل تم كشف أي أسرار)
```text
Secrets Exposed: NO
```
*(لم يتم كشف أو طباعة أو تسجيل أي كلمات مرور أو رموز استعادة أو بيانات اعتماد SMTP في السجلات أو الكود أو التقارير).*

---

### 13. Final Status (الحالة النهائية)
```text
EMAIL_CONFIGURATION_REQUIRED
```
*(تم إصلاح خطأ الواجهة `addToast` بنجاح واختبار مسار الاستعادة بأمان كامل، مع بقاء تسليم البريد الخارجي معتمداً على تزويد النظام بإعدادات الـ SMTP).*

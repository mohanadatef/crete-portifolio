# خطة العمل (محدّثة) — الحالة الحالية

تدقيق جديد على الكود الحالي (Laravel 12 + Angular 18 SSR). **فيه تقدّم كبير** — معظم الـ P0 القديمة اتقفلت. الباقي: مشاكل مفتوحة + مشاكل جديدة من الـ features. نقاط فقط: مشكلة → حل + المكان.

**الحالة:** قديم: 16 من ~21 اتقفل · لسه مفتوح: 6 · جديد: 9.

---

## ✅ اتقفل (تأكّد بالكود) — للعِلم

- XSS الـ GTM → اتصلّح (script element متحقّق منه). `seo.service.ts:58-101`
- XSS الـ landing → اتصلّح (شيل bypassSecurityTrustHtml). `landing-page.component.ts:156`
- Mass-assignment على leads → اتصلّح (blocklist). `LeadDTO.php:18`
- reCAPTCHA backend → اتصلّح (fail-closed في prod + submitForm بيتحقق). `RecaptchaService.php:24-49`
- سكربتات debug الخطيرة → اتحذفت كلها.
- CORS → بقى origins محدّدة. · N+1 على Project → اتشال · DB indexes → اتضافت · backups → اتظبطت (`config/backup.php`) · privacy_consent → بيتحقق ويتخزّن · Project SoftDeletes + casts · email الـ lead → ShouldQueue · TestController → اتحذف · interceptor مكرّر → اتوحّد · prod env للفرونت → اتعمل · SSR-unsafe layout → اتغلّف بـ isPlatformBrowser · canonical/hreflang → اتصلّح · composer stability → stable.

---

## 🔴 لسه مفتوح (لازم يتقفل)

- [ ] **reCAPTCHA على الفرونت لسه bypass** — لسه بيرجع للـ Google test key وبيبعت `'dev_bypass_token'` لو grecaptcha مش موجود → يتخطّى الحماية. → شيل الـ test key والـ dev_bypass؛ اقرأ الـ site key من environment؛ امنع الإرسال من غير توكن حقيقي. `contact.component.ts:82,133,146`
- [ ] **تسريب رسائل الـ exceptions** — لسه 40+ موضع بترجّع `$e->getMessage()` بـ 500. → سجّل داخليًا ورجّع رسالة عامة. `LeadController.php:41,206` · `SettingController.php:35` · `LandingPageController.php:139,150,171`
- [ ] **مفيش password reset** — مفيش route لنسيان/إعادة الباسورد. → أضف forgot/reset flow. `routes/api.php`
- [ ] **التوكن في localStorage** — قابل للسرقة بـ XSS. → httpOnly secure cookie. `auth.service.ts:19-21,37-49`
- [ ] **`alert()` للأخطاء** — لسه ~12 موضع. → toast/UI service موحّد. (settings, leads, projects, pages, contact:141)
- [ ] **Setting model من غير `$casts`** — قيم bool/json مش متكاست. → أضف `$casts`. `Setting.php`

---

## 🆕 مشاكل جديدة من الـ features

- [ ] **(P1) كتابة إعدادات حرّة — خطر تسريب/حقن بيانات اعتماد** — `updateBulk` بيمرّر `$request->all()` خام لـ `updateOrCreate` على **أي مفتاح** يبعته العميل، بما فيهم `recaptcha_secret_key` / `mail_password` / SMTP host. أي مستخدم عنده `edit-settings` يقدر يكتب مفاتيح حسّاسة (وبعدها تُقرأ في إعداد الميل). → حقّق ضد allow-list لمفاتيح معروفة عبر FormRequest قبل الحفظ. `SettingController.php:71` + `SettingService.php:38-46`
- [ ] **(P1) فورم الـ landing الديناميكي من غير حماية كافية** — لو الـ schema فاضية → `validate([])` مش بيتحقق من حاجة، والحقول القياسية بتتاخد من `$request->input()` بدون validation/طول/consent؛ و`$field['name']/['type']` بتتقري بدون `isset` → 500 لو الـ schema مشوّهة. → اشترط schema غير فاضية + isset guards + max lengths + privacy_consent زي مسار الـ JSON. `LandingPageController.php:90-128`
- [ ] **(P2) تسريب exception على مسار عام** — `submitForm` catch بيرجّع `$e->getMessage()` بـ 500 لزائر مجهول. → رسالة عامة + log. `LandingPageController.php:136`
- [ ] **(P2) route الـ export من غير permission middleware** — الحماية بـ `abort_unless` جوّا الكنترولر بس؛ refactor يشيلها يكشف كل الـ leads. → أضف `->middleware('permission:export-leads')` على الـ route. `routes/api.php:82`
- [ ] **(P2) عدّادات الـ dashboard مش مفلترة بالملكية** — وكيل عنده `view-unassigned-leads` بس بيشوف إجمالي كل الـ leads. → فلتر العدّادات بنفس scope الملكية. `DashboardController.php`
- [ ] **(P2) conversion id مكانه placeholder** — `gtag(... send_to:'AW-XX/lead')`. → اقرأه من settings/env أو شيله. `contact.component.ts:172`
- [ ] **(P3) عدّاد count-up من غير ngOnDestroy** — تايمر مش بيتمسح (memory leak بسيط). → أضف OnDestroy يمسح الـ interval. `home.component.ts:281`
- [ ] **(P3) كتابة على document في settings save بدون isPlatformBrowser** — آمن حاليًا بس وحّد الحماية. `settings.component.ts:278`

---

## الترتيب المقترح
1. reCAPTCHA frontend (شيل test key + dev_bypass).
2. كتابة الإعدادات الحرّة — allow-list (أخطر جديد).
3. حماية فورم الـ landing الديناميكي.
4. تسريب الـ exceptions (backend عام + public submitForm).
5. password reset + permission على export.
6. الباقي P2/P3 (casts, dashboard scope, alert→toast, localStorage, timers).

> الخلاصة: تحسّن واضح وحقيقي — الجاهزية الأمنية ارتفعت من ~5.5 لـ ~7.5/10. باقي بند P1 واحد قديم (reCAPTCHA frontend) + اتنين جديدين (settings write, landing form) لازم يتقفلوا قبل الإطلاق.

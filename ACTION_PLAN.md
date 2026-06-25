# خطة العمل — مشاكل وحلول (نقاط فقط)

مبنية على تدقيق كامل للكود (Laravel 12 modular + Angular 18 SSR). كل بند: **المشكلة → الحل + المكان**. اشطب وأنت بتنفّذ.

---

## 🔴 حرجة — P0 (تتقفل قبل أي إطلاق)

- [ ] **XSS مخزّن في حقن GTM**
  - المشكلة: `google_tag` بيتحقن كـ HTML خام في `<head>` عبر `createContextualFragment` → يتخطّى حماية Angular ويشغّل JS عشوائي على كل الصفحات.
  - الحل: ابني `<script>` element متحكّم فيه بـ container ID متحقّق منه فقط؛ بلاش حقن HTML خام.
  - المكان: `frontend/src/app/services/seo.service.ts:23-30`

- [ ] **XSS مخزّن عبر bypassSecurityTrustHtml**
  - المشكلة: محتوى الـ landing page الجاي من الـ API بيتعرض بـ `bypassSecurityTrustHtml` → stored XSS على صفحات الحملات.
  - الحل: استخدم `[innerHTML]="col.content"` مباشرة (Angular بينضّفه)، أو نضّف من السيرفر بـ allow-list.
  - المكان: `frontend/src/app/public/landing-page/landing-page.component.ts:143-145`

- [ ] **reCAPTCHA معطّل فعليًا**
  - المشكلة: بيعدّي لو التوكن فاضي/الـ secret تجريبي، وفيه `dev_bypass_token`، وفورم الـ landing page مفيهوش reCAPTCHA أصلاً.
  - الحل: fail closed (توكن مطلوب + تحقق `success && score>=0.5`، بلاش bypass)؛ شغّل نفس التحقق في `submitForm`؛ حط مفاتيح حقيقية في env وفضّيها في `.env.example`.
  - المكان: `backend/app/Services/RecaptchaService.php:22-29` · `LandingPageController.php:79` · `contact.component.ts`

- [ ] **Mass-assignment على الـ leads العامة**
  - المشكلة: المسار العام بيبني الموديل من `$request->except('recaptcha_token')`، و`status`/`assigned_to`/`landing_page_id` في `$fillable` → زائر مجهول يقدر يحدّدهم.
  - الحل: ابنِ الـ lead من whitelist صريح (`validated()` ناقص التوكن)؛ شيل الحقول الإدارية من المسار العام.
  - المكان: `backend/app/Modules/Lead/DTOs/LeadDTO.php:16-18` + `Lead/Models/Lead.php`

- [ ] **`.env` متسجّل + debug مفعّل**
  - المشكلة: `.env` موجود بـ `APP_DEBUG=true` ومفاتيح حقيقية؛ و`.env.example` افتراضه debug/local.
  - الحل: اتأكد إن `.env` مايترفعش (دوّر المفاتيح المكشوفة)؛ خلّي `.env.example` افتراضه `APP_ENV=production` و`APP_DEBUG=false`.
  - المكان: `backend/.env` + `backend/.env.example:2,4`

- [ ] **مفيش بيئة production للفرونت**
  - المشكلة: ملف واحد بس `environment.ts` بـ `apiUrl: http://backend.test` (دومين dev، HTTP)؛ مفيش `environment.prod.ts` ولا fileReplacements.
  - الحل: أضف `environment.prod.ts` بالـ API URL الحقيقي (HTTPS) + `fileReplacements` في إعداد production في `angular.json`.
  - المكان: `frontend/src/environments/environment.ts:2-4` + `angular.json`

---

## 🟠 عالية — P1

- [ ] **تسريب رسائل الـ exceptions** — `catch(Exception $e){ return $e->getMessage(),500 }` بيكشف تفاصيل SQL/داخلية ويحوّل كل خطأ لـ 500. → سجّل `$e` داخليًا، رجّع رسالة عامة، وسيب 404/422 يعدّوا. (كنترولرز Project/Blog/Page/Lead)
- [ ] **سكربتات debug خطيرة متسجّلة** — `check_perms.php`, `test_login.php` (فيه admin@admin.com/password), `fix_controllers.php`, `fix_routes.php`, `refactor.php`, `test_api.php`, `create_db.php`. → احذفهم كلهم. (repo + backend root)
- [ ] **التوكن في localStorage** — قابل للسرقة مع ثغرات الـ XSS. → استخدم httpOnly secure cookie؛ على الأقل اقفل الـ XSS الأول. (`auth.service.ts:19,38,49`)
- [ ] **CORS مفتوح** — `allowed_origins => ['*']`. → قصّرها على دومين الفرونت. (`config/cors.php:22`)
- [ ] **N+1 على Project** — `$appends=['images']` + accessor بيعمل query كل serialization. → شيل الـ appends/accessor واعتمد على `whenLoaded('projectImages')`. (`Project/Models/Project.php:33,42-45`)
- [ ] **مفيش DB indexes** — على `status`/`featured`/FK/`created_at` رغم إن كل القوايم بتفلتر/ترتّب عليهم. → أضف composite indexes. (`database/migrations/*`)
- [ ] **التوكن مالوش انتهاء + مفيش reset password** — مفيش `config/sanctum.php` (expiration null, abilities `*`). → حدّد expiration + abilities، وأضف flow لإعادة الباسورد.
- [ ] **CI مكرّر/مكسور** — 3 workflows متداخلة، واحد MySQL بدون DB creds، ومفيش build للفرونت. → خلّيهم واحد + ظبط الـ creds + أضف `npm ci && ng build`. (`.github/workflows/*`)
- [ ] **composer minimum-stability: dev** — بيسمح بنسخ غير مستقرة في الإنتاج. → خلّيها `stable`. (`backend/composer.json:78`)
- [ ] **كود SSR غير آمن** — `getBrowserLang()` وكتابة على `document.documentElement` في الـ constructor بدون `isPlatformBrowser`. → غلّفهم بـ `isPlatformBrowser(PLATFORM_ID)`. (`public-layout.component.ts:36,76-117`)
- [ ] **SEO meta مش في الـ SSR HTML** — `SeoService` بيعدّل DOM بعد الـ hydration، و home/project-details مش بيحطّوا meta. → حط title/meta/OG لكل route أثناء الـ SSR (resolver/ngOnInit بقيم حقيقية).
- [ ] **interceptor مكرّر** — اتنين، المسجّل بيعالج 401 بس، التاني dead وبيقرأ مفتاح غلط. → احذف غير المستخدم ووحّد معالجة الأخطاء. (`app.config.ts:9,25`)
- [ ] **`vendor/` و`dist/` متسجّلين + `.gitignore` مكسور (UTF-16)** → `git rm --cached` ليهم، وأعد كتابة `.gitignore` بـ UTF-8 (أضف `dist/`, `.idea/`, `.env`).
- [ ] **الـ backups مش مظبوطة** — الباكدج موجود بس `config/backup.php` مش منشور. → انشر واظبط الإعداد وأكّد `backup:run`.
- [ ] **privacy_consent مش متحقّق منه ولا متخزّن** — موثّق كـ required بس مفيش rule ولا عمود. → أضف `privacy_consent => accepted` وخزّن timestamp للموافقة. (`StoreLeadRequest` + Lead model)

---

## 🟡 متوسطة / منخفضة — P2 / P3

- [ ] **مفيش `$casts`** على Project/BlogPost/Setting (bool/decimal/date). → أضف casts صريحة.
- [ ] **Project بيتحذف نهائي** (مفيش SoftDeletes) عكس Lead. → أضف SoftDeletes لـ Project أو وثّق القرار.
- [ ] **import مكسور** `use App\Models\User;` في Lead model. → صحّحه أو احذفه.
- [ ] **envelopes غير متسقة** — ProjectType/Dashboard بيرجّعوا شكل JSON مختلف. → وحّدهم على `successResponse`.
- [ ] **موديول Blog خارج النمط** — بيعتمد على service مونوليثي بدون Services/Requests محلية. → قسّمه زي باقي الموديولات.
- [ ] **إيميل الـ lead بيتبعت sync** — بيبطّأ الطلب العام. → خلّي الـ Mailable `ShouldQueue`.
- [ ] **`views_count` increment** على كل عرض بدون throttle. → أجّله لـ queued job أو throttle.
- [ ] **email مطلوب** بينما المفروض nullable (يرفض leads بتليفون بس). → خلّيه `nullable|email`.
- [ ] **`/admin/media` و`/admin/dashboard` auth بس** بدون permission. → أضف `permission:upload-media` / `view-dashboard`.
- [ ] **canonical base URL ثابت + hreflang لـ `/ar` مش موجود**. → استخرج الـ origin من الطلب، واطلع hreflang لروابط حقيقية بس.
- [ ] **Authorization headers يدوية في كومبوننتات الأدمن** → "Bearer null" لما مفيش login. → اعتمد على الـ interceptor.
- [ ] **`alert()` للأخطاء + بدون retry/timeout** → أضف toast service + retry على الـ GETs.
- [ ] **~25 `console.error`** متسيبين. → وجّههم لـ logger واشيلهم في الإنتاج.
- [ ] **نقص accessibility في الفورمات** — `for/id` و`aria-invalid`/`role=alert`. → أضفهم.
- [ ] **tests الفرونت كلها scaffolding فاضي** (`toBeTruthy()` بس) + backend 3 tests رفيعة. → أضف tests حقيقية.
- [ ] **TestController فاضي متسجّل**. → احذفه.

---

## الترتيب المقترح
1. الـ XSS الاتنين (P0-1, P0-2).
2. reCAPTCHA (fail closed + landing form + مفاتيح حقيقية).
3. Mass-assignment على الـ leads.
4. شيل `.env`/سكربتات الـ debug + ظبط defaults.
5. بيئة production للفرونت (HTTPS).
6. باقي أمان/إعداد الـ P1 (exceptions, CORS, token expiry, localStorage, backups, consent, indexes, N+1).
7. CI + tests حقيقية + وقف تتبّع vendor/dist.
8. P2/P3 كـ hardening.

> الجودة الهندسية عالية، بس دي عيوب أمان/إعداد حقيقية مش polish. اقفل P0 + أمان P1 قبل الإطلاق.

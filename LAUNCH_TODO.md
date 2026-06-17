# Launch To-Do — Real Estate Website

**كل المطلوب المتبقي قبل وبعد الإطلاق.** الحالة بعد Round 6: مفيش bugs حرجة في الكود — فاضل blockers بسيطة + polish.
اشطب `[ ]` ← `[x]` وأنت بتخلّص.

- Reviewed: working tree @ 17 June 2026
- Legend: **P1** = launch blocker · **P2** = post-launch polish

---

## 🚦 لازم قبل الإطلاق (P1)

### [ ] 1. RECAPTCHA-KEYS — بدّل المفاتيح التجريبية بمفاتيح حقيقية
دلوقتي مستخدم مفاتيح Google التجريبية (`6LeIxAcTAAAA...`) — دايمًا بترجّع success، يعني **مفيش حماية سبام حقيقية**، ولو حطّيت secret حقيقي مش متطابق هترفض كل الـ leads.

- [ ] استخرج site key + secret key حقيقيين من Google reCAPTCHA v3 admin.
- [ ] **Frontend** — بدّل الـ site key في مكانين:
  - `frontend/src/index.html` (سطر سكربت الـ api.js)
  - `frontend/src/app/public/contact/contact.component.ts` (داخل `grecaptcha.execute(...)`)
```html
<!-- index.html -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_REAL_SITE_KEY"></script>
```
```ts
// contact.component.ts
(window as any).grecaptcha.execute('YOUR_REAL_SITE_KEY', { action: 'submit' })
```
- [ ] **Backend** — حط الـ secret الحقيقي في `.env` وشيل الـ fallback الوهمي:
```
RECAPTCHA_SECRET_KEY=YOUR_REAL_SECRET_KEY
```
- [ ] **شيل مسار `'fallback_token'`** في `onSubmit()` — بدّله برسالة خطأ واضحة للمستخدم بدل ما يبعت توكن هيترفض بـ 422.
- [ ] اختبر: lead حقيقي يتسجّل (201)، وبوت/توكن فاضي يترفض (422).

### [ ] 2. QA-01 — Feature tests + CI
أهم حاجة بتديك أمان. كل الـ regressions اللي حصلت كان تيست واحد هيمسكها.

- [ ] tests على مسار الـ lead والـ auth:
```bash
php artisan make:test LeadSubmissionTest
```
```php
// Http::fake() لـ siteverify ثم:
// valid + captcha pass  -> 201 و الصف اتسجّل في DB
// captcha fail          -> 422
// delete بدون confirm   -> 422
// login غلط 6 مرات      -> 429 (throttle)
```
- [ ] CI (GitHub Actions) يشغّل `php artisan test` على كل push:
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.2' }
      - run: cd backend && composer install --no-interaction
      - run: cd backend && cp .env.example .env && php artisan key:generate
      - run: cd backend && php artisan test
```

---

## ✅ بعد الإطلاق — Polish (P2)

### [ ] PERF-01 — تحسين الصور
- [ ] thumbnails / responsive variants + WebP عند الرفع (مثلًا `intervention/image`).
- [ ] lazy-load + CDN قدّام الميديا.

### [ ] OPS-02 — Staging + استضافة SSR
- [ ] بيئة staging مطابقة للـ production.
- [ ] وثّق طريقة تشغيل الـ SSR (Node runtime) ودومين الـ API vs الفرونت.

### [ ] PM-01 — OpenAPI / Swagger
- [ ] وثّق كل الـ v1 endpoints في spec واحد (مثلًا `l5-swagger`) مرجع للفريقين.

### [ ] UX-01 — فلترة المشاريع (الواجهة)
- [ ] شريط فلترة على صفحة المشاريع (location, type, status, price range). الباك إند بيدعمها بالفعل (`paginate` + query).

### [ ] SEC-08b — `$fillable` على باقي الموديلات
- [ ] تأكد إن Lead / BlogPost / BlogCategory / LandingPage / Page بتستخدم `$fillable` صريح بدل `guarded = []`.

### [ ] BE-05b — Form Requests لباقي الكنترولرز
- [ ] انقل الـ inline validation في blog / landing / page / settings لـ Form Requests.

### [ ] media table — فعّل تسجيل الصف
- [ ] في `MediaController@store` فعّل `Media::create([...])` (السطر دلوقتي commented) عشان جدول `media` يتسجّل فيه فعليًا.

### [ ] DOC-01 — قرار لغة الداشبورد
- [ ] اقفل: الداشبورد إنجليزي بس ولا ثنائي اللغة؟ وحدّث الـ scope.

---

## خلاصة
- **اعمل البندين بتوع 🚦 (P1) الأول** → المشروع جاهز للإطلاق.
- باقي الـ P2 ممكن بالتوازي أو بعد الإطلاق.
- آخر خطوة قبل go-live: على staging، ابعت lead حقيقي وتأكد إنه اتسجّل + الإيميل وصل + الـ conversion وصل GTM/Meta + البوت اتمنع.

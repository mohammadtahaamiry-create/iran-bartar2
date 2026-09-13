# ایران برتر — دستیار هوش مصنوعی فارسی

پلتفرم حرفه‌ای فارسی شامل احراز هویت، CMS، چت هوش مصنوعی (متن، تصویر، صوت) و پنل مدیریت تنظیمات.

## راه‌اندازی سریع

پروژه با سه دستور ساده اجرا می‌شود:

```bash
# ۱) نصب وابستگی‌ها (به‌طور خودکار Prisma client را هم می‌سازد)
npm install

# ۲) بیلد پروژه برای پروداکشن
npm run build

# ۳) اجرای پروژه در محیط توسعه
npm run dev
```

سپس به [http://localhost:3000](http://localhost:3000) بروید.

## نکته درباره `npm run dev`

اسکریپت `predev` قبل از اجرای dev به‌طور خودکار:
- `prisma generate` — تولید Prisma client
- `prisma db push` — همگام‌سازی schema با دیتابیس

پس نیازی به دستور اضافی برای دیتابیس نیست.

## اجرای پروداکشن

برای اجرا در حالت پروداکشن:

```bash
npm install
npm run build
npm start
```

`npm start` از خروجی بیلد استفاده می‌کند و روی پورت 3000 اجرا می‌شود.

## متغیرهای محیطی

فایل `.env` را با مقادیر واقعی پر کنید (نمونه در `.env.example`):

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
SETTINGS_ENCRYPTION_KEY=iran-behtar-default-encryption-key-v1
PORT=3000
NODE_ENV=production
```

**توجه:** کلید API هوش مصنوعی و سایر تنظیمات از پنل ادمین داخل اپلیکیشن وارد می‌شوند، نه در فایل `.env`.

## حساب ادمین پیش‌فرض

- ایمیل: `mohammadtahaamiri@gmail.com`
- رمز: `mohammadtaha`

پس از اولین ورود، از بخش «تنظیمات» کلید OpenRouter را وارد کنید.

## پیش‌نیازهای سیستم

- Node.js 18 یا بالاتر
- ffmpeg (برای تبدیل صدا به متن) — روی اوبونتو: `sudo apt install ffmpeg`

## دیپلوی روی Cloudflare / Docker

برای دیپلوی با Docker یا Cloudflare Containers، فایل [CLOUDFLARE.md](./CLOUDFLARE.md) را بخوانید.

## دیپلوی با Docker روی سرور DirectAdmin

اگر سرور شما کنترل‌پنل **DirectAdmin** دارد (که پورت‌های ۸۰ و ۴۴۳ را اشغال کرده)، راهنمای کامل در فایل [deploy/DOCKER-DIRECTADMIN.md](./deploy/DOCKER-DIRECTADMIN.md) است. به‌طور خلاصه:

```bash
# ۱) ساخت فایل env با مقادیر واقعی
cp .env.example .env.production
nano .env.production  # دو کلید تصادفی: openssl rand -base64 48
chmod 600 .env.production

# ۲) ساخت و اجرای کانتینر (دیتابیس روی volume پایدار)
docker compose up -d --build

# ۳) آپدیت بدون از دست رفتن داده‌ها
git pull && docker compose up -d --build --force-recreate
```

ویژگی‌های کلیدی این پیکربندی:
- **هیچ رازی داخل image نیست** — `.env.production` فقط روی سرور است و توسط `.dockerignore` از build context حذف می‌شود.
- **دیتابیس روی volume** (`iran_behtar_data`) — بین rebuildها و restartها حفظ می‌شود.
- **پورت ۳۰۰۰ به `127.0.0.1` بایند شده** — فقط Reverse Proxy دایرکت‌ادمین از بیرون به آن دسترسی دارد.
- **Entrypoint به‌طور خودکار `prisma db push`** را قبل از شروع سرور اجرا می‌کند.

## دیپلوی روی VPS با PM2/systemd

برای دیپلوی روی سرور Node.js (بدون Docker)، فایل [deploy/README.md](./deploy/README.md) را بخوانید.

## ساختار پروژه

```
src/
├── app/                    # مسیرهای Next.js (App Router)
│   ├── api/                # API Routes
│   │   ├── chat/           # چت، تبدیل صدا
│   │   ├── settings/       # تنظیمات، تست اتصال
│   │   ├── cms/            # مدیریت محتوا
│   │   └── auth/           # احراز هویت
│   └── page.tsx            # صفحه اصلی
├── components/             # کامپوننت‌های React
│   ├── chat/               # پنل چت
│   ├── cms/                # پنل CMS
│   ├── settings/           # پنل تنظیمات
│   └── layout/             # AppShell
├── lib/                    # توابع کمکی
│   ├── ai-client.ts        # کلاینت OpenAI/OpenRouter
│   ├── settings.ts         # مدیریت تنظیمات با رمزنگاری
│   ├── auth.ts             # احراز هویت
│   └── db.ts               # Prisma client
└── store/                  # Zustand stores
```

## مدیریت دیتابیس

```bash
# اعمال تغییرات schema
npm run db:push

# مهاجرت (migrations)
npm run db:migrate

# بازنشانی (هشدار: حذف همه داده‌ها!)
npm run db:reset
```

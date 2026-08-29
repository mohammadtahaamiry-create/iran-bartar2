# دیپلوی روی Cloudflare — راهنمای کامل

این راهنما به شما نشان می‌دهد چگونه اپلیکیشن «ایران برتر» را روی **Cloudflare Containers** (یا هر پلتفرم سازگار با Docker) دیپلوی کنید.

## چرا Cloudflare Containers؟

پروژه شما از این ویژگی‌ها استفاده می‌کند:
- **SQLite** (دیتابیس فایلی) — نیاز به volume دائمی دارد
- **ffmpeg** (تبدیل صدا به متن) — نیاز به اجرای باینری سیستم دارد
- **API Routes با Node.js modules** (`fs`, `crypto`)

این ویژگی‌ها با Cloudflare Pages/Workers سازگار نیستند (چون بدون state و بدون ffmpeg هستند). اما **Cloudflare Containers** از Docker پشتیبانی می‌کند و برای این پروژه مناسب است.

## پیش‌نیازها

1. حساب Cloudflare (رایگان)
2. Wrangler CLI نصب شده:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Docker نصب شده روی ماشین محلی

## روش ۱: دیپلوی با Cloudflare Containers (پیشنهادی)

### مرحله ۱: بیلد ایمیج Docker

```bash
# بیلد ایمیج
npm run docker:build
# یا دستی:
docker build -t iran-behtar:latest .
```

### مرحله ۲: تست محلی

```bash
# اجرای محلی با Docker
npm run docker:run
# یا دستی:
docker run --rm -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  iran-behtar:latest
```

سپس به `http://localhost:3000` بروید و مطمئن شوید همه چیز کار می‌کند.

### مرحله ۳: دیپلوی روی Cloudflare

```bash
# دیپلوی ایمیج روی Cloudflare Containers
npm run cf:deploy
# یا دستی:
wrangler containers deploy iran-behtar:latest
```

### مرحله ۴: تنظیم متغیرهای محیطی (Secrets)

```bash
# تنظیم کلیدهای محرمانه از طریق Wrangler
echo "your-32-char-encryption-key" | wrangler containers secret put SETTINGS_ENCRYPTION_KEY --name iran-behtar
```

### مرحله ۵: مشاهده لاگ‌ها

```bash
npm run cf:logs
# یا
wrangler containers logs iran-behtar
```

## روش ۲: دیپلوی با Docker روی VPS دیگر

اگر می‌خواهید ایمیج Docker را روی سرور خود اجرا کنید:

```bash
# روی سرور هدف
docker pull your-registry/iran-behtar:latest
docker run -d \
  --name iran-behtar \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  -v /var/iran-behtar-data:/app/data \
  your-registry/iran-behtar:latest
```

## ساختار فایل‌های دیپلوی

```
.
├── Dockerfile              # ایمیج Docker (multi-stage)
├── .dockerignore           # فایل‌های نادیده‌گرفته‌شده در Docker
├── wrangler.toml           # پیکربندی Cloudflare Containers
├── .env.example            # نمونه متغیرهای محیطی
└── deploy/
    ├── deploy.sh           # اسکریپت دیپلوی Node.js
    ├── iran-behtar.service  # فایل systemd
    └── README.md           # راهنمای دیپلوی Node.js
```

## متغیرهای محیطی

فایل `.env` را با مقادیر واقعی پر کنید (نمونه در `.env.example`):

| متغیر | توضیح | ضروری |
|------|------|------|
| `DATABASE_URL` | مسیر فایل SQLite | بله |
| `SETTINGS_ENCRYPTION_KEY` | کلید رمزنگاری (۳۲+ کاراکتر تصادفی) | بله |
| `PORT` | پورت سرور (پیش‌فرض 3000) | خیر |
| `NODE_ENV` | `production` | بله |

**توجه:** کلید API هوش مصنوعی و سایر تنظیمات از پنل ادمین در اپلیکیشن وارد می‌شوند، نه در فایل `.env`.

## ویژگی‌های Dockerfile

✅ **Multi-stage build** — ایمیج نهایی فقط فایل‌های ضروری را شامل می‌شود (کوچک و سریع)

✅ **Non-root user** — امنیت بالا (کاربر `nextjs` با UID 1001)

✅ **ffmpeg نصب شده** — تبدیل صدا به متن کار می‌کند

✅ **Volume دائمی** — دیتابیس SQLite در `/app/data` ذخیره می‌شود و بین ری‌استارت‌ها باقی می‌ماند

✅ **Health check** — Cloudflare می‌تواند وضعیت سرور را بررسی کند

✅ **Standalone output** — Next.js فقط فایل‌های ضروری را در ایمیج نهایی قرار می‌دهد

## عیب‌یابی

### بیلد Docker با خطا مواجه شد

```bash
# لاگ کامل را ببینید
docker build --progress=plain -t iran-behtar:latest . 2>&1 | tail -50
```

### دیتابیس در Container کار نمی‌کند

مطمئن شوید مسیر `DATABASE_URL` با volume هماهنگ است:
```env
DATABASE_URL=file:/app/data/custom.db
```
و volume درست mount شده:
```bash
-v $(pwd)/data:/app/data
```

### ffmpeg پیدا نمی‌شود

```bash
# وارد container شوید و بررسی کنید
docker exec -it iran-behtar sh
ffmpeg -version
```

### لاگ‌های Cloudflare را ببینید

```bash
wrangler containers logs iran-behtar --follow
```

## نکات مهم

1. **اولین بار اجرای اپ:** پس از دیپلوی، با حساب ادمین وارد شوید:
   - ایمیل: `mohammadtahaamiri@gmail.com`
   - رمز: `mohammadtaha`
   - سپس کلید OpenRouter را در بخش «تنظیمات» وارد کنید

2. **پشتیبان‌گیری از دیتابیس:**
   ```bash
   docker cp iran-behtar:/app/data/custom.db ./backup-$(date +%F).db
   ```

3. **به‌روزرسانی اپلیکیشن:**
   ```bash
   git pull
   npm run docker:build
   wrangler containers deploy iran-behtar:latest
   ```

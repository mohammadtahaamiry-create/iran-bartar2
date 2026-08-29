# دیپلوی روی Node.js — راهنمای کامل

این راهنما به شما نشان می‌دهد چگونه اپلیکیشن «ایران برتر» را روی یک سرور Node.js دیپلوی کنید.

## پیش‌نیازها

- سرور لینوکس (Ubuntu 20.04+ یا مشابه)
- Node.js نسخه 18 یا بالاتر (`node -v`)
- npm
- ffmpeg (برای تبدیل صدا به متن)
- IP یا دامنه برای دسترسی

### نصب پیش‌نیازها روی اوبونتو

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs ffmpeg
```

## روش ۱: اجرای مستقیم (ساده‌ترین)

```bash
# ۱) کد پروژه را روی سرور کپی کنید
git clone <repo-url> /var/www/iran-behtar
cd /var/www/iran-behtar

# ۲) فایل env را بسازید
cp .env.example .env
nano .env   # مقادیر را ویرایش کنید

# ۳) اسکریپت دیپلوی را اجرا کنید
bash deploy/deploy.sh

# ۴) اجرای سرور
npm start
```

سرور روی `http://localhost:3000` اجرا می‌شود.

## روش ۲: PM2 (پیشنهادی برای پروداکشن)

[PM2](https://pm2.keymetrics.io/) مدیریت فرآیند، ری‌استارت خودکار و لاگ‌گیری فراهم می‌کند.

```bash
# نصب PM2
npm install -g pm2

# اجرای اپلیکیشن
pm2 start ecosystem.config.cjs

# ذخیره‌سازی پروسه‌ها
pm2 save

# فعال‌سازی اجرای خودکار در بوت سیستم
pm2 startup
# دستوری که PM2 نمایش می‌دهد را با sudo اجرا کنید
```

### دستورات مفید PM2

```bash
pm2 status                    # وضعیت
pm2 logs iran-behtar          # مشاهده لاگ‌ها
pm2 restart iran-behtar       # ری‌استارت
pm2 stop iran-behtar          # توقف
pm2 delete iran-behtar        # حذف
pm2 monit                     # مانیتورینگ زنده
```

## روش ۳: systemd (پایدارترین)

```bash
# ۱) فایل سرویس را کپی کنید
sudo cp deploy/iran-behtar.service /etc/systemd/system/

# ۲) ویرایش مسیرها اگر لازم است
sudo nano /etc/systemd/system/iran-behtar.service

# ۳) فعال‌سازی و اجرا
sudo systemctl daemon-reload
sudo systemctl enable iran-behtar
sudo systemctl start iran-behtar

# ۴) بررسی وضعیت
sudo systemctl status iran-behtar
sudo journalctl -u iran-behtar -f   # مشاهده لاگ‌ها
```

## تنظیم Nginx (اختیاری، برای HTTPS و دامنه)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

سپس با Certbot گواهی SSL رایگان بگیرید:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## متغیرهای محیطی

فایل `.env` را با مقادیر واقعی پر کنید (نمونه در `.env.example`):

| متغیر | توضیح |
|------|------|
| `DATABASE_URL` | مسیر فایل SQLite (با مسیر مطلق) |
| `SETTINGS_ENCRYPTION_KEY` | کلید رمزنگاری تنظیمات (۳۲+ کاراکتر تصادفی) |
| `PORT` | پورت سرور (پیش‌فرض 3000) |
| `NODE_ENV` | `production` |

**توجه:** کلید API هوش مصنوعی و سایر تنظیمات از پنل ادمین در اپلیکیشن وارد می‌شوند، نه در فایل `.env`.

## مدیریت دیتابیس

```bash
# بکاپ
cp db/custom.db backups/custom-$(date +%F).db

# بازنشانی (ریسک از دست رفتن داده!)
npm run db:reset

# اعمال تغییرات schema
npm run db:push
```

## به‌روزرسانی اپلیکیشن

```bash
cd /var/www/iran-behtar
git pull
npm install
npm run build
pm2 restart iran-behtar   # یا sudo systemctl restart iran-behtar
```

## عیب‌یابی

### سرور بالا نمی‌آید
```bash
pm2 logs iran-behtar --lines 50
# یا
sudo journalctl -u iran-behtar -n 50
```

### دیتابیس پیدا نمی‌شود
- مطمئن شوید `DATABASE_URL` در `.env` مسیر مطلق دارد (مثل `file:/var/www/iran-behtar/db/custom.db`)
- پوشه `db/` وجود داشته باشد

### تبدیل صدا کار نمی‌کند
- ffmpeg نصب باشد: `ffmpeg -version`
- مجوز نوشتن در پوشه موقت داشته باشید

### کلید API کار نمی‌کند
- از بخش «تنظیمات → کلیدهای API» کلید واقعی OpenRouter را وارد کنید
- کلید باید ASCII باشد (بدون کاراکتر فارسی)
- با دکمه «تست اتصال» بررسی کنید

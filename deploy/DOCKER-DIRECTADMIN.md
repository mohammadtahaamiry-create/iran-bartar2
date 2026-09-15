# راهنمای استقرار با Docker روی سرور DirectAdmin

این راهنما به شما نشان می‌دهد چگونه اپلیکیشن **ایران برتر** را روی یک سرور مجازی که کنترل‌پنل **DirectAdmin** دارد، با Docker مستقر کنید — بدون اینکه با پورت‌های ۸۰ و ۴۴۳ (که DirectAdmin اشغال کرده) تداخل داشته باشید و بدون اینکه داده‌ها بعد از هر آپدیت از بین بروند.

---

## پیش‌نیازها

روی سرور (با SSH):

```bash
# اگر Docker نصب نیست:
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker

# بررسی نصب:
docker --version
docker compose version
```

> فرض: شما دسترسی root یا sudo دارید و پروژه را در مسیر `/opt/iran-behtar` قرار می‌دهید.

---

## ۱) انتقال پروژه به سرور

```bash
# روش اول: git (اگر repo دارید)
cd /opt
git clone https://your-repo-url.git iran-behtar
cd iran-behtar

# روش دوم: آپلود با scp از روی سیستم خودتان
# scp -r ./iran-behtar root@SERVER_IP:/opt/iran-behtar
```

> **مهم:** مطمئن شوید فایل `.env` یا `.env.production` حاوی کلیدهای واقعی، در repo نیست. آن را جداگانه روی سرور می‌سازیم.

---

## ۲) ساخت فایل `.env.production` با مقادیر واقعی

روی سرور، در پوشه‌ی پروژه:

```bash
cd /opt/iran-behtar

# کپی از نمونه
cp .env.example .env.production

# تولید دو کلید تصادفی قوی
echo "SETTINGS_ENCRYPTION_KEY=$(openssl rand -base64 48)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 48)"

# حالا با ادیتور دلخواه فایل را باز کن و مقادیر را جایگزین کن:
nano .env.production
```

محتوای نهایی چیزی شبیه این خواهد بود:

```env
DATABASE_URL=file:/app/data/custom.db
SETTINGS_ENCRYPTION_KEY=YOUR_RANDOM_KEY_FROM_OPENSSL
NEXTAUTH_SECRET=YOUR_RANDOM_SECRET_FROM_OPENSSL
NEXTAUTH_URL=https://app.yourdomain.com
NODE_ENV=production
PORT=3000
ADMIN_EMAIL=mohammadtahaamiri@gmail.com
ADMIN_PASSWORD=YOUR_STRONG_PASSWORD_MIN_8_CHARS
```

> **نکته:** `ADMIN_EMAIL` و `ADMIN_PASSWORD` در اولین اجرا به‌طور خودکار حساب ادمین را می‌سازند تا بتوانید بلافاصله وارد شوید و کلید OpenRouter را تنظیم کنید. این مقادیر در هر ری‌استارت با env همگام می‌مانند (idempotent).

> **هشدار امنیتی:** فایل `.env.production` حاوی رازهای اصلی است. مطمئن شوید:
> - در `.gitignore` هست (هست — چک کنید)
> - دسترسی‌اش محدود است: `chmod 600 .env.production`
> - هرگز در image داکر کپی نمی‌شود (`.dockerignore` این کار را تضمین می‌کند)

```bash
chmod 600 .env.production
```

---

## ۳) ساخت و اجرای کانتینر

```bash
# ساخت image و اجرای کانتینر در پس‌زمینه
docker compose up -d --build

# مشاهده‌ی لاگ‌ها (برای اطمینان از اجرای موفق)
docker compose logs -f
```

با این کار:
- یک **volume دائمی** به نام `iran_behtar_data` ساخته می‌شود که دیتابیس SQLite در آن قرار دارد.
- کانتینر فقط به `127.0.0.1:3000` بایند می‌شود (یعنی فقط روی خود سرور قابل دسترسی، نه از بیرون) — این امنیت بالاتری می‌دهد چون فقط DirectAdmin از طریق Reverse Proxy به آن دسترسی خواهد داشت.

بررسی سلامت کانتینر:

```bash
docker ps
docker compose ps
# باید status "healthy" را ببینید

# تست محلی داخل سرور:
curl http://127.0.0.1:3000/
```

---

## ۴) پایداری داده‌ها (Data Persistence)

این مهم‌ترین قسمت است. سه لایه از داده‌های شما محافظت می‌کنند:

| لایه | توضیح |
|------|------|
| **Volume داکر** | `iran_behtar_data` — حجم جداگانه از خود image، روی filesystem سرور |
| **مسیر دیتابیس** | `DATABASE_URL=file:/app/data/custom.db` — داخل volume، نه داخل image |
| **عدم کپی env در image** | `.dockerignore` تمام فایل‌های `.env`, `*.db`, `data/` را از build context حذف می‌کند |

برای **بک‌آپ دستی**:

```bash
# بک‌آپ بگیر در پوشه‌ی backups/
npm run docker:backup

# یا دستی:
docker run --rm \
  -v iran_behtar_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/iran-behtar-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

برای **بازگردانی بک‌آپ**:

```bash
docker compose down
docker run --rm \
  -v iran_behtar_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/iran-behtar-YYYYMMDD-HHMMSS.tar.gz"
docker compose up -d
```

---

## ۵) پیکربندی Reverse Proxy در DirectAdmin

چون DirectAdmin پورت‌های ۸۰ و ۴۴۳ را اشغال کرده، باید ترافیک دامنه‌ی شما (مثلاً `app.yourdomain.com`) را به `http://127.0.0.1:3000` هدایت کند.

### روش A) Custom HTTPD Config در DirectAdmin (توصیه‌شده)

1. وارد DirectAdmin شوید → **Custom HTTPD Config** (در بخش **Advanced Features**).
2. دامنه‌ی خود را انتخاب کنید (مثلاً `app.yourdomain.com`).
3. در بخش **Customization** → در قسمت **"Insert this in the VirtualHost tag"** قرار دهید:

   ```apache
   ProxyPreserveHost On
   ProxyRequests off
   ProxyPass / http://127.0.0.1:3000/
   ProxyPassReverse / http://127.0.0.1:3000/
   RequestHeader set X-Forwarded-Proto "https"
   RequestHeader set X-Forwarded-Host "app.yourdomain.com"
   ```

4. ذخیره → DirectAdmin به‌طور خودکار Apache را reload می‌کند.
5. برای HTTPS: در DirectAdmin بخش **SSL Certificates** → گزینه‌ی **Let's Encrypt** را برای این دامنه فعال کنید. کانفیگ بالا هم برای HTTPS و هم HTTP کار می‌کند.

### روش B) Custom Nginx Config (اگر از Nginx به‌جای Apache در DirectAdmin استفاده می‌کنید)

در همان بخش Custom HTTPD، اگر Nginx فعال است:

```nginx
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
    # WebSocket support برای AI streaming
    proxy_read_timeout 86400;
    proxy_buffering off;
}
```

### روش C) اگر Custom HTTPD در دسترس نیست (Custom Rules)

از بخش **Custom Rules** یا **.htaccess** در public_html دامنه، این را در `.htaccess` قرار دهید:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

> این روش نیاز به فعال بودن `mod_proxy` و `mod_proxy_http` در Apache دارد.

---

## ۶) آپدیت اپلیکیشن (بدون از دست رفتن داده‌ها)

وقتی کد جدیدی در repo آماده شد:

```bash
cd /opt/iran-behtar

# کد جدید را بگیر
git pull origin main

# (اگر .env.production را تغییر داده‌اید، فقط فایل را ادیت کنید)

# بازسازی کانتینر — volume دست‌نخورده باقی می‌ماند
docker compose up -d --build --force-recreate

# لاگ‌ها را ببینید
docker compose logs -f
```

**مهم:** اسکریپت `docker-entrypoint.sh` در هر شروع کانتینر به‌طور خودکار:
1. `prisma migrate deploy` را اجرا می‌کند — فقط migration فایل‌های کامیت‌شده را اعمال می‌کند و **هرگز داده حذف نمی‌کند**
2. اتصال دیتابیس را تست می‌کند (smoke test)
3. اگر `ADMIN_EMAIL` و `ADMIN_PASSWORD` در `.env.production` باشند، حساب ادمین را می‌سازد یا همگام می‌کند (idempotent)
4. سپس سرور Next.js را اجرا می‌کند

اگر schema جدیدی در کد push شده باشد ولی migration فایل نداشته باشید، `prisma db push` در حالت safe اجرا می‌شود (بدون `--accept-data-loss`) — تغییرات تخریبی با خطای واضح متوقف می‌شوند.

---

## ۷) فرمان‌های مفید

```bash
# وضعیت کانتینر
docker compose ps

# لاگ‌های زنده
docker compose logs -f

# ورود به shell کانتینر (برای دیباگ)
docker exec -it iran-behtar /bin/sh

# توقف موقت (داده‌ها حفظ می‌شوند)
docker compose down

# راه‌اندازی مجدد بدون rebuild
docker compose up -d

# حذف کامل image (volume دست‌نخورده می‌ماند)
docker compose down --rmi local

# حذف volume (خطرناک! همه داده‌ها از بین می‌روند)
docker compose down -v
```

---

## ۸) عیب‌یابی

### "Cannot connect to the Docker daemon"
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER  # سپس logout و login مجدد
```

### "Port 3000 already in use"
```bash
sudo ss -tlnp | grep :3000
# یا تغییر پورت در docker-compose.yml: "127.0.0.1:3001:3000" و به‌روزرسانی Reverse Proxy
```

### "Database is locked" / خطای Prisma
- مطمئن شوید فقط **یک کانتینر** در حال اجراست: `docker ps`
- اگر دیتابیس corrupt شده، از بک‌آپ بازگردانی کنید.

### صفحه‌ی سفید / خطای ۵۰۲ در Reverse Proxy
- مطمئن شوید کانتینر اجراست: `docker compose ps`
- تست محلی: `curl http://127.0.0.1:3000/` باید HTML برگرداند.
- لاگ‌های کانتینر را ببینید: `docker compose logs --tail 100`
- در DirectAdmin، لاگ‌های Apache را در `/var/log/httpd/` یا `/var/log/apache2/` بررسی کنید.

### فراموشی کلید `SETTINGS_ENCRYPTION_KEY`
اگر این کلید را عوض کنید، API keyهای ذخیره‌شده در دیتابیس قابل خواندن نیستند. باید در پنل ادمین دوباره آنها را وارد کنید. این کلید را در یک جای امن (مثلاً password manager) نگه‌دارید.

---

## ۹) چک‌لیست نهایی پیش از Production

- [ ] `.env.production` با کلیدهای تصادفی واقعی پر شده
- [ ] `chmod 600 .env.production` اجرا شده
- [ ] `docker compose up -d --build` موفق بوده
- [ ] `docker compose ps` وضعیت `healthy` نشان می‌دهد
- [ ] `curl http://127.0.0.1:3000/` پاسخ می‌دهد
- [ ] Reverse Proxy در DirectAdmin پیکربندی شده
- [ ] Let's Encrypt SSL برای دامنه فعال شده
- [ ] یک بک‌آپ اولیه گرفته شده: `npm run docker:backup`
- [ ] یک کاربر ادمین ساخته‌اید و وارد اپ شده‌اید
- [ ] کلید API معتبر OpenRouter را در پنل ادمین وارد و تست کرده‌اید

---

## معماری نهایی

```
کاربر → HTTPS:443 → DirectAdmin (Apache/Nginx) → http://127.0.0.1:3000 → Docker Container (iran-behtar)
                                                                          │
                                                                          ├── /app (read-only code)
                                                                          └── /app/data ←── volume: iran_behtar_data (پایدار)
```

تمام رازها در `.env.production` روی filesystem سرور هستند، نه داخل image. تمام داده‌ها در volume هستند و بین rebuildها حفظ می‌شوند.

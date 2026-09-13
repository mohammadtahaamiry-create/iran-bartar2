
---
Task ID: theme-turquoise
Agent: main (Super Z)
Task: تغییر تم اپلیکیشن ایران برتر به رنگ فیروزه‌ای

Work Log:
- بازرسی src/app/globals.css: تم قبلی نارنجی (hue 30 در oklch) بود
- بازنویسی پالت حالت روشن: primary=oklch(0.55 0.10 195)، secondary/accent/border/sidebar با ته‌رنگ فیروزه‌ای
- بازنویسی پالت حالت تاریک: پس‌زمینه با ته‌رنگ آبی-فیروزه (hue 220)، primary=oklch(0.78 0.11 190)
- به‌روزرسانی chart-1..5 و glow-primary به فیروزه‌ای
- رفع دو خطای تایپی CSS نامعتبر: oklch(0.205 0 02 30)
- OverviewPanel.tsx: گرادیان کارت «تفکر عمیق» از amber/orange به cyan/teal تغییر یافت
- اکثر اجزا از متغیر from-primary استفاده می‌کنند و خودکار فیروزه‌ای شدند
- رنگ‌های معنایی (سبز=موفقیت، قرمز=خطا/ضبط، زرد=هشدار) عمداً حفظ شدند
- npm run build موفق؛ CSS کامپایل‌شده تأیید شد: #008383 (روشن) / #51cec7 (تاریک)

Stage Summary:
- تم فیروزه‌ای کامل در هر دو حالت روشن و تاریک اعمال و با build تأیید شد

---
Task ID: docker-directadmin-deploy
Agent: main (Super Z)
Task: داکرایز کامل پروژه برای استقرار روی سرور DirectAdmin، بدون نشت رازها در image و با حفظ دیتابیس بین آپدیت‌ها

Work Log:
- بازنویسی کامل Dockerfile (multi-stage با ۳ مرحله deps/builder/runner):
  - non-root user (nextjs:1001) برای امنیت
  - dumb-init برای مدیریت صحیح SIGTERM و graceful shutdown
  - ffmpeg برای تبدیل صوت به متن (ASR)
  - wget برای healthcheck
  - DATABASE_URL به volume mount /app/data اشاره می‌کند
  - در زمان build فقط placeholder در env تنظیم می‌شود، رازهای واقعی در runtime از env-file تزریق می‌شوند
- ایجاد docker-entrypoint.sh:
  - قبل از اجرای Next.js: prisma generate + prisma db push (غیرتخریبی) را اجرا می‌کند
  - schema تغییرات به‌صورت خودکار اعمال می‌شوند بدون از دست رفتن داده
- بازنویسی جامع .dockerignore:
  - تمام فایل‌های حساس: .env, .env.*, *.pem, *.key, secrets/, credentials*
  - تمام فایل‌های دیتابیس: *.db, *.sqlite, db/, data/, prisma/*.db
  - build artifacts, node_modules, logs, OS files, deploy scripts
- ایجاد docker-compose.yml:
  - port binding فقط روی 127.0.0.1:3000 (نه به اینترنت عمومی - فقط Reverse Proxy DirectAdmin دسترسی دارد)
  - env_file: .env.production (هیچ رازی در image نیست)
  - volume نام‌دار iran_behtar_data -> /app/data (بین rebuildها حفظ می‌شود)
  - restart: unless-stopped (auto-restart روی crash/reboot)
  - security_opt: no-new-privileges + cap_drop: ALL (hardening)
  - logging با rotation (max-size 10m, max 5 files)
- به‌روزرسانی .env.example با توضیحات کامل و متغیرهای OpenRouter اختیاری
- به‌روزرسانی .gitignore: اضافه شدن .env.production, *.pem, *.key, backups/, secrets/
- به‌روزرسانی package.json با دستورات داکر جدید:
  - docker:build, docker:run (با 127.0.0.1 و volume), docker:stop, docker:logs, docker:shell
  - docker:backup (بک‌آپ volume با alpine tar)
  - compose:up/down/logs/rebuild
- ایجاد deploy/DOCKER-DIRECTADMIN.md (راهنمای کامل فارسی):
  - نصب Docker روی VPS
  - انتقال پروژه و ساخت .env.production با کلیدهای openssl rand
  - build و run با docker compose
  - توضیح ۳ لایه حفاظت از داده (volume, مسیر DB, dockerignore)
  - بک‌آپ و بازگردانی
  - پیکربندی Reverse Proxy در DirectAdmin (Apache mod_proxy, Nginx, htaccess)
  - فعال‌سازی Let's Encrypt SSL
  - فرآیند آپدیت بدون از دست رفتن داده
  - عیب‌یابی رایج
  - چک‌لیست نهایی production
- به‌روزرسانی README.md با بخش Docker + DirectAdmin
- اعتبارسنجی: اسکریپت verify-docker-setup.sh همه فایل‌ها و قواعد را چک کرد - همه PASSED

Stage Summary:
- Dockerfile کامل و امن (non-root, dumb-init, healthcheck, بدون نشت راز)
- docker-compose.yml با hardening کامل و volume پایدار
- .dockerignore همه فایل‌های حساس را از build context حذف می‌کند
- راهنمای جامع فارسی برای DirectAdmin در deploy/DOCKER-DIRECTADMIN.md
- هیچ رازی داخل image نیست - همه چیز از .env.production در runtime تزریق می‌شود
- دیتابیس روی volume نام‌دار iran_behtar_data - بین rebuild و restart حفظ می‌شود
- پورت فقط به 127.0.0.1 بایند شده - DirectAdmin به‌عنوان reverse proxy عمل می‌کند

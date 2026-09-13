
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

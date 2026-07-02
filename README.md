# 🤖 Supabase Manager Bot

ربات تلگرام حرفه‌ای برای مدیریت اکانت‌ها و پروژه‌های Supabase، نوشته‌شده با **Node.js + TypeScript + Telegraf + Prisma**.

## ✅ امکاناتی که به‌طور کامل پیاده‌سازی و به رابط ربات (دکمه‌های Inline) متصل شده‌اند

- ثبت‌نام خودکار کاربران + پنل شخصی هر کاربر (بدون دسترسی به اطلاعات کاربران دیگر)
- رمزنگاری AES‑256‑GCM برای تمام Personal Access Token های ذخیره‌شده (هیچ توکنی در لاگ‌ها ذخیره نمی‌شود)
- افزودن/حذف/تغییرنام/انتخاب اکانت پیش‌فرض Supabase (چند اکانت به ازای هر کاربر)
- لیست پروژه‌ها با Pagination، نمایش نام/Region/وضعیت/تاریخ ساخت
- ساخت پروژه جدید (نام، Organization، Region، رمز دیتابیس) با نمایش کامل Credentials و دکمه «📋 کپی» برای هر مقدار
- مدیریت پروژه: مشاهده، ریستارت، حذف (با تأییدیه)
- SQL Editor: اجرای کوئری متنی یا آپلود فایل `.sql`، نمایش خطای کامل یا تعداد ردیف‌های خروجی
- پنل ادمین: آمار کاربران/اکانت‌ها/درخواست‌ها، بلاک کاربر، پیام همگانی (Broadcast)، مشاهده خطاهای اخیر
- Rate Limiting، Session Management (State machine برای مراحل چندقسمتی مثل ساخت پروژه)، اعتبارسنجی کامل ورودی‌ها با Zod
- ناوبری استاندارد: Breadcrumb ساده، دکمه‌های Back/Home در همه صفحات، Refresh در لیست پروژه‌ها

## 🚧 لایه سرویس آماده، رابط کاربری مرحله بعد (Phase 2)

طبق درخواست شما (Storage، Auth Users، Table Manager، Migration، Edge Functions، Logs، Realtime، Secrets)، **متدهای کامل Service Layer** برای این بخش‌ها در `src/services/supabaseManagement.service.ts` پیاده‌سازی شده‌اند (مثلاً `listBuckets`, `listAuthUsers`, `banAuthUser`, `listTables`, `listMigrations`, `getLogs`, `listEdgeFunctions`, `deployEdgeFunction`, `listSecrets`, `setSecrets`).

این متدها همان الگوی Repository/Service را دنبال می‌کنند که بقیه پروژه استفاده می‌کند، اما هنوز به Handler/Keyboard تلگرام وصل نشده‌اند — چون حجم این پروژه (بیش از ۱۵ ماژول کامل مدیریتی) در یک تحویل اولیه به‌سختی با کیفیت Production قابل تکمیل کامل بود. برای وصل‌کردن هرکدام، دقیقاً از الگوی `sqlEditor.handler.ts` + `projects.keyboard.ts` پیروی کنید:

1. یک فایل جدید در `src/bot/keyboards/` برای دکمه‌های آن بخش بسازید.
2. یک Handler جدید در `src/bot/handlers/` بسازید که متدهای مربوطه از `supabaseManagement.service.ts` را صدا بزند.
3. آن را در `src/bot/bot.ts` رجیستر کنید.

خوشحال می‌شوم در پیام بعدی، هرکدام از این بخش‌ها را که اولویت دارد کامل به UI وصل کنم (مثلاً Table Manager یا Storage).

## 📁 ساختار پروژه

```
supabase-manager-bot/
├── api/webhook.ts          # ورودی Vercel Serverless (Webhook)
├── src/
│   ├── index.ts            # ورودی Long Polling برای VPS/Docker/PM2
│   ├── bot/
│   │   ├── bot.ts          # ساخت instance ربات + رجیستر Handlerها
│   │   ├── handlers/       # منطق هر بخش (start, accounts, projects, sql, admin)
│   │   ├── keyboards/      # دکمه‌های Inline هر بخش
│   │   ├── middlewares/    # auth, rateLimit
│   │   └── helpers/        # نمایش Credentials و ...
│   ├── services/           # Service Layer (منطق کسب‌وکار + فراخوانی Supabase API)
│   ├── repositories/       # Repository Pattern (دسترسی به دیتابیس با Prisma)
│   ├── config/             # env, constants, prisma client
│   └── utils/              # logger (با Redact خودکار اطلاعات حساس), validators (Zod)
├── prisma/schema.prisma    # مدل‌های User, SupabaseAccount, Session, AuditLog, Broadcast
├── scripts/setWebhook.ts   # اسکریپت ثبت Webhook روی تلگرام
├── Dockerfile / docker-compose.yml / ecosystem.config.js  # استقرار روی VPS
└── vercel.json             # استقرار Serverless روی Vercel
```

## ⚙️ نصب و راه‌اندازی محلی

```bash
git clone <your-repo-url>
cd supabase-manager-bot
cp .env.example .env
npm install
```

مقادیر `.env` را تکمیل کنید (توضیح کامل هر متغیر داخل `.env.example` است). مهم‌ترین‌ها:

- `BOT_TOKEN`: از [@BotFather](https://t.me/BotFather) بگیرید.
- `DATABASE_URL`: کانکشن استرینگ Postgres (پیشنهاد: یک پروژه Supabase مجزا برای خود ربات — Session Pooler برای سازگاری با Serverless).
- `ENCRYPTION_KEY`: یک رشته Hex به طول ۶۴ کاراکتر (۳۲ بایت) بسازید: `openssl rand -hex 32`
- `ADMIN_IDS`: آیدی عددی تلگرام ادمین(ها)، جدا شده با کاما. آیدی خود را از [@userinfobot](https://t.me/userinfobot) بگیرید.

### ساخت دیتابیس

```bash
npx prisma migrate dev --name init
```

### اجرای محلی (Long Polling)

```bash
npm run dev
```

## 🐳 اجرای با Docker

```bash
docker compose up -d --build
```

این حالت از **Long Polling** و **PM2** داخل کانتینر استفاده می‌کند (مناسب برای VPS).

## 🖥 اجرای با PM2 (بدون Docker)

```bash
npm run build
npx prisma migrate deploy
pm2 start ecosystem.config.js
pm2 save
```

## ▲ استقرار روی Vercel (Serverless + Webhook)

این پروژه برای اجرا روی پلن رایگان Vercel و پلن رایگان Supabase طراحی شده است.

1. **اتصال گیت‌هاب به Vercel:**
   - ریپازیتوری را روی GitHub پوش کنید.
   - در [vercel.com](https://vercel.com) → New Project → ریپازیتوری را انتخاب کنید.
   - Framework Preset را روی **Other** بگذارید (نیازی به تنظیم خاصی نیست، `vercel.json` موجود است).

2. **تنظیم Environment Variables در Vercel:**
   - در تنظیمات پروژه → Environment Variables، تمام متغیرهای فایل `.env.example` را وارد کنید.
   - `WEBHOOK_URL` را برابر آدرس دیپلوی شده بگذارید، مثلاً `https://your-app.vercel.app`.
   - Deploy کنید.

3. **اتصال پروژه به Supabase:**
   - یک پروژه Supabase جدید بسازید (فقط برای دیتابیس خود ربات).
   - از Project Settings → Database، Connection String حالت **Session Pooler** را کپی کرده و در `DATABASE_URL` قرار دهید.
   - سپس یک‌بار به‌صورت لوکال اجرا کنید: `npx prisma migrate deploy` (با `DATABASE_URL` پروداکشن در `.env`).

4. **ثبت Webhook تلگرام:**
   بعد از Deploy موفق:
   ```bash
   npm run webhook:set
   ```
   این اسکریپت آدرس `https://your-app.vercel.app/api/webhook?secret=...` را به تلگرام معرفی می‌کند.

5. از این پس هر Push به شاخه اصلی گیت‌هاب، به‌صورت خودکار روی Vercel دیپلوی می‌شود (Auto Deploy پیش‌فرض Vercel).

## 🔐 نکات امنیتی

- توکن‌ها با AES‑256‑GCM رمزنگاری و در دیتابیس ذخیره می‌شوند؛ کلید رمزنگاری فقط در Environment Variable نگه‌داری می‌شود، هرگز در کد یا Git.
- Logger به‌صورت خودکار فیلدهای حساس (token, password, jwt_secret, ...) را قبل از لاگ‌شدن Redact می‌کند.
- Rate Limiting روی هر کاربر برای جلوگیری از سوءاستفاده اعمال شده است.
- Webhook با یک `secret` در Query String محافظت می‌شود.
- تمام ورودی‌های کاربر (نام پروژه، رمز دیتابیس، توکن، کوئری SQL و...) با Zod اعتبارسنجی می‌شوند.

## 🛠 تکنولوژی‌ها

Node.js • TypeScript • Telegraf 4 • Supabase Management API • Prisma • PostgreSQL • Docker • PM2 • ESLint • Prettier • Zod • Vercel Serverless Functions

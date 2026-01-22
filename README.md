# 🏦 نظام طباعة دفاتر الشيكات - CheckSystem

نظام متكامل لإدارة وطباعة دفاتر الشيكات للبنوك، مع دعم كامل للغة العربية وخط MICR.

## 🚀 البدء السريع

### المتطلبات الأساسية
- Node.js (v18 أو أحدث)
- PostgreSQL
- npm أو yarn

### التثبيت والتشغيل

#### 1. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb checksystem
```

#### 2. إعداد Backend
```bash
cd server

# تثبيت المكتبات
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env حسب إعداداتك

# تشغيل migrations
npm run prisma:migrate

# إضافة بيانات تجريبية
npm run db:seed

# تشغيل السيرفر
npm run dev
```

#### 3. إعداد Frontend
```bash
cd client

# تثبيت المكتبات
npm install

# إعداد متغيرات البيئة
cp .env.local.example .env.local
# عدّل .env.local حسب إعداداتك

# تشغيل التطبيق
npm run dev
```

#### 4. الوصول للنظام
- **Frontend**: http://localhost:5050
- **Backend API**: http://localhost:5050/api

**بيانات الدخول الافتراضية:**
- Username: `admin`
- Password: `Admin@123`

---

## 📚 التوثيق

جميع ملفات التوثيق متوفرة في مجلد [`docs/`](./docs/)

### 📖 ملفات مهمة:
- **[🚀 ابدأ من هنا](./docs/🚀_ابدأ_من_هنا.md)** - دليل البدء السريع بالعربية
- **[START_HERE.md](./docs/START_HERE.md)** - دليل البدء الشامل
- **[ENV_SETUP.md](./docs/ENV_SETUP.md)** - إعداد متغيرات البيئة
- **[API_TESTING_GUIDE.md](./docs/API_TESTING_GUIDE.md)** - دليل اختبار API
- **[PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md)** - ملخص المشروع الكامل

### 📋 التوثيق حسب الموضوع:

#### إعداد النظام:
- [PRISMA_MIGRATION_COMPLETE.md](./docs/PRISMA_MIGRATION_COMPLETE.md)
- [DATABASE_FIXED.md](./docs/DATABASE_FIXED.md)
- [ENV_SETUP.md](./docs/ENV_SETUP.md)

#### الطباعة:
- [PRINTING_TEST_GUIDE.md](./docs/PRINTING_TEST_GUIDE.md)
- [PDF_PRINTING_GUIDE.md](./docs/PDF_PRINTING_GUIDE.md)
- [PHYSICAL_PRINTING_GUIDE.md](./docs/PHYSICAL_PRINTING_GUIDE.md)
- [MICR_PRINTING_COMPLETE.md](./docs/MICR_PRINTING_COMPLETE.md)

#### الإعدادات والتخصيص:
- [SETTINGS_COMPLETE.md](./docs/SETTINGS_COMPLETE.md)
- [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)
- [LIBYA_LOCALIZATION.md](./docs/LIBYA_LOCALIZATION.md)

#### الميزات:
- [REPRINT_FEATURE.md](./docs/REPRINT_FEATURE.md)
- [HISTORY_PAGE_COMPLETE.md](./docs/HISTORY_PAGE_COMPLETE.md)

---

## 🏗️ بنية المشروع

```
CheckSystem/
├── client/              # تطبيق Next.js (Frontend)
│   ├── src/
│   │   ├── app/        # صفحات التطبيق
│   │   ├── components/ # المكونات
│   │   ├── lib/        # المكتبات والـ API clients
│   │   └── utils/      # الأدوات المساعدة
│   └── public/         # الملفات الثابتة
│
├── server/             # Express + TypeScript (Backend)
│   ├── src/
│   │   ├── routes/     # مسارات API
│   │   ├── controllers/# Controllers
│   │   ├── services/   # Business Logic
│   │   ├── middleware/ # Middleware
│   │   └── lib/        # المكتبات
│   └── prisma/         # Schema وقاعدة البيانات
│
└── docs/               # التوثيق الكامل
```

---

## ✨ الميزات الرئيسية

- ✅ **إدارة الحسابات** - أفراد وشركات
- ✅ **طباعة الشيكات** - مع خط MICR
- ✅ **إدارة المخزون** - تتبع دفاتر الشيكات
- ✅ **سجل العمليات** - تتبع كامل للطباعة
- ✅ **إعادة الطباعة** - طباعة نطاق محدد من الشيكات
- ✅ **إعدادات مرنة** - تخصيص مواضع الطباعة
- ✅ **دعم كامل للعربية** - واجهة وبيانات
- ✅ **أمان متقدم** - JWT Authentication
- ✅ **تصميم حديث** - واجهة مستخدم احترافية

---

## 🔧 التقنيات المستخدمة

### Frontend:
- Next.js 14
- TypeScript
- TailwindCSS
- Axios
- Lucide Icons

### Backend:
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- PDFKit (لإنشاء PDF)

---

## 🧪 الاختبار

```bash
# اختبار Backend API
cd server
npm test

# اختبار Frontend
cd client
npm test
```

راجع [API_TESTING_GUIDE.md](./docs/API_TESTING_GUIDE.md) لاختبارات مفصلة.

---

## 📝 المتغيرات البيئية

### Backend (server/.env):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/checksystem
JWT_SECRET=your_secret_key
PORT=5050
HOST=localhost
CLIENT_URL=http://localhost:5050
```

### Frontend (client/.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```

راجع [ENV_SETUP.md](./docs/ENV_SETUP.md) للتفاصيل الكاملة.

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للـ branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 📞 الدعم

للأسئلة والدعم، راجع:
- [التوثيق الكامل](./docs/)
- [دليل استكشاف الأخطاء](./docs/TESTING_STATUS.md)

---

## 🎯 الحالة

✅ **جاهز للإنتاج**

النظام مكتمل ومختبر بالكامل. راجع:
- [✅ كل شيء جاهز](./docs/✅_كل_شيء_جاهز.md)
- [🎉 PROJECT_COMPLETE](./docs/🎉_PROJECT_COMPLETE.md)
- [COMPLETION_REPORT](./docs/COMPLETION_REPORT.md)

---

**صُنع بـ ❤️ للبنوك الليبية**

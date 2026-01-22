# Check Printing System - Frontend

Frontend للنظام طباعة الشيكات المصرفية مع Next.js و Redux.

## 🚀 التقنيات المستخدمة

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📦 التثبيت

```bash
cd client
npm install
```

## 🔧 الإعداد

### 1. ملف `.env.local`

الملف موجود بالفعل مع:
```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```

### 2. تشغيل Backend

تأكد من تشغيل Backend Server:
```bash
cd ../server
npm run dev
```

### 3. تشغيل Frontend

```bash
npm run dev
```

الموقع سيعمل على: **http://localhost:5050**

## 📁 الهيكل

```
client/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── login/           # صفحة تسجيل الدخول
│   │   ├── dashboard/       # لوحة التحكم
│   │   ├── print/           # صفحة الطباعة
│   │   ├── inventory/       # إدارة المخزون
│   │   ├── users/           # إدارة المستخدمين
│   │   ├── branches/        # إدارة الفروع
│   │   ├── reports/         # التقارير
│   │   └── layout.tsx       # Layout رئيسي
│   │
│   ├── components/          # React Components
│   │   ├── layout/         # Layout components
│   │   ├── forms/          # Form components
│   │   └── ui/             # UI components
│   │
│   ├── lib/
│   │   └── api/            # API Services
│   │       ├── client.ts   # Axios client
│   │       └── services/   # Service files
│   │
│   ├── store/              # Redux Store
│   │   ├── slices/        # Redux slices
│   │   ├── hooks.ts       # Redux hooks
│   │   └── index.ts       # Store configuration
│   │
│   └── types/             # TypeScript types
│
├── public/                # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔌 API Integration

### Services المتاحة:

```typescript
import {
  authService,
  branchService,
  userService,
  inventoryService,
  accountService,
  printingService
} from '@/lib/api';

// مثال: Login
const response = await authService.login({
  username: 'admin',
  password: '[REDACTED]'
});

// مثال: Get branches
const branches = await branchService.getAll();

// مثال: Print checkbook
const result = await printingService.printCheckbook({
  account_number: '1234567890'
});
```

### Redux Store

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, logout } from '@/store/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const handleLogin = async () => {
    await dispatch(login({ username: 'admin', password: '[REDACTED]' }));
  };
}
```

## 📄 الصفحات المطلوب إنشاؤها

### 1. صفحة Login ✅ (تحتاج إكمال)
- `/login`
- Form مع username و password
- Redux integration

### 2. Dashboard ⏳
- `/dashboard`
- إحصائيات سريعة
- آخر العمليات
- حالة المخزون

### 3. Print Checkbook ⏳
- `/print`
- استعلام عن حساب
- عرض البيانات
- زر طباعة

### 4. Inventory Management ⏳
- `/inventory`
- عرض المخزون
- إضافة مخزون
- سجل الحركة

### 5. Users Management ⏳
- `/users`
- قائمة المستخدمين
- إضافة/تعديل/حذف
- تعيين الصلاحيات

### 6. Branches Management ⏳
- `/branches`
- قائمة الفروع
- إضافة/تعديل/حذف

### 7. Reports ⏳
- `/reports`
- سجل الطباعة
- إحصائيات
- Filters

## 🎨 UI Components

### Components المطلوبة:

```typescript
// Layout
<Sidebar />
<Header />
<Footer />

// Forms
<LoginForm />
<PrintForm />
<InventoryForm />
<UserForm />
<BranchForm />

// Tables
<DataTable />
<PrintHistoryTable />
<InventoryTransactionsTable />

// Cards
<StatCard />
<InventoryCard />

// Modals
<ConfirmModal />
<InfoModal />
```

## 🔐 Authentication

### Protected Routes

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### useAuth Hook

```typescript
function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    if (auth.token && !auth.user) {
      dispatch(fetchCurrentUser());
    }
  }, []);
  
  return auth;
}
```

## 📊 Example: Print Page Flow

```typescript
'use client';

import { useState } from 'react';
import { accountService, printingService } from '@/lib/api';

export default function PrintPage() {
  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleQuery = async () => {
    setLoading(true);
    try {
      const data = await accountService.query(accountNumber);
      setAccount(data);
    } catch (error) {
      alert('Failed to query account');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = async () => {
    setLoading(true);
    try {
      const result = await printingService.printCheckbook({
        account_number: accountNumber
      });
      
      alert(result.message);
    } catch (error) {
      alert('Failed to print');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input 
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
      />
      <button onClick={handleQuery}>Query</button>
      
      {account && (
        <div>
          <p>Name: {account.accountHolderName}</p>
          <p>Type: {account.accountType === 1 ? 'Individual' : 'Corporate'}</p>
          <button onClick={handlePrint}>Print</button>
        </div>
      )}
    </div>
  );
}
```

## 🧪 Testing

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 API Endpoints Integration

جميع الـ endpoints مربوطة:

- ✅ `/api/auth/login` - Login
- ✅ `/api/users/me` - Current user
- ✅ `/api/branches` - Branches CRUD
- ✅ `/api/users` - Users CRUD
- ✅ `/api/inventory` - Inventory management
- ✅ `/api/accounts/query` - Query account
- ✅ `/api/printing/print` - Print checkbook
- ✅ `/api/printing/history` - Print history
- ✅ `/api/printing/statistics` - Statistics

## 🎯 الخطوات التالية

### لإكمال Frontend:

1. **إنشاء الصفحات:**
   - Login page
   - Dashboard
   - Print page
   - Inventory page
   - Users page
   - Branches page
   - Reports page

2. **إنشاء Components:**
   - Layout components (Sidebar, Header)
   - Form components
   - Table components
   - Modal components

3. **إضافة Validation:**
   - React Hook Form
   - Zod schemas

4. **إضافة Loading States:**
   - Skeleton loaders
   - Spinners

5. **Error Handling:**
   - Toast notifications
   - Error boundaries

6. **Styling:**
   - Tailwind components
   - Responsive design
   - Dark mode (optional)

## 📖 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)

## 🚀 Current Status

```
✅ Next.js Project Setup
✅ TypeScript Configuration
✅ Tailwind CSS Setup
✅ Redux Store Configuration
✅ API Client Setup
✅ All API Services
✅ Auth Slice
✅ Types Definitions

⏳ Pages (need to create)
⏳ Components (need to create)
⏳ Forms (need to create)
⏳ UI Polish
```

## 💡 Quick Start Guide

```bash
# 1. Install dependencies
npm install

# 2. Make sure backend is running
cd ../server
npm run dev

# 3. Run frontend
cd ../client
npm run dev

# 4. Open browser
http://localhost:5050

# 5. Login with:
# Username: admin
# Password: [REDACTED]
```

---

**Frontend Structure Complete!** 🎉

الآن يمكنك البدء في إنشاء الصفحات والـ components! 🚀


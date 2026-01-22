/**
 * إعدادات الأمان للتطبيق
 * هذا الملف يحتوي على كلمات المرور والإعدادات الأمنية
 * لا يتم رفعه إلى قاعدة البيانات
 */

export const SECURITY_CONFIG = {
  // كلمة مرور صفحة الفروع
  BRANCHES_PAGE_PASSWORD: '1@1@1@',
  
  // يمكن إضافة كلمات مرور أخرى هنا في المستقبل
  // SETTINGS_PAGE_PASSWORD: 'password123',
  // REPORTS_PAGE_PASSWORD: 'password456',
} as const;

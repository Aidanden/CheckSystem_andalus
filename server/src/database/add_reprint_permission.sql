-- ===================================================================
-- سكريبت إضافة صلاحية إعادة الطباعة
-- Check Printing System - M.T.C
-- ===================================================================

-- الخطوة 1: إضافة الصلاحية الجديدة
-- ===================================================================
INSERT INTO permissions (permission_name, permission_code, description)
SELECT 'إعادة الطباعة', 'REPRINT', 'السماح للمستخدم بإعادة طباعة الشيكات المطبوعة مسبقاً من شاشة السجلات'
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'REPRINT'
);

-- الخطوة 2: عرض جميع الصلاحيات للتأكد
-- ===================================================================
SELECT 
    id,
    permission_name AS "اسم الصلاحية",
    permission_code AS "كود الصلاحية",
    description AS "الوصف"
FROM permissions 
ORDER BY id;

-- الخطوة 3 (اختياري): منح الصلاحية لمستخدم معين
-- ===================================================================
-- قم بإلغاء التعليق عن السطور التالية واستبدل 'admin' باسم المستخدم المطلوب

/*
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    u.id,
    p.id
FROM users u
CROSS JOIN permissions p
WHERE u.username = 'admin'  -- استبدل 'admin' باسم المستخدم المطلوب
  AND p.permission_code = 'REPRINT'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission_id = p.id
  );
*/

-- الخطوة 4 (اختياري): منح الصلاحية لجميع المدراء
-- ===================================================================
-- قم بإلغاء التعليق عن السطور التالية لمنح الصلاحية لجميع المدراء

/*
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    u.id,
    p.id
FROM users u
CROSS JOIN permissions p
WHERE u.is_admin = true
  AND p.permission_code = 'REPRINT'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission_id = p.id
  );
*/

-- الخطوة 5: عرض المستخدمين وصلاحياتهم
-- ===================================================================
SELECT 
    u.id,
    u.username AS "اسم المستخدم",
    u.is_admin AS "مسؤول",
    STRING_AGG(p.permission_name, ', ') AS "الصلاحيات"
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_id = p.id
GROUP BY u.id, u.username, u.is_admin
ORDER BY u.id;

-- ===================================================================
-- ملاحظات:
-- ===================================================================
-- 1. بعد تشغيل هذا السكريبت، ستظهر صلاحية "إعادة الطباعة" تلقائياً في شاشة إدارة المستخدمين
-- 2. يمكن للمسؤول منح هذه الصلاحية للمستخدمين من خلال الواجهة
-- 3. المدراء (is_admin = true) لديهم صلاحية إعادة الطباعة تلقائياً بدون الحاجة لمنحها
-- 4. يمكن استخدام الخطوات الاختيارية أعلاه لمنح الصلاحية برمجياً
-- ===================================================================

# تحسين نظام التسلسل للشيكات المصدقة

## المشكلة السابقة
كان النظام يسمح لفروع مختلفة باستخدام نفس الأرقام التسلسلية للشيكات المصدقة. على سبيل المثال:
- الفرع A يمكنه طباعة: 1-50
- الفرع B يمكنه أيضاً طباعة: 1-50 ❌

كان التحقق من التداخل يتم **فقط داخل نفس الفرع**، مما يعني أن كل فرع له تسلسل مستقل.

## الحل المُطبق
تم تعديل النظام لضمان أن **الأرقام التسلسلية فريدة عبر جميع الفروع**:

### التغييرات التقنية

#### 1. تعديل دالة `checkSerialOverlap` في `CertifiedCheck.model.ts`
**قبل:**
```typescript
static async checkSerialOverlap(
    branchId: number,
    firstSerial: number,
    lastSerial: number,
    excludeLogId?: number
): Promise<boolean> {
    const where: any = {
        branchId,  // ❌ يتحقق فقط داخل نفس الفرع
        OR: [...]
    };
    // ...
    return !!overlapping;
}
```

**بعد:**
```typescript
static async checkSerialOverlap(
    branchId: number,
    firstSerial: number,
    lastSerial: number,
    excludeLogId?: number
): Promise<{ hasOverlap: boolean; conflictingBranch?: string }> {
    const where: any = {
        // ✅ إزالة فلتر branchId للتحقق عبر جميع الفروع
        OR: [...]
    };
    
    const overlapping = await prisma.certifiedCheckLog.findFirst({
        where,
        include: {
            branch: {
                select: { branchName: true }
            }
        }
    });

    if (overlapping) {
        return {
            hasOverlap: true,
            conflictingBranch: overlapping.branchName
        };
    }

    return { hasOverlap: false };
}
```

**الفوائد:**
- ✅ إزالة فلتر `branchId` من الاستعلام
- ✅ إرجاع اسم الفرع المتعارض في حالة وجود تداخل
- ✅ رسالة خطأ أكثر وضوحاً للمستخدم

#### 2. تحديث دالة `printBook` في `CertifiedCheck.model.ts`
```typescript
if (data.operationType === 'print') {
    const overlapResult = await this.checkSerialOverlap(
        data.branchId,
        data.firstSerial,
        data.lastSerial
    );

    if (overlapResult.hasOverlap) {
        const errorMessage = overlapResult.conflictingBranch
            ? `الأرقام التسلسلية من ${data.firstSerial} إلى ${data.lastSerial} مستخدمة بالفعل من قبل فرع "${overlapResult.conflictingBranch}"`
            : `الأرقام التسلسلية من ${data.firstSerial} إلى ${data.lastSerial} متداخلة مع عملية طباعة سابقة`;
        throw new Error(errorMessage);
    }
}
```

#### 3. تحديث Controller في `certifiedCheck.controller.ts`
```typescript
// التحقق من عدم التكرار عبر جميع الفروع
const overlapResult = await CertifiedCheckModel.checkSerialOverlap(
    branchId,
    range.firstSerial,
    range.lastSerial
);

if (overlapResult.hasOverlap) {
    const errorMessage = overlapResult.conflictingBranch
        ? `الأرقام التسلسلية من ${range.firstSerial} إلى ${range.lastSerial} مستخدمة بالفعل من قبل فرع "${overlapResult.conflictingBranch}"`
        : `الأرقام التسلسلية من ${range.firstSerial} إلى ${range.lastSerial} متداخلة مع عملية طباعة سابقة`;
    return res.status(400).json({ error: errorMessage });
}
```

## النتيجة النهائية

### السيناريو الآن:
1. **الفرع A** يطبع الأرقام 1-50 ✅
2. **الفرع B** يحاول طباعة 1-50 ❌
   - **رسالة الخطأ:** "الأرقام التسلسلية من 1 إلى 50 مستخدمة بالفعل من قبل فرع "الفرع A""
3. **الفرع B** يجب أن يستخدم 51-100 ✅

### الفوائد:
- ✅ **فريدة عالمياً:** كل رقم تسلسلي يُستخدم مرة واحدة فقط عبر جميع الفروع
- ✅ **رسائل خطأ واضحة:** المستخدم يعرف بالضبط أي فرع يستخدم الأرقام
- ✅ **منع التكرار:** لا يمكن لفرعين استخدام نفس التسلسل
- ✅ **تتبع أفضل:** سهولة تتبع من استخدم أي نطاق من الأرقام

## الملفات المُعدلة
1. `server/src/models/CertifiedCheck.model.ts` - تعديل دالة `checkSerialOverlap` و `printBook`
2. `server/src/controllers/certifiedCheck.controller.ts` - تحديث معالجة الأخطاء في `printBook`

## ملاحظات مهمة
- ⚠️ هذا التغيير **لا يؤثر** على البيانات الموجودة
- ⚠️ يطبق فقط على **عمليات الطباعة الجديدة** (`operationType === 'print'`)
- ⚠️ **إعادة الطباعة** (`reprint`) لا تخضع لهذا التحقق (لأنها تستخدم أرقاماً موجودة مسبقاً)

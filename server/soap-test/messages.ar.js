module.exports = {
  langCode: 'ARB',
  invalidXml: 'لم يتم استلام بيانات XML صالحة. تأكد من إرسال XML في الـ body',
  accountNotFound: (account) => `الحساب رقم ${account} غير موجود في قاعدة البيانات التجريبية`,
  unsupportedOperation: (operation) => `العملية ${operation} غير مدعومة`,
  logReceived: (path) => `\n📨 تم استلام طلب SOAP على المسار: ${path}`,
  logOperation: '📋 العملية المطلوبة:',
  logBranch: '  - فرع الحساب:',
  logAccount: '  - رقم الحساب:',
  logAccountData: '🔍 بيانات الحساب:',
  accountTypeLabel: (type, leaves) => {
    const kind = type === 1 ? 'فردي' : type === 2 ? 'شركة' : 'موظف';
    return `📋 نوع الحساب: ${kind} (${type}) - عدد الشيكات: ${leaves}`;
  },
  logChequesGenerated: (n) => `📊 عدد الشيكات المولدة: ${n}`,
  logSuccess: '✅ تم إنشاء الاستجابة بنجاح\n',
  logError: '❌ خطأ في معالجة الطلب:',
  bannerTitle: (port) => `🚀 خادم SOAP التجريبي يعمل على المنفذ: ${port}`,
  checkBookEndpoint: (host, port) => `📍 CheckBook Endpoint: http://${host}:${port}/FCUBSAccService`,
  customerEndpoint: (host, port) => `📍 CustomerName Endpoint: http://${host}:${port}/FCUBSIAService`,
  health: (host, port) => `🏥 Health Check: http://${host}:${port}/health`,
  supportedOpsTitle: '\n📝 العمليات المدعومة:',
  opCheckBook: '1. QueryCheckBook (للحصول على بيانات الشيكات)',
  opCustomer: '2. QueryIACustAcc (للحصول على اسم العميل)',
  accountsTitle: '\n📊 الحسابات المتوفرة:',
  accountLine: (acc) => {
    const accountTypeName =
      acc.accountType === 1 ? 'فردي (25 شيك)' : acc.accountType === 2 ? 'شركة (50 شيك)' : 'موظف (10 شيك)';
    return `  - ${acc.account} (${acc.name}) - فرع ${acc.branch} - ${accountTypeName}`;
  },
};

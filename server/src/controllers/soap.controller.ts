import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { bankAPI } from '../utils/bankAPI';
import { BranchModel } from '../models/Branch.model';

export class SoapController {
  static async queryCheckbook(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, branchCode, firstChequeNumber } = req.body;

      if (!accountNumber || typeof accountNumber !== 'string') {
        res.status(400).json({ error: 'رقم الحساب مطلوب' });
        return;
      }

      const trimmedAccountNumber = accountNumber.trim();

      // استخراج رقم الفرع من أول 3 أرقام من رقم الحساب (كما طلب المستخدم)
      const extractedBranchCode = trimmedAccountNumber.substring(0, 3);

      // الأولوية للرقم المستخرج من الحساب لضمان الدقة
      const finalBranchCode = extractedBranchCode || branchCode?.trim() || '001';

      console.log('📋 SOAP Query Request:', {
        accountNumber: trimmedAccountNumber,
        extractedBranchCode,
        finalBranchCode,
        firstChequeNumber: firstChequeNumber || 'not specified'
      });

      const result = await bankAPI.queryCheckbook({
        accountNumber: trimmedAccountNumber,
        branchCode: finalBranchCode,
        firstChequeNumber: firstChequeNumber ? parseInt(firstChequeNumber, 10) : undefined,
      });

      // جلب اسم صاحب الحساب من API الثاني
      let customerName: string | undefined;
      try {
        console.log('👤 جلب اسم صاحب الحساب من FCUBSIAService...');
        const accountInfo = await bankAPI.queryAccountInfo(trimmedAccountNumber);
        customerName = accountInfo.customerName;
        console.log('✅ تم جلب اسم صاحب الحساب بنجاح:', customerName);
      } catch (accountInfoError: any) {
        console.error('❌ خطأ في جلب اسم صاحب الحساب:', accountInfoError.message);
        console.warn('⚠️ سيتم المتابعة بدون اسم صاحب الحساب');
        // لا نوقف العملية، فقط نسجل الخطأ
      }

      // جلب معلومات الفرع من قاعدة البيانات
      try {
        console.log('🔍 البحث عن الفرع برقم:', finalBranchCode);
        const branch = await BranchModel.findByBranchCode(finalBranchCode);

        if (branch) {
          // إضافة معلومات الفرع واسم صاحب الحساب إلى النتيجة
          (result as any).branchName = branch.branchName;
          (result as any).routingNumber = branch.routingNumber;
          if (customerName) {
            (result as any).customerName = customerName;
          }
          console.log('✅ تم جلب معلومات الفرع بنجاح:', {
            searchCode: finalBranchCode,
            foundBranchNumber: branch.branchNumber,
            branchName: branch.branchName,
            routingNumber: branch.routingNumber,
            customerName: customerName || 'غير متوفر'
          });
        } else {
          // حتى لو لم نجد الفرع، نضيف اسم صاحب الحساب
          if (customerName) {
            (result as any).customerName = customerName;
          }
          console.warn('⚠️ لم يتم العثور على الفرع في قاعدة البيانات!');
          console.warn('   - رقم الفرع المطلوب:', finalBranchCode);
          console.warn('   - تأكد من وجود فرع برقم (branchNumber) يطابق هذا الرقم');
        }
      } catch (branchError) {
        console.error('❌ خطأ في جلب معلومات الفرع:', branchError);
        // حتى لو فشل جلب الفرع، نضيف اسم صاحب الحساب إن وجد
        if (customerName) {
          (result as any).customerName = customerName;
        }
      }

      console.log('📤 إرسال النتيجة:', {
        accountNumber: result.accountNumber,
        accountBranch: result.accountBranch,
        branchName: (result as any).branchName || 'غير محدد',
        routingNumber: (result as any).routingNumber || 'غير محدد',
        customerName: (result as any).customerName || 'غير محدد'
      });

      res.json(result);
    } catch (error: any) {
      console.error('SOAP query error:', error);
      res.status(500).json({
        error: 'فشل الاستعلام عن دفتر الشيكات',
        details: error.message
      });
    }
  }
}

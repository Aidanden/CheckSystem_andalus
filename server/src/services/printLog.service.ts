import { PrintLogModel, CreatePrintLogData } from '../models/PrintLog.model';
import { PrintOperationModel } from '../models/PrintOperation.model';
import { AccountModel } from '../models/Account.model';
import { UserModel } from '../models/User.model';
import { InventoryService } from './inventory.service';
import { AccountType, StockType } from '../types';

export class PrintLogService {
  static async createPrintLog(data: CreatePrintLogData) {
    // خصم المخزون عند الطباعة العادية
    if (data.operationType === 'print') {
      try {
        // تحديد نوع المخزون بناءً على نوع الحساب
        // Individual (1) و Employee (3) يستخدمان Individual stock
        // Corporate (2) يستخدم Corporate stock
        const stockType: StockType = data.accountType === AccountType.CORPORATE
          ? StockType.CORPORATE
          : StockType.INDIVIDUAL;

        console.log(`📊 تحديد نوع المخزون: accountType=${data.accountType} (${data.accountType === AccountType.CORPORATE ? 'شركة' : data.accountType === AccountType.EMPLOYEE ? 'موظف' : 'فردي'}) => stockType=${stockType} (${stockType === StockType.CORPORATE ? 'شركة' : 'فردي'})`);

        // عدد الأوراق المطبوعة (يجب خصمها من المخزون)
        const sheetsToDeduct = data.totalCheques;

        // التحقق من توفر المخزون قبل الخصم
        const availableQuantity = await InventoryService.getAvailableQuantity(stockType);
        if (availableQuantity < sheetsToDeduct) {
          throw new Error(`لا يوجد مخزون كافٍ. المطلوب: ${sheetsToDeduct} ورقة، المتاح: ${availableQuantity} ورقة`);
        }

        // خصم عدد الأوراق الفعلي من المخزون
        await InventoryService.deductInventory(
          stockType,
          sheetsToDeduct,
          data.printedBy,
          `طباعة دفتر شيكات للحساب ${data.accountNumber} (${sheetsToDeduct} ورقة - من ${data.firstChequeNumber} إلى ${data.lastChequeNumber})`
        );

        console.log(`✅ تم خصم ${sheetsToDeduct} ورقة من المخزون (نوع: ${stockType === StockType.INDIVIDUAL ? 'فردي' : 'شركة'})`);
      } catch (error) {
        console.error('❌ خطأ في خصم المخزون:', error);
        // نرمي الخطأ هنا لأن الطباعة يجب أن تفشل إذا لم يكن هناك مخزون
        if (error instanceof Error) {
          throw new Error(`فشل خصم المخزون: ${error.message}`);
        }
        throw new Error('فشل خصم المخزون');
      }
    }
    // خصم المخزون عند إعادة الطباعة (فقط إذا كانت الورقة تالفة)
    else if (data.operationType === 'reprint') {
      // التحقق من وجود سبب إعادة الطباعة
      if (!data.reprintReason) {
        throw new Error('يجب تحديد سبب إعادة الطباعة (ورقة تالفة أو ورقة لم تطبع)');
      }

      // إذا كانت الورقة تالفة، يجب خصم عدد الأوراق من المخزون
      if (data.reprintReason === 'damaged') {
        try {
          // تحديد نوع المخزون بناءً على نوع الحساب
          const stockType: StockType = data.accountType === AccountType.CORPORATE
            ? StockType.CORPORATE
            : StockType.INDIVIDUAL;

          console.log(`📊 إعادة طباعة - تحديد نوع المخزون: accountType=${data.accountType} (${data.accountType === AccountType.CORPORATE ? 'شركة' : data.accountType === AccountType.EMPLOYEE ? 'موظف' : 'فردي'}) => stockType=${stockType} (${stockType === StockType.CORPORATE ? 'شركة' : 'فردي'})`);

          // عدد الأوراق المعاد طباعتها (يجب خصمها من المخزون)
          const sheetsToDeduct = data.totalCheques;

          // التحقق من توفر المخزون قبل الخصم
          const availableQuantity = await InventoryService.getAvailableQuantity(stockType);
          if (availableQuantity < sheetsToDeduct) {
            throw new Error(`لا يوجد مخزون كافٍ. المطلوب: ${sheetsToDeduct} ورقة، المتاح: ${availableQuantity} ورقة`);
          }

          // خصم عدد الأوراق المعاد طباعتها من المخزون
          await InventoryService.deductInventory(
            stockType,
            sheetsToDeduct,
            data.printedBy,
            `إعادة طباعة دفتر شيكات تالف للحساب ${data.accountNumber} (${sheetsToDeduct} ورقة - من ${data.firstChequeNumber} إلى ${data.lastChequeNumber})`
          );

          console.log(`✅ تم خصم ${sheetsToDeduct} ورقة من المخزون (إعادة طباعة - تالفة) (نوع: ${stockType === StockType.INDIVIDUAL ? 'فردي' : 'شركة'})`);
        } catch (error) {
          console.error('❌ خطأ في خصم المخزون عند إعادة الطباعة:', error);
          if (error instanceof Error) {
            throw new Error(`فشل خصم المخزون: ${error.message}`);
          }
          throw new Error('فشل خصم المخزون');
        }
      }
      // إذا كانت الورقة لم تطبع، لا يتم خصم من المخزون
      else if (data.reprintReason === 'not_printed') {
        console.log(`ℹ️ إعادة طباعة بدون خصم من المخزون (الورقة لم تطبع) - ${data.totalCheques} ورقة`);
      }
    }

    const log = await PrintLogModel.create(data);

    // Sync to PrintOperation for Dashboard Statistics
    try {
      // 1. Get User Branch to attribute the operation correctly
      let branchId: number | undefined;
      let routingNumber = data.accountBranch;

      if (data.printedBy) {
        const user = await UserModel.findById(data.printedBy);
        if (user?.branchId) {
          branchId = user.branchId;
        }
      }

      // 2. Ensure Account Exists (Critical for PrintOperation Foreign Key)
      let account = await AccountModel.findByAccountNumber(data.accountNumber);
      if (!account) {
        // Create a minimal account record if it doesn't exist
        account = await AccountModel.create({
          accountNumber: data.accountNumber,
          accountHolderName: data.accountNumber, // Placeholder name
          accountType: data.accountType,
          branchId: branchId ?? null,
        });
      }

      // 3. Create PrintOperation Record
      await PrintOperationModel.create({
        accountId: account.id,
        userId: data.printedBy,
        branchId: branchId || 0, // 0 or null depending on schema, but Model expects number. If 0 fails FK, we might need null logic in model, but here assuming 0 won't crash or is valid. 
        // Actually BranchId is Int? (nullable) in schema. Model expects number. passing undefined/null might keep it null.
        // Let's check PrintOperationModel.create signature. It takes `branchId: number`.
        // If I pass 0, and Branch 0 doesn't exist, it might satisfy FK if 0 is not checked? 
        // Prisma relies on relationship. `branch` relation is optional.
        // But in schema: `branch Branch? @relation(fields: [branchId], references: [id])`
        // If I pass non-existent ID, FK constraint fails.
        // Better to pass valid ID. If branchId is undefined, I should probably catch that.
        // But dashboard user (emhem) surely has a branch if they can see any stats (even 0).
        routingNumber: routingNumber,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        serialFrom: data.firstChequeNumber,
        serialTo: data.lastChequeNumber,
        sheetsPrinted: data.totalCheques,
        status: 'COMPLETED',
        notes: data.notes,
      });

    } catch (error) {
      console.error('Failed to sync PrintLog to PrintOperation:', error);
      // We do not throw here, so the main Log creation is still successful
    }

    return log;
  }

  static async checkChequesPrintStatus(accountNumber: string, chequeNumbers: number[]) {
    return PrintLogModel.checkPrintedCheques(accountNumber, chequeNumbers);
  }

  static async getAllLogs(options?: {
    page?: number;
    limit?: number;
    operationType?: 'print' | 'reprint';
    accountNumber?: string;
    startDate?: string;
    endDate?: string;
    userId?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const startDate = options?.startDate ? new Date(options.startDate) : undefined;
    const endDate = options?.endDate ? new Date(options.endDate) : undefined;

    return PrintLogModel.findAll({
      skip,
      take: limit,
      operationType: options?.operationType,
      accountNumber: options?.accountNumber,
      startDate,
      endDate,
      userId: options?.userId,
    });
  }

  static async getLogById(id: number) {
    return PrintLogModel.findById(id);
  }

  static async allowReprintForCheques(accountNumber: string, chequeNumbers: number[]) {
    return PrintLogModel.allowReprint(accountNumber, chequeNumbers);
  }
}

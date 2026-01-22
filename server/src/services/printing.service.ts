import prisma from '../lib/prisma';
import { AccountModel } from '../models/Account.model';
import { InventoryModel } from '../models/Inventory.model';
import { PrintOperationModel } from '../models/PrintOperation.model';
import { PrintLogModel } from '../models/PrintLog.model';
import { BranchModel } from '../models/Branch.model';
import { PrintSettingsModel } from '../models/PrintSettings.model';
import { AccountService } from './account.service';
import { InventoryService } from './inventory.service';
import { AccountType, StockType, PrintStatus, PrintCheckbookResponse } from '../types';
import { CheckFormatter, CheckData, CheckbookData } from '../types/check.types';



export class PrintingService {
  static async printCheckbook(
    accountNumber: string,
    userId: number,
    branchId: number,
    customSerialFrom?: number,
    customSerialTo?: number,
    options: { source?: 'test' | 'bank'; branchCoreCode?: string } = {}
  ): Promise<PrintCheckbookResponse> {
    try {
      // Get account information BEFORE starting transaction
      // (queryAccount may create/update account records)
      const { account, checkbookDetails } = await AccountService.queryAccount(accountNumber, {
        source: options.source,
        branchId,
        branchCoreCode: options.branchCoreCode,
      });
      if (!account) {
        throw new Error('Account not found');
      }

      const result = await prisma.$transaction(async (tx) => {

        // Get branch information using transaction client
        const branch = await tx.branch.findUnique({
          where: { id: branchId },
        });
        if (!branch) {
          throw new Error('Branch not found');
        }

        // Determine stock type and number of sheets
        // Individual (1) and Employee (3) checks use Individual stock
        // Corporate (2) checks use Corporate stock
        const stockType: StockType = account.accountType === AccountType.CORPORATE
          ? StockType.CORPORATE
          : StockType.INDIVIDUAL;

        // Individual = 25 sheets, Corporate = 50 sheets, Employee = 10 sheets
        const sheetsPerBook = account.accountType === AccountType.INDIVIDUAL
          ? 25
          : account.accountType === AccountType.CORPORATE
            ? 50
            : 10;

        // If account is assigned to a specific branch and doesn't match the requested branch, prevent printing
        if (account.branchId && account.branchId !== branchId) {
          throw new Error('غير مسموح بالوصول لحساب تابع لفرع آخر');
        }

        // Load print settings for this account type (use tx to keep within transaction)
        let settings: any = null;
        const dbSettings = await tx.printSettings.findUnique({ where: { accountType: account.accountType } });

        console.log('\n📋 Loading Print Settings for Account Type:', account.accountType);
        console.log('DB Settings Found:', dbSettings ? 'Yes' : 'No');

        if (dbSettings) {
          settings = {
            accountType: dbSettings.accountType,
            checkWidth: dbSettings.checkWidth,
            checkHeight: dbSettings.checkHeight,
            branchName: { x: dbSettings.branchNameX, y: dbSettings.branchNameY, fontSize: dbSettings.branchNameFontSize, align: dbSettings.branchNameAlign },
            serialNumber: { x: dbSettings.serialNumberX, y: dbSettings.serialNumberY, fontSize: dbSettings.serialNumberFontSize, align: dbSettings.serialNumberAlign },
            accountNumber: { x: (dbSettings as any).accountNumberX, y: (dbSettings as any).accountNumberY, fontSize: (dbSettings as any).accountNumberFontSize, align: (dbSettings as any).accountNumberAlign },
            checkSequence: { x: (dbSettings as any).checkSequenceX, y: (dbSettings as any).checkSequenceY, fontSize: (dbSettings as any).checkSequenceFontSize, align: (dbSettings as any).checkSequenceAlign },
            accountHolderName: { x: dbSettings.accountHolderNameX, y: dbSettings.accountHolderNameY, fontSize: dbSettings.accountHolderNameFontSize, align: dbSettings.accountHolderNameAlign },
            micrLine: { x: dbSettings.micrLineX, y: dbSettings.micrLineY, fontSize: dbSettings.micrLineFontSize, align: dbSettings.micrLineAlign },
          };

          console.log('Settings Loaded:');
          console.log('  Check Size:', settings.checkWidth, 'x', settings.checkHeight, 'mm');
          console.log('  Branch Name:', settings.branchName);
          console.log('  Serial Number:', settings.serialNumber);
          console.log('  Account Holder:', settings.accountHolderName);
          console.log('  MICR Line:', settings.micrLine);
        } else {
          // Fallback to defaults via PrintSettingsModel.getOrDefault
          settings = await PrintSettingsModel.getOrDefault(account.accountType);
          console.log('⚠️ Using default settings (no DB settings found)');
        }
        console.log('');


        // Check inventory availability using transaction client
        const inventory = await tx.inventory.findFirst({
          where: { stockType },
          select: { quantity: true },
        });
        const currentQuantity = inventory?.quantity || 0;
        if (currentQuantity < 1) {
          throw new Error('لا يوجد مخزون كافٍ');
        }

        // Calculate serial numbers
        let serialFrom: number;
        let serialTo: number;

        if (customSerialFrom !== undefined && customSerialTo !== undefined) {
          // Custom range specified (for reprint)
          serialFrom = customSerialFrom;
          serialTo = customSerialTo;

          // Validate range
          if (serialFrom < 1 || serialTo < serialFrom) {
            throw new Error('رقم التسلسل غير صحيح');
          }

          const requestedSheets = serialTo - serialFrom + 1;
          if (requestedSheets > sheetsPerBook) {
            throw new Error(`لا يمكن طباعة أكثر من ${sheetsPerBook} ورقة في المرة الواحدة`);
          }
        } else {
          // Normal print: continue from last serial
          const lastSerial = account.lastPrintedSerial;
          serialFrom = lastSerial + 1;
          serialTo = lastSerial + sheetsPerBook;
        }

        // Deduct from inventory using transaction client
        await tx.inventory.updateMany({
          where: { stockType },
          data: {
            quantity: {
              decrement: 1,
            },
          },
        });

        // Record inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            stockType,
            transactionType: 'DEDUCT',
            quantity: 1,
            userId,
            notes: `طباعة دفتر شيكات للحساب ${accountNumber}`,
          },
        });

        // Update last printed serial using transaction client
        await tx.account.update({
          where: { accountNumber },
          data: { lastPrintedSerial: serialTo },
        });

        // Generate checkbook data with MICR information
        const checkbookData = this.generateCheckbookData(
          account.accountNumber,
          account.accountHolderName,
          account.accountType as 1 | 2,
          branch.branchName,
          branch.routingNumber,
          serialFrom,
          serialTo,
          settings
        );

        // Create print operation record using transaction client
        const sheetsPrintedCount = serialTo - serialFrom + 1;
        const operation = await tx.printOperation.create({
          data: {
            accountId: account.id,
            userId: userId,
            branchId: branchId,
            routingNumber: branch.routingNumber,
            accountNumber: accountNumber,
            accountType: account.accountType,
            serialFrom: serialFrom,
            serialTo: serialTo,
            sheetsPrinted: sheetsPrintedCount,
            pdfFilename: null,
            status: PrintStatus.COMPLETED,
          },
        });

        // Send to MICR printer
        await this.sendToMICRPrinter(checkbookData);

        return {
          success: true,
          message: `تمت طباعة دفتر الشيكات بنجاح. الأرقام التسلسلية من ${serialFrom} إلى ${serialTo}`,
          operation,
          checkbookData, // Return data for client-side PDF generation
        };
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'حدث خطأ أثناء طباعة دفتر الشيكات',
      };
    }
  }

  static async getPrintHistory(filters: {
    userId?: number;
    branchId?: number;
    accountNumber?: string;
    accountHolderName?: string;
    accountType?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<any[]> {
    const { userId, branchId, accountNumber, accountHolderName, accountType, status, dateFrom, dateTo, limit = 100 } = filters;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (accountNumber) {
      where.accountNumber = { contains: accountNumber };
    }

    if (accountHolderName) {
      where.account = {
        accountHolderName: { contains: accountHolderName }
      };
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.printDate = {};
      if (dateFrom) {
        where.printDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.printDate.lte = endDate;
      }
    }

    return prisma.printOperation.findMany({
      where,
      orderBy: { printDate: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        branch: {
          select: {
            id: true,
            branchName: true,
          },
        },
        account: {
          select: {
            id: true,
            accountHolderName: true,
          }
        }
      },
    });
  }

  static async getPrintStatistics(branchId?: number): Promise<any> {
    const stats = await PrintOperationModel.getStatistics(branchId);
    const reprintStats = await PrintLogModel.getReprintStatistics(branchId);

    return {
      ...stats,
      reprint_operations: reprintStats.operations.toString(),
      reprint_sheets: reprintStats.sheets.toString(),
    };
  }

  /**
   * Generate complete checkbook data with MICR lines
   */
  private static generateCheckbookData(
    accountNumber: string,
    accountHolderName: string,
    accountType: 1 | 2,
    branchName: string,
    routingNumber: string,
    serialFrom: number,
    serialTo: number,
    settings: any
  ): CheckbookData {
    const checks: CheckData[] = [];
    // Determine check size either from settings or formatter defaults
    const checkSize = settings && settings.checkWidth && settings.checkHeight
      ? { width: settings.checkWidth, height: settings.checkHeight, unit: 'mm' }
      : CheckFormatter.getCheckSize(accountType);

    // Generate data for each check in the book
    for (let serial = serialFrom; serial <= serialTo; serial++) {
      const checkNumber = serial - serialFrom + 1;
      const serialFormatted = CheckFormatter.formatSerialNumber(serial);
      const accountTypeFormatted = CheckFormatter.formatAccountType(accountType);
      const micrLine = CheckFormatter.generateMICRLine(
        serial,
        routingNumber,
        accountNumber,
        accountType
      );

      // Attach position/format settings per check so PDF generator can use them
      const checkObj: any = {
        checkNumber,
        serialNumber: serialFormatted,
        routingNumber,
        accountNumber,
        accountType: accountTypeFormatted,
        accountHolderName,
        branchName,
        checkSize,
        micrLine,
      };

      if (settings) {
        checkObj.branchNameX = settings.branchName?.x;
        checkObj.branchNameY = settings.branchName?.y;
        checkObj.branchNameFontSize = settings.branchName?.fontSize;
        checkObj.branchNameAlign = settings.branchName?.align;

        checkObj.serialNumberX = settings.serialNumber?.x;
        checkObj.serialNumberY = settings.serialNumber?.y;
        checkObj.serialNumberFontSize = settings.serialNumber?.fontSize;
        checkObj.serialNumberAlign = settings.serialNumber?.align;

        checkObj.accountNumberX = settings.accountNumber?.x;
        checkObj.accountNumberY = settings.accountNumber?.y;
        checkObj.accountNumberFontSize = settings.accountNumber?.fontSize;
        checkObj.accountNumberAlign = settings.accountNumber?.align;

        checkObj.checkSequenceX = settings.checkSequence?.x;
        checkObj.checkSequenceY = settings.checkSequence?.y;
        checkObj.checkSequenceFontSize = settings.checkSequence?.fontSize;
        checkObj.checkSequenceAlign = settings.checkSequence?.align;

        checkObj.accountHolderNameX = settings.accountHolderName?.x;
        checkObj.accountHolderNameY = settings.accountHolderName?.y;
        checkObj.accountHolderNameFontSize = settings.accountHolderName?.fontSize;
        checkObj.accountHolderNameAlign = settings.accountHolderName?.align;

        checkObj.micrLineX = settings.micrLine?.x;
        checkObj.micrLineY = settings.micrLine?.y;
        checkObj.micrLineFontSize = settings.micrLine?.fontSize;
        checkObj.micrLineAlign = settings.micrLine?.align;
      }

      checks.push(checkObj as CheckData);
    }

    return {
      operation: {
        operationId: 0, // Will be set after database insert
        accountNumber,
        accountHolderName,
        accountType,
        branchName,
        routingNumber,
        serialFrom,
        serialTo,
        sheetsPrinted: serialTo - serialFrom + 1,
        printDate: new Date(),
      },
      checks,
    };
  }

  /**
   * Send checkbook data to MICR printer
   * TODO: Implement actual printer integration
   */
  private static async sendToMICRPrinter(checkbookData: CheckbookData): Promise<void> {
    // This would send formatted MICR data to the physical printer
    console.log('='.repeat(60));
    console.log('📄 إرسال دفتر الشيكات إلى طابعة MICR');
    console.log('='.repeat(60));
    console.log('\n📋 معلومات العملية:');
    console.log(`   الحساب: ${checkbookData.operation.accountNumber}`);
    console.log(`   العميل: ${checkbookData.operation.accountHolderName}`);
    console.log(`   الفرع: ${checkbookData.operation.branchName}`);
    console.log(`   النوع: ${checkbookData.operation.accountType === 1 ? 'فردي' : 'شركة'}`);
    console.log(`   التسلسل: من ${checkbookData.operation.serialFrom} إلى ${checkbookData.operation.serialTo}`);
    console.log(`   عدد الأوراق: ${checkbookData.operation.sheetsPrinted}`);

    console.log('\n🖨️ نماذج من الشيكات:');

    // Show first 3 checks as example
    const samplesToShow = Math.min(3, checkbookData.checks.length);
    for (let i = 0; i < samplesToShow; i++) {
      const check = checkbookData.checks[i];
      console.log(`\n   ✅ شيك رقم ${check.checkNumber}:`);
      console.log(`      المقاس: ${check.checkSize.width}×${check.checkSize.height} ملم`);
      console.log(`      في الأعلى (المنتصف): ${check.branchName}`);
      console.log(`      تحته (على اليمين): ${check.serialNumber}`);
      console.log(`      في الأسفل (اليسار): ${check.accountHolderName}`);
      console.log(`      خط MICR: ${check.micrLine}`);
    }

    if (checkbookData.checks.length > 3) {
      console.log(`\n   ... وباقي ${checkbookData.checks.length - 3} شيك`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ تم إرسال البيانات إلى الطابعة بنجاح');
    console.log('='.repeat(60) + '\n');

    // TODO: Replace with actual printer API call
    // Example:
    // await printerAPI.printCheckbook(checkbookData);
  }
}

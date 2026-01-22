import { AccountModel } from '../models/Account.model';
import { BranchModel } from '../models/Branch.model';
import { bankAPI } from '../utils/bankAPI';
import { Account } from '@prisma/client';
import { CheckbookDetails } from '../types';

export class AccountService {
  static async getAllAccounts(): Promise<Account[]> {
    return AccountModel.findAll();
  }

  static async getAccountById(id: number): Promise<Account> {
    const account = await AccountModel.findById(id);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  static async getAccountByNumber(accountNumber: string): Promise<Account> {
    const account = await AccountModel.findByAccountNumber(accountNumber);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  static async queryAccount(
    accountNumber: string,
    options: {
      source?: 'test' | 'bank';
      branchId?: number;
      branchCoreCode?: string;
    } = {}
  ): Promise<{ account: Account; checkbookDetails?: CheckbookDetails }> {
    const useBankApi = options.source === 'bank';

    try {
      let bankAccountData: { account_number: string; account_holder_name: string; account_type: number } | null = null;
      let checkbookDetails: CheckbookDetails | undefined;

      if (useBankApi) {
        const branchCoreCode = await this.resolveBranchCoreCode(options.branchId, options.branchCoreCode);
        if (!branchCoreCode) {
          throw new Error('لم يتم تحديد رمز الفرع للمنظومة المصرفية');
        }

        try {
          checkbookDetails = await bankAPI.queryCheckbook({
            accountNumber,
            branchCode: branchCoreCode,
          });

          // If successful, use checkbook details
          bankAccountData = {
            account_number: checkbookDetails.accountNumber,
            account_holder_name: checkbookDetails.accountNumber,
            account_type: 1,
          };
        } catch (err: any) {
          console.error('FCUBS query failed:', err);

          // Check if it's a connection error - fallback to mock mode
          if (err.message?.includes('not accessible') || err.message?.includes('ECONNREFUSED')) {
            console.warn('⚠️ FCUBS server not accessible, falling back to mock mode...');
            bankAccountData = await bankAPI.getAccountInfoMock(accountNumber);
            console.log('✅ Using mock data as fallback');
          } else {
            throw new Error('تعذر الاتصال بالمنظومة المصرفية. الرجاء المحاولة لاحقاً');
          }
        }
      } else {
        bankAccountData = await bankAPI.getAccountInfoMock(accountNumber);
      }

      // Ensure bankAccountData is assigned
      if (!bankAccountData) {
        throw new Error('فشل في الحصول على بيانات الحساب');
      }

      let account = await AccountModel.findByAccountNumber(bankAccountData.account_number);

      if (!account) {
        account = await AccountModel.create({
          accountNumber: bankAccountData.account_number,
          accountHolderName: bankAccountData.account_holder_name,
          accountType: bankAccountData.account_type,
          branchId: options.branchId ?? null,
        });
      } else {
        if (account.accountHolderName !== bankAccountData.account_holder_name) {
          account = await AccountModel.updateName(
            bankAccountData.account_number,
            bankAccountData.account_holder_name
          ) as Account;
        }

        if (useBankApi && options.branchId && account.branchId !== options.branchId) {
          account = await AccountModel.updateBranch(bankAccountData.account_number, options.branchId) as Account;
        }
      }

      return { account, checkbookDetails };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`فشل الاستعلام عن الحساب: ${error.message}`);
      }
      throw error;
    }
  }

  private static async resolveBranchCoreCode(branchId?: number, override?: string): Promise<string | undefined> {
    if (override) return override;
    if (branchId) {
      const branch = await BranchModel.findById(branchId);
      if (branch?.routingNumber) {
        if (branch.routingNumber.length >= 3) {
          return branch.routingNumber.substring(branch.routingNumber.length - 3);
        }
        return branch.routingNumber;
      }
    }
    return process.env.BANK_DEFAULT_BRANCH_CODE || '001';
  }

  static async getLastPrintedSerial(accountNumber: string): Promise<number> {
    return AccountModel.getLastPrintedSerial(accountNumber);
  }

  static async updateLastPrintedSerial(
    accountNumber: string,
    lastSerial: number
  ): Promise<void> {
    await AccountModel.updateLastPrintedSerial(accountNumber, lastSerial);
  }
}

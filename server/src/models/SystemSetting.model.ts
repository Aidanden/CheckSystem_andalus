import prisma from '../lib/prisma';

export class SystemSettingModel {
  static async findByKey(key: string) {
    return prisma.systemSetting.findUnique({
      where: { key },
    });
  }

  static async getValue(key: string): Promise<string | null> {
    const record = await this.findByKey(key);
    return record?.value ?? null;
  }

  static async setValue(key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  static async deleteByKey(key: string): Promise<void> {
    try {
      await prisma.systemSetting.delete({ where: { key } });
    } catch (error: any) {
      if (error?.code !== 'P2025') {
        throw error;
      }
    }
  }
}

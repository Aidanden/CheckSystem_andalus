import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Delete old permissions and their associations
  console.log('Cleaning up old permissions...');
  await prisma.userPermission.deleteMany({});
  await prisma.permission.deleteMany({});
  console.log('✅ Old permissions cleaned up');

  // Create default permissions
  const permissions = [
    // إدارة النظام
    {
      permissionName: 'إدارة المستخدمين',
      permissionCode: 'MANAGE_USERS',
      description: 'القدرة على إضافة/تعديل/حذف المستخدمين',
    },
    {
      permissionName: 'إدارة الفروع',
      permissionCode: 'MANAGE_BRANCHES',
      description: 'القدرة على إضافة/تعديل الفروع',
    },
    {
      permissionName: 'إعدادات النظام',
      permissionCode: 'SYSTEM_SETTINGS',
      description: 'الوصول إلى شاشة إعدادات الطباعة وتخطيط الشيكات',
    },
    {
      permissionName: 'شاشة التقارير العامة',
      permissionCode: 'SCREEN_REPORTS',
      description: 'الوصول إلى الشاشة العامة للتقارير والإحصائيات',
    },

    // شيكات الأفراد والشركات
    {
      permissionName: 'طباعة دفاتر شيكات',
      permissionCode: 'SCREEN_PRINT',
      description: 'الوصول إلى شاشة طباعة دفاتر شيكات الأفراد والشركات',
    },
    {
      permissionName: 'سجلات طباعة الدفاتر',
      permissionCode: 'SCREEN_PRINT_LOGS',
      description: 'الوصول إلى سجلات عمليات طباعة الدفاتر',
    },
    {
      permissionName: 'إدارة المخزون (دفاتر)',
      permissionCode: 'INVENTORY_MANAGEMENT',
      description: 'إدارة مخزون دفاتر الشيكات الخام',
    },
    {
      permissionName: 'إعادة طباعة الشيكات',
      permissionCode: 'REPRINT',
      description: 'القدرة على إعادة طباعة الشيكات من شاشة السجلات',
    },

    // طباعة الشيك المصدق (فردي)
    {
      permissionName: 'طباعة شيك مصدق',
      permissionCode: 'SCREEN_CERTIFIED_PRINT',
      description: 'الوصول إلى شاشة طباعة الشيكات المصدقة الفردية',
    },
    {
      permissionName: 'تقارير الشيك المصدق',
      permissionCode: 'SCREEN_CERTIFIED_REPORTS',
      description: 'الوصول إلى تقارير إصدار الشيكات المصدقة الفردية',
    },
    {
      permissionName: 'إعادة طباعة المصدق',
      permissionCode: 'REPRINT_CERTIFIED',
      description: 'القدرة على إعادة طباعة الشيكات المصدقة',
    },

    // إصدار دفاتر المصدقة
    {
      permissionName: 'إصدار دفاتر مصدقة',
      permissionCode: 'SCREEN_CERTIFIED_BOOKS',
      description: 'الوصول إلى شاشة إصدار دفاتر الصكوك المصدقة',
    },
    {
      permissionName: 'سجلات الدفاتر المصدقة',
      permissionCode: 'SCREEN_CERTIFIED_LOGS',
      description: 'الوصول إلى سجلات إصدار دفاتر الصكوك المصدقة',
    },
    {
      permissionName: 'مخزن المصدق',
      permissionCode: 'CERTIFIED_INVENTORY_MANAGEMENT',
      description: 'إدارة مخزون الصكوك المصدقة (الخام والإصدار)',
    },
  ];

  console.log('Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.create({
      data: perm,
    });
  }
  console.log('✅ Permissions created');

  // Create two branches: Tripoli (main) and Misrata
  console.log('Creating branches for Tripoli and Misrata...');
  const tripoli = await prisma.branch.upsert({
    where: { routingNumber: '02800116' },
    update: { branchNumber: '001' },
    create: {
      branchName: 'فرع طرابلس',
      branchLocation: 'طرابلس - طريق السكة',
      routingNumber: '02800116',
      branchNumber: '001',
    },
  });

  const misrata = await prisma.branch.upsert({
    where: { routingNumber: '02800219' },
    update: { branchNumber: '002' },
    create: {
      branchName: 'فرع مصراته',
      branchLocation: 'مصراته ',
      routingNumber: '02800219',
      branchNumber: '002',
    },
  });

  console.log('✅ Branches created: Tripoli ID=', tripoli.id, ' Misrata ID=', misrata.id);

  // Remove other branches (if any) — user requested to delete other branches
  await prisma.branch.deleteMany({
    where: {
      routingNumber: {
        notIn: [tripoli.routingNumber, misrata.routingNumber],
      },
    },
  });
  console.log('✅ Removed other branches (if existed)');

  // Create main admin user (assigned to Tripoli)
  console.log('Creating admin user for Tripoli...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      branchId: tripoli.id,
      isAdmin: true,
      isActive: true,
    },
  });
  console.log('✅ Admin user created with ID:', adminUser.id);
  console.log('   Username: admin');
  console.log('   Password: [REDACTED] (change in production)');
  console.log('   ⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IN PRODUCTION!');

  // Create branch-specific users for Tripoli
  console.log('Creating Tripoli branch users...');
  const tripManagerPass = await bcrypt.hash('trip_manager_123', 10);
  const tripManager = await prisma.user.upsert({
    where: { username: 'trip_manager' },
    update: {},
    create: {
      username: 'trip_manager',
      passwordHash: tripManagerPass,
      branchId: tripoli.id,
      isAdmin: false,
      isActive: true,
    },
  });

  const tripOperatorPass = await bcrypt.hash('trip_operator_123', 10);
  const tripOperator = await prisma.user.upsert({
    where: { username: 'trip_operator' },
    update: {},
    create: {
      username: 'trip_operator',
      passwordHash: tripOperatorPass,
      branchId: tripoli.id,
      isAdmin: false,
      isActive: true,
    },
  });
  console.log('✅ Tripoli users created');

  // Create branch-specific users for Misrata
  console.log('Creating Misrata branch users...');
  const msrManagerPass = await bcrypt.hash('msr_manager_123', 10);
  const msrManager = await prisma.user.upsert({
    where: { username: 'msr_manager' },
    update: {},
    create: {
      username: 'msr_manager',
      passwordHash: msrManagerPass,
      branchId: misrata.id,
      isAdmin: false,
      isActive: true,
    },
  });

  const msrOperatorPass = await bcrypt.hash('msr_operator_123', 10);
  const msrOperator = await prisma.user.upsert({
    where: { username: 'msr_operator' },
    update: {},
    create: {
      username: 'msr_operator',
      passwordHash: msrOperatorPass,
      branchId: misrata.id,
      isAdmin: false,
      isActive: true,
    },
  });
  console.log('✅ Misrata users created');

  // Assign permissions
  const allPermissions = await prisma.permission.findMany();

  // Admin gets ALL permissions
  console.log('Assigning all permissions to admin...');
  for (const permission of allPermissions) {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: adminUser.id, permissionId: permission.id } },
      update: {},
      create: { userId: adminUser.id, permissionId: permission.id },
    });
  }
  console.log('✅ Admin granted all permissions');

  // Branch users get specific permissions
  console.log('Assigning permissions to branch users...');
  const screenPrintPerm = await prisma.permission.findUnique({ where: { permissionCode: 'SCREEN_PRINT' } });
  const screenLogsPerm = await prisma.permission.findUnique({ where: { permissionCode: 'SCREEN_PRINT_LOGS' } });
  const screenReportsPerm = await prisma.permission.findUnique({ where: { permissionCode: 'SCREEN_REPORTS' } });

  const branchUsers = [tripManager, tripOperator, msrManager, msrOperator];
  for (const u of branchUsers) {
    // Grant screen access permissions
    if (screenPrintPerm) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: u.id, permissionId: screenPrintPerm.id } },
        update: {},
        create: { userId: u.id, permissionId: screenPrintPerm.id },
      });
    }
    if (screenLogsPerm) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: u.id, permissionId: screenLogsPerm.id } },
        update: {},
        create: { userId: u.id, permissionId: screenLogsPerm.id },
      });
    }
    if (screenReportsPerm) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: u.id, permissionId: screenReportsPerm.id } },
        update: {},
        create: { userId: u.id, permissionId: screenReportsPerm.id },
      });
    }
  }
  console.log('✅ Permissions assigned to branch users');

  // Set all non-admin users' password to '123' (hashed), leave admin unchanged
  console.log('Updating passwords: setting password "123" for all non-admin users...');
  const defaultPassHash = await bcrypt.hash('123', 10);
  await prisma.user.updateMany({
    where: { username: { not: 'admin' } },
    data: { passwordHash: defaultPassHash },
  });
  console.log('✅ Updated passwords for non-admin users (password = 123)');

  // Create initial inventory
  console.log('Creating initial inventory...');
  await prisma.inventory.upsert({
    where: { id: 1 },
    update: { quantity: 100 },
    create: {
      stockType: 1, // Individual
      quantity: 100,
    },
  });

  await prisma.inventory.upsert({
    where: { id: 2 },
    update: { quantity: 50 },
    create: {
      stockType: 2, // Corporate
      quantity: 50,
    },
  });

  await prisma.inventory.upsert({
    where: { id: 3 },
    update: { quantity: 200 },
    create: {
      stockType: 3, // Certified
      quantity: 200,
    },
  });
  console.log('✅ Initial inventory added (100 individual, 50 corporate, 200 certified)');

  // Create test accounts (15 digits each)
  console.log('Creating test accounts...');

  // Create accounts for Tripoli (branchId = tripoli.id)

  /*
  await prisma.account.upsert({
    where: { accountNumber: '100031100000001' },
    update: {},
    create: {
      accountNumber: '100031100000001',
      accountHolderName: 'أمينة محمد علي',
      accountType: 1,
      branchId: tripoli.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '100031100000002' },
    update: {},
    create: {
      accountNumber: '100031100000002',
      accountHolderName: 'خالد حسين سعيد',
      accountType: 1,
      branchId: tripoli.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '200031100000001' },
    update: {},
    create: {
      accountNumber: '200031100000001',
      accountHolderName: 'شركة طرابلس للتقنية المحدودة',
      accountType: 2,
      branchId: tripoli.id,
      lastPrintedSerial: 0,
    },
  });

  // Create accounts for Misrata (branchId = misrata.id)
  await prisma.account.upsert({
    where: { accountNumber: '100031200000001' },
    update: {},
    create: {
      accountNumber: '100031200000001',
      accountHolderName: 'سارة محمد عبدالرحمن',
      accountType: 1,
      branchId: misrata.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '100031200000002' },
    update: {},
    create: {
      accountNumber: '100031200000002',
      accountHolderName: 'مروان عبدالغني',
      accountType: 1,
      branchId: misrata.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '200031200000001' },
    update: {},
    create: {
      accountNumber: '200031200000001',
      accountHolderName: 'شركة مصراته للصناعات',
      accountType: 2,
      branchId: misrata.id,
      lastPrintedSerial: 0,
    },
  });
*/
  console.log('✅ Test accounts created for Tripoli and Misrata (each linked to their branch)');

  // 8. Create default print settings
  console.log('\n🎨 Creating default print settings...');

  // Individual check settings (235 x 86 mm)
  await prisma.printSettings.upsert({
    where: { accountType: 1 },
    update: {
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: 120,
      accountNumberY: 52,
      accountNumberFontSize: 8,
      accountNumberAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: 120,
      accountHolderNameY: 58,
      accountHolderNameFontSize: 8,
      accountHolderNameAlign: 'right',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
    create: {
      accountType: 1,
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: 120,
      accountNumberY: 52,
      accountNumberFontSize: 8,
      accountNumberAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: 120,
      accountHolderNameY: 58,
      accountHolderNameFontSize: 8,
      accountHolderNameAlign: 'right',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
  });

  // Corporate check settings (240 x 86 mm)
  await prisma.printSettings.upsert({
    where: { accountType: 2 },
    update: {
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: 135,
      accountNumberY: 52,
      accountNumberFontSize: 8,
      accountNumberAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: 135,
      accountHolderNameY: 58,
      accountHolderNameFontSize: 8,
      accountHolderNameAlign: 'right',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
    create: {
      accountType: 2,
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: 135,
      accountNumberY: 52,
      accountNumberFontSize: 8,
      accountNumberAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: 135,
      accountHolderNameY: 58,
      accountHolderNameFontSize: 8,
      accountHolderNameAlign: 'right',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
  });

  // Bank staff check settings (10 checks, same layout as individual)
  await prisma.printSettings.upsert({
    where: { accountType: 3 },
    update: {
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: 120,
      accountNumberY: 52,
      accountNumberFontSize: 8,
      accountNumberAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: 120,
      accountHolderNameY: 58,
      accountHolderNameFontSize: 8,
      accountHolderNameAlign: 'right',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
    create: {
      accountType: 3,
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: 120,
      accountNumberY: 52,
      accountNumberFontSize: 8,
      accountNumberAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: 120,
      accountHolderNameY: 58,
      accountHolderNameFontSize: 8,
      accountHolderNameAlign: 'right',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
  });

  // Certified checks settings (accountType: 4) - similar to corporate but without account holder name and account number
  await prisma.printSettings.upsert({
    where: { accountType: 4 },
    update: {
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      accountNumberX: undefined,
      accountNumberY: undefined,
      accountNumberFontSize: undefined,
      accountNumberAlign: undefined,
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: -1000, // خارج الشيك - لا يظهر
      accountHolderNameY: -1000, // خارج الشيك - لا يظهر
      accountHolderNameFontSize: 0,
      accountHolderNameAlign: 'left',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
    create: {
      accountType: 4,
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 145,
      branchNameY: 5,
      branchNameFontSize: 8,
      branchNameAlign: 'center',
      serialNumberX: 215,
      serialNumberY: 18,
      serialNumberFontSize: 8,
      serialNumberAlign: 'right',
      checkSequenceX: 20,
      checkSequenceY: 18,
      checkSequenceFontSize: 8,
      checkSequenceAlign: 'left',
      accountHolderNameX: -1000, // خارج الشيك - لا يظهر
      accountHolderNameY: -1000, // خارج الشيك - لا يظهر
      accountHolderNameFontSize: 0,
      accountHolderNameAlign: 'left',
      micrLineX: 138,
      micrLineY: 70,
      micrLineFontSize: 14,
      micrLineAlign: 'center',
    },
  });

  console.log('✅ Print settings created:');
  console.log('  - Individual settings (235 x 86 mm)');
  console.log('  - Corporate settings (240 x 86 mm)');
  console.log('  - Bank staff settings (235 x 86 mm)');
  console.log('  - Certified checks settings (240 x 86 mm, without account holder name and account number)');

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    // @ts-ignore - process is available in Node.js runtime
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Testing Prisma Client...');
console.log('Has systemSetting?', 'systemSetting' in prisma);
console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

prisma.$disconnect();

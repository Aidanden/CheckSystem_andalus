const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setSoapEndpoint() {
  try {
    // رابط SOAP الصحيح للبنك
    const soapEndpoint = 'http://localhost:5050:8080/FCUBSAccService';

    const result = await prisma.systemSetting.upsert({
      where: { key: 'soap_api_url' },
      update: { value: soapEndpoint },
      create: {
        key: 'soap_api_url',
        value: soapEndpoint
      }
    });

    console.log('✅ تم تعيين رابط SOAP بنجاح:', result);
  } catch (error) {
    console.error('❌ فشل في تعيين رابط SOAP:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setSoapEndpoint();

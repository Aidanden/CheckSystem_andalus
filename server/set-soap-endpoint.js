const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Local mock FCUBS server (npm run soap:test or soap:test:en) */
const LOCAL_ENDPOINTS = {
  soap_api_url: 'http://localhost:8080/FCUBSAccService',
  soap_ia_api_url: 'http://localhost:8080/FCUBSIAService',
};

async function setSoapEndpoint() {
  try {
    for (const [key, value] of Object.entries(LOCAL_ENDPOINTS)) {
      const result = await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      console.log(`✅ ${key}:`, result.value);
    }
  } catch (error) {
    console.error('❌ Failed to set SOAP endpoints:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

setSoapEndpoint();

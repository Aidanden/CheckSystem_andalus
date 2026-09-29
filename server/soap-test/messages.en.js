module.exports = {
  langCode: 'ENG',
  invalidXml: 'No valid XML body received. Send XML in the request body.',
  accountNotFound: (account) => `Account ${account} was not found in the test database`,
  unsupportedOperation: (operation) => `Operation ${operation} is not supported`,
  logReceived: (path) => `\n📨 SOAP request received on path: ${path}`,
  logOperation: '📋 Requested operation:',
  logBranch: '  - Account branch:',
  logAccount: '  - Account number:',
  logAccountData: '🔍 Account data:',
  accountTypeLabel: (type, leaves) => {
    const kind = type === 1 ? 'Individual' : type === 2 ? 'Corporate' : 'Employee';
    return `📋 Account type: ${kind} (${type}) - cheque leaves: ${leaves}`;
  },
  logChequesGenerated: (n) => `📊 Generated cheques: ${n}`,
  logSuccess: '✅ Response built successfully\n',
  logError: '❌ Request handling error:',
  bannerTitle: (port) => `🚀 FCUBS SOAP mock server listening on port: ${port}`,
  checkBookEndpoint: (host, port) => `📍 CheckBook Endpoint: http://${host}:${port}/FCUBSAccService`,
  customerEndpoint: (host, port) => `📍 CustomerName Endpoint: http://${host}:${port}/FCUBSIAService`,
  health: (host, port) => `🏥 Health Check: http://${host}:${port}/health`,
  supportedOpsTitle: '\n📝 Supported operations:',
  opCheckBook: '1. QueryCheckBook (cheque book data)',
  opCustomer: '2. QueryIACustAcc (customer name)',
  accountsTitle: '\n📊 Available test accounts:',
  accountLine: (acc) => {
    const accountTypeName =
      acc.accountType === 1
        ? 'Individual (25 cheques)'
        : acc.accountType === 2
          ? 'Corporate (50 cheques)'
          : 'Employee (10 cheques)';
    return `  - ${acc.account} (${acc.name}) - branch ${acc.branch} - ${accountTypeName}`;
  },
};

const { createSoapTestServer } = require('./soap-test/createServer');
const accounts = require('./soap-test/accounts.en');
const messages = require('./soap-test/messages.en');

const { start } = createSoapTestServer({ accounts, messages });
start();

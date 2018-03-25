const SimpleNodeLogger = require('simple-node-logger');

module.exports = SimpleNodeLogger.createSimpleLogger({
    logFilePath: process.cwd() + process.env.LOG_PATH,
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
  });
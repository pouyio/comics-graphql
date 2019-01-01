require('dotenv').load();
const serverless = require('serverless-http');
const { app } = require('./api');

module.exports = { app };
module.exports.handler = serverless(app);
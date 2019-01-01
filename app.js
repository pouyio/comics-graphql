require('dotenv').load();
const { app } = require('./src');
// const CronJob = require('cron').CronJob;
// const { scrap } = require('./src/scrapper');

// TODO remove port because not used
app.listen({ port: process.env.PORT }, () => console.log('Comics-api listenin on port ' + process.env.PORT));
// new CronJob('0 0 5 * * *', scrap, null, true);
require('dotenv').load();
const fs = require('fs');
const CronJob = require('cron').CronJob;
const { api } = require('./src/api');
const { scrap } = require('./src/scrapper');

if (process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/aws/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/aws/fullchain.pem')
    }
    require('spdy')
        .createServer(options || {}, api)
        .listen(process.env.PORT, () => console.log('Comics-api listenin on port ' + process.env.PORT));
    new CronJob('0 0 5 * * *', scrap, null, true);
} else {

    api.listen({ port: process.env.PORT }, () => console.log('Comics-api listenin on port ' + process.env.PORT));
}
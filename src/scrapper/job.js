const cron = require("node-cron");
const { scrap } = require("./index");

cron.schedule(`10 0 * * *`, async () => {});

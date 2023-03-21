const cron = require("node-cron");
const { scrap } = require("./index");

cron.schedule(`0 17 * * *`, async () => {
  scrap();
});

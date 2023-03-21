require("dotenv").load();
const cron = require("node-cron");
const { scrap } = require("./index");

cron.schedule(`20 21 * * *`, async () => {
  scrap();
});

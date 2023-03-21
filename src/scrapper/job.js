const cron = require("node-cron");
// const { scrap } = require("./index");

cron.schedule(`*/1 * * * *`, async () => {
  console.log("running your task...");
});

// scrap();

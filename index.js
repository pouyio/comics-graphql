require("dotenv").load();
const { app } = require("./src");
// TODO execute this fn in a cronjob to scrap latest comics 
// const { scrap } = require("./src/scrapper");

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running locally http://localhost:${PORT}`);
});

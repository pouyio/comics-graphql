require("dotenv").load();
const { app } = require("./src");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { scrap } = require("./src/scrapper");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  })
});

exports.scrapper = functions
  .runWith({ timeoutSeconds: 540 })
  .region("europe-west1")
  .pubsub.schedule(" 0 5 * * *")
  .timeZone("Europe/Madrid")
  .onRun(async context => {
    try {
      await scrap();
    } catch (error) {
      console.log(error);
    }
    return null;
  });

exports.api = functions.region("europe-west1").https.onRequest(app);
